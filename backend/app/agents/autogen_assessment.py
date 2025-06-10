"""
Modern AutoGen Assessment Agent for Insurance Claims

This module implements a simplified, modern assessment agent using AutoGen framework
with structured output, Azure OpenAI integration, and multimodal image analysis.
"""

import json
import logging
import base64
from io import BytesIO
from typing import Optional, Dict, Any, List
from PIL import Image as PILImage

from autogen_core.models import UserMessage
from autogen_ext.models.openai import AzureOpenAIChatCompletionClient

from app.core.config import settings
from app.schemas.claims import ClaimAssessmentRequest, ClaimAssessmentResponse

logger = logging.getLogger(__name__)


class AutoGenAssessmentAgent:
    """
    Modern AutoGen-based assessment agent for insurance claims.

    Uses Azure OpenAI with structured output for reliable, type-safe assessments.
    Supports multimodal image analysis for comprehensive claim evaluation.
    """

    def __init__(self):
        """Initialize the AutoGen assessment agent with Azure OpenAI configuration."""
        self._validate_azure_config()
        self.client = self._create_azure_client()

        # Supported image formats for multimodal analysis
        self.supported_image_formats = {
            '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'}

    def _validate_azure_config(self) -> None:
        """Validate that all required Azure OpenAI configuration is available."""
        required_vars = [
            "AZURE_OPENAI_ENDPOINT",
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_DEPLOYMENT_NAME"
        ]

        missing_vars = [
            var for var in required_vars if not getattr(settings, var, None)]
        if missing_vars:
            raise ValueError(
                f"Missing required Azure OpenAI configuration: {', '.join(missing_vars)}"
            )

    def _create_azure_client(self) -> AzureOpenAIChatCompletionClient:
        """Create and configure the Azure OpenAI client."""
        return AzureOpenAIChatCompletionClient(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,  # Model name same as deployment
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version="2024-08-01-preview"  # Required for structured output
        )

    async def assess_claim(self, request: ClaimAssessmentRequest) -> ClaimAssessmentResponse:
        """
        Assess an insurance claim using AutoGen with structured output.

        Args:
            request: The claim assessment request with all necessary data

        Returns:
            ClaimAssessmentResponse: Structured assessment result

        Raises:
            Exception: If assessment fails
        """
        try:
            # Build the assessment task
            task = self._build_assessment_task(request)

            # Create user message
            messages = [UserMessage(content=task, source="user")]

            # Call Azure OpenAI with structured output
            response = await self.client.create(
                messages=messages,
                extra_create_args={"response_format": ClaimAssessmentResponse}
            )

            # Validate and return structured response
            if not response.content:
                raise ValueError("Empty response from Azure OpenAI")

            # Parse the structured response
            assessment_result = ClaimAssessmentResponse.model_validate_json(
                response.content)

            logger.info(
                f"Assessment completed for claim {request.claim_id}: {assessment_result.decision}")
            return assessment_result

        except Exception as e:
            logger.error(
                f"Assessment failed for claim {request.claim_id}: {str(e)}")
            # Return a structured error response
            return ClaimAssessmentResponse(
                decision="ERROR",
                confidence_score=0.0,
                reasoning=f"Assessment failed due to technical error: {str(e)}",
                risk_factors=[],
                recommended_actions=[
                    "Manual review required due to system error"],
                estimated_amount=0.0,
                processing_notes=f"AutoGen assessment error: {str(e)}"
            )

    async def assess_claim_with_files(
        self,
        request: ClaimAssessmentRequest,
        file_paths: List[str]
    ) -> ClaimAssessmentResponse:
        """
        Assess an insurance claim with file attachments using multimodal analysis.

        Args:
            request: The claim assessment request with all necessary data
            file_paths: List of file paths to analyze

        Returns:
            ClaimAssessmentResponse: Structured assessment result with image analysis

        Raises:
            Exception: If assessment fails
        """
        try:
            logger.info(
                f"Starting multimodal assessment for claim {request.claim_id} with {len(file_paths)} files")

            # Process image files for multimodal analysis
            image_base64_list = []
            processed_files = []

            for file_path in file_paths:
                try:
                    image_base64 = await self._process_image_to_base64(file_path)
                    if image_base64:
                        image_base64_list.append(image_base64)
                        processed_files.append(
                            file_path.split('/')[-1])  # Get filename
                        logger.info(
                            f"Successfully processed image: {file_path}")
                except Exception as e:
                    logger.warning(
                        f"Failed to process image {file_path}: {str(e)}")
                    continue

            if not image_base64_list:
                # No images to analyze, fall back to standard assessment
                logger.info(
                    "No images processed, falling back to standard assessment")
                return await self.assess_claim(request)

            # Build multimodal assessment task
            task = self._build_multimodal_assessment_task(
                request, processed_files)

            # Create multimodal message content
            message_content = [{"type": "text", "text": task}]

            # Add images to the message content
            for image_base64 in image_base64_list:
                message_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                })

            # Call Azure OpenAI directly using the underlying HTTP client
            # This bypasses AutoGen's message validation
            import httpx
            import asyncio

            # Prepare the request payload
            payload = {
                "messages": [{
                    "role": "user",
                    "content": message_content
                }],
                "model": settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                "max_tokens": 4000,
                "temperature": 0.1
            }

            # Make direct HTTP request to Azure OpenAI
            headers = {
                "Content-Type": "application/json",
                "api-key": settings.AZURE_OPENAI_API_KEY
            }

            url = f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version={settings.AZURE_OPENAI_API_VERSION}"

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=60.0)
                response.raise_for_status()

                result = response.json()
                ai_response = result["choices"][0]["message"]["content"]

            # Parse the AI response and create structured output
            assessment_result = self._parse_multimodal_response(
                ai_response, request, processed_files)

            logger.info(
                f"Multimodal assessment completed for claim {request.claim_id}: {assessment_result.decision}")
            logger.info(
                f"AutoGen assessment completed with {len(processed_files)} files processed")

            return assessment_result

        except Exception as e:
            logger.error(
                f"Multimodal assessment failed for claim {request.claim_id}: {str(e)}")
            # Return a structured error response
            return ClaimAssessmentResponse(
                decision="ERROR",
                confidence_score=0.0,
                reasoning=f"Multimodal assessment failed due to technical error: {str(e)}",
                risk_factors=[],
                recommended_actions=[
                    "Manual review required due to system error"],
                estimated_amount=0.0,
                processing_notes=f"AutoGen multimodal assessment error: {str(e)}"
            )

    def _parse_multimodal_response(self, ai_response: str, request: ClaimAssessmentRequest, processed_files: List[str]) -> ClaimAssessmentResponse:
        """
        Parse the AI response from multimodal analysis and create structured output.

        Args:
            ai_response: Raw response from Azure OpenAI
            request: Original claim request
            processed_files: List of processed file names

        Returns:
            ClaimAssessmentResponse: Structured assessment result
        """
        try:
            # Try to extract structured information from the response
            # This is a simplified parser - in production you might want more sophisticated parsing

            # Default values
            decision = "INVESTIGATION"
            confidence_score = 0.5
            reasoning = ai_response
            risk_factors = []
            recommended_actions = []
            estimated_amount = 0.0

            # Simple keyword-based parsing
            response_lower = ai_response.lower()

            # Determine decision
            if "approved" in response_lower or "approve" in response_lower:
                decision = "APPROVED"
                confidence_score = 0.8
            elif "denied" in response_lower or "deny" in response_lower:
                decision = "DENIED"
                confidence_score = 0.8
            elif "investigation" in response_lower or "investigate" in response_lower:
                decision = "INVESTIGATION"
                confidence_score = 0.6

            # Extract confidence if mentioned
            import re
            confidence_match = re.search(
                r'confidence[:\s]*(\d+(?:\.\d+)?)', response_lower)
            if confidence_match:
                confidence_score = min(float(confidence_match.group(1)), 1.0)
                if confidence_score > 1.0:
                    confidence_score = confidence_score / 100.0  # Convert percentage

            # Extract estimated amount
            amount_matches = re.findall(r'\$[\d,]+(?:\.\d{2})?', ai_response)
            if amount_matches:
                # Take the last mentioned amount as the estimate
                amount_str = amount_matches[-1].replace(
                    '$', '').replace(',', '')
                try:
                    estimated_amount = float(amount_str)
                except ValueError:
                    estimated_amount = request.claim_amount
            else:
                # Default to claim amount minus deductible if approved
                if decision == "APPROVED":
                    estimated_amount = max(
                        0, request.claim_amount - request.deductible)

            # Extract risk factors (simple keyword detection)
            risk_keywords = ["fraud", "inconsistent",
                             "suspicious", "unusual", "excessive", "prior claims"]
            for keyword in risk_keywords:
                if keyword in response_lower:
                    risk_factors.append(
                        f"Potential {keyword} indicator detected")

            # Generate recommended actions based on decision
            if decision == "APPROVED":
                recommended_actions = [
                    "Process payment authorization",
                    "Update claim status to approved",
                    "Send approval notification to claimant"
                ]
            elif decision == "DENIED":
                recommended_actions = [
                    "Send denial letter with explanation",
                    "Document denial reasons",
                    "Update claim status to denied"
                ]
            else:  # INVESTIGATION
                recommended_actions = [
                    "Assign to senior adjuster for review",
                    "Request additional documentation",
                    "Schedule inspection if needed"
                ]

            # Add image analysis note
            processing_notes = f"Multimodal analysis completed with {len(processed_files)} images: {', '.join(processed_files)}"

            return ClaimAssessmentResponse(
                decision=decision,
                confidence_score=confidence_score,
                reasoning=reasoning,
                risk_factors=risk_factors,
                recommended_actions=recommended_actions,
                estimated_amount=estimated_amount,
                processing_notes=processing_notes
            )

        except Exception as e:
            logger.error(f"Failed to parse multimodal response: {str(e)}")
            # Return a basic response with the raw AI output
            return ClaimAssessmentResponse(
                decision="INVESTIGATION",
                confidence_score=0.5,
                reasoning=ai_response,
                risk_factors=["Response parsing incomplete"],
                recommended_actions=["Manual review of AI response required"],
                estimated_amount=request.claim_amount,
                processing_notes=f"Multimodal analysis with {len(processed_files)} images - manual parsing required"
            )

    async def _process_image_to_base64(self, file_path: str) -> Optional[str]:
        """
        Process an image file and convert it to base64 for Azure OpenAI.

        Args:
            file_path: Path to the image file

        Returns:
            Optional[str]: Base64 encoded image data, or None if processing fails
        """
        try:
            # Check if file is an image
            file_ext = file_path.lower().split('.')[-1]
            if f'.{file_ext}' not in self.supported_image_formats:
                logger.warning(f"Unsupported image format: {file_ext}")
                return None

            # Open and process the image
            with open(file_path, 'rb') as image_file:
                # Load image with PIL to ensure it's valid and convert to RGB
                pil_image = PILImage.open(image_file)

                # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')

                # Resize if too large (max 2048x2048 for efficiency)
                max_size = 2048
                if pil_image.width > max_size or pil_image.height > max_size:
                    pil_image.thumbnail(
                        (max_size, max_size), PILImage.Resampling.LANCZOS)

                # Convert to base64
                buffer = BytesIO()
                pil_image.save(buffer, format='JPEG', quality=85)
                image_bytes = buffer.getvalue()

                return base64.b64encode(image_bytes).decode('utf-8')

        except Exception as e:
            logger.error(f"Failed to process image file {file_path}: {str(e)}")
            return None

    def _build_assessment_task(self, request: ClaimAssessmentRequest) -> str:
        """
        Build the assessment task prompt for the AutoGen agent.

        Args:
            request: The claim assessment request

        Returns:
            str: Formatted task prompt
        """
        # Build comprehensive assessment prompt
        task = f"""Assess the following insurance claim and provide a structured decision:

**Claim Information:**
- Claim ID: {request.claim_id}
- Policy Number: {request.policy_number}
- Claim Type: {request.claim_type}
- Claim Amount: ${request.claim_amount:,.2f}
- Date of Incident: {request.date_of_incident}
- Description: {request.description}

**Policy Information:**
- Coverage Limit: ${request.policy_coverage_limit:,.2f}
- Deductible: ${request.deductible:,.2f}
- Policy Status: {request.policy_status}

**Assessment Context:**
- Urgency Level: {request.urgency_level}
- Prior Claims: {len(request.prior_claims)} previous claims
- Supporting Documents: {len(request.supporting_documents)} documents provided

**Assessment Requirements:**
1. Determine if the claim should be APPROVED, DENIED, or requires INVESTIGATION
2. Provide a confidence score (0.0 to 1.0) for your decision
3. Explain your reasoning clearly and concisely
4. Identify any risk factors that influenced your decision
5. Recommend specific actions for claim processing
6. Estimate the final settlement amount if approved
7. Add any processing notes for the claims team

**Guidelines:**
- Consider policy coverage limits and deductibles
- Evaluate claim amount reasonableness for the incident type
- Check for potential fraud indicators
- Ensure compliance with insurance regulations
- Factor in the claimant's history and policy status

Provide a comprehensive assessment that helps the claims team make an informed decision."""

        return task

    def _build_multimodal_assessment_task(self, request: ClaimAssessmentRequest, processed_files: List[str]) -> str:
        """
        Build the multimodal assessment task prompt including image analysis context.

        Args:
            request: The claim assessment request
            processed_files: List of processed file names

        Returns:
            str: Formatted multimodal task prompt
        """
        base_task = self._build_assessment_task(request)

        # Add multimodal context
        multimodal_context = f"""

**MULTIMODAL ANALYSIS:**
You have been provided with {len(processed_files)} image(s) to analyze alongside this claim:
{', '.join(processed_files)}

**IMAGE ANALYSIS REQUIREMENTS:**
1. Carefully examine each provided image
2. Identify the type of damage, documentation, or evidence shown
3. Assess whether the images support or contradict the claim description
4. Look for signs of fraud, inconsistencies, or unusual patterns
5. Evaluate if the visible damage matches the claimed amount
6. Check for any safety concerns or additional issues not mentioned in the description
7. Note the quality and clarity of the documentation provided

**ENHANCED ASSESSMENT GUIDELINES:**
- Compare the visual evidence with the written claim description
- Consider whether the images provide sufficient documentation for the claim
- Look for any discrepancies between the incident date and image metadata/conditions
- Assess the severity of damage shown versus the claimed amount
- Identify any additional damage or issues visible in the images
- Consider the overall credibility based on visual evidence

**IMPORTANT:** Base your assessment on both the written claim information AND the visual evidence provided in the images. If there are any conflicts between the description and images, note this in your reasoning and factor it into your decision."""

        return base_task + multimodal_context

    async def close(self) -> None:
        """Clean up resources (placeholder for future resource management)."""
        # AutoGen client doesn't require explicit cleanup currently
        # This method is here for consistency with the communication agent pattern
        pass
