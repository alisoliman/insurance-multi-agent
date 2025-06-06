from fastapi import APIRouter

from .agents import router as agents_router

# Create the main API router
router = APIRouter()

# Include the agents router
router.include_router(agents_router, prefix="/agents", tags=["agents"])
