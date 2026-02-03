"""
Service layer for claim workflow operations.
Feature 005 - Claims Workbench
"""

import logging
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from app.db.repositories.claim_repo import ClaimRepository
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

class ClaimService:
    """Service for managing claims and handler assignments."""

    def __init__(self, claim_repo: ClaimRepository):
        self.repo = claim_repo

    async def create_claim(self, claim_in: ClaimCreate) -> Claim:
        """Create a new claim submission."""
        now = datetime.utcnow()
        claim_data = claim_in.model_dump()
        
        # Generate claimant_id if not provided (for demo/seed data)
        if not claim_data.get("claimant_id"):
            claim_data["claimant_id"] = f"CLM-{str(uuid.uuid4())[:8].upper()}"
        
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
        
        return created

    async def get_assigned_claims(
        self, 
        handler_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """Get claims assigned to a specific handler."""
        return await self.repo.get_claims(
            handler_id=handler_id,
            limit=limit,
            offset=offset
        )

    async def get_incoming_claims(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Claim], int]:
        """Get unassigned new claims."""
        return await self.repo.get_claims(
            status=ClaimStatus.NEW,
            limit=limit,
            offset=offset
        )
    
    async def get_claim(self, claim_id: str) -> Optional[Claim]:
        """Get a single claim by ID."""
        return await self.repo.get_claim(claim_id)

    async def get_handlers(self) -> List[Handler]:
        """Get list of active handlers."""
        return await self.repo.get_handlers()

    async def process_claim(self, claim_id: str) -> Optional[AIAssessment]:
        """Run multi-agent AI workflow on a claim."""
        claim = await self.repo.get_claim(claim_id)
        if not claim:
            return None

        # Create initial assessment record
        now = datetime.utcnow()
        assessment_id = str(uuid.uuid4())
        assessment = AIAssessment(
            id=assessment_id,
            claim_id=claim_id,
            status=AssessmentStatus.PROCESSING,
            processing_started_at=now,
            created_at=now
        )
        await self.repo.create_assessment(assessment)

        # Update claim status
        await self.repo.update_claim(claim_id, ClaimUpdate(status=ClaimStatus.IN_PROGRESS))
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
            
            for chunk in chunks:
                for agent_name, data in chunk.items():
                    if "structured_output" in data and data["structured_output"]:
                        agent_outputs[agent_name] = data["structured_output"]
                    
                    if agent_name == "synthesizer" and "structured_output" in data:
                        # Assuming FinalAssessment has recommendation field
                        final_out = data["structured_output"]
                        if "final_recommendation" in final_out:
                            final_rec = final_out["final_recommendation"]
                        elif "recommendation" in final_out:
                             final_rec = final_out["recommendation"]
                        
                        # Extract confidence scores if available (mocking for now if not deep in structure)
                        if "confidence_score" in final_out:
                             confidence_scores["supervisor"] = final_out["confidence_score"]

            # Update assessment record
            assessment.status = AssessmentStatus.COMPLETED
            assessment.agent_outputs = agent_outputs
            assessment.final_recommendation = str(final_rec) if final_rec else None
            assessment.confidence_scores = confidence_scores
            assessment.processing_completed_at = datetime.utcnow()
            
            await self.repo.update_assessment(assessment)
            
            await self.repo.create_audit_entry(AuditLogCreate(
                claim_id=claim_id,
                action=AuditAction.AI_PROCESSING_COMPLETED,
                new_value={"assessment_id": assessment_id, "status": "completed"}
            ))
            
            return assessment

        except Exception as e:
            logger.error(f"AI processing failed for claim {claim_id}: {e}")
            assessment.status = AssessmentStatus.FAILED
            assessment.error_message = str(e)
            assessment.processing_completed_at = datetime.utcnow()
            await self.repo.update_assessment(assessment)
            raise e

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

    async def get_metrics(self, handler_id: str) -> dict:
        """Get dashboard metrics."""
        return await self.repo.get_metrics(handler_id)

    async def record_decision(self, claim_id: str, decision_in: ClaimDecisionCreate) -> Optional[ClaimDecision]:
        """Record a final decision on a claim."""
        claim = await self.repo.get_claim(claim_id)
        if not claim:
            return None
            
        now = datetime.utcnow()
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
