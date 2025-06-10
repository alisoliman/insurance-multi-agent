from fastapi import APIRouter

from .agents import router as agents_router
from .orchestrator import router as orchestrator_router
from .enhanced_assessment import router as enhanced_assessment_router
from .enhanced_communication import router as enhanced_communication_router
from .health import router as health_router
from .websocket import router as websocket_router
from .websocket_management import router as websocket_management_router
from .feedback import router as feedback_router

# Create the main API router
router = APIRouter()

# Include routers
router.include_router(health_router, tags=["health"])
router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(orchestrator_router,
                      prefix="/agents/orchestrator", tags=["orchestrator"])
router.include_router(enhanced_assessment_router,
                      prefix="/agents/enhanced-assessment", tags=["enhanced-assessment"])
router.include_router(enhanced_communication_router,
                      prefix="/agents/enhanced-communication", tags=["enhanced-communication"])
router.include_router(websocket_router, prefix="/ws", tags=["websocket"])
router.include_router(
    websocket_management_router, prefix="/websocket", tags=["websocket-management"]
)
router.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
