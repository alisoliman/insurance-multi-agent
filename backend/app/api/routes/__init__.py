from fastapi import APIRouter

from .agents import router as agents_router
from .health import router as health_router

# Create the main API router
router = APIRouter()

# Include routers
router.include_router(health_router, tags=["health"])
router.include_router(agents_router, prefix="/agents", tags=["agents"])
