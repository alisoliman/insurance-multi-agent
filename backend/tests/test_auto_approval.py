from datetime import datetime, timezone

import pytest

from app.db.repositories.claim_repo import ClaimRepository
from app.models.workbench import (
    Claim,
    ClaimPriority,
    ClaimStatus,
    AIAssessment,
    AssessmentStatus,
)
from app.services.claim_service import ClaimService


@pytest.mark.asyncio
async def test_auto_approves_low_risk_claim(db):
    repo = ClaimRepository(db)
    service = ClaimService(repo)

    now = datetime.now(timezone.utc)
    claim = Claim(
        id="claim-001",
        claimant_name="Test Customer",
        claimant_id="CLT-1001",
        policy_number="POL-2024-001",
        claim_type="auto",
        description="Minor scrape in parking lot",
        incident_date=now,
        estimated_damage=1200.0,
        location="Portland, OR",
        priority=ClaimPriority.LOW,
        status=ClaimStatus.NEW,
        version=1,
        created_at=now,
    )

    await repo.create_claim(claim)

    assessment = AIAssessment(
        id="assessment-001",
        claim_id=claim.id,
        status=AssessmentStatus.COMPLETED,
        agent_outputs={
            "risk_analyst": {"risk_level": "LOW_RISK", "risk_score": "12"},
            "claim_assessor": {"validity_status": "VALID"},
            "policy_checker": {"coverage_status": "COVERED"},
            "synthesizer": {"recommendation": "APPROVE", "confidence": "HIGH"},
        },
        final_recommendation="APPROVE",
        confidence_scores={"supervisor": 0.9},
        processing_started_at=now,
        processing_completed_at=now,
        created_at=now,
    )
    await repo.create_assessment(assessment)

    await service._maybe_auto_approve(claim, assessment)

    updated = await repo.get_claim(claim.id)
    assert updated is not None
    assert updated.status == ClaimStatus.APPROVED
    assert updated.assigned_handler_id == "system"

    cursor = await db.execute(
        "SELECT COUNT(*) FROM claim_decisions WHERE claim_id = ?",
        (claim.id,),
    )
    decision_count = (await cursor.fetchone())[0]
    assert decision_count == 1


@pytest.mark.asyncio
async def test_does_not_auto_approve_high_risk_claim(db):
    repo = ClaimRepository(db)
    service = ClaimService(repo)

    now = datetime.now(timezone.utc)
    claim = Claim(
        id="claim-002",
        claimant_name="Risky Customer",
        claimant_id="CLT-2001",
        policy_number="POL-2024-002",
        claim_type="auto",
        description="Suspicious theft claim",
        incident_date=now,
        estimated_damage=8000.0,
        location="Miami, FL",
        priority=ClaimPriority.HIGH,
        status=ClaimStatus.NEW,
        version=1,
        created_at=now,
    )

    await repo.create_claim(claim)

    assessment = AIAssessment(
        id="assessment-002",
        claim_id=claim.id,
        status=AssessmentStatus.COMPLETED,
        agent_outputs={
            "risk_analyst": {"risk_level": "HIGH_RISK", "risk_score": 85},
            "claim_assessor": {"validity_status": "VALID"},
            "policy_checker": {"coverage_status": "COVERED"},
            "synthesizer": {"recommendation": "INVESTIGATE", "confidence": "HIGH"},
        },
        final_recommendation="INVESTIGATE",
        processing_started_at=now,
        processing_completed_at=now,
        created_at=now,
    )
    await repo.create_assessment(assessment)

    await service._maybe_auto_approve(claim, assessment)

    updated = await repo.get_claim(claim.id)
    assert updated is not None
    assert updated.status == ClaimStatus.NEW
    assert updated.assigned_handler_id is None

    cursor = await db.execute(
        "SELECT COUNT(*) FROM claim_decisions WHERE claim_id = ?",
        (claim.id,),
    )
    decision_count = (await cursor.fetchone())[0]
    assert decision_count == 0
