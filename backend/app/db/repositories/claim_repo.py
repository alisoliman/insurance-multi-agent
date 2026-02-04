"""
Repository for CRUD operations on claims and related entities.
Feature 005 - Claims Workbench
"""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import aiosqlite

from app.models.workbench import (
    Claim,
    ClaimCreate,
    ClaimStatus,
    ClaimPriority,
    ClaimUpdate,
    Handler,
    ClaimDecision,
    ClaimDecisionCreate,
    AIAssessment,
    AuditAction,
    AuditLogCreate,
    AssessmentStatus
)

logger = logging.getLogger(__name__)


class ClaimRepository:
    """Repository for claim workflow operations."""

    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    # ---------------------------------------------------------------------------
    # Claim Operations
    # ---------------------------------------------------------------------------

    async def create_claim(self, claim: Claim) -> Claim:
        """Create a new claim."""
        logger.info(f"Creating claim: id={claim.id}, type={claim.claim_type}, status={claim.status.value}")
        query = """
        INSERT INTO claims (
            id, claimant_name, claimant_id, policy_number, claim_type,
            description, incident_date, estimated_damage, location,
            status, priority, assigned_handler_id, version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            claim.id, claim.claimant_name, claim.claimant_id, claim.policy_number,
            claim.claim_type, claim.description, claim.incident_date.isoformat(),
            claim.estimated_damage, claim.location, claim.status.value,
            claim.priority.value, claim.assigned_handler_id, claim.version,
            claim.created_at.isoformat()
        )
        
        await self.db.execute(query, params)
        await self.db.commit()
        logger.info(f"Claim {claim.id} created and committed successfully")
        return claim

    async def get_metrics(self, handler_id: str) -> dict:
        """Get dashboard metrics for a handler."""
        # 1. Assigned claims count (active)
        cursor = await self.db.execute(
            "SELECT COUNT(*) FROM claims WHERE assigned_handler_id = ? AND status NOT IN ('approved', 'denied')",
            (handler_id,)
        )
        assigned_count = (await cursor.fetchone())[0]

        # 2. Review queue depth (unassigned, AI completed/failed)
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claims c
            LEFT JOIN (
                SELECT a1.claim_id, a1.status
                FROM ai_assessments a1
                JOIN (
                    SELECT claim_id, MAX(created_at) AS max_created_at
                    FROM ai_assessments
                    GROUP BY claim_id
                ) latest
                  ON latest.claim_id = a1.claim_id AND latest.max_created_at = a1.created_at
            ) la ON la.claim_id = c.id
            WHERE c.assigned_handler_id IS NULL
              AND la.status IN ('completed', 'failed')
            """
        )
        queue_depth = (await cursor.fetchone())[0]

        # 3. AI processing queue depth (pending/processing)
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claims c
            LEFT JOIN (
                SELECT a1.claim_id, a1.status
                FROM ai_assessments a1
                JOIN (
                    SELECT claim_id, MAX(created_at) AS max_created_at
                    FROM ai_assessments
                    GROUP BY claim_id
                ) latest
                  ON latest.claim_id = a1.claim_id AND latest.max_created_at = a1.created_at
            ) la ON la.claim_id = c.id
            WHERE la.status IN ('pending', 'processing')
            """
        )
        processing_queue_depth = (await cursor.fetchone())[0]

        # 4. Processed today (decisions made today by this handler)
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claim_decisions 
            WHERE handler_id = ? 
            AND date(created_at) = date('now')
            """,
            (handler_id,)
        )
        processed_today = (await cursor.fetchone())[0]

        # 5. Average processing time (assignment -> decision), in minutes
        cursor = await self.db.execute(
            """
            SELECT AVG((julianday(cd.created_at) - julianday(al.assigned_at)) * 24 * 60)
            FROM claim_decisions cd
            JOIN (
                SELECT claim_id, MAX(timestamp) AS assigned_at
                FROM claim_audit_log
                WHERE action = 'assigned'
                GROUP BY claim_id
            ) al ON al.claim_id = cd.claim_id
            WHERE cd.handler_id = ?
            """,
            (handler_id,)
        )
        avg_processing_time = (await cursor.fetchone())[0]

        # 6. Auto-approved counts
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claim_decisions
            WHERE handler_id = 'system'
            AND date(created_at) = date('now')
            """
        )
        auto_approved_today = (await cursor.fetchone())[0]

        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claim_decisions
            WHERE handler_id = 'system'
            """
        )
        auto_approved_total = (await cursor.fetchone())[0]

        # 7. Status counts for pipeline view
        cursor = await self.db.execute(
            """
            SELECT status, COUNT(*) as count
            FROM claims
            GROUP BY status
            """
        )
        status_rows = await cursor.fetchall()
        status_counts = {row["status"]: row["count"] for row in status_rows}

        return {
            "my_caseload": assigned_count,
            "queue_depth": queue_depth,
            "processing_queue_depth": processing_queue_depth,
            "processed_today": processed_today,
            "avg_processing_time_minutes": round(avg_processing_time, 2) if avg_processing_time else 0,
            "auto_approved_today": auto_approved_today,
            "auto_approved_total": auto_approved_total,
            "status_new": status_counts.get("new", 0),
            "status_assigned": status_counts.get("assigned", 0),
            "status_in_progress": status_counts.get("in_progress", 0),
            "status_awaiting_info": status_counts.get("awaiting_info", 0),
            "status_approved": status_counts.get("approved", 0),
            "status_denied": status_counts.get("denied", 0)
        }

    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Get a single claim by ID."""
        query = """
        SELECT c.*, la.status AS latest_assessment_status, la.agent_outputs AS agent_outputs, la.final_recommendation AS final_recommendation
        FROM claims c
        LEFT JOIN (
            SELECT a1.claim_id, a1.status, a1.agent_outputs, a1.final_recommendation
            FROM ai_assessments a1
            JOIN (
                SELECT claim_id, MAX(created_at) AS max_created_at
                FROM ai_assessments
                GROUP BY claim_id
            ) latest
              ON latest.claim_id = a1.claim_id AND latest.max_created_at = a1.created_at
        ) la ON la.claim_id = c.id
        WHERE c.id = ?
        """
        cursor = await self.db.execute(query, (claim_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        
        return self._row_to_claim(row)

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
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """
        Get claims with optional filters.
        Returns a tuple of (claims list, total count).
        """
        logger.info(
            "get_claims called: handler_id=%s, status=%s, claim_type=%s, created_from=%s, created_to=%s, search=%s, assessment_statuses=%s, limit=%s, offset=%s",
            handler_id, status, claim_type, created_from, created_to, search, assessment_statuses, limit, offset
        )

        conditions = []
        params: list = []

        if handler_id is not None:
            conditions.append("c.assigned_handler_id = ?")
            params.append(handler_id)

        if unassigned_only:
            conditions.append("c.assigned_handler_id IS NULL")

        if status is not None:
            conditions.append("c.status = ?")
            params.append(status.value)

        if claim_type is not None:
            conditions.append("c.claim_type = ?")
            params.append(claim_type)

        if created_from is not None:
            conditions.append("c.created_at >= ?")
            params.append(created_from)

        if created_to is not None:
            conditions.append("c.created_at <= ?")
            params.append(created_to)

        if search is not None and search.strip():
            conditions.append("(c.id = ? OR lower(c.claimant_name) LIKE ?)")
            params.append(search.strip())
            params.append(f"%{search.strip().lower()}%")

        if assessment_statuses:
            placeholders = ", ".join(["?"] * len(assessment_statuses))
            conditions.append(f"la.status IN ({placeholders})")
            params.extend(assessment_statuses)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        latest_assessment_join = """
        LEFT JOIN (
            SELECT a1.claim_id, a1.status, a1.agent_outputs, a1.final_recommendation
            FROM ai_assessments a1
            JOIN (
                SELECT claim_id, MAX(created_at) AS max_created_at
                FROM ai_assessments
                GROUP BY claim_id
            ) latest
              ON latest.claim_id = a1.claim_id AND latest.max_created_at = a1.created_at
        ) la ON la.claim_id = c.id
        """

        count_query = f"""
        SELECT COUNT(*) FROM claims c
        {latest_assessment_join}
        {where_clause}
        """
        cursor = await self.db.execute(count_query, params)
        row = await cursor.fetchone()
        total = row[0] if row else 0

        query = f"""
        SELECT c.*, la.status AS latest_assessment_status, la.agent_outputs AS agent_outputs, la.final_recommendation AS final_recommendation
        FROM claims c
        {latest_assessment_join}
        {where_clause}
        ORDER BY 
            CASE c.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            c.created_at DESC
        LIMIT ? OFFSET ?
        """
        params_with_pagination = params + [limit, offset]

        cursor = await self.db.execute(query, params_with_pagination)
        rows = await cursor.fetchall()

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
        offset: int = 0
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
            offset=offset
        )

    async def get_processing_queue(
        self,
        claim_type: Optional[str] = None,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """Get claims currently pending or processing AI."""
        return await self.get_claims(
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            assessment_statuses=["pending", "processing"],
            limit=limit,
            offset=offset
        )

    async def update_claim(self, claim_id: str, update: ClaimUpdate) -> Optional[Claim]:
        """
        Update claim fields. Uses optimistic locking via version field.
        Returns updated claim or None if not found.
        """
        # Build SET clause dynamically for non-None fields
        set_parts = []
        params = []
        
        if update.status is not None:
            set_parts.append("status = ?")
            params.append(update.status.value)
        
        if update.priority is not None:
            set_parts.append("priority = ?")
            params.append(update.priority.value)
        
        if update.assigned_handler_id is not None:
            set_parts.append("assigned_handler_id = ?")
            params.append(update.assigned_handler_id)
        
        if update.description is not None:
            set_parts.append("description = ?")
            params.append(update.description)
        
        if update.estimated_damage is not None:
            set_parts.append("estimated_damage = ?")
            params.append(update.estimated_damage)
        
        if not set_parts:
            # Nothing to update, just return current claim
            return await self.get_claim(claim_id)
        
        # Always update timestamp and version
        set_parts.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        set_parts.append("version = version + 1")
        
        params.append(claim_id)
        
        query = f"UPDATE claims SET {', '.join(set_parts)} WHERE id = ?"
        
        cursor = await self.db.execute(query, params)
        await self.db.commit()
        
        if cursor.rowcount == 0:
            return None
        
        return await self.get_claim(claim_id)

    def _row_to_claim(self, row) -> Claim:
        """Convert a database row to a Claim model."""
        data = dict(row)
        
        # Parse datetime fields
        if data['incident_date']:
            data['incident_date'] = datetime.fromisoformat(data['incident_date'])
        if data['created_at']:
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if data['updated_at']:
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        
        # Parse enum fields
        data['status'] = ClaimStatus(data['status'])
        data['priority'] = ClaimPriority(data['priority'])
        if data.get('latest_assessment_status'):
            data['latest_assessment_status'] = AssessmentStatus(data['latest_assessment_status'])

        agent_outputs_raw = data.pop("agent_outputs", None)
        final_rec = data.pop("final_recommendation", None)
        if agent_outputs_raw:
            try:
                agent_outputs = json.loads(agent_outputs_raw)
            except Exception:
                agent_outputs = {}
            risk = agent_outputs.get("risk_analyst") or {}
            synth = agent_outputs.get("synthesizer") or {}
            data["ai_risk_level"] = risk.get("risk_level")
            data["ai_risk_score"] = risk.get("risk_score")
            data["ai_recommendation"] = synth.get("recommendation") or final_rec
        
        return Claim(**data)

    async def get_latest_assessment(self, claim_id: str) -> Optional[AIAssessment]:
        """Get the latest AI assessment for a claim."""
        cursor = await self.db.execute(
            """
            SELECT * FROM ai_assessments
            WHERE claim_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (claim_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return self._row_to_assessment(row)

    async def get_latest_assessment_status(self, claim_id: str) -> Optional[str]:
        """Get latest AI assessment status for a claim."""
        cursor = await self.db.execute(
            """
            SELECT status FROM ai_assessments
            WHERE claim_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (claim_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return row["status"]

    async def assign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """
        Assign a claim to a handler if it is currently unassigned.
        Returns the updated claim if successful, or None if claim not found or already assigned.
        """
        latest_status = await self.get_latest_assessment_status(claim_id)
        if latest_status not in ("completed", "failed"):
            return None

        now = datetime.now(timezone.utc).isoformat()
        
        query = """
        UPDATE claims 
        SET assigned_handler_id = ?, 
            status = 'assigned', 
            updated_at = ?, 
            version = version + 1
        WHERE id = ? 
          AND assigned_handler_id IS NULL
        """
        
        cursor = await self.db.execute(query, (handler_id, now, claim_id))
        await self.db.commit()
        
        if cursor.rowcount == 0:
            # Either claim doesn't exist OR it was already assigned
            return None
            
        return await self.get_claim(claim_id)

    async def unassign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """Unassign a claim and return it to the review queue."""
        now = datetime.now(timezone.utc).isoformat()
        query = """
        UPDATE claims
        SET assigned_handler_id = NULL,
            status = 'new',
            updated_at = ?,
            version = version + 1
        WHERE id = ?
          AND assigned_handler_id = ?
        """
        cursor = await self.db.execute(query, (now, claim_id, handler_id))
        await self.db.commit()
        if cursor.rowcount == 0:
            return None
        return await self.get_claim(claim_id)

    def _row_to_assessment(self, row) -> AIAssessment:
        data = dict(row)
        if data.get("status"):
            data["status"] = AssessmentStatus(data["status"])
        if data.get("agent_outputs"):
            data["agent_outputs"] = json.loads(data["agent_outputs"])
        if data.get("confidence_scores"):
            data["confidence_scores"] = json.loads(data["confidence_scores"])
        if data.get("processing_started_at"):
            data["processing_started_at"] = datetime.fromisoformat(data["processing_started_at"])
        if data.get("processing_completed_at"):
            data["processing_completed_at"] = datetime.fromisoformat(data["processing_completed_at"])
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        return AIAssessment(**data)

    # ---------------------------------------------------------------------------
    # Handler Operations
    # ---------------------------------------------------------------------------

    async def get_handlers(self) -> List[Handler]:
        """Get all active handlers."""
        cursor = await self.db.execute(
            "SELECT * FROM handlers WHERE is_active = 1 ORDER BY name"
        )
        rows = await cursor.fetchall()
        
        handlers = []
        for row in rows:
            data = dict(row)
            if data['created_at']:
                data['created_at'] = datetime.fromisoformat(data['created_at'])
            handlers.append(Handler(**data))
            
        return handlers

    async def get_handler(self, handler_id: str) -> Optional[Handler]:
        """Get handler by ID."""
        cursor = await self.db.execute(
            "SELECT * FROM handlers WHERE id = ?", (handler_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
            
        data = dict(row)
        if data['created_at']:
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        return Handler(**data)

    # ---------------------------------------------------------------------------
    # Decision Operations
    # ---------------------------------------------------------------------------

    async def create_decision(self, decision: ClaimDecision) -> ClaimDecision:
        """Record a claim decision."""
        query = """
        INSERT INTO claim_decisions (
            id, claim_id, handler_id, decision_type, notes, 
            ai_assessment_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            decision.id, decision.claim_id, decision.handler_id,
            decision.decision_type.value, decision.notes,
            decision.ai_assessment_id, decision.created_at.isoformat()
        )
        await self.db.execute(query, params)
        await self.db.commit()
        return decision

    # ---------------------------------------------------------------------------
    # AI Assessment Operations
    # ---------------------------------------------------------------------------

    async def create_assessment(self, assessment: AIAssessment) -> AIAssessment:
        """Create a new AI assessment record."""
        query = """
        INSERT INTO ai_assessments (
            id, claim_id, status, agent_outputs, final_recommendation,
            confidence_scores, processing_started_at, processing_completed_at,
            error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        outputs_json = json.dumps(assessment.agent_outputs) if assessment.agent_outputs else None
        scores_json = json.dumps(assessment.confidence_scores) if assessment.confidence_scores else None
        
        params = (
            assessment.id, assessment.claim_id, assessment.status.value,
            outputs_json, assessment.final_recommendation, scores_json,
            assessment.processing_started_at.isoformat() if assessment.processing_started_at else None,
            assessment.processing_completed_at.isoformat() if assessment.processing_completed_at else None,
            assessment.error_message, assessment.created_at.isoformat()
        )
        
        await self.db.execute(query, params)
        await self.db.commit()
        return assessment
    
    async def update_assessment(self, assessment: AIAssessment) -> AIAssessment:
        """Update an existing assessment."""
        query = """
        UPDATE ai_assessments SET
            status = ?, agent_outputs = ?, final_recommendation = ?,
            confidence_scores = ?, processing_started_at = ?,
            processing_completed_at = ?, error_message = ?
        WHERE id = ?
        """
        
        outputs_json = json.dumps(assessment.agent_outputs) if assessment.agent_outputs else None
        scores_json = json.dumps(assessment.confidence_scores) if assessment.confidence_scores else None
        
        params = (
            assessment.status.value, outputs_json, assessment.final_recommendation,
            scores_json,
            assessment.processing_started_at.isoformat() if assessment.processing_started_at else None,
            assessment.processing_completed_at.isoformat() if assessment.processing_completed_at else None,
            assessment.error_message, assessment.id
        )
        
        await self.db.execute(query, params)
        await self.db.commit()
        return assessment

    # ---------------------------------------------------------------------------
    # Audit Log Operations
    # ---------------------------------------------------------------------------

    async def create_audit_entry(self, entry: AuditLogCreate) -> None:
        """Create an audit log entry."""
        import uuid
        now = datetime.now(timezone.utc)
        
        query = """
        INSERT INTO claim_audit_log (
            id, claim_id, handler_id, action, old_value, new_value, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        
        old_json = json.dumps(entry.old_value) if entry.old_value else None
        new_json = json.dumps(entry.new_value) if entry.new_value else None
        
        params = (
            str(uuid.uuid4()), entry.claim_id, entry.handler_id,
            entry.action.value, old_json, new_json, now.isoformat()
        )
        
        await self.db.execute(query, params)
        await self.db.commit()
