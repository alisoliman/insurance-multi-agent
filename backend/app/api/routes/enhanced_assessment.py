"""
API routes for Enhanced Assessment agent functionality.
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
import json
import logging
from typing import Any

from app.agents.assessment import (
    EnhancedAssessmentAgent,
    AssessmentDecision,
    ConfidenceLevel,
)
from app.schemas.claims import (
    EnhancedAssessmentRequest,
    EnhancedAssessmentResponse,
    EnhancedAssessmentWithImagesResponse,
)
from app.core.exceptions import (
    handle_agent_error,
    safe_serialize_response,
    AssessmentError,
    AgentInitializationError,
    ImageProcessingError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/assess-claim", response_model=EnhancedAssessmentResponse)
async def enhanced_assess_claim(request: EnhancedAssessmentRequest) -> dict[str, Any]:
    """
    Perform enhanced assessment of a claim using the EnhancedAssessmentAgent.

    Args:
        request: Enhanced assessment request with claim details

    Returns:
        Detailed assessment with decision and confidence level
    """
    try:
        logger.info(
            f"Starting enhanced assessment for claim: {request.claim_data.claim_id}")

        # Initialize agent with error handling
        try:
            agent = EnhancedAssessmentAgent()
        except Exception as e:
            logger.error(f"Failed to initialize EnhancedAssessmentAgent: {e}")
            raise AgentInitializationError("EnhancedAssessmentAgent", str(e))

        # Perform assessment with error handling
        try:
            claim_data = request.claim_data.model_dump()
            policy_data = request.policy_data.model_dump() if request.policy_data else None
            result = await agent.assess_claim(claim_data, policy_data)
        except Exception as e:
            logger.error(
                f"Assessment failed for claim {request.claim_data.claim_id}: {e}")
            raise AssessmentError(str(e), request.claim_data.claim_id)

        # Safely serialize the response
        try:
            assessment_data = safe_serialize_response(result)

            logger.info(
                f"Assessment completed successfully for claim: {request.claim_data.claim_id}")

            return EnhancedAssessmentResponse(
                success=True,
                assessment_result=assessment_data.get("data", result)
            )
        except Exception as e:
            logger.error(f"Failed to serialize assessment result: {e}")
            return EnhancedAssessmentResponse(
                success=False,
                error=f"Assessment completed but response serialization failed: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in enhanced assessment: {e}", exc_info=True)
        raise handle_agent_error(
            e, "EnhancedAssessmentAgent", "claim assessment")


@router.post("/assess-claim-legacy")
async def enhanced_assess_claim_legacy(request: EnhancedAssessmentRequest) -> dict[str, Any]:
    """
    Legacy endpoint for enhanced claim assessment (returns dict format).

    Args:
        request: Enhanced assessment request with claim details

    Returns:
        Assessment result in dictionary format
    """
    try:
        agent = EnhancedAssessmentAgent()
        result = await agent.assess_claim(request.claim_data.model_dump())

        return {
            "success": True,
            "assessment_result": result.model_dump(),
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/capabilities")
async def get_enhanced_assessment_capabilities() -> dict[str, Any]:
    """
    Get the capabilities of the enhanced assessment agent.

    Returns:
        Agent capabilities and configuration
    """
    try:
        agent = EnhancedAssessmentAgent()
        capabilities = agent.get_capabilities()

        return {"success": True, "capabilities": capabilities}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/batch-assess")
async def batch_assess_claims(claims: list[EnhancedAssessmentRequest]) -> dict[str, Any]:
    """
    Assess multiple claims in batch.

    Args:
        claims: List of claims to assess

    Returns:
        Batch assessment results
    """
    try:
        agent = EnhancedAssessmentAgent()
        results = []

        for i, claim_request in enumerate(claims):
            try:
                result = await agent.assess_claim(claim_request.claim_data.model_dump())
                results.append({
                    "index": i,
                    "claim_id": claim_request.claim_data.claim_id,
                    "success": True,
                    "assessment_result": result.model_dump(),
                })
            except Exception as e:
                results.append({
                    "index": i,
                    "claim_id": claim_request.claim_data.claim_id,
                    "success": False,
                    "error": str(e),
                })

        # Calculate summary statistics
        successful_assessments = [r for r in results if r["success"]]
        total_claims = len(claims)
        successful_count = len(successful_assessments)

        summary = {
            "total_claims": total_claims,
            "successful_assessments": successful_count,
            "failed_assessments": total_claims - successful_count,
            "success_rate": successful_count / total_claims if total_claims > 0 else 0,
        }

        return {
            "success": True,
            "batch_results": results,
            "summary": summary,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-integration")
async def test_enhanced_assessment_integration() -> dict[str, Any]:
    """
    Test the enhanced assessment integration with sample data.

    Returns:
        Integration test results
    """
    try:
        agent = EnhancedAssessmentAgent()

        # Test with sample claim data
        sample_claims = [
            {
                "claim_id": "TEST-001",
                "policy_number": "POL-12345",
                "incident_date": "2024-01-15",
                "description": "Minor fender bender in parking lot",
                "amount": 2500.0,
            },
            {
                "claim_id": "TEST-002",
                "policy_number": "POL-67890",
                "incident_date": "2024-01-20",
                "description": "Water damage from burst pipe",
                "amount": 15000.0,
            },
            {
                "claim_id": "TEST-003",
                "policy_number": "POL-11111",
                "incident_date": "2024-01-25",
                "description": "Suspicious fire damage with inconsistent story",
                "amount": 50000.0,
            },
        ]

        test_results = []
        for claim in sample_claims:
            try:
                result = await agent.assess_claim(claim)
                test_results.append({
                    "claim_id": claim["claim_id"],
                    "success": True,
                    "decision": result.decision.value,
                    "confidence": result.confidence.value,
                    "risk_score": result.risk_score,
                })
            except Exception as e:
                test_results.append({
                    "claim_id": claim["claim_id"],
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


@router.post("/assess-claim-with-images", response_model=EnhancedAssessmentWithImagesResponse)
async def enhanced_assess_claim_with_images(
    policy_number: str = Form(...),
    incident_date: str = Form(...),
    description: str = Form(...),
    amount: float | None = Form(None),
    claim_id: str | None = Form(None),
    documentation: str | None = Form(None),
    image_files: list[UploadFile] = File(default=[]),
    policy_data: str | None = Form(None)  # JSON string
):
    """
    Perform enhanced assessment with image analysis.

    Args:
        policy_number: Insurance policy number
        incident_date: Date of the incident
        description: Description of the claim
        amount: Claim amount (optional)
        claim_id: Unique claim identifier (optional)
        documentation: Additional documentation (optional)
        image_files: List of uploaded image files
        policy_data: Policy information as JSON string (optional)

    Returns:
        Enhanced assessment result with image analysis
    """
    try:
        claim_id_generated = claim_id or f"claim_{policy_number}_{incident_date}"
        logger.info(
            f"Starting enhanced assessment with images for claim: {claim_id_generated}")

        # Initialize agent with error handling
        try:
            agent = EnhancedAssessmentAgent()
        except Exception as e:
            logger.error(f"Failed to initialize EnhancedAssessmentAgent: {e}")
            raise AgentInitializationError("EnhancedAssessmentAgent", str(e))

        # Prepare claim data
        claim_data = {
            "policy_number": policy_number,
            "incident_date": incident_date,
            "description": description,
            "claim_id": claim_id_generated,
        }

        if amount is not None:
            claim_data["amount"] = amount

        if documentation:
            claim_data["documentation"] = documentation

        # Parse policy data if provided
        parsed_policy_data = None
        if policy_data:
            try:
                parsed_policy_data = json.loads(policy_data)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse policy data as JSON: {e}")
                parsed_policy_data = {"raw": policy_data}

        # Validate and process image files
        valid_files = []
        if image_files:
            for i, file in enumerate(image_files):
                if file.filename and file.size > 0:
                    # Basic file validation
                    if file.size > 10 * 1024 * 1024:  # 10MB limit
                        logger.warning(
                            f"Image file {file.filename} exceeds size limit")
                        continue
                    valid_files.append(file)
                else:
                    logger.warning(f"Skipping invalid image file at index {i}")

        # Perform assessment with or without images
        try:
            if valid_files:
                logger.info(
                    f"Processing {len(valid_files)} image files for claim {claim_id_generated}")
                assessment_result, image_analysis_result = await agent.assess_claim_with_images(
                    claim_data, valid_files, parsed_policy_data
                )

                # Safely serialize both results
                assessment_data = safe_serialize_response(assessment_result)

                image_analysis_data = safe_serialize_response(
                    image_analysis_result) if image_analysis_result else None

                return EnhancedAssessmentWithImagesResponse(
                    success=True,
                    assessment_result=assessment_data.get(
                        "data", assessment_result),
                    image_analysis_result=image_analysis_data.get(
                        "data", image_analysis_result) if image_analysis_data else None
                )
            else:
                logger.info(
                    f"No valid images provided, performing regular assessment for claim {claim_id_generated}")
                # Fall back to regular assessment if no valid images
                assessment_result = await agent.assess_claim(claim_data, parsed_policy_data)

                assessment_data = safe_serialize_response(assessment_result)

                return EnhancedAssessmentWithImagesResponse(
                    success=True,
                    assessment_result=assessment_data.get(
                        "data", assessment_result),
                    image_analysis_result=None
                )
        except Exception as e:
            logger.error(
                f"Assessment failed for claim {claim_id_generated}: {e}")
            if "image" in str(e).lower():
                raise ImageProcessingError(
                    str(e), getattr(e, 'filename', None))
            else:
                raise AssessmentError(str(e), claim_id_generated)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in enhanced assessment with images: {e}", exc_info=True)
        raise handle_agent_error(
            e, "EnhancedAssessmentAgent", "claim assessment with images")
