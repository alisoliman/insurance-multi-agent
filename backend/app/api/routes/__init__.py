from fastapi import APIRouter

from .tasks import router as tasks_router

# Create the main API router
router = APIRouter()

# Include the tasks router
router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
