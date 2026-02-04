import logging
import os
import traceback
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import workflow as workflow_endpoints
from app.api.v1.endpoints import files as files_endpoints
from app.api.v1.endpoints import agent as agent_endpoints
from app.api.v1.endpoints import documents as documents_endpoints
from app.api.v1.endpoints import index_management as index_endpoints
from app.api.v1.endpoints import claims as claims_endpoints
from app.api.v1.endpoints import metrics as metrics_endpoints
from app.workflow.policy_search import get_policy_search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import scenarios endpoint
scenarios_endpoints = None
SCENARIOS_AVAILABLE = False
try:
    from app.api.v1.endpoints import scenarios as scenarios_endpoints
    SCENARIOS_AVAILABLE = True
except Exception as e:
    logger.error(f"Failed to import scenarios endpoint: {e}")
    traceback.print_exc()

app = FastAPI()


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f">>> Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"<<< Response: {response.status_code} ({process_time:.3f}s)")
        return response
    except Exception as e:
        logger.exception(f"!!! Request failed: {e}")
        raise


# CORS configuration
DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
AZURE_ORIGINS = [
    "https://frontend-gqxcjz.redflower-818d79c8.eastus2.azurecontainerapps.io",
]
AZURE_ORIGIN_REGEX = r"https://.*\.azurecontainerapps\.io"

frontend_origin = os.getenv("FRONTEND_ORIGIN")
allow_all_cors = os.getenv("ALLOW_ALL_CORS", "false").lower() == "true"

if allow_all_cors:
    allow_origins = ["*"]
    allow_origin_regex = None
    logger.warning("CORS allows all origins - set FRONTEND_ORIGIN for stricter policy")
elif frontend_origin:
    allow_origins = [frontend_origin] + DEV_ORIGINS
    allow_origin_regex = AZURE_ORIGIN_REGEX
    logger.info(f"CORS configured for: {frontend_origin} + dev origins + Azure regex")
else:
    allow_origins = DEV_ORIGINS + AZURE_ORIGINS
    allow_origin_regex = AZURE_ORIGIN_REGEX
    logger.info(f"CORS configured for dev + Azure origins")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize policy search index and re-index saved policies on startup."""
    logger.info("Initializing policy search index...")
    try:
        get_policy_search()
        logger.info("Policy search index initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize policy search index: %s", e)
    
    logger.info("Re-indexing policies from saved scenarios...")
    try:
        from app.db.database import init_db
        from app.services.scenario_generator import reindex_saved_policies
        
        await init_db()
        indexed_count = await reindex_saved_policies()
        logger.info(f"Re-indexed {indexed_count} policies from saved scenarios")
    except Exception as e:
        logger.error("Failed to re-index saved policies: %s", e)


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": "Hello World"}

# Mount API V1 routers
app.include_router(workflow_endpoints.router, prefix="/api/v1")
app.include_router(files_endpoints.router, prefix="/api/v1")
app.include_router(agent_endpoints.router, prefix="/api/v1")
app.include_router(documents_endpoints.router, prefix="/api/v1")
app.include_router(index_endpoints.router, prefix="/api/v1")
app.include_router(claims_endpoints.router, prefix="/api/v1/claims", tags=["claims"])
app.include_router(metrics_endpoints.router, prefix="/api/v1", tags=["metrics"])

if SCENARIOS_AVAILABLE and scenarios_endpoints is not None:
    app.include_router(scenarios_endpoints.router, prefix="/api/v1")
    logger.info("Scenarios endpoint registered")
else:
    logger.warning("Scenarios endpoint NOT available due to import error")
