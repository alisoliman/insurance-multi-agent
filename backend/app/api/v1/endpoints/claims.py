"""
API endpoints for Claims Workbench operations.
Feature 005 - Claims Workbench
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from aiosqlite import Connection

from app.db.database import get_db
from app.db.repositories.claim_repo import ClaimRepository
from app.services.claim_service import ClaimService
from app.models.workbench import (
    Claim,
    ClaimCreate,
    ClaimStatus,
    ClaimPriority,
    Handler,
    AIAssessment,
    ClaimDecision,
    ClaimDecisionCreate,
    DecisionType
)


class SeedResponse(BaseModel):
    """Response from seed endpoint."""
    claims_created: int
    claim_ids: List[str]


class ClaimDecisionRequest(BaseModel):
    """Request body for recording a decision (claim_id is taken from path)."""
    handler_id: str
    decision_type: DecisionType
    notes: Optional[str] = None
    ai_assessment_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Sample Claims for Seeding (Development/Demo)
# ---------------------------------------------------------------------------

AUTO_APPROVE_SAMPLES = [
    {
        "claimant_name": "John Smith",
        "claimant_id": "CLT-1001",
        "policy_number": "POL-2024-001",
        "claim_type": "auto",
        "description": "Low-speed parking lot scrape. Photos and repair estimate attached. No injuries.",
        "estimated_damage": 1200.00,
        "location": "Portland, OR",
        "priority": ClaimPriority.LOW,
    },
    {
        "claimant_name": "Sarah Johnson",
        "claimant_id": "CLT-1002",
        "policy_number": "POL-2024-002",
        "claim_type": "auto",
        "description": "Windshield chip from highway debris. Photos and invoice from glass shop attached. No other damage.",
        "estimated_damage": 450.00,
        "location": "Seattle, WA",
        "priority": ClaimPriority.LOW,
    },
    {
        "claimant_name": "John Smith",
        "claimant_id": "CLT-1003",
        "policy_number": "POL-2024-001",
        "claim_type": "auto",
        "description": "Rear-end collision at stoplight. Other driver admitted fault; police report filed. Photos and repair estimate attached.",
        "estimated_damage": 5200.00,
        "location": "Austin, TX",
        "priority": ClaimPriority.MEDIUM,
    },
    {
        "claimant_name": "Sarah Johnson",
        "claimant_id": "CLT-1004",
        "policy_number": "POL-2024-002",
        "claim_type": "auto",
        "description": "Minor hail damage to roof and hood. Photos and body shop estimate attached.",
        "estimated_damage": 1800.00,
        "location": "Denver, CO",
        "priority": ClaimPriority.MEDIUM,
    },
]

REVIEW_SAMPLES = [
    {
        "claimant_name": "Michael Davis",
        "claimant_id": "CLT-2001",
        "policy_number": "POL-2024-001",
        "claim_type": "auto",
        "description": "Multi-vehicle collision with reported injuries. Vehicle potentially totaled. Conflicting statements in report.",
        "estimated_damage": 48000.00,
        "location": "San Francisco, CA",
        "priority": ClaimPriority.URGENT,
    },
    {
        "claimant_name": "Emily Chen",
        "claimant_id": "CLT-2002",
        "policy_number": "POL-PROP-2024-031",
        "claim_type": "property",
        "description": "Kitchen fire and smoke damage. Limited documentation and delayed report. Cause under investigation.",
        "estimated_damage": 45000.00,
        "location": "Phoenix, AZ",
        "priority": ClaimPriority.URGENT,
    },
    {
        "claimant_name": "David Thompson",
        "claimant_id": "CLT-2003",
        "policy_number": "POL-LIAB-2024-012",
        "claim_type": "liability",
        "description": "Slip-and-fall claim with legal representation. Medical bills and wage loss requested. Incident details disputed.",
        "estimated_damage": 52000.00,
        "location": "Chicago, IL",
        "priority": ClaimPriority.HIGH,
    },
    {
        "claimant_name": "Amanda Garcia",
        "claimant_id": "CLT-2004",
        "policy_number": "POL-2024-002",
        "claim_type": "auto",
        "description": "Reported vehicle theft with missing keys; police report pending. Prior claims in last 12 months noted.",
        "estimated_damage": 26000.00,
        "location": "Miami, FL",
        "priority": ClaimPriority.HIGH,
    },
]

SAMPLE_CLAIMS = AUTO_APPROVE_SAMPLES + REVIEW_SAMPLES


router = APIRouter()


async def get_claim_service(db: Connection = Depends(get_db)) -> ClaimService:
    """Dependency to get ClaimService instance."""
    repo = ClaimRepository(db)
    return ClaimService(repo)


# ---------------------------------------------------------------------------
# Collection Endpoints (no path parameters - must come first)
# ---------------------------------------------------------------------------

@router.post("", response_model=Claim, status_code=201, include_in_schema=False)
@router.post("/", response_model=Claim, status_code=201)
async def create_claim(
    claim_in: ClaimCreate,
    service: ClaimService = Depends(get_claim_service)
):
    """Create a new claim submission."""
    return await service.create_claim(claim_in)


@router.get("", response_model=List[Claim], include_in_schema=False)
@router.get("/", response_model=List[Claim])
async def list_claims(
    handler_id: Optional[str] = Query(None, description="Filter by assigned handler ID"),
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
    created_from: Optional[str] = Query(None, description="Filter by created_at start (ISO)"),
    created_to: Optional[str] = Query(None, description="Filter by created_at end (ISO)"),
    search: Optional[str] = Query(None, description="Search by claim ID or claimant name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ClaimService = Depends(get_claim_service)
):
    """
    List claims with optional filtering.
    Use handler_id to get 'My Assigned Claims'.
    """
    if handler_id:
        claims, _ = await service.get_assigned_claims(
            handler_id=handler_id,
            status=status,
            claim_type=claim_type,
            created_from=created_from,
            created_to=created_to,
            search=search,
            limit=limit,
            offset=offset
        )
        return claims

    claims, _ = await service.repo.get_claims(
        status=status,
        claim_type=claim_type,
        created_from=created_from,
        created_to=created_to,
        search=search,
        limit=limit,
        offset=offset
    )
    return claims


@router.get("/handlers", response_model=List[Handler])
async def list_handlers(
    service: ClaimService = Depends(get_claim_service)
):
    """List all active claim handlers."""
    return await service.get_handlers()


@router.get("/metrics", response_model=Dict[str, float])
async def get_metrics(
    handler_id: str = Query(..., description="Handler ID to get metrics for"),
    service: ClaimService = Depends(get_claim_service)
):
    """Get dashboard metrics for a handler."""
    return await service.get_metrics(handler_id)


@router.post("/seed", response_model=SeedResponse)
async def seed_claims(
    count: int = Query(default=5, ge=1, le=10, description="Number of claims to create"),
    service: ClaimService = Depends(get_claim_service)
):
    """
    Seed the database with sample claims for demo/testing.
    Creates random claims from predefined templates.
    All seeded claims auto-start AI processing.
    """
    created_ids = []
    
    def pick_from_pool(pool: List[dict], k: int) -> List[dict]:
        if k <= 0:
            return []
        if k <= len(pool):
            return random.sample(pool, k)
        return random.choices(pool, k=k)

    auto_count = min(len(AUTO_APPROVE_SAMPLES), max(1, count // 2))
    review_count = max(0, count - auto_count)

    samples = pick_from_pool(AUTO_APPROVE_SAMPLES, auto_count) + pick_from_pool(REVIEW_SAMPLES, review_count)
    random.shuffle(samples)
    
    for sample in samples:
        # Randomize incident date within last 7 days
        days_ago = random.randint(0, 7)
        incident_date = datetime.utcnow() - timedelta(days=days_ago)
        
        claim_create = ClaimCreate(
            claimant_name=sample["claimant_name"],
            claimant_id=sample.get("claimant_id"),
            policy_number=sample["policy_number"],
            claim_type=sample["claim_type"],
            description=sample["description"],
            incident_date=incident_date,
            estimated_damage=sample["estimated_damage"],
            location=sample["location"],
            priority=sample["priority"],
        )
        
        claim = await service.create_claim(claim_create)
        created_ids.append(claim.id)
    
    return SeedResponse(claims_created=len(created_ids), claim_ids=created_ids)


# ---------------------------------------------------------------------------
# Queue Endpoints
# ---------------------------------------------------------------------------

@router.get("/queue", response_model=List[Claim])
async def get_review_queue(
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
    created_from: Optional[str] = Query(None, description="Filter by created_at start (ISO)"),
    created_to: Optional[str] = Query(None, description="Filter by created_at end (ISO)"),
    search: Optional[str] = Query(None, description="Search by claim ID or claimant name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ClaimService = Depends(get_claim_service)
):
    """Get AI-processed, unassigned claims ready for review."""
    claims, _ = await service.get_review_queue(
        status=status,
        claim_type=claim_type,
        created_from=created_from,
        created_to=created_to,
        search=search,
        limit=limit,
        offset=offset
    )
    return claims


@router.get("/processing-queue", response_model=List[Claim])
async def get_processing_queue(
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
    created_from: Optional[str] = Query(None, description="Filter by created_at start (ISO)"),
    created_to: Optional[str] = Query(None, description="Filter by created_at end (ISO)"),
    search: Optional[str] = Query(None, description="Search by claim ID or claimant name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ClaimService = Depends(get_claim_service)
):
    """Get claims pending or processing AI."""
    claims, _ = await service.get_processing_queue(
        claim_type=claim_type,
        created_from=created_from,
        created_to=created_to,
        search=search,
        limit=limit,
        offset=offset
    )
    return claims


# ---------------------------------------------------------------------------
# Item Endpoints (with path parameters - must come after static paths)
# ---------------------------------------------------------------------------

@router.get("/{claim_id}", response_model=Claim)
async def get_claim(
    claim_id: str,
    service: ClaimService = Depends(get_claim_service)
):
    """Get claim details by ID."""
    claim = await service.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.post("/{claim_id}/assign", response_model=Claim)
async def assign_claim(
    claim_id: str,
    handler_id: str = Query(..., description="ID of the handler to assign"),
    service: ClaimService = Depends(get_claim_service)
):
    """
    Assign a claim to a handler.
    Fails if claim is already assigned or AI is not complete.
    """
    claim = await service.assign_claim(claim_id, handler_id)
    if not claim:
        raise HTTPException(
            status_code=409,
            detail="Claim could not be assigned (it may not exist, AI is not complete, or it is already assigned)"
        )
    return claim


@router.post("/{claim_id}/unassign", response_model=Claim)
async def unassign_claim(
    claim_id: str,
    body: Dict[str, str],
    service: ClaimService = Depends(get_claim_service)
):
    """Unassign a claim and return it to the review queue."""
    handler_id = body.get("handler_id")
    if not handler_id:
        raise HTTPException(status_code=400, detail="handler_id is required")
    claim = await service.unassign_claim(claim_id, handler_id)
    if not claim:
        raise HTTPException(status_code=403, detail="Claim not found or not owned by handler")
    return claim


@router.post("/{claim_id}/process", response_model=AIAssessment)
async def process_claim(
    claim_id: str,
    service: ClaimService = Depends(get_claim_service)
):
    """
    Run multi-agent AI workflow on a claim.
    Returns the AI assessment results.
    """
    try:
        assessment = await service.process_claim(claim_id)
        if not assessment:
             raise HTTPException(status_code=404, detail="Claim not found")
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/{claim_id}/assessment", response_model=AIAssessment)
async def get_latest_assessment(
    claim_id: str,
    service: ClaimService = Depends(get_claim_service)
):
    """Get latest AI assessment for a claim."""
    assessment = await service.get_latest_assessment(claim_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("/{claim_id}/decision", response_model=ClaimDecision)
async def record_decision(
    claim_id: str,
    decision_in: ClaimDecisionRequest,
    service: ClaimService = Depends(get_claim_service)
):
    """Record a decision for a claim."""
    decision_create = ClaimDecisionCreate(
        claim_id=claim_id,
        handler_id=decision_in.handler_id,
        decision_type=decision_in.decision_type,
        notes=decision_in.notes,
        ai_assessment_id=decision_in.ai_assessment_id
    )
         
    decision = await service.record_decision(claim_id, decision_create)
    if not decision:
        raise HTTPException(status_code=404, detail="Claim not found")
    return decision


# ---------------------------------------------------------------------------
