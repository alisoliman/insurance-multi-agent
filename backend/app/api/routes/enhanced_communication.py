"""
API routes for Communication agent functionality using AutoGen framework.
"""

from fastapi import APIRouter
from typing import Any
import logging

from app.agents.autogen_communication import AutoGenCommunicationAgent
from app.schemas.communication import (
    CommunicationRequest,
    AssessmentBasedCommunicationRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/capabilities")
async def get_communication_capabilities() -> dict[str, Any]:
    """
    Get the capabilities of the AutoGen communication agent.

    Returns:
        Agent capabilities and configuration
    """
    try:
        agent = AutoGenCommunicationAgent()

        return {
            "success": True,
            "capabilities": {
                "agent_type": "autogen",
                "structured_output": True,
                "streaming_supported": False,
                "features": [
                    "structured_output",
                    "azure_openai_integration",
                    "multilingual_support",
                    "compliance_verification",
                ],
                "supported_languages": ["en", "es", "fr", "de", "pt", "zh"],
                "supported_communication_types": [
                    "claim_status_update",
                    "approval_notification",
                    "rejection_notification",
                    "information_request",
                    "human_review_notification",
                    "investigation_update",
                    "general_inquiry_response"
                ],
                "supported_tones": [
                    "professional",
                    "empathetic",
                    "urgent",
                    "reassuring",
                    "congratulatory"
                ]
            },
            "default_agent": "autogen",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/generate")
async def generate_communication(request: CommunicationRequest) -> dict[str, Any]:
    """
    Generate communication using the AutoGen communication agent.

    Args:
        request: Communication request with context and preferences

    Returns:
        Generated communication content
    """
    try:
        logger.info(
            f"Generating communication of type: {request.communication_type}")

        # Use AutoGen agent
        agent = AutoGenCommunicationAgent()
        result = await agent.generate_communication(request)

        logger.info(
            f"AutoGen communication generation completed for type: {request.communication_type}")

        return {
            "success": True,
            "communication_result": result.dict(),
            "agent_type": "autogen",
            "structured_output": True,
        }

    except Exception as e:
        logger.error(
            f"Communication generation failed for type {request.communication_type}: {e}")
        return {"success": False, "error": str(e)}


@router.post("/from-assessment")
async def generate_communication_from_assessment(
    request: AssessmentBasedCommunicationRequest,
) -> dict[str, Any]:
    """
    Generate communication based on an assessment result.

    Args:
        request: Request containing assessment result and communication preferences

    Returns:
        Generated communication tailored to the assessment
    """
    try:
        # Convert assessment-based request to standard communication request
        communication_request = CommunicationRequest(
            customer_name=request.customer_data.get("name", "Valued Customer"),
            claim_id=request.assessment_result.get("claim_id", "Unknown"),
            policy_number=request.customer_data.get(
                "policy_number", "Unknown"),
            communication_type=request.communication_type or "general_inquiry_response",
            preferred_language=request.preferred_language,
            urgency_level=request.urgency_level,
            special_instructions=request.special_instructions,
            assessment_result=request.assessment_result,
            policy_details=request.customer_data,
        )

        agent = AutoGenCommunicationAgent()
        result = await agent.generate_communication(communication_request)

        logger.info("Assessment-based communication generation completed")

        return {
            "success": True,
            "communication_result": result.dict(),
            "agent_type": "autogen",
            "structured_output": True,
        }

    except Exception as e:
        logger.error(f"Assessment-based communication generation failed: {e}")
        return {"success": False, "error": str(e)}


@router.get("/test-integration")
async def test_communication_integration() -> dict[str, Any]:
    """
    Test the AutoGen communication agent integration.

    Returns:
        Test results and agent status
    """
    try:
        agent = AutoGenCommunicationAgent()

        # Test with a simple request
        test_request = CommunicationRequest(
            customer_name="Test Customer",
            claim_id="TEST-001",
            policy_number="TEST-POL-001",
            communication_type="general_inquiry_response",
            preferred_language="en",
            urgency_level="normal",
            special_instructions="This is a test communication",
        )

        result = await agent.generate_communication(test_request)

        return {
            "success": True,
            "test_result": "AutoGen communication agent is working correctly",
            "agent_type": "autogen",
            "test_communication": {
                "subject": result.subject,
                "content_length": len(result.content),
                "language": result.language,
                "tone": result.tone,
            },
        }

    except Exception as e:
        logger.error(f"Communication integration test failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "test_result": "AutoGen communication agent test failed",
        }


@router.get("/supported-languages")
async def get_supported_languages() -> dict[str, Any]:
    """
    Get the list of supported languages for communication generation.

    Returns:
        List of supported languages with their codes and names
    """
    try:
        languages = [
            {"code": "en", "name": "English", "flag": "🇺🇸"},
            {"code": "es", "name": "Spanish", "flag": "🇪🇸"},
            {"code": "fr", "name": "French", "flag": "🇫🇷"},
            {"code": "de", "name": "German", "flag": "🇩🇪"},
            {"code": "pt", "name": "Portuguese", "flag": "🇵🇹"},
            {"code": "zh", "name": "Chinese", "flag": "🇨🇳"},
        ]

        return {
            "success": True,
            "supported_languages": languages,
            "default_language": "en",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/communication-types")
async def get_communication_types() -> dict[str, Any]:
    """
    Get the list of supported communication types.

    Returns:
        List of supported communication types with descriptions
    """
    try:
        communication_types = [
            {
                "value": "claim_status_update",
                "label": "Claim Status Update",
                "description": "Provide claim processing update"
            },
            {
                "value": "approval_notification",
                "label": "Approval Notification",
                "description": "Notify customer of approved claim"
            },
            {
                "value": "rejection_notification",
                "label": "Rejection Notification",
                "description": "Explain claim denial with reasons"
            },
            {
                "value": "information_request",
                "label": "Information Request",
                "description": "Request additional documentation"
            },
            {
                "value": "human_review_notification",
                "label": "Human Review Notification",
                "description": "Escalation to human reviewer"
            },
            {
                "value": "investigation_update",
                "label": "Investigation Update",
                "description": "Inform about claim investigation"
            },
            {
                "value": "general_inquiry_response",
                "label": "General Inquiry Response",
                "description": "Response to customer questions"
            },
        ]

        return {
            "success": True,
            "communication_types": communication_types,
            "default_type": "general_inquiry_response",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
