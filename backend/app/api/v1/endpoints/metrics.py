"""
API endpoints for Workbench metrics.
"""

from typing import Dict

from fastapi import APIRouter, Depends, Query
from aiosqlite import Connection

from app.db.database import get_db
from app.db.repositories.claim_repo import ClaimRepository
from app.services.claim_service import ClaimService

router = APIRouter()


async def get_claim_service(db: Connection = Depends(get_db)) -> ClaimService:
    repo = ClaimRepository(db)
    return ClaimService(repo)


@router.get("/metrics", response_model=Dict[str, float])
async def get_metrics(
    handler_id: str = Query(..., description="Handler ID to get metrics for"),
    service: ClaimService = Depends(get_claim_service)
):
    """Get dashboard metrics for a handler."""
    return await service.get_metrics(handler_id)
