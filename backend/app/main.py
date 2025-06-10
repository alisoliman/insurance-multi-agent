"""
FastAPI application factory and configuration.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router
from app.core.config import settings
from app.core.logger import setup_logging

# Setup logging
setup_logging()

# Simple fix: Disable AutoGen's problematic loggers that cause JSON serialization errors
logging.getLogger("autogen_core.logging").disabled = True
logging.getLogger("autogen_ext.models.openai").setLevel(logging.ERROR)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router, prefix=settings.API_PREFIX)

    # Serve static files
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

    return app


app = create_app()


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Welcome to the Shadcn-FastAPI Starter API!"}
