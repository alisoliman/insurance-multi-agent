"""
Service layer for claim workflow operations.
Feature 005 - Claims Workbench
"""

import logging
import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from app.db.repositories.claim_repo import ClaimRepository
from app.db.database import get_db_connection
from app.workflow import process_claim_with_supervisor
from app.models.workbench import (
    Claim,
    ClaimCreate,
    ClaimStatus,
    ClaimUpdate,
    Handler,
    ClaimPriority,
    AuditLogCreate,
    AuditAction,
    AIAssessment,
    AIAssessmentCreate,
    AssessmentStatus,
    DecisionType,
    ClaimDecision,
    ClaimDecisionCreate
)

logger = logging.getLogger(__name__)

# Auto-approval rule (low-risk, low-value)
AUTO_APPROVE_MAX_DAMAGE = 15000.0
AUTO_APPROVE_MAX_RISK_SCORE = 30
AUTO_APPROVE_RISK_LEVELS = {"LOW_RISK"}
AUTO_APPROVE_VALIDITY_ALLOWED = {"VALID", "QUESTIONABLE"}
AUTO_APPROVE_COVERAGE_ALLOWED = {"COVERED", "PARTIALLY_COVERED", "INSUFFICIENT_EVIDENCE"}
AUTO_APPROVE_RECOMMENDATION = "APPROVE"
AUTO_APPROVE_CONFIDENCE_ALLOWED = {"HIGH", "MEDIUM"}
AUTO_APPROVE_HANDLER_ID = "system"

class ClaimService:
    """Service for managing claims and handler assignments."""

    def __init__(self, claim_repo: ClaimRepository):
        self.repo = claim_repo

    async def create_claim(self, claim_in: ClaimCreate) -> Claim:
        """Create a new claim submission."""
        now = datetime.now(timezone.utc)
        claim_data = claim_in.model_dump()
        
        # Generate claimant_id if not provided (for demo/seed data)
        if not claim_data.get("claimant_id"):
            claim_data["claimant_id"] = f"CLT-{str(uuid.uuid4())[:8].upper()}"
        
        claim = Claim(
            id=str(uuid.uuid4()),
            **claim_data,
            status=ClaimStatus.NEW,
            version=1,
            created_at=now
        )
        
        created = await self.repo.create_claim(claim)
        
        # Audit log
        await self.repo.create_audit_entry(AuditLogCreate(
            claim_id=created.id,
            action=AuditAction.CREATED,
            new_value=created.model_dump(mode="json")
        ))

        # Auto-start AI processing in background
        asyncio.create_task(self._run_ai_processing(created.id))

        return created

    async def _run_ai_processing(self, claim_id: str) -> None:
        """Run AI processing in a background task with its own DB connection."""
        try:
            async with get_db_connection() as db:
                repo = ClaimRepository(db)
                service = ClaimService(repo)
                await service.process_claim(claim_id, raise_on_error=False)
        except Exception:
            logger.exception("Background AI processing failed for claim %s", claim_id)

    async def get_assigned_claims(
        self,
        handler_id: str,
        status: Optional[ClaimStatus] = None,
        claim_type: Optional[str] = None,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """Get claims assigned to a specific handler."""
        return await self.repo.get_claims(
            handler_id=handler_id,
            status=status,
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            limit=limit,
            offset=offset
        )

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
        return await self.repo.get_review_queue(
            status=status,
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
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
        return await self.repo.get_processing_queue(
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            limit=limit,
            offset=offset
        )
    
    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Get a single claim by ID."""
        return await self.repo.get_claim(claim_id)

    async def get_handlers(self) -> List[Handler]:
        """Get list of active handlers."""
        return await self.repo.get_handlers()

    async def process_claim(self, claim_id: str, raise_on_error: bool = True) -> Optional[AIAssessment]:
        """Run multi-agent AI workflow on a claim."""
        claim = await self.repo.get_claim(claim_id)
        if not claim:
            return None

        # Create initial assessment record
        now = datetime.now(timezone.utc)
        assessment_id = str(uuid.uuid4())
        assessment = AIAssessment(
            id=assessment_id,
            claim_id=claim_id,
            status=AssessmentStatus.PROCESSING,
            processing_started_at=now,
            created_at=now
        )
        await self.repo.create_assessment(assessment)

        await self.repo.create_audit_entry(AuditLogCreate(
            claim_id=claim_id,
            action=AuditAction.AI_PROCESSING_STARTED,
            new_value={"assessment_id": assessment_id}
        ))

        try:
            # Prepare claim data for workflow
            claim_data = claim.model_dump(mode="json")
            
            # Execute workflow
            chunks = await process_claim_with_supervisor(claim_data)
            
            # Parse results
            agent_outputs = {}
            final_rec = None
            confidence_scores = {} # Not strictly in current output, but placeholder
            
            def _coerce_enum(value):  # noqa: WPS430 - small local helper for enum normalization
                return value.value if hasattr(value, "value") else value

            for chunk in chunks:
                for agent_name, data in chunk.items():
                    if "structured_output" in data and data["structured_output"]:
                        agent_outputs[agent_name] = data["structured_output"]
                    
                    if agent_name == "synthesizer" and "structured_output" in data:
                        # Assuming FinalAssessment has recommendation field
                        final_out = data["structured_output"]
                        if "final_recommendation" in final_out:
                            final_rec = _coerce_enum(final_out["final_recommendation"])
                        elif "recommendation" in final_out:
                             final_rec = _coerce_enum(final_out["recommendation"])
                        
                        # Extract confidence scores if available (mocking for now if not deep in structure)
                        if "confidence_score" in final_out:
                             confidence_scores["supervisor"] = final_out["confidence_score"]

            # Update assessment record
            assessment.status = AssessmentStatus.COMPLETED
            assessment.agent_outputs = agent_outputs
            assessment.final_recommendation = str(final_rec) if final_rec is not None else None
            assessment.confidence_scores = confidence_scores
            assessment.processing_completed_at = datetime.now(timezone.utc)
            
            await self.repo.update_assessment(assessment)
            
            await self.repo.create_audit_entry(AuditLogCreate(
                claim_id=claim_id,
                action=AuditAction.AI_PROCESSING_COMPLETED,
                new_value={"assessment_id": assessment_id, "status": "completed"}
            ))

            # Auto-approve low-risk, low-value claims
            await self._maybe_auto_approve(claim, assessment)
            
            return assessment

        except Exception as e:
            logger.error(f"AI processing failed for claim {claim_id}: {e}")
            assessment.status = AssessmentStatus.FAILED
            assessment.error_message = str(e)
            assessment.processing_completed_at = datetime.now(timezone.utc)
            await self.repo.update_assessment(assessment)
            await self.repo.create_audit_entry(AuditLogCreate(
                claim_id=claim_id,
                action=AuditAction.AI_PROCESSING_COMPLETED,
                new_value={"assessment_id": assessment_id, "status": "failed"}
            ))
            if raise_on_error:
                raise e
            return assessment

    async def get_latest_assessment(self, claim_id: str) -> Optional[AIAssessment]:
        """Get latest AI assessment for a claim."""
        return await self.repo.get_latest_assessment(claim_id)

    async def _maybe_auto_approve(self, claim: Claim, assessment: AIAssessment) -> None:
        """Auto-approve low-risk, low-value claims based on structured outputs."""
        if claim.status in (ClaimStatus.APPROVED, ClaimStatus.DENIED):
            return
        if claim.assigned_handler_id is not None:
            return
        if claim.estimated_damage is None or claim.estimated_damage > AUTO_APPROVE_MAX_DAMAGE:
            return

        outputs = assessment.agent_outputs or {}
        risk = outputs.get("risk_analyst") or {}
        validity = outputs.get("claim_assessor") or {}
        coverage = outputs.get("policy_checker") or {}
        final_out = outputs.get("synthesizer") or {}

        def _coerce_enum(value):  # noqa: WPS430 - small local helper for enum normalization
            return value.value if hasattr(value, "value") else value

        risk_level = _coerce_enum(risk.get("risk_level"))
        risk_score = risk.get("risk_score")
        if isinstance(risk_score, str):
            try:
                risk_score = float(risk_score)
            except ValueError:
                risk_score = None
        validity_status = _coerce_enum(validity.get("validity_status"))
        coverage_status = _coerce_enum(coverage.get("coverage_status"))
        recommendation = _coerce_enum(final_out.get("recommendation") or assessment.final_recommendation)
        confidence = _coerce_enum(final_out.get("confidence"))
        if not risk_level or risk_level not in AUTO_APPROVE_RISK_LEVELS:
            return
        if risk_score is not None and risk_score > AUTO_APPROVE_MAX_RISK_SCORE:
            return
        if validity_status and validity_status not in AUTO_APPROVE_VALIDITY_ALLOWED:
            return
        if coverage_status and coverage_status not in AUTO_APPROVE_COVERAGE_ALLOWED:
            return
        if recommendation:
            if recommendation != AUTO_APPROVE_RECOMMENDATION:
                return
        if confidence is not None and confidence not in AUTO_APPROVE_CONFIDENCE_ALLOWED:
            return
        # Red flags are advisory; low-risk, low-value claims may still auto-approve in demo mode.

        # Mark as handled by the system for UI visibility before recording the decision.
        await self.repo.update_claim(
            claim.id,
            ClaimUpdate(assigned_handler_id=AUTO_APPROVE_HANDLER_ID)
        )

        decision_in = ClaimDecisionCreate(
            claim_id=claim.id,
            handler_id=AUTO_APPROVE_HANDLER_ID,
            decision_type=DecisionType.APPROVED,
            notes="Auto-approved: low risk and low value",
            ai_assessment_id=assessment.id
        )
        await self.record_decision(claim.id, decision_in)

    async def assign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """Assign a claim to a handler."""
        # Get old claim for audit
        old_claim = await self.repo.get_claim(claim_id)
        if not old_claim:
            return None
            
        updated = await self.repo.assign_claim(claim_id, handler_id)
        
        if updated:
            await self.repo.create_audit_entry(AuditLogCreate(
                claim_id=claim_id,
                handler_id=handler_id,
                action=AuditAction.ASSIGNED,
                old_value={"status": old_claim.status, "assigned_handler_id": old_claim.assigned_handler_id},
                new_value={"status": updated.status, "assigned_handler_id": updated.assigned_handler_id}
            ))
            
        return updated

    async def unassign_claim(self, claim_id: str, handler_id: str) -> Optional[Claim]:
        """Unassign a claim and return it to the review queue."""
        old_claim = await self.repo.get_claim(claim_id)
        if not old_claim:
            return None

        updated = await self.repo.unassign_claim(claim_id, handler_id)
        if updated:
            await self.repo.create_audit_entry(AuditLogCreate(
                claim_id=claim_id,
                handler_id=handler_id,
                action=AuditAction.UNASSIGNED,
                old_value={"status": old_claim.status, "assigned_handler_id": old_claim.assigned_handler_id},
                new_value={"status": updated.status, "assigned_handler_id": updated.assigned_handler_id}
            ))
        return updated

    async def get_metrics(self, handler_id: str) -> dict:
        """Get dashboard metrics."""
        return await self.repo.get_metrics(handler_id)

    async def record_decision(self, claim_id: str, decision_in: ClaimDecisionCreate) -> Optional[ClaimDecision]:
        """Record a final decision on a claim."""
        claim = await self.repo.get_claim(claim_id)
        if not claim:
            return None
            
        now = datetime.now(timezone.utc)
        decision_id = str(uuid.uuid4())
        
        decision = ClaimDecision(
            id=decision_id,
            claim_id=claim_id,
            handler_id=decision_in.handler_id,
            decision_type=decision_in.decision_type,
            notes=decision_in.notes,
            ai_assessment_id=decision_in.ai_assessment_id,
            created_at=now
        )
        
        await self.repo.create_decision(decision)
        
        # Update claim status based on decision
        new_status = ClaimStatus.APPROVED if decision.decision_type == DecisionType.APPROVED else \
                     ClaimStatus.DENIED if decision.decision_type == DecisionType.DENIED else \
                     ClaimStatus.AWAITING_INFO
                     
        await self.repo.update_claim(claim_id, ClaimUpdate(status=new_status))
        
        await self.repo.create_audit_entry(AuditLogCreate(
            claim_id=claim_id,
            handler_id=decision.handler_id,
            action=AuditAction.DECISION_RECORDED,
            old_value={"status": claim.status},
            new_value={"status": new_status, "decision": decision.decision_type.value}
        ))
        
        return decision
