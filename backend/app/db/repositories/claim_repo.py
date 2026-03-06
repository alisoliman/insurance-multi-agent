"""Repository for CRUD operations on claims and related entities."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db.database import fetch_all, fetch_one
from app.models.workbench import (
    AIAssessment,
    AssessmentStatus,
    AuditLogCreate,
    Claim,
    ClaimDecision,
    ClaimPriority,
    ClaimStatus,
    ClaimUpdate,
    Handler,
)

logger = logging.getLogger(__name__)

LATEST_ASSESSMENT_JOIN = """
LEFT JOIN (
    SELECT DISTINCT ON (claim_id)
        claim_id,
        status,
        agent_outputs,
        final_recommendation
    FROM ai_assessments
    ORDER BY claim_id, created_at DESC
) la ON la.claim_id = c.id
"""


def _coerce_json(value):
    if isinstance(value, str):
        return json.loads(value)
    return value


def _parse_filter_datetime(value: str, *, end_of_day: bool = False) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    if end_of_day and "T" not in value:
        parsed = parsed + timedelta(days=1) - timedelta(microseconds=1)
    return parsed


class ClaimRepository:
    """Repository for claim workflow operations."""

    def __init__(self, db: AsyncConnection):
        self.db = db

    async def create_claim(self, claim: Claim) -> Claim:
        """Create a new claim."""
        logger.info(
            "Creating claim: id=%s, type=%s, status=%s",
            claim.id,
            claim.claim_type,
            claim.status.value,
        )
        await self.db.execute(
            text(
                """
                INSERT INTO claims (
                    id, claimant_name, claimant_id, policy_number, claim_type,
                    description, incident_date, estimated_damage, location,
                    status, priority, assigned_handler_id, version, created_at
                ) VALUES (
                    :id, :claimant_name, :claimant_id, :policy_number, :claim_type,
                    :description, :incident_date, :estimated_damage, :location,
                    :status, :priority, :assigned_handler_id, :version, :created_at
                )
                """
            ),
            {
                "id": claim.id,
                "claimant_name": claim.claimant_name,
                "claimant_id": claim.claimant_id,
                "policy_number": claim.policy_number,
                "claim_type": claim.claim_type,
                "description": claim.description,
                "incident_date": claim.incident_date,
                "estimated_damage": claim.estimated_damage,
                "location": claim.location,
                "status": claim.status.value,
                "priority": claim.priority.value,
                "assigned_handler_id": claim.assigned_handler_id,
                "version": claim.version,
                "created_at": claim.created_at,
            },
        )
        await self.db.commit()
        logger.info("Claim %s created and committed successfully", claim.id)
        return claim

    async def get_metrics(self, handler_id: str) -> dict:
        """Get dashboard metrics for a handler."""
        assigned_row = await fetch_one(
            self.db,
            """
            SELECT COUNT(*) AS count
            FROM claims
            WHERE assigned_handler_id = :handler_id
              AND status NOT IN ('approved', 'denied')
            """,
            {"handler_id": handler_id},
        )

        queue_row = await fetch_one(
            self.db,
            f"""
            SELECT COUNT(*) AS count
            FROM claims c
            {LATEST_ASSESSMENT_JOIN}
            WHERE c.assigned_handler_id IS NULL
              AND la.status IN ('completed', 'failed')
            """,
        )

        processing_row = await fetch_one(
            self.db,
            f"""
            SELECT COUNT(*) AS count
            FROM claims c
            {LATEST_ASSESSMENT_JOIN}
            WHERE la.status IN ('pending', 'processing')
            """,
        )

        processed_row = await fetch_one(
            self.db,
            """
            SELECT COUNT(*) AS count
            FROM claim_decisions
            WHERE handler_id = :handler_id
              AND created_at::date = CURRENT_DATE
            """,
            {"handler_id": handler_id},
        )

        avg_row = await fetch_one(
            self.db,
            """
            SELECT AVG(EXTRACT(EPOCH FROM (cd.created_at - al.assigned_at)) / 60.0)
                AS avg_processing_time
            FROM claim_decisions cd
            JOIN (
                SELECT claim_id, MAX(timestamp) AS assigned_at
                FROM claim_audit_log
                WHERE action = 'assigned'
                GROUP BY claim_id
            ) al ON al.claim_id = cd.claim_id
            WHERE cd.handler_id = :handler_id
            """,
            {"handler_id": handler_id},
        )

        auto_today_row = await fetch_one(
            self.db,
            """
            SELECT COUNT(*) AS count
            FROM claim_decisions
            WHERE handler_id = 'system'
              AND created_at::date = CURRENT_DATE
            """,
        )

        auto_total_row = await fetch_one(
            self.db,
            """
            SELECT COUNT(*) AS count
            FROM claim_decisions
            WHERE handler_id = 'system'
            """,
        )

        status_rows = await fetch_all(
            self.db,
            """
            SELECT status, COUNT(*) AS count
            FROM claims
            GROUP BY status
            """,
        )
        status_counts = {row["status"]: row["count"] for row in status_rows}

        avg_processing_time = avg_row["avg_processing_time"] if avg_row else 0
        return {
            "my_caseload": assigned_row["count"] if assigned_row else 0,
            "queue_depth": queue_row["count"] if queue_row else 0,
            "processing_queue_depth": processing_row["count"] if processing_row else 0,
            "processed_today": processed_row["count"] if processed_row else 0,
            "avg_processing_time_minutes": round(float(avg_processing_time), 2) if avg_processing_time else 0,
            "auto_approved_today": auto_today_row["count"] if auto_today_row else 0,
            "auto_approved_total": auto_total_row["count"] if auto_total_row else 0,
            "status_new": status_counts.get("new", 0),
            "status_assigned": status_counts.get("assigned", 0),
            "status_in_progress": status_counts.get("in_progress", 0),
            "status_awaiting_info": status_counts.get("awaiting_info", 0),
            "status_approved": status_counts.get("approved", 0),
            "status_denied": status_counts.get("denied", 0),
        }

    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Get a single claim by ID."""
        row = await fetch_one(
            self.db,
            f"""
            SELECT
                c.*,
                la.status AS latest_assessment_status,
                la.agent_outputs AS agent_outputs,
                la.final_recommendation AS final_recommendation
            FROM claims c
            {LATEST_ASSESSMENT_JOIN}
            WHERE c.id = :claim_id
            """,
            {"claim_id": claim_id},
        )
        return self._row_to_claim(row) if row else None

    async def get_claims(
        self,
        handler_id: Optional[str] = None,
        status: Optional[ClaimStatus] = None,
        claim_type: Optional[str] = None,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        search: Optional[str] = None,
        assessment_statuses: Optional[List[str]] = None,
        unassigned_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Claim], int]:
        """Get claims with optional filters."""
        logger.info(
            "get_claims called: handler_id=%s, status=%s, claim_type=%s, created_from=%s, created_to=%s, search=%s, assessment_statuses=%s, limit=%s, offset=%s",
            handler_id,
            status,
            claim_type,
            created_from,
            created_to,
            search,
            assessment_statuses,
            limit,
            offset,
        )

        conditions: list[str] = []
        params: dict[str, object] = {"limit": limit, "offset": offset}

        if handler_id is not None:
            conditions.append("c.assigned_handler_id = :handler_id")
            params["handler_id"] = handler_id

        if unassigned_only:
            conditions.append("c.assigned_handler_id IS NULL")

        if status is not None:
            conditions.append("c.status = :status")
            params["status"] = status.value

        if claim_type is not None:
            conditions.append("c.claim_type = :claim_type")
            params["claim_type"] = claim_type

        if created_from is not None:
            conditions.append("c.created_at >= :created_from")
            params["created_from"] = _parse_filter_datetime(created_from)

        if created_to is not None:
            conditions.append("c.created_at <= :created_to")
            params["created_to"] = _parse_filter_datetime(created_to, end_of_day=True)

        if search is not None and search.strip():
            conditions.append("(c.id = :search_exact OR lower(c.claimant_name) LIKE :search_like)")
            params["search_exact"] = search.strip()
            params["search_like"] = f"%{search.strip().lower()}%"

        if assessment_statuses:
            placeholders = []
            for index, assessment_status in enumerate(assessment_statuses):
                param_name = f"assessment_status_{index}"
                placeholders.append(f":{param_name}")
                params[param_name] = assessment_status
            conditions.append(f"la.status IN ({', '.join(placeholders)})")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        count_row = await fetch_one(
            self.db,
            f"""
            SELECT COUNT(*) AS total
            FROM claims c
            {LATEST_ASSESSMENT_JOIN}
            {where_clause}
            """,
            params,
        )
        total = count_row["total"] if count_row else 0

        rows = await fetch_all(
            self.db,
            f"""
            SELECT
                c.*,
                la.status AS latest_assessment_status,
                la.agent_outputs AS agent_outputs,
                la.final_recommendation AS final_recommendation
            FROM claims c
            {LATEST_ASSESSMENT_JOIN}
            {where_clause}
            ORDER BY
                CASE c.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                c.created_at DESC
            LIMIT :limit OFFSET :offset
            """,
            params,
        )

        claims = [self._row_to_claim(row) for row in rows]
        logger.info("get_claims: returning %s claims", len(claims))
        return claims, total

    async def get_review_queue(
        self,
        status: Optional[ClaimStatus] = None,
        claim_type: Optional[str] = None,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Claim], int]:
        """Get AI-processed, unassigned claims ready for review."""
        if status is None:
            status = ClaimStatus.NEW
        return await self.get_claims(
            status=status,
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            assessment_statuses=["completed", "failed"],
            unassigned_only=True,
            limit=limit,
            offset=offset,
        )

    async def get_processing_queue(
        self,
        claim_type: Optional[str] = None,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Claim], int]:
        """Get claims currently pending or processing AI."""
        return await self.get_claims(
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            assessment_statuses=["pending", "processing"],
            limit=limit,
            offset=offset,
        )

    async def update_claim(self, claim_id: str, update: ClaimUpdate) -> Optional[Claim]:
        """Update claim fields and return the refreshed claim."""
        set_parts: list[str] = []
        params: dict[str, object] = {"claim_id": claim_id}

        if update.status is not None:
            set_parts.append("status = :status")
            params["status"] = update.status.value

        if update.priority is not None:
            set_parts.append("priority = :priority")
            params["priority"] = update.priority.value

        if update.assigned_handler_id is not None:
            set_parts.append("assigned_handler_id = :assigned_handler_id")
            params["assigned_handler_id"] = update.assigned_handler_id

        if update.description is not None:
            set_parts.append("description = :description")
            params["description"] = update.description

        if update.estimated_damage is not None:
            set_parts.append("estimated_damage = :estimated_damage")
            params["estimated_damage"] = update.estimated_damage

        if not set_parts:
            return await self.get_claim(claim_id)

        set_parts.append("updated_at = :updated_at")
        params["updated_at"] = datetime.now(timezone.utc)
        set_parts.append("version = version + 1")

        row = await fetch_one(
            self.db,
            f"""
            UPDATE claims
            SET {', '.join(set_parts)}
            WHERE id = :claim_id
            RETURNING id
            """,
            params,
        )
        await self.db.commit()

        if row is None:
            return None
        return await self.get_claim(claim_id)

    def _row_to_claim(self, row) -> Claim:
        data = dict(row)
        data["status"] = ClaimStatus(data["status"])
        data["priority"] = ClaimPriority(data["priority"])

        if data.get("latest_assessment_status"):
            data["latest_assessment_status"] = AssessmentStatus(data["latest_assessment_status"])

        agent_outputs_raw = data.pop("agent_outputs", None)
        final_rec = data.pop("final_recommendation", None)
        if agent_outputs_raw:
            agent_outputs = _coerce_json(agent_outputs_raw) or {}
            risk = agent_outputs.get("risk_analyst") or {}
            synth = agent_outputs.get("synthesizer") or {}
            data["ai_risk_level"] = risk.get("risk_level")
            data["ai_risk_score"] = risk.get("risk_score")
            data["ai_recommendation"] = synth.get("recommendation") or final_rec

        if data.get("assigned_handler_id") == "system" and data["status"] == ClaimStatus.APPROVED:
            raw_rec = data.get("ai_recommendation")
            if raw_rec and raw_rec != "APPROVE":
                data["ai_recommendation"] = "APPROVE"
                data["ai_recommendation_override"] = raw_rec

        return Claim(**data)

    async def get_latest_assessment(self, claim_id: str) -> Optional[AIAssessment]:
        """Get the latest AI assessment for a claim."""
        row = await fetch_one(
            self.db,
            """
            SELECT *
            FROM ai_assessments
            WHERE claim_id = :claim_id
            ORDER BY created_at DESC
            LIMIT 1
            """,
            {"claim_id": claim_id},
        )
        return self._row_to_assessment(row) if row else None

    async def get_latest_assessment_status(self, claim_id: str) -> Optional[str]:
        """Get latest AI assessment status for a claim."""
        row = await fetch_one(
            self.db,
            """
            SELECT status
            FROM ai_assessments
            WHERE claim_id = :claim_id
            ORDER BY created_at DESC
            LIMIT 1
            """,
            {"claim_id": claim_id},
        )
        return row["status"] if row else None

    async def assign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """Assign a claim to a handler if it is currently unassigned."""
        latest_status = await self.get_latest_assessment_status(claim_id)
        if latest_status not in ("completed", "failed"):
            return None

        row = await fetch_one(
            self.db,
            """
            UPDATE claims
            SET assigned_handler_id = :handler_id,
                status = 'assigned',
                updated_at = :updated_at,
                version = version + 1
            WHERE id = :claim_id
              AND assigned_handler_id IS NULL
            RETURNING id
            """,
            {
                "handler_id": handler_id,
                "updated_at": datetime.now(timezone.utc),
                "claim_id": claim_id,
            },
        )
        await self.db.commit()

        if row is None:
            return None
        return await self.get_claim(claim_id)

    async def unassign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """Unassign a claim and return it to the review queue."""
        row = await fetch_one(
            self.db,
            """
            UPDATE claims
            SET assigned_handler_id = NULL,
                status = 'new',
                updated_at = :updated_at,
                version = version + 1
            WHERE id = :claim_id
              AND assigned_handler_id = :handler_id
            RETURNING id
            """,
            {
                "updated_at": datetime.now(timezone.utc),
                "claim_id": claim_id,
                "handler_id": handler_id,
            },
        )
        await self.db.commit()

        if row is None:
            return None
        return await self.get_claim(claim_id)

    def _row_to_assessment(self, row) -> AIAssessment:
        data = dict(row)
        if data.get("status"):
            data["status"] = AssessmentStatus(data["status"])
        if data.get("agent_outputs") is not None:
            data["agent_outputs"] = _coerce_json(data["agent_outputs"])
        if data.get("confidence_scores") is not None:
            data["confidence_scores"] = _coerce_json(data["confidence_scores"])
        return AIAssessment(**data)

    async def get_handlers(self) -> List[Handler]:
        """Get all active handlers."""
        rows = await fetch_all(
            self.db,
            """
            SELECT *
            FROM handlers
            WHERE is_active = true
            ORDER BY name
            """,
        )
        return [Handler(**dict(row)) for row in rows]

    async def get_handler(self, handler_id: str) -> Optional[Handler]:
        """Get handler by ID."""
        row = await fetch_one(
            self.db,
            "SELECT * FROM handlers WHERE id = :handler_id",
            {"handler_id": handler_id},
        )
        return Handler(**dict(row)) if row else None

    async def create_decision(self, decision: ClaimDecision) -> ClaimDecision:
        """Record a claim decision."""
        await self.db.execute(
            text(
                """
                INSERT INTO claim_decisions (
                    id, claim_id, handler_id, decision_type, notes,
                    ai_assessment_id, created_at
                ) VALUES (
                    :id, :claim_id, :handler_id, :decision_type, :notes,
                    :ai_assessment_id, :created_at
                )
                """
            ),
            {
                "id": decision.id,
                "claim_id": decision.claim_id,
                "handler_id": decision.handler_id,
                "decision_type": decision.decision_type.value,
                "notes": decision.notes,
                "ai_assessment_id": decision.ai_assessment_id,
                "created_at": decision.created_at,
            },
        )
        await self.db.commit()
        return decision

    async def create_assessment(self, assessment: AIAssessment) -> AIAssessment:
        """Create a new AI assessment record."""
        await self.db.execute(
            text(
                """
                INSERT INTO ai_assessments (
                    id, claim_id, status, agent_outputs, final_recommendation,
                    confidence_scores, processing_started_at, processing_completed_at,
                    error_message, created_at
                ) VALUES (
                    :id, :claim_id, :status, CAST(:agent_outputs AS jsonb), :final_recommendation,
                    CAST(:confidence_scores AS jsonb), :processing_started_at, :processing_completed_at,
                    :error_message, :created_at
                )
                """
            ),
            {
                "id": assessment.id,
                "claim_id": assessment.claim_id,
                "status": assessment.status.value,
                "agent_outputs": json.dumps(assessment.agent_outputs) if assessment.agent_outputs else None,
                "final_recommendation": assessment.final_recommendation,
                "confidence_scores": json.dumps(assessment.confidence_scores) if assessment.confidence_scores else None,
                "processing_started_at": assessment.processing_started_at,
                "processing_completed_at": assessment.processing_completed_at,
                "error_message": assessment.error_message,
                "created_at": assessment.created_at,
            },
        )
        await self.db.commit()
        return assessment

    async def update_assessment(self, assessment: AIAssessment) -> AIAssessment:
        """Update an existing assessment."""
        await self.db.execute(
            text(
                """
                UPDATE ai_assessments
                SET status = :status,
                    agent_outputs = CAST(:agent_outputs AS jsonb),
                    final_recommendation = :final_recommendation,
                    confidence_scores = CAST(:confidence_scores AS jsonb),
                    processing_started_at = :processing_started_at,
                    processing_completed_at = :processing_completed_at,
                    error_message = :error_message
                WHERE id = :id
                """
            ),
            {
                "status": assessment.status.value,
                "agent_outputs": json.dumps(assessment.agent_outputs) if assessment.agent_outputs else None,
                "final_recommendation": assessment.final_recommendation,
                "confidence_scores": json.dumps(assessment.confidence_scores) if assessment.confidence_scores else None,
                "processing_started_at": assessment.processing_started_at,
                "processing_completed_at": assessment.processing_completed_at,
                "error_message": assessment.error_message,
                "id": assessment.id,
            },
        )
        await self.db.commit()
        return assessment

    async def create_audit_entry(self, entry: AuditLogCreate) -> None:
        """Create an audit log entry."""
        import uuid

        now = datetime.now(timezone.utc)
        await self.db.execute(
            text(
                """
                INSERT INTO claim_audit_log (
                    id, claim_id, handler_id, action, old_value, new_value, timestamp
                ) VALUES (
                    :id, :claim_id, :handler_id, :action,
                    CAST(:old_value AS jsonb), CAST(:new_value AS jsonb), :timestamp
                )
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "claim_id": entry.claim_id,
                "handler_id": entry.handler_id,
                "action": entry.action.value,
                "old_value": json.dumps(entry.old_value) if entry.old_value else None,
                "new_value": json.dumps(entry.new_value) if entry.new_value else None,
                "timestamp": now,
            },
        )
        await self.db.commit()
