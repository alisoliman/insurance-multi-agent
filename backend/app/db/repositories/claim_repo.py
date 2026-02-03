"""
Repository for CRUD operations on claims and related entities.
Feature 005 - Claims Workbench
"""

import json
import logging
from datetime import datetime
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
    AuditLogCreate
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
        return claim

    async def get_metrics(self, handler_id: str) -> dict:
        """Get dashboard metrics for a handler."""
        # 1. Assigned claims count (active)
        cursor = await self.db.execute(
            "SELECT COUNT(*) FROM claims WHERE assigned_handler_id = ? AND status NOT IN ('approved', 'denied')",
            (handler_id,)
        )
        assigned_count = (await cursor.fetchone())[0]

        # 2. Queue depth (unassigned)
        cursor = await self.db.execute(
            "SELECT COUNT(*) FROM claims WHERE status = 'new'"
        )
        queue_depth = (await cursor.fetchone())[0]

        # 3. Processed today (decisions made today by this handler)
        # We check claim_decisions table
        # SQLite date function works with ISO strings
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) FROM claim_decisions 
            WHERE handler_id = ? 
            AND date(created_at) = date('now')
            """,
            (handler_id,)
        )
        processed_today = (await cursor.fetchone())[0]

        return {
            "assigned_count": assigned_count,
            "queue_depth": queue_depth,
            "processed_today": processed_today
        }

    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Get a single claim by ID."""
        cursor = await self.db.execute(
            "SELECT * FROM claims WHERE id = ?", (claim_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        
        return self._row_to_claim(row)

    async def get_claims(
        self,
        handler_id: Optional[str] = None,
        status: Optional[ClaimStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """
        Get claims with optional filters.
        Returns a tuple of (claims list, total count).
        """
        # Build WHERE clause dynamically
        conditions = []
        params = []
        
        if handler_id is not None:
            conditions.append("assigned_handler_id = ?")
            params.append(handler_id)
        
        if status is not None:
            conditions.append("status = ?")
            params.append(status.value)
        
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM claims {where_clause}"
        cursor = await self.db.execute(count_query, params)
        total = (await cursor.fetchone())[0]
        
        # Get paginated results (ordered by priority DESC, created_at DESC)
        query = f"""
        SELECT * FROM claims {where_clause}
        ORDER BY 
            CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            created_at DESC
        LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        cursor = await self.db.execute(query, params)
        rows = await cursor.fetchall()
        
        claims = [self._row_to_claim(row) for row in rows]
        return claims, total

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
        params.append(datetime.utcnow().isoformat())
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
        
        return Claim(**data)

    async def assign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """
        Assign a claim to a handler if it is currently unassigned.
        Returns the updated claim if successful, or None if claim not found or already assigned.
        """
        # Atomic update: only update if assigned_handler_id is NULL or status is 'new'
        # Note: We should probably rely on status='new' or assigned_handler_id IS NULL
        
        now = datetime.utcnow().isoformat()
        
        # Check current state first or do conditional update
        # Conditional update is safer for race conditions
        query = """
        UPDATE claims 
        SET assigned_handler_id = ?, 
            status = 'assigned', 
            updated_at = ?, 
            version = version + 1
        WHERE id = ? 
          AND (assigned_handler_id IS NULL OR status = 'new')
        """
        
        cursor = await self.db.execute(query, (handler_id, now, claim_id))
        await self.db.commit()
        
        if cursor.rowcount == 0:
            # Either claim doesn't exist OR it was already assigned
            return None
            
        return await self.get_claim(claim_id)

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
        now = datetime.utcnow()
        
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
