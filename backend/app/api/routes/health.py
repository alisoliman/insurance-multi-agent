"""
Health check and monitoring API routes.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import asyncio
from datetime import datetime

router = APIRouter()


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Basic health check endpoint.

    Returns:
        Health status of the application and its services
    """
    try:
        # Check basic service availability
        services = {
            "api": "healthy",
            "agents": "healthy",
            "database": "not_configured",  # Will be updated when DB is added
        }

        # Test agent imports
        try:
            from app.agents.assessment import EnhancedAssessmentAgent
            from app.agents.communication import EnhancedCommunicationAgent
            services["agents"] = "healthy"
        except Exception:
            services["agents"] = "unhealthy"

        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            services=services
        )

    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            services={"error": str(e)}
        )


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with component testing.

    Returns:
        Detailed health information including component status
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {}
    }

    # Test agent initialization
    try:
        from app.agents.assessment import EnhancedAssessmentAgent
        agent = EnhancedAssessmentAgent()
        health_data["components"]["assessment_agent"] = {
            "status": "healthy",
            "name": agent.name,
            "type": agent.agent_type
        }
    except Exception as e:
        health_data["components"]["assessment_agent"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    try:
        from app.agents.communication import EnhancedCommunicationAgent
        agent = EnhancedCommunicationAgent()
        health_data["components"]["communication_agent"] = {
            "status": "healthy",
            "name": agent.name,
            "capabilities": len(agent.supported_languages)
        }
    except Exception as e:
        health_data["components"]["communication_agent"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Check if any components are unhealthy
    unhealthy_components = [
        comp for comp, data in health_data["components"].items()
        if data.get("status") == "unhealthy"
    ]

    if unhealthy_components:
        health_data["status"] = "degraded"
        health_data["unhealthy_components"] = unhealthy_components

    return health_data


@router.get("/ready")
async def readiness_check():
    """
    Kubernetes-style readiness check.

    Returns:
        Simple ready/not ready status
    """
    try:
        # Basic readiness checks
        from app.agents.assessment import EnhancedAssessmentAgent
        from app.agents.communication import EnhancedCommunicationAgent

        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}


@router.get("/live")
async def liveness_check():
    """
    Kubernetes-style liveness check.

    Returns:
        Simple alive/dead status
    """
    return {"status": "alive"}
