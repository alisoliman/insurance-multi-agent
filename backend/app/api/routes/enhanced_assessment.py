"""
API routes for Assessment agent functionality using AutoGen framework.
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
import json
import logging
import os
import tempfile
from typing import Any
from datetime import datetime

from app.agents.autogen_assessment import AutoGenAssessmentAgent
from app.schemas.claims import (
    ClaimAssessmentRequest,
    ClaimAssessmentResponse,
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
    Perform enhanced assessment of a claim using the AutoGen Assessment Agent.

    Args:
        request: Enhanced assessment request with claim details

    Returns:
        Detailed assessment with decision and confidence level
    """
    try:
        logger.info(
            f"Starting AutoGen assessment for claim: {request.claim_data.claim_id}")

        # Initialize AutoGen agent with error handling
        try:
            agent = AutoGenAssessmentAgent()
        except Exception as e:
            logger.error(f"Failed to initialize AutoGenAssessmentAgent: {e}")
            raise AgentInitializationError("AutoGenAssessmentAgent", str(e))

        # Convert request to AutoGen format
        try:
            # Extract policy information from policy_data or use defaults
            policy_data = request.policy_data or {}

            assessment_request = ClaimAssessmentRequest(
                claim_id=request.claim_data.claim_id or f"claim_{request.claim_data.policy_number}",
                policy_number=request.claim_data.policy_number,
                claim_type=getattr(request.claim_data, 'claim_type', 'auto'),
                claim_amount=request.claim_data.amount or 0.0,
                date_of_incident=request.claim_data.incident_date,
                description=request.claim_data.description,
                policy_coverage_limit=policy_data.get(
                    'coverage_limit', 100000.0),
                deductible=policy_data.get('deductible', 500.0),
                policy_status=policy_data.get('status', 'active'),
                urgency_level="medium",
                prior_claims=policy_data.get('prior_claims', []),
                supporting_documents=getattr(
                    request.claim_data, 'documentation', []) or [],
                claimant_name=policy_data.get('customer_name'),
                contact_information=policy_data.get('contact_info')
            )

            result = await agent.assess_claim(assessment_request)
        except Exception as e:
            logger.error(
                f"AutoGen assessment failed for claim {request.claim_data.claim_id}: {e}")
            raise AssessmentError(str(e), request.claim_data.claim_id)

        # Convert AutoGen response to legacy format for backward compatibility
        try:
            logger.info(
                f"AutoGen assessment completed successfully for claim: {request.claim_data.claim_id}")

            return EnhancedAssessmentResponse(
                success=True,
                assessment_result={
                    "decision": result.decision.value,
                    "confidence_score": result.confidence_score,
                    "reasoning": result.reasoning,
                    "risk_factors": result.risk_factors,
                    "recommended_actions": result.recommended_actions,
                    "estimated_amount": result.estimated_amount,
                    "processing_notes": result.processing_notes,
                    "metadata": result.metadata
                }
            )
        except Exception as e:
            logger.error(f"Failed to serialize AutoGen assessment result: {e}")
            return EnhancedAssessmentResponse(
                success=False,
                error=f"Assessment completed but response serialization failed: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in AutoGen assessment: {e}", exc_info=True)
        raise handle_agent_error(
            e, "AutoGenAssessmentAgent", "claim assessment")


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
        agent = AutoGenAssessmentAgent()

        # Convert to AutoGen format
        policy_data = request.policy_data or {}

        assessment_request = ClaimAssessmentRequest(
            claim_id=request.claim_data.claim_id or f"claim_{request.claim_data.policy_number}",
            policy_number=request.claim_data.policy_number,
            claim_type=getattr(request.claim_data, 'claim_type', 'auto'),
            claim_amount=request.claim_data.amount or 0.0,
            date_of_incident=request.claim_data.incident_date,
            description=request.claim_data.description,
            policy_coverage_limit=policy_data.get('coverage_limit', 100000.0),
            deductible=policy_data.get('deductible', 500.0),
            policy_status=policy_data.get('status', 'active'),
            urgency_level="medium",
            prior_claims=policy_data.get('prior_claims', []),
            supporting_documents=getattr(
                request.claim_data, 'documentation', []) or [],
            claimant_name=policy_data.get('customer_name'),
            contact_information=policy_data.get('contact_info')
        )

        result = await agent.assess_claim(assessment_request)

        return {
            "success": True,
            "assessment_result": result.dict(),
            "agent_info": {
                "agent_type": "autogen",
                "structured_output": True,
                "version": "1.0.0"
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/capabilities")
async def get_enhanced_assessment_capabilities() -> dict[str, Any]:
    """
    Get the capabilities of the AutoGen assessment agent.

    Returns:
        Agent capabilities and configuration
    """
    try:
        agent = AutoGenAssessmentAgent()

        return {
            "success": True,
            "capabilities": {
                "agent_type": "autogen",
                "structured_output": True,
                "streaming_supported": False,
                "features": [
                    "structured_output",
                    "azure_openai_integration",
                    "comprehensive_risk_analysis",
                    "policy_compliance_checking",
                    "automated_decision_making",
                ],
                "supported_claim_types": [
                    "auto",
                    "home",
                    "health",
                    "life",
                    "travel",
                    "business",
                    "other"
                ],
                "supported_decisions": [
                    "approve",
                    "deny",
                    "investigate",
                    "human_review"
                ],
                "confidence_levels": [
                    "very_low",
                    "low",
                    "medium",
                    "high",
                    "very_high"
                ],
                "urgency_levels": [
                    "low",
                    "normal",
                    "high",
                    "critical"
                ]
            },
            "default_agent": "autogen",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/batch-assess")
async def batch_assess_claims(claims: list[EnhancedAssessmentRequest]) -> dict[str, Any]:
    """
    Assess multiple claims in batch using AutoGen agent.

    Args:
        claims: List of claims to assess

    Returns:
        Batch assessment results
    """
    try:
        agent = AutoGenAssessmentAgent()
        results = []

        for i, claim_request in enumerate(claims):
            try:
                # Convert to AutoGen format
                policy_data = claim_request.policy_data or {}

                assessment_request = ClaimAssessmentRequest(
                    claim_id=claim_request.claim_data.claim_id or f"claim_{claim_request.claim_data.policy_number}",
                    policy_number=claim_request.claim_data.policy_number,
                    claim_type=getattr(
                        claim_request.claim_data, 'claim_type', 'auto'),
                    claim_amount=claim_request.claim_data.amount or 0.0,
                    date_of_incident=claim_request.claim_data.incident_date,
                    description=claim_request.claim_data.description,
                    policy_coverage_limit=policy_data.get(
                        'coverage_limit', 100000.0),
                    deductible=policy_data.get('deductible', 500.0),
                    policy_status=policy_data.get('status', 'active'),
                    urgency_level="medium",
                    prior_claims=policy_data.get('prior_claims', []),
                    supporting_documents=getattr(
                        claim_request.claim_data, 'documentation', []) or [],
                    claimant_name=policy_data.get('customer_name'),
                    contact_information=policy_data.get('contact_info')
                )

                result = await agent.assess_claim(assessment_request)
                results.append({
                    "index": i,
                    "claim_id": claim_request.claim_data.claim_id,
                    "success": True,
                    "assessment_result": result.dict(),
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
            "agent_type": "autogen",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-integration")
async def test_enhanced_assessment_integration() -> dict[str, Any]:
    """
    Test the AutoGen assessment integration with sample data.

    Returns:
        Integration test results
    """
    try:
        agent = AutoGenAssessmentAgent()

        # Test with sample claim data
        test_request = ClaimAssessmentRequest(
            claim_id="TEST-001",
            policy_number="TEST-POL-001",
            claim_type="auto",
            claim_amount=5000.0,
            date_of_incident="2024-01-15",
            description="Test claim for integration testing - minor auto accident",
            policy_coverage_limit=50000.0,
            deductible=500.0,
            policy_status="active",
            urgency_level="medium",
            prior_claims=[],
            supporting_documents=["test_document.pdf"],
            claimant_name="Test Customer",
            contact_information="test@example.com"
        )

        result = await agent.assess_claim(test_request)

        return {
            "success": True,
            "test_result": "AutoGen assessment agent is working correctly",
            "agent_type": "autogen",
            "test_assessment": {
                "decision": result.decision.value,
                "confidence_score": result.confidence_score,
                "reasoning_length": len(result.reasoning),
                "estimated_amount": result.estimated_amount,
            },
        }

    except Exception as e:
        logger.error(f"Assessment integration test failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "test_result": "AutoGen assessment agent test failed",
        }


@router.post("/assess-claim-with-files", response_model=EnhancedAssessmentResponse)
async def assess_claim_with_files(
    policy_number: str = Form(...),
    claim_amount: float = Form(...),
    date_of_incident: str = Form(...),
    description: str = Form(...),
    claim_type: str = Form(...),
    claimant_name: str = Form(...),
    contact_information: str = Form(None),
    special_circumstances: str = Form(None),
    policy_coverage_limit: float = Form(100000.0),
    deductible: float = Form(500.0),
    policy_status: str = Form("active"),
    urgency_level: str = Form("medium"),
    files: list[UploadFile] = File(default=[])
) -> dict[str, Any]:
    """
    Assess a claim with file uploads (images, PDFs, documents) using AutoGen agent.

    This endpoint accepts file uploads and processes them alongside the claim data.
    Supported file types: PDF, JPEG, PNG, TIFF, BMP, WebP, TXT, DOC, DOCX

    Args:
        policy_number: Insurance policy number
        claim_amount: Requested claim amount
        date_of_incident: Date of the incident (YYYY-MM-DD)
        description: Detailed description of the incident
        claim_type: Type of claim (auto, home, health, etc.)
        claimant_name: Name of the person filing the claim
        contact_information: Contact information for the claimant
        special_circumstances: Any special circumstances to consider
        policy_coverage_limit: Maximum coverage limit for this policy
        deductible: Policy deductible amount
        policy_status: Current status of the policy
        urgency_level: Urgency level for processing
        files: List of uploaded files (images, PDFs, documents)

    Returns:
        Assessment result with file processing information
    """
    try:
        logger.info(
            f"Starting AutoGen assessment with {len(files)} files for policy: {policy_number}")

        # Initialize AutoGen agent
        agent = AutoGenAssessmentAgent()

        # Process uploaded files
        file_info = []
        temp_files = []

        try:
            for file in files:
                if file.filename:
                    # Validate file type
                    allowed_extensions = {
                        '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp', '.txt', '.doc', '.docx'}
                    file_ext = os.path.splitext(file.filename)[1].lower()

                    if file_ext not in allowed_extensions:
                        logger.warning(
                            f"Skipping unsupported file type: {file.filename}")
                        continue

                    # Save file temporarily for processing
                    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                        content = await file.read()
                        temp_file.write(content)
                        temp_files.append(temp_file.name)

                        file_info.append({
                            "filename": file.filename,
                            "size": len(content),
                            "type": file_ext,
                            "temp_path": temp_file.name
                        })

                        logger.info(
                            f"Processed file: {file.filename} ({len(content)} bytes)")

            # Create supporting documents list with file information
            supporting_documents = [
                f"{info['filename']} ({info['type']}, {info['size']} bytes)" for info in file_info]

            # Add file processing context to description
            enhanced_description = description
            if file_info:
                enhanced_description += f"\n\nSupporting files provided ({len(file_info)} files):\n"
                for info in file_info:
                    enhanced_description += f"- {info['filename']} ({info['type']}, {info['size']} bytes)\n"

            # Create assessment request
            assessment_request = ClaimAssessmentRequest(
                claim_id=f"claim_{policy_number}_{int(datetime.now().timestamp())}",
                policy_number=policy_number,
                claim_type=claim_type,
                claim_amount=claim_amount,
                date_of_incident=date_of_incident,
                description=enhanced_description,
                policy_coverage_limit=policy_coverage_limit,
                deductible=deductible,
                policy_status=policy_status,
                urgency_level=urgency_level,
                prior_claims=[],
                supporting_documents=supporting_documents,
                claimant_name=claimant_name,
                contact_information=contact_information,
                special_circumstances=special_circumstances
            )

            # Check if we have image files for multimodal analysis
            image_files = [info for info in file_info if info['type'] in {
                '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp'}]

            if image_files:
                # Use multimodal assessment with image analysis
                image_paths = [info['temp_path'] for info in image_files]
                assessment_result = await agent.assess_claim_with_files(assessment_request, image_paths)
                logger.info(
                    f"Performed multimodal assessment with {len(image_files)} images")
            else:
                # Use standard text-based assessment
                assessment_result = await agent.assess_claim(assessment_request)
                logger.info("Performed standard text-based assessment")

            logger.info(
                f"AutoGen assessment completed with {len(file_info)} files processed")

            return EnhancedAssessmentResponse(
                success=True,
                assessment_result={
                    "decision": assessment_result.decision.value,
                    "confidence_score": assessment_result.confidence_score,
                    "reasoning": assessment_result.reasoning,
                    "risk_factors": assessment_result.risk_factors,
                    "recommended_actions": assessment_result.recommended_actions,
                    "estimated_amount": assessment_result.estimated_amount,
                    "processing_notes": assessment_result.processing_notes,
                    "metadata": assessment_result.metadata
                }
            )

        finally:
            # Clean up temporary files
            for temp_path in temp_files:
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass

    except Exception as e:
        logger.error(f"Error in file-based assessment: {e}", exc_info=True)
        return EnhancedAssessmentResponse(
            success=False,
            error=f"Assessment with files failed: {str(e)}"
        )


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
            agent = AutoGenAssessmentAgent()
        except Exception as e:
            logger.error(f"Failed to initialize AutoGenAssessmentAgent: {e}")
            raise AgentInitializationError("AutoGenAssessmentAgent", str(e))

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

        # Perform assessment (simplified - image processing not yet implemented in AutoGen agent)
        try:
            # Convert to AutoGen format
            assessment_request = ClaimAssessmentRequest(
                claim_id=claim_id_generated,
                policy_number=policy_number,
                claim_type="auto",  # Default type for image-based claims
                claim_amount=amount or 0.0,
                date_of_incident=incident_date,
                description=description,
                policy_coverage_limit=parsed_policy_data.get(
                    'coverage_limit', 100000.0) if parsed_policy_data else 100000.0,
                deductible=parsed_policy_data.get(
                    'deductible', 500.0) if parsed_policy_data else 500.0,
                policy_status=parsed_policy_data.get(
                    'status', 'active') if parsed_policy_data else 'active',
                urgency_level="medium",
                prior_claims=parsed_policy_data.get(
                    'prior_claims', []) if parsed_policy_data else [],
                supporting_documents=[
                    f.filename for f in valid_files] if valid_files else [],
                claimant_name=parsed_policy_data.get(
                    'customer_name') if parsed_policy_data else None,
                contact_information=parsed_policy_data.get(
                    'contact_info') if parsed_policy_data else None
            )

            assessment_result = await agent.assess_claim(assessment_request)

            # Note about images in the assessment
            image_note = None
            if valid_files:
                image_note = {
                    "message": "Image processing not yet implemented in AutoGen agent",
                    "image_count": len(valid_files),
                    "image_files": [f.filename for f in valid_files],
                    "note": "Assessment performed without image analysis"
                }
                logger.info(
                    f"Received {len(valid_files)} images but processed without image analysis")

            return EnhancedAssessmentWithImagesResponse(
                success=True,
                assessment_result={
                    "decision": assessment_result.decision.value,
                    "confidence_score": assessment_result.confidence_score,
                    "reasoning": assessment_result.reasoning,
                    "risk_factors": assessment_result.risk_factors,
                    "recommended_actions": assessment_result.recommended_actions,
                    "estimated_amount": assessment_result.estimated_amount,
                    "processing_notes": assessment_result.processing_notes,
                    "metadata": assessment_result.metadata
                },
                image_analysis_result=image_note
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
            e, "AutoGenAssessmentAgent", "claim assessment with images")
