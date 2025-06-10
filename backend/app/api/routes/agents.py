"""
API routes for basic AutoGen agent testing and interaction.
"""

from fastapi import APIRouter, HTTPException
from typing import Any

import os

from app.agents.base import ClaimAssessmentAgent, CustomerCommunicationAgent
from app.schemas.agents import AgentTestRequest, AgentTestResponse
from app.schemas.claims import ClaimData, CustomerInquiry

router = APIRouter()


@router.post("/process", response_model=AgentTestResponse)
async def process_agent_message(request: AgentTestRequest) -> dict[str, Any]:
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
                status_code=400,
                detail="Invalid agent type. Use 'assessment' or 'communication'",
            )

        # Process the message
        response = await agent.process_message(request.message)

        return AgentTestResponse(
            success=True,
            agent_name=agent.name,
            message=request.message,
            response=response,
        )

    except Exception as e:
        return AgentTestResponse(
            success=False,
            agent_name="Unknown",
            message=request.message,
            response="",
            error=str(e),
        )


@router.post("/process-claim")
async def process_insurance_claim(claim_data: ClaimData) -> dict[str, Any]:
    """
    Process a structured insurance claim using the ClaimAssessmentAgent.
    Demonstrates insurance-specific functionality.

    Args:
        claim_data: Structured claim information

    Returns:
        Detailed claim assessment
    """
    try:
        agent = ClaimAssessmentAgent()

        # Convert Pydantic model to dict
        claim_dict = claim_data.model_dump()

        # Use the specialized claim assessment method
        assessment = await agent.assess_claim_validity(claim_dict)

        return {
            "success": True,
            "assessment": assessment,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "claim_id": claim_data.claim_id}


@router.post("/draft-response")
async def draft_customer_response(inquiry: CustomerInquiry) -> dict[str, Any]:
    """
    Draft a customer response using the CustomerCommunicationAgent.
    Demonstrates insurance-specific customer communication features.

    Args:
        inquiry: Customer inquiry with optional context

    Returns:
        Drafted response with metadata
    """
    try:
        agent = CustomerCommunicationAgent()

        # Prepare context if provided
        context = None
        if any([inquiry.customer_id, inquiry.claim_status, inquiry.policy_type]):
            context = {
                "customer_id": inquiry.customer_id,
                "claim_status": inquiry.claim_status,
                "policy_type": inquiry.policy_type,
            }

        # Use the specialized customer response method
        response = await agent.draft_customer_response(inquiry.inquiry, context)

        return {
            "success": True,
            "response": response,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/agent-info/{agent_type}")
async def get_agent_info(agent_type: str) -> dict[str, Any]:
    """
    Get detailed information about an agent's capabilities.
    Demonstrates the hybrid approach's introspection features.

    Args:
        agent_type: Type of agent ("assessment" or "communication")

    Returns:
        Agent information and capabilities
    """
    try:
        if agent_type == "assessment":
            agent = ClaimAssessmentAgent()
        elif agent_type == "communication":
            agent = CustomerCommunicationAgent()
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid agent type. Use 'assessment' or 'communication'",
            )

        info = agent.get_agent_info()

        # Add AutoGen compatibility demonstration
        autogen_methods = []
        for method_name in dir(agent):
            if not method_name.startswith("_") and hasattr(agent.agent, method_name):
                autogen_methods.append(method_name)

        info["autogen_delegated_methods"] = autogen_methods[:10]  # Show first 10
        info["total_autogen_methods"] = len(autogen_methods)

        return {"success": True, "agent_info": info}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/validate-context/{message}")
async def validate_insurance_context(message: str) -> dict[str, Any]:
    """
    Validate if a message contains insurance-related context.
    Demonstrates insurance-specific validation features.

    Args:
        message: Message to validate

    Returns:
        Validation result
    """
    try:
        agent = ClaimAssessmentAgent()
        is_valid = agent.validate_insurance_context(message)

        return {
            "success": True,
            "message": message,
            "is_insurance_related": is_valid,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-autogen-compatibility")
async def test_autogen_compatibility() -> dict[str, Any]:
    """
    Test AutoGen compatibility by creating agents and checking their methods.
    Demonstrates that our hybrid approach maintains AutoGen functionality.

    Returns:
        Compatibility test results
    """
    try:
        # Test both agent types
        assessment_agent = ClaimAssessmentAgent()
        communication_agent = CustomerCommunicationAgent()

        # Check if agents have AutoGen methods
        assessment_methods = [
            method for method in dir(assessment_agent.agent)
            if not method.startswith("_")
        ]
        communication_methods = [
            method for method in dir(communication_agent.agent)
            if not method.startswith("_")
        ]

        return {
            "success": True,
            "autogen_compatibility": True,
            "assessment_agent": {
                "name": assessment_agent.name,
                "autogen_methods_count": len(assessment_methods),
                "sample_methods": assessment_methods[:5],
            },
            "communication_agent": {
                "name": communication_agent.name,
                "autogen_methods_count": len(communication_methods),
                "sample_methods": communication_methods[:5],
            },
        }

    except Exception as e:
        return {
            "success": False,
            "autogen_compatibility": False,
            "error": str(e),
        }


@router.get("/test-azure-openai")
async def test_azure_openai_connection() -> dict[str, Any]:
    """
    Test Azure OpenAI connection and configuration.
    Demonstrates environment setup validation.

    Returns:
        Azure OpenAI connection test results
    """
    try:
        # Check environment variables
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
        azure_api_version = os.getenv(
            "AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

        config_status = {
            "endpoint_configured": bool(azure_endpoint),
            "api_key_configured": bool(azure_api_key),
            "api_version": azure_api_version,
        }

        if not azure_endpoint or not azure_api_key:
            return {
                "success": False,
                "error": "Azure OpenAI configuration incomplete",
                "config_status": config_status,
            }

        # Try to create an agent (this will test the connection)
        agent = ClaimAssessmentAgent()
        agent_info = agent.get_agent_info()

        return {
            "success": True,
            "azure_openai_configured": True,
            "config_status": config_status,
            "agent_creation_successful": True,
            "agent_info": agent_info,
        }

    except Exception as e:
        return {
            "success": False,
            "azure_openai_configured": False,
            "error": str(e),
            "config_status": config_status if 'config_status' in locals() else {},
        }


@router.get("/health")
async def agent_health_check() -> dict[str, Any]:
    """
    Health check endpoint for agent services.
    Verifies that agents can be instantiated and basic functionality works.

    Returns:
        Health status of agent services
    """
    try:
        # Test agent instantiation
        assessment_agent = ClaimAssessmentAgent()
        communication_agent = CustomerCommunicationAgent()

        # Test basic functionality
        assessment_info = assessment_agent.get_agent_info()
        communication_info = communication_agent.get_agent_info()

        return {
            "success": True,
            "status": "healthy",
            "agents": {
                "assessment": {
                    "status": "healthy",
                    "name": assessment_info.get("name"),
                },
                "communication": {
                    "status": "healthy",
                    "name": communication_info.get("name"),
                },
            },
            "timestamp": "2024-01-01T00:00:00Z",  # Would use actual timestamp
        }

    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z",  # Would use actual timestamp
        }
