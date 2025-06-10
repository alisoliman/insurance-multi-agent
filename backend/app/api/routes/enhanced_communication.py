"""
API routes for Enhanced Communication agent functionality.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Any
import logging

from app.agents.communication import (
    EnhancedCommunicationAgent,
    CommunicationType,
    CommunicationContext,
    Language,
)
from app.schemas.communication import (
    CommunicationRequest,
    AssessmentBasedCommunicationRequest,
)
from app.core.exceptions import (
    handle_agent_error,
    safe_serialize_response,
    CommunicationError,
    AgentInitializationError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/capabilities")
async def get_enhanced_communication_capabilities() -> dict[str, Any]:
    """
    Get the capabilities of the enhanced communication agent.

    Returns:
        Agent capabilities and configuration
    """
    try:
        agent = EnhancedCommunicationAgent()
        capabilities = agent.get_capabilities()

        return {"success": True, "capabilities": capabilities}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/generate")
async def generate_communication(request: CommunicationRequest) -> dict[str, Any]:
    """
    Generate communication using the enhanced communication agent.

    Args:
        request: Communication request with context and preferences

    Returns:
        Generated communication content
    """
    try:
        logger.info(
            f"Generating communication of type: {request.communication_type}")

        # Initialize agent with error handling
        try:
            agent = EnhancedCommunicationAgent()
        except Exception as e:
            logger.error(
                f"Failed to initialize EnhancedCommunicationAgent: {e}")
            raise AgentInitializationError(
                "EnhancedCommunicationAgent", str(e))

        # Generate the communication
        try:
            # Create CommunicationContext from request
            context = CommunicationContext(
                customer_name=request.customer_name,
                claim_id=request.claim_id,
                policy_number=request.policy_number,
                communication_type=CommunicationType(
                    request.communication_type),
                assessment_result=request.assessment_result,
                policy_details=request.policy_details,
                preferred_language=Language(request.preferred_language),
                special_instructions=request.special_instructions,
                urgency_level=request.urgency_level,
            )

            result = await agent.generate_communication(context)

            # Safely serialize the result
            communication_data = safe_serialize_response(result)

            logger.info(
                f"Communication generation completed for type: {request.communication_type}")

            return {
                "success": True,
                "communication_result": communication_data.get("data", result),
            }

        except Exception as e:
            logger.error(
                f"Communication generation failed for type {request.communication_type}: {e}")
            raise CommunicationError(str(e), str(request.communication_type))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in communication generation: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/from-assessment")
async def generate_communication_from_assessment(
    request: AssessmentBasedCommunicationRequest,
):
    """
    Generate communication based on an assessment result.

    Args:
        request: Request containing assessment result and communication preferences

    Returns:
        Generated communication tailored to the assessment
    """
    try:
        agent = EnhancedCommunicationAgent()

        result = await agent.generate_communication_from_assessment(
            assessment_result=request.assessment_result,
            communication_type=request.communication_type,
            language=request.language,
            tone=request.tone,
        )

        return {
            "success": True,
            "communication_result": result.model_dump(),
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-integration")
async def test_enhanced_communication_integration() -> dict[str, Any]:
    """
    Test the enhanced communication integration with sample data.

    Returns:
        Integration test results
    """
    try:
        agent = EnhancedCommunicationAgent()

        # Test different communication types
        test_scenarios = [
            {
                "name": "Claim Approval",
                "communication_type": CommunicationType.CLAIM_APPROVAL,
                "context": CommunicationContext(
                    customer_name="John Doe",
                    claim_id="CLM-001",
                    policy_number="POL-12345",
                    claim_amount=2500.0,
                    incident_date="2024-01-15",
                    assessment_decision="APPROVED",
                ),
                "language": Language.ENGLISH,
            },
            {
                "name": "Information Request",
                "communication_type": CommunicationType.INFORMATION_REQUEST,
                "context": CommunicationContext(
                    customer_name="Jane Smith",
                    claim_id="CLM-002",
                    policy_number="POL-67890",
                    missing_documents=["Police Report", "Medical Records"],
                ),
                "language": Language.ENGLISH,
            },
            {
                "name": "Claim Denial",
                "communication_type": CommunicationType.CLAIM_DENIAL,
                "context": CommunicationContext(
                    customer_name="Bob Johnson",
                    claim_id="CLM-003",
                    policy_number="POL-11111",
                    claim_amount=50000.0,
                    denial_reason="Policy exclusion applies",
                    assessment_decision="DENIED",
                ),
                "language": Language.ENGLISH,
            },
        ]

        test_results = []
        for scenario in test_scenarios:
            try:
                result = await agent.generate_communication(
                    communication_type=scenario["communication_type"],
                    context=scenario["context"],
                    language=scenario["language"],
                )
                test_results.append({
                    "scenario": scenario["name"],
                    "success": True,
                    "communication_type": scenario["communication_type"].value,
                    "content_length": len(result.content),
                    "has_subject": bool(result.subject),
                })
            except Exception as e:
                test_results.append({
                    "scenario": scenario["name"],
                    "success": False,
                    "error": str(e),
                })

        return {
            "success": True,
            "test_results": test_results,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/supported-languages")
async def get_supported_languages() -> dict[str, Any]:
    """
    Get the list of supported languages.

    Returns:
        List of supported languages
    """
    try:
        languages = [
            {"code": lang.value, "name": lang.name.replace("_", " ").title()}
            for lang in Language
        ]

        return {"success": True, "supported_languages": languages}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/communication-types")
async def get_communication_types() -> dict[str, Any]:
    """
    Get the list of available communication types.

    Returns:
        List of available communication types
    """
    try:
        communication_types = [
            {"code": comm_type.value,
                "name": comm_type.name.replace("_", " ").title()}
            for comm_type in CommunicationType
        ]

        return {"success": True, "communication_types": communication_types}

    except Exception as e:
        return {"success": False, "error": str(e)}
