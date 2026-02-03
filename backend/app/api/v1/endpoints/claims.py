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
    ClaimDecisionCreate
)


class SeedResponse(BaseModel):
    """Response from seed endpoint."""
    claims_created: int
    claim_ids: List[str]


# ---------------------------------------------------------------------------
# Sample Claims for Seeding (Development/Demo)
# ---------------------------------------------------------------------------

SAMPLE_CLAIMS = [
    {
        "claimant_name": "John Smith",
        "policy_number": "POL-AUTO-2024-001",
        "claim_type": "auto",
        "description": "Rear-end collision at intersection of Main St and Oak Ave. Other driver admitted fault. Damage to rear bumper and trunk.",
        "estimated_damage": 5200.00,
        "location": "Portland, OR",
        "priority": ClaimPriority.MEDIUM,
    },
    {
        "claimant_name": "Sarah Johnson",
        "policy_number": "POL-PROP-2024-015",
        "claim_type": "property",
        "description": "Water damage from burst pipe in upstairs bathroom. Affected ceiling, walls, and flooring in two rooms.",
        "estimated_damage": 15750.00,
        "location": "Seattle, WA",
        "priority": ClaimPriority.HIGH,
    },
    {
        "claimant_name": "Michael Davis",
        "policy_number": "POL-LIAB-2024-008",
        "claim_type": "liability",
        "description": "Customer slipped on wet floor in retail store. Sustained injuries requiring medical attention. Seeking compensation for medical bills and lost wages.",
        "estimated_damage": 52000.00,
        "location": "San Francisco, CA",
        "priority": ClaimPriority.URGENT,
    },
    {
        "claimant_name": "Emily Chen",
        "policy_number": "POL-AUTO-2024-022",
        "claim_type": "auto",
        "description": "Vehicle struck by fallen tree branch during windstorm. Damage to hood, windshield, and roof.",
        "estimated_damage": 8500.00,
        "location": "Denver, CO",
        "priority": ClaimPriority.MEDIUM,
    },
    {
        "claimant_name": "Robert Martinez",
        "policy_number": "POL-PROP-2024-031",
        "claim_type": "property",
        "description": "Fire damage in kitchen from stove malfunction. Fire contained to kitchen but smoke damage throughout home.",
        "estimated_damage": 45000.00,
        "location": "Phoenix, AZ",
        "priority": ClaimPriority.URGENT,
    },
    {
        "claimant_name": "Jennifer Williams",
        "policy_number": "POL-AUTO-2024-045",
        "claim_type": "auto",
        "description": "Side-swipe accident in parking garage. Minor damage to driver side door and mirror.",
        "estimated_damage": 2100.00,
        "location": "Austin, TX",
        "priority": ClaimPriority.LOW,
    },
    {
        "claimant_name": "David Thompson",
        "policy_number": "POL-LIAB-2024-012",
        "claim_type": "liability",
        "description": "Dog bite incident at insured's property. Visitor required emergency room treatment and follow-up care.",
        "estimated_damage": 18500.00,
        "location": "Chicago, IL",
        "priority": ClaimPriority.HIGH,
    },
    {
        "claimant_name": "Amanda Garcia",
        "policy_number": "POL-PROP-2024-028",
        "claim_type": "property",
        "description": "Theft of electronics and jewelry during home break-in. Security system was disabled.",
        "estimated_damage": 12300.00,
        "location": "Miami, FL",
        "priority": ClaimPriority.MEDIUM,
    },
]


router = APIRouter()


async def get_claim_service(db: Connection = Depends(get_db)) -> ClaimService:
    """Dependency to get ClaimService instance."""
    repo = ClaimRepository(db)
    return ClaimService(repo)


# ---------------------------------------------------------------------------
# Collection Endpoints (no path parameters - must come first)
# ---------------------------------------------------------------------------

@router.post("/", response_model=Claim, status_code=201)
async def create_claim(
    claim_in: ClaimCreate,
    service: ClaimService = Depends(get_claim_service)
):
    """Create a new claim submission."""
    return await service.create_claim(claim_in)


@router.get("/", response_model=List[Claim])
async def list_claims(
    handler_id: Optional[str] = Query(None, description="Filter by assigned handler ID"),
    status: Optional[ClaimStatus] = Query(None, description="Filter by claim status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ClaimService = Depends(get_claim_service)
):
    """
    List claims with optional filtering.
    Use handler_id to get 'My Assigned Claims'.
    Use status='new' to get 'Incoming Queue'.
    """
    if handler_id:
        claims, _ = await service.get_assigned_claims(handler_id, limit, offset)
        return claims
    elif status == ClaimStatus.NEW:
        claims, _ = await service.get_incoming_claims(limit, offset)
        return claims
    else:
        # Default to incoming queue if no filters
        claims, _ = await service.get_incoming_claims(limit, offset)
        return claims


@router.get("/handlers", response_model=List[Handler])
async def list_handlers(
    service: ClaimService = Depends(get_claim_service)
):
    """List all active claim handlers."""
    return await service.get_handlers()


@router.get("/metrics", response_model=Dict[str, int])
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
    All seeded claims have status='new' (unassigned).
    """
    created_ids = []
    
    # Shuffle and pick 'count' claims from samples
    samples = random.sample(SAMPLE_CLAIMS, min(count, len(SAMPLE_CLAIMS)))
    
    for sample in samples:
        # Randomize incident date within last 7 days
        days_ago = random.randint(0, 7)
        incident_date = datetime.utcnow() - timedelta(days=days_ago)
        
        claim_create = ClaimCreate(
            claimant_name=sample["claimant_name"],
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
    Fails if claim is already assigned.
    """
    claim = await service.assign_claim(claim_id, handler_id)
    if not claim:
        raise HTTPException(
            status_code=409, 
            detail="Claim could not be assigned (it may not exist or is already assigned)"
        )
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


@router.post("/{claim_id}/decision", response_model=ClaimDecision)
async def record_decision(
    claim_id: str,
    decision_in: ClaimDecisionCreate,
    service: ClaimService = Depends(get_claim_service)
):
    """Record a decision for a claim."""
    if decision_in.claim_id and decision_in.claim_id != claim_id:
         raise HTTPException(status_code=400, detail="Claim ID mismatch in body")
    
    decision_in.claim_id = claim_id
         
    decision = await service.record_decision(claim_id, decision_in)
    if not decision:
        raise HTTPException(status_code=404, detail="Claim not found")
    return decision
