from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.v1.endpoints import workflow as workflow_endpoints
from app.workflow.policy_search import get_policy_search

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default dev port
        "http://localhost:3001",  # Alternative dev port
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://127.0.0.1:3001",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
