from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.api.v1.endpoints import workflow as workflow_endpoints
from app.workflow.policy_search import get_policy_search

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
frontend_origin = os.getenv("FRONTEND_ORIGIN")

# Default origins for local development
default_dev_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# If FRONTEND_ORIGIN is set (e.g., https://frontend-*.azurecontainerapps.io) use it; otherwise, fall back to dev origins.
allow_origins = [frontend_origin] if frontend_origin else default_dev_origins

# In case no specific origin is provided for production, allow all (*) to unblock CORS, but log a warning.
if not frontend_origin and os.getenv("ALLOW_ALL_CORS", "false").lower() == "true":
    logging.warning("CORS is configured to allow all origins – set FRONTEND_ORIGIN for stricter policy.")
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
