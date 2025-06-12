from fastapi import FastAPI
import logging

from app.api.v1.endpoints import workflow as workflow_endpoints
from app.workflow.policy_search import get_policy_search

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    """Initialize policy search index on startup."""
    logger.info("🚀 Initializing policy search index...")
    try:
        policy_search = get_policy_search()
        logger.info("✅ Policy search index initialized successfully")
    except Exception as e:
        logger.error("❌ Failed to initialize policy search index: %s", e)
        # Don't raise - let the app start but log the error

# Root


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": "Hello World"}

# Mount API V1 routers
app.include_router(workflow_endpoints.router, prefix="/api/v1")
