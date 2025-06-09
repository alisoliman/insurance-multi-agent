from fastapi import APIRouter

from .agents import router as agents_router
from .health import router as health_router
from .websocket import router as websocket_router
from .websocket_management import router as websocket_management_router

# Create the main API router
router = APIRouter()

# Include routers
router.include_router(health_router, tags=["health"])
router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(websocket_router, prefix="/ws", tags=["websocket"])
router.include_router(
    websocket_management_router, prefix="/websocket", tags=["websocket-management"]
)
