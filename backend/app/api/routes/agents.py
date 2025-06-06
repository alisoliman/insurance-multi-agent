"""
API routes for AutoGen agent testing and interaction.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.agents.base import ClaimAssessmentAgent, CustomerCommunicationAgent

router = APIRouter()


class AgentTestRequest(BaseModel):
    message: str
    agent_type: str = "assessment"  # "assessment" or "communication"


class AgentTestResponse(BaseModel):
    success: bool
    agent_name: str
    message: str
    response: str
    error: str = None


@router.post("/process", response_model=AgentTestResponse)
async def process_agent_message(request: AgentTestRequest):
    """
    Process a message through a specific AutoGen agent.

    Args:
        request: Contains the message and agent type

    Returns:
        Agent response and metadata
    """
    try:
        # Select the appropriate agent
        if request.agent_type == "assessment":
            agent = ClaimAssessmentAgent()
        elif request.agent_type == "communication":
            agent = CustomerCommunicationAgent()
        else:
            raise HTTPException(
                status_code=400, detail="Invalid agent type. Use 'assessment' or 'communication'")

        # Process the message
        response = await agent.process_message(request.message)

        return AgentTestResponse(
            success=True,
            agent_name=agent.name,
            message=request.message,
            response=response
        )

    except Exception as e:
        return AgentTestResponse(
            success=False,
            agent_name="Unknown",
            message=request.message,
            response="",
            error=str(e)
        )


@router.get("/test-azure-openai")
async def test_azure_openai_connection():
    """
    Test the Azure OpenAI connection directly.

    Returns:
        Status of the Azure OpenAI connection and configuration
    """
    try:
        from app.agents.base import AutoGenConfig
        from app.core.config import settings

        # Check configuration
        config_status = {
            "azure_openai_api_key_set": bool(settings.AZURE_OPENAI_API_KEY),
            "azure_openai_endpoint_set": bool(settings.AZURE_OPENAI_ENDPOINT),
            "azure_openai_deployment_name": settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            "azure_openai_api_version": settings.AZURE_OPENAI_API_VERSION
        }

        # Try to create a model client
        model_client = AutoGenConfig.get_model_client()
        if model_client is None:
            return {
                "success": False,
                "error": "Could not create Azure OpenAI model client",
                "config": config_status
            }

        # Try to create an agent and test a simple interaction
        agent = ClaimAssessmentAgent()
        test_response = await agent.process_message("Please respond with 'Azure OpenAI is working' to confirm the connection.")

        return {
            "success": True,
            "config": config_status,
            "model_client_type": str(type(model_client).__name__),
            "test_response": test_response,
            "agent_name": agent.name
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


@router.get("/health")
async def agent_health_check():
    """
    Health check for the agents module.

    Returns:
        Status of the AutoGen integration
    """
    try:
        # Try to import and instantiate a basic agent
        from app.agents.base import ClaimAssessmentAgent
        agent = ClaimAssessmentAgent()

        return {
            "status": "healthy",
            "autogen_version": "0.6.1",
            "agents_available": ["ClaimAssessmentAgent", "CustomerCommunicationAgent"],
            "model_client": str(type(agent.model_client).__name__)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Agents module unhealthy: {str(e)}")
