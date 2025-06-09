"""
Enhanced Assessment Agent for insurance claim analysis and decision-making.

This module implements a sophisticated Assessment Agent that leverages LLM capabilities
for nuanced claim analysis while maintaining production reliability through fallback
mechanisms and structured decision-making.
"""

import asyncio
import json
import uuid
import base64
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict
from io import BytesIO
from PIL import Image as PILImage

# AutoGen imports
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinGroupChat
    from autogen_agentchat.conditions import MaxMessageTermination
    from autogen_agentchat.messages import TextMessage, MultiModalMessage
    from autogen_core import Image as AGImage

    AUTOGEN_AVAILABLE = True
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    AUTOGEN_IMPORT_ERROR = str(e)

from app.agents.base import BaseInsuranceAgent
from app.core.config import settings

# Import the new schemas
from app.schemas.claims import (
    ImageAnalysisResult,
    MultiImageAssessmentResult,
    ClaimDataWithImages
)


class AssessmentDecision(Enum):
    """Enumeration of assessment decisions."""

    APPROVE = "approve"
    REJECT = "reject"
    HUMAN_REVIEW = "human_review"
    INVESTIGATE = "investigate"


class ConfidenceLevel(Enum):
    """Enumeration of confidence levels."""

    VERY_HIGH = "very_high"  # 0.9-1.0
    HIGH = "high"  # 0.8-0.89
    MEDIUM = "medium"  # 0.7-0.79
    LOW = "low"  # 0.6-0.69
    VERY_LOW = "very_low"  # <0.6


@dataclass
class RiskFactor:
    """Structure for risk factor identification."""

    factor_type: str
    severity: str  # low, medium, high
    description: str
    confidence: float


@dataclass
class AssessmentResult:
    """Comprehensive assessment result structure."""

    decision: AssessmentDecision
    confidence_score: float
    confidence_level: ConfidenceLevel
    reasoning: str
    risk_factors: List[RiskFactor]
    policy_coverage_analysis: Dict[str, Any]
    fraud_risk_score: float
    documentation_completeness: float
    regulatory_compliance: Dict[str, Any]
    recommended_actions: List[str]
    processing_time_seconds: float
    assessment_id: str
    timestamp: datetime

    def __post_init__(self):
        if not hasattr(self, "assessment_id") or self.assessment_id is None:
            self.assessment_id = str(uuid.uuid4())
        if not hasattr(self, "timestamp") or self.timestamp is None:
            self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["decision"] = self.decision.value
        data["confidence_level"] = self.confidence_level.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


class EnhancedAssessmentAgent(BaseInsuranceAgent):
    """
    Enhanced Assessment Agent with LLM-driven decision making and image processing.

    This agent provides sophisticated claim analysis using Azure OpenAI GPT-4o
    with structured output, comprehensive risk assessment, image analysis capabilities,
    and fallback mechanisms for production reliability.
    """

    def __init__(self):
        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        system_message = """You are an expert insurance claim assessment agent with deep knowledge of:

        1. Insurance policy coverage analysis
        2. Fraud detection and risk assessment
        3. Regulatory compliance requirements
        4. Documentation evaluation
        5. Incident plausibility assessment
        6. Image analysis and damage assessment
        7. Document classification and OCR

        Your responsibilities:
        - Analyze claims with nuanced understanding of context and circumstances
        - Process and analyze images related to insurance claims
        - Extract information from documents, invoices, and damage photos
        - Classify images by type and relevance to claims
        - Provide structured decisions with clear reasoning
        - Identify risk factors and fraud indicators
        - Assess policy coverage and compliance requirements
        - Generate confidence scores based on available evidence
        - Recommend appropriate actions for each claim

        Decision Framework:
        - APPROVE: Valid claims with high confidence and low risk
        - REJECT: Invalid claims or clear policy violations
        - HUMAN_REVIEW: Complex cases requiring human expertise
        - INVESTIGATE: Claims needing additional information or investigation

        Image Analysis Capabilities:
        - Classify image types (invoices, crash photos, damage assessment, medical documents, etc.)
        - Extract text and data from images using OCR
        - Assess damage severity and estimate repair costs
        - Identify potential fraud indicators in images
        - Determine relevance of images to specific claims

        Always provide detailed reasoning, identify specific risk factors, and ensure decisions are explainable and auditable for regulatory compliance."""

        super().__init__(
            name="enhanced_assessment_agent", system_message=system_message
        )

        # Assessment thresholds
        self.confidence_thresholds = {
            "auto_approve": 0.8,
            "human_review": 0.7,
            "auto_reject": 0.9,  # High confidence required for auto-rejection
        }

        # Risk scoring weights
        self.risk_weights = {
            "fraud_indicators": 0.3,
            "documentation_quality": 0.2,
            "policy_compliance": 0.25,
            "incident_plausibility": 0.15,
            "regulatory_factors": 0.1,
        }

        # Supported image formats
        self.supported_image_formats = {
            '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'}

    async def assess_claim_with_images(
        self,
        claim_data: Dict[str, Any],
        image_files: List[Any] = None,
        policy_data: Optional[Dict[str, Any]] = None
    ) -> tuple[AssessmentResult, Optional[MultiImageAssessmentResult]]:
        """
        Perform comprehensive claim assessment with image analysis.

        Args:
            claim_data: Dictionary containing claim information
            image_files: List of image files (FastAPI UploadFile objects)
            policy_data: Optional policy information for coverage verification

        Returns:
            Tuple of (AssessmentResult, MultiImageAssessmentResult)
        """
        start_time = datetime.now()
        image_analysis_result = None

        try:
            # Validate input data
            validation_result = self._validate_claim_data(claim_data)
            if not validation_result["valid"]:
                return self._create_error_result(validation_result["error"], start_time), None

            # Process images if provided
            if image_files and len(image_files) > 0:
                image_analysis_result = await self._process_images(image_files, claim_data)

            # Perform LLM-driven assessment with image context
            llm_result = await self._perform_llm_assessment_with_images(
                claim_data, policy_data, image_analysis_result
            )

            # Apply business rules and validation
            final_result = self._apply_business_rules(llm_result, claim_data)

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            final_result.processing_time_seconds = processing_time

            return final_result, image_analysis_result

        except Exception as e:
            # Return error instead of fallback
            return self._create_error_result(str(e), start_time), None

    async def _process_images(
        self,
        image_files: List[Any],
        claim_data: Dict[str, Any]
    ) -> MultiImageAssessmentResult:
        """
        Process multiple images using LLM vision capabilities.

        Args:
            image_files: List of image files to process
            claim_data: Claim context for relevance assessment

        Returns:
            MultiImageAssessmentResult with analysis of all images

        Raises:
            Exception: If any critical image processing fails
        """
        start_time = datetime.now()
        image_analyses = []
        processing_errors = []

        for i, image_file in enumerate(image_files):
            try:
                # Process individual image
                analysis = await self._analyze_single_image(image_file, claim_data)
                image_analyses.append(analysis)
            except Exception as e:
                error_msg = f"Failed to process image {i+1} ({getattr(image_file, 'filename', 'unknown')}): {str(e)}"
                processing_errors.append(error_msg)

                # Create error analysis for failed image with detailed error info
                error_analysis = ImageAnalysisResult(
                    filename=getattr(image_file, 'filename',
                                     f'unknown_image_{i+1}'),
                    file_size=0,
                    image_type="error",
                    classification=f"Processing failed: {str(e)[:100]}...",
                    confidence_score=0.0,
                    relevance_score=0.0,
                    extracted_text=None,
                    extracted_data={"error": str(
                        e), "error_type": "processing_failure"},
                    damage_assessment=None,
                    processing_time_seconds=0.0
                )
                image_analyses.append(error_analysis)

        # If all images failed, raise an exception
        if len(processing_errors) == len(image_files):
            raise Exception(
                f"All {len(image_files)} images failed to process. Errors: {'; '.join(processing_errors)}")

        # If some images failed, include error info in recommendations
        if processing_errors:
            error_summary = f"{len(processing_errors)} out of {len(image_files)} images failed to process"
        else:
            error_summary = None

        # Calculate overall metrics (excluding error results)
        processing_time = (datetime.now() - start_time).total_seconds()
        successful_analyses = [
            img for img in image_analyses if img.image_type != "error"]

        if successful_analyses:
            overall_relevance = sum(
                img.relevance_score for img in successful_analyses) / len(successful_analyses)
        else:
            overall_relevance = 0.0

        # Generate recommendations based on image analysis
        recommended_actions = self._generate_image_based_recommendations(
            image_analyses)

        # Add error information to recommendations if there were failures
        if processing_errors:
            recommended_actions.insert(
                0, f"⚠️ {error_summary}. Review error details in individual image results.")

        # Generate summary
        summary = self._generate_image_analysis_summary(
            image_analyses, claim_data)

        # Add error information to summary if there were failures
        if error_summary:
            summary = f"{error_summary}. {summary}"

        return MultiImageAssessmentResult(
            total_images_processed=len(image_analyses),
            processing_time_seconds=processing_time,
            image_analyses=image_analyses,
            overall_relevance_score=overall_relevance,
            recommended_actions=recommended_actions,
            summary=summary
        )

    async def _analyze_single_image(
        self,
        image_file: Any,
        claim_data: Dict[str, Any]
    ) -> ImageAnalysisResult:
        """
        Analyze a single image using LLM vision capabilities.

        Args:
            image_file: Single image file to analyze
            claim_data: Claim context for analysis

        Returns:
            ImageAnalysisResult with detailed analysis

        Raises:
            Exception: If image analysis fails with detailed error information
        """
        start_time = datetime.now()
        filename = getattr(image_file, 'filename', 'unknown')

        try:
            # Read image data
            image_data = await image_file.read()
            file_size = len(image_data)

            if file_size == 0:
                raise ValueError(f"Image file '{filename}' is empty (0 bytes)")

            # Convert to PIL Image for AutoGen
            try:
                pil_image = PILImage.open(BytesIO(image_data))
                ag_image = AGImage(pil_image)
            except Exception as e:
                raise ValueError(
                    f"Failed to process image '{filename}' as valid image format: {str(e)}")

            # Create analysis prompt
            analysis_prompt = self._build_image_analysis_prompt(
                claim_data, filename)

            # Create multimodal message using AutoGen's MultiModalMessage
            multimodal_message = MultiModalMessage(
                content=[analysis_prompt, ag_image],
                source="assessment_agent"
            )

            # Use AutoGen agent for image analysis
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2),
            )

            # Process the multimodal message - use direct agent approach to avoid team serialization issues
            try:
                # Send multimodal message directly to the agent instead of through team
                response = await self.agent.on_messages([multimodal_message], cancellation_token=None)

                # Extract the response content
                if hasattr(response, 'chat_message') and hasattr(response.chat_message, 'content'):
                    response_content = response.chat_message.content
                elif hasattr(response, 'content'):
                    response_content = response.content
                else:
                    raise Exception(
                        f"Unexpected response format from agent: {type(response)}")

            except Exception as e:
                raise Exception(
                    f"AutoGen processing failed for image '{filename}': {str(e)}")

            if not response_content or response_content.strip() == "":
                raise Exception(
                    f"Empty response from LLM for image '{filename}' analysis")

            # Parse the response - this will raise detailed errors if parsing fails
            try:
                analysis_data = self._parse_image_analysis_response(
                    response_content)
            except Exception as e:
                raise Exception(
                    f"Failed to parse LLM response for image '{filename}': {str(e)}")

            processing_time = (datetime.now() - start_time).total_seconds()

            return ImageAnalysisResult(
                filename=filename,
                file_size=file_size,
                image_type=analysis_data.get("image_type", "unknown"),
                classification=analysis_data.get(
                    "classification", "unclassified"),
                confidence_score=float(
                    analysis_data.get("confidence_score", 0.5)),
                relevance_score=float(
                    analysis_data.get("relevance_score", 0.5)),
                extracted_text=analysis_data.get("extracted_text"),
                extracted_data=analysis_data.get("extracted_data"),
                damage_assessment=analysis_data.get("damage_assessment"),
                processing_time_seconds=processing_time
            )

        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            # Re-raise the exception with additional context
            raise Exception(
                f"Image analysis failed for '{filename}' after {processing_time:.2f}s: {str(e)}")

    def _build_image_analysis_prompt(self, claim_data: Dict[str, Any], filename: str) -> str:
        """Build prompt for image analysis."""
        return f"""
        You are an expert insurance claim analyst with advanced image analysis capabilities. Analyze this image in the context of an insurance claim and provide detailed, structured analysis.

        CLAIM CONTEXT:
        - Claim ID: {claim_data.get("claim_id", "Not provided")}
        - Policy Number: {claim_data.get("policy_number", "Not provided")}
        - Incident Date: {claim_data.get("incident_date", "Not provided")}
        - Description: {claim_data.get("description", "Not provided")}
        - Estimated Amount: {claim_data.get("amount", "Not provided")}

        IMAGE FILE: {filename}

        CRITICAL: First, carefully examine the image to determine its type. Look for:
        - INVOICES/BILLS: Look for headers like "Invoice", "Bill", "Receipt", company letterheads, itemized charges, tax amounts, payment terms
        - CRASH PHOTOS: Look for damaged vehicles, accident scenes, road conditions
        - DAMAGE ASSESSMENT: Look for close-up damage photos, repair estimates, before/after comparisons
        - MEDICAL DOCUMENTS: Look for medical forms, hospital letterheads, prescription pads
        - POLICE REPORTS: Look for official police department headers, incident numbers, officer signatures

        Please analyze the image and provide your response in the following JSON format:

        {{
            "image_type": "invoice|crash_photo|damage_assessment|medical_document|police_report|receipt|estimate|other",
            "classification": "detailed classification of the image content",
            "confidence_score": 0.0-1.0,
            "relevance_score": 0.0-1.0,
            "extracted_text": "all readable text found in the image",
            "extracted_data": {{
                "document_type": "specific type of document",
                "vendor_name": "company/vendor name if applicable",
                "amounts": ["all monetary amounts found with labels"],
                "dates": ["all dates found with context"],
                "names": ["any person/company names found"],
                "invoice_number": "invoice/reference number if applicable",
                "line_items": ["itemized charges if applicable"],
                "tax_amount": "tax amount if shown",
                "total_amount": "total amount if shown",
                "payment_terms": "payment terms if shown",
                "key_details": ["any other important information"]
            }},
            "damage_assessment": {{
                "severity": "none|minor|moderate|severe|total_loss",
                "estimated_cost": "estimated repair cost if applicable",
                "description": "description of damage visible",
                "affected_areas": ["list of damaged parts/areas"]
            }},
            "fraud_indicators": {{
                "suspicious_elements": ["any suspicious elements noted"],
                "authenticity_score": 0.0-1.0,
                "concerns": ["specific concerns if any"]
            }}
        }}

        ANALYSIS REQUIREMENTS:
        1. **Document Type Identification**: Carefully identify if this is an invoice, receipt, estimate, or other document type
        2. **Text Extraction**: Extract ALL readable text using OCR capabilities - be thorough
        3. **Financial Information**: If it's an invoice/receipt/estimate, extract:
           - Vendor/company name
           - Invoice/reference number
           - All line items and amounts
           - Subtotal, tax, and total amounts
           - Dates (invoice date, due date, service date)
           - Payment terms
        4. **Damage Analysis**: If showing damage, assess severity and estimated costs
        5. **Relevance Assessment**: How relevant is this image to the insurance claim?
        6. **Fraud Detection**: Look for signs of document manipulation, inconsistencies, or suspicious elements
        7. **Quality Assessment**: Note image quality, readability, and completeness

        Be extremely thorough in text extraction - extract every piece of readable text, including small print, headers, footers, and watermarks.
        For invoices and financial documents, pay special attention to amounts, dates, and vendor information.
        """

    def _parse_image_analysis_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response for image analysis."""
        try:
            # Try to extract JSON from the response
            start_idx = response_content.find("{")
            end_idx = response_content.rfind("}") + 1

            if start_idx == -1 or end_idx == -1:
                raise ValueError(
                    f"No valid JSON found in LLM response. Response content: {response_content[:500]}...")

            json_str = response_content[start_idx:end_idx]
            parsed_data = json.loads(json_str)

            # Validate and clean the parsed data
            return self._validate_and_clean_image_data(parsed_data)

        except json.JSONDecodeError as e:
            raise ValueError(
                f"Failed to parse JSON from LLM response. JSON error: {str(e)}. Response content: {response_content[:500]}...")
        except Exception as e:
            raise ValueError(
                f"Unexpected error parsing LLM response: {str(e)}. Response content: {response_content[:500]}...")

    def _validate_and_clean_image_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean parsed image analysis data."""
        # Validate required fields
        required_fields = ["image_type", "classification",
                           "confidence_score", "relevance_score"]
        missing_fields = [
            field for field in required_fields if field not in data]

        if missing_fields:
            raise ValueError(
                f"Missing required fields in LLM response: {missing_fields}. Available fields: {list(data.keys())}")

        # Validate data types and ranges
        try:
            confidence_score = float(data["confidence_score"])
            relevance_score = float(data["relevance_score"])

            if not (0.0 <= confidence_score <= 1.0):
                raise ValueError(
                    f"Confidence score must be between 0.0 and 1.0, got: {confidence_score}")

            if not (0.0 <= relevance_score <= 1.0):
                raise ValueError(
                    f"Relevance score must be between 0.0 and 1.0, got: {relevance_score}")

        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid score values in LLM response: {str(e)}")

        # Ensure required fields exist with proper types
        cleaned_data = {
            "image_type": str(data["image_type"]),
            "classification": str(data["classification"]),
            "confidence_score": confidence_score,
            "relevance_score": relevance_score,
            "extracted_text": data.get("extracted_text", ""),
            "extracted_data": data.get("extracted_data", {}),
            "damage_assessment": data.get("damage_assessment", {
                "severity": "none",
                "estimated_cost": "Not applicable",
                "description": "No damage assessment applicable"
            }),
            "fraud_indicators": data.get("fraud_indicators", {
                "suspicious_elements": [],
                "authenticity_score": 0.8,
                "concerns": []
            })
        }

        # Ensure extracted_data has proper structure
        if not isinstance(cleaned_data["extracted_data"], dict):
            raise ValueError(
                f"extracted_data must be a dictionary, got: {type(cleaned_data['extracted_data'])}")

        # Add default fields to extracted_data if missing
        extracted_data_defaults = {
            "document_type": "Unknown",
            "vendor_name": None,
            "amounts": [],
            "dates": [],
            "names": [],
            "key_details": []
        }

        for key, default_value in extracted_data_defaults.items():
            if key not in cleaned_data["extracted_data"]:
                cleaned_data["extracted_data"][key] = default_value

        return cleaned_data

    def _extract_image_data_from_text(self, text: str) -> Dict[str, Any]:
        """
        This method is removed - no fallback logic.
        If LLM response parsing fails, we should get clear error feedback.
        """
        raise NotImplementedError(
            "Fallback text parsing has been removed. LLM must provide valid JSON response.")

    def _extract_amounts_from_text(self, text: str) -> List[str]:
        """
        This method is removed - no fallback logic.
        If LLM response parsing fails, we should get clear error feedback.
        """
        raise NotImplementedError(
            "Fallback text parsing has been removed. LLM must provide valid JSON response.")

    def _extract_dates_from_text(self, text: str) -> List[str]:
        """
        This method is removed - no fallback logic.
        If LLM response parsing fails, we should get clear error feedback.
        """
        raise NotImplementedError(
            "Fallback text parsing has been removed. LLM must provide valid JSON response.")

    def _generate_image_based_recommendations(self, image_analyses: List[ImageAnalysisResult]) -> List[str]:
        """Generate recommendations based on image analysis results."""
        recommendations = []

        if not image_analyses:
            return ["No images provided for analysis"]

        # Check for high-relevance images
        high_relevance_images = [
            img for img in image_analyses if img.relevance_score > 0.8]
        if high_relevance_images:
            recommendations.append(
                f"Found {len(high_relevance_images)} highly relevant images for claim assessment")

        # Check for damage assessments
        damage_images = [img for img in image_analyses if img.damage_assessment and
                         getattr(img.damage_assessment, "severity", "none") != "none"]
        if damage_images:
            recommendations.append(
                f"Damage assessment available from {len(damage_images)} images")

        # Check for invoices/receipts
        invoice_images = [
            img for img in image_analyses if img.image_type in ["invoice", "receipt"]]
        if invoice_images:
            recommendations.append(
                f"Found {len(invoice_images)} financial documents for verification")

        # Check for low confidence scores
        low_confidence_images = [
            img for img in image_analyses if img.confidence_score < 0.5]
        if low_confidence_images:
            recommendations.append(
                f"Manual review recommended for {len(low_confidence_images)} images with low confidence scores")

        return recommendations if recommendations else ["Standard image processing completed"]

    def _generate_image_analysis_summary(self, image_analyses: List[ImageAnalysisResult], claim_data: Dict[str, Any]) -> str:
        """Generate a summary of image analysis results."""
        if not image_analyses:
            return "No images were processed for this claim."

        total_images = len(image_analyses)
        avg_relevance = sum(
            img.relevance_score for img in image_analyses) / total_images
        avg_confidence = sum(
            img.confidence_score for img in image_analyses) / total_images

        # Count image types
        type_counts = {}
        for img in image_analyses:
            type_counts[img.image_type] = type_counts.get(
                img.image_type, 0) + 1

        summary = f"Processed {total_images} images with average relevance score of {avg_relevance:.2f} and confidence score of {avg_confidence:.2f}. "

        if type_counts:
            type_summary = ", ".join(
                [f"{count} {img_type}" for img_type, count in type_counts.items()])
            summary += f"Image types: {type_summary}. "

        # Add damage assessment summary if available
        damage_images = [img for img in image_analyses if img.damage_assessment and
                         getattr(img.damage_assessment, "severity", "none") != "none"]
        if damage_images:
            summary += f"Damage assessment available from {len(damage_images)} images. "

        return summary

    async def _perform_llm_assessment_with_images(
        self,
        claim_data: Dict[str, Any],
        policy_data: Optional[Dict[str, Any]],
        image_analysis: Optional[MultiImageAssessmentResult]
    ) -> Dict[str, Any]:
        """Perform LLM-driven claim assessment with image analysis context."""

        # Build enhanced prompt with image context
        assessment_prompt = self._build_assessment_prompt_with_images(
            claim_data, policy_data, image_analysis
        )

        try:
            # Use AutoGen agent for structured assessment
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2),
            )

            result = await team.run(task=assessment_prompt)

            if result.messages and len(result.messages) > 0:
                response_content = result.messages[-1].content
                return self._parse_llm_response(response_content)
            else:
                raise Exception("No response from LLM")

        except Exception as e:
            raise Exception(f"LLM assessment failed: {str(e)}")

    def _build_assessment_prompt_with_images(
        self,
        claim_data: Dict[str, Any],
        policy_data: Optional[Dict[str, Any]],
        image_analysis: Optional[MultiImageAssessmentResult]
    ) -> str:
        """Build comprehensive assessment prompt including image analysis context."""

        base_prompt = self._build_assessment_prompt(claim_data, policy_data)

        if image_analysis:
            image_context = f"""

            IMAGE ANALYSIS RESULTS:
            - Total Images Processed: {image_analysis.total_images_processed}
            - Overall Relevance Score: {image_analysis.overall_relevance_score:.2f}
            - Processing Time: {image_analysis.processing_time_seconds:.2f} seconds
            - Summary: {image_analysis.summary}

            INDIVIDUAL IMAGE ANALYSES:
            """

            for i, img in enumerate(image_analysis.image_analyses, 1):
                image_context += f"""
            Image {i}: {img.filename}
            - Type: {img.image_type}
            - Classification: {img.classification}
            - Confidence: {img.confidence_score:.2f}
            - Relevance: {img.relevance_score:.2f}
            - Extracted Text: {img.extracted_text[:200] if img.extracted_text else 'None'}...
            - Damage Assessment: {getattr(img.damage_assessment, 'severity', 'N/A') if img.damage_assessment else 'N/A'}
            """

            image_context += f"""

            IMAGE-BASED RECOMMENDATIONS:
            {chr(10).join(f"- {rec}" for rec in image_analysis.recommended_actions)}

            ENHANCED ANALYSIS REQUIREMENTS:
            Consider the image analysis results in your assessment:
            1. Do the images support or contradict the claim description?
            2. Is the damage assessment from images consistent with claimed amount?
            3. Are there any fraud indicators visible in the images?
            4. Do the images provide sufficient documentation for the claim?
            5. Are there any discrepancies between image content and claim details?
            """

            return base_prompt + image_context
        else:
            return base_prompt + "\n\nNOTE: No images were provided for analysis."

    # Keep all existing methods unchanged
    async def assess_claim(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]] = None
    ) -> AssessmentResult:
        """
        Perform comprehensive claim assessment using LLM-driven analysis.
        (Original method maintained for backward compatibility)
        """
        start_time = datetime.now()

        try:
            # Validate input data
            validation_result = self._validate_claim_data(claim_data)
            if not validation_result["valid"]:
                return self._create_error_result(validation_result["error"], start_time)

            # Perform LLM-driven assessment
            llm_result = await self._perform_llm_assessment(claim_data, policy_data)

            # Apply business rules and validation
            final_result = self._apply_business_rules(llm_result, claim_data)

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            final_result.processing_time_seconds = processing_time

            return final_result

        except Exception as e:
            # Return error instead of fallback
            return self._create_error_result(str(e), start_time)

    async def _perform_llm_assessment(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform LLM-driven claim assessment with structured output."""

        # Prepare comprehensive prompt
        assessment_prompt = self._build_assessment_prompt(
            claim_data, policy_data)

        try:
            # Use AutoGen agent for structured assessment
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2),
            )

            result = await team.run(task=assessment_prompt)

            if result.messages and len(result.messages) > 0:
                response_content = result.messages[-1].content
                return self._parse_llm_response(response_content)
            else:
                raise Exception("No response from LLM")

        except Exception as e:
            raise Exception(f"LLM assessment failed: {str(e)}")

    def _build_assessment_prompt(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]]
    ) -> str:
        """Build comprehensive assessment prompt for LLM."""

        prompt = f"""
            Analyze this insurance claim and provide a structured assessment:

            CLAIM INFORMATION:
            - Claim ID: {claim_data.get("claim_id", "Not provided")}
            - Policy Number: {claim_data.get("policy_number", "Not provided")}
            - Incident Date: {claim_data.get("incident_date", "Not provided")}
            - Reported Date: {claim_data.get("reported_date", "Not provided")}
            - Description: {claim_data.get("description", "Not provided")}
            - Estimated Amount: {claim_data.get("amount", "Not provided")}
            - Location: {claim_data.get("location", "Not provided")}
            - Claimant: {claim_data.get("claimant_name", "Not provided")}

            DOCUMENTATION PROVIDED:
            - Incident Report: {"Yes" if claim_data.get("incident_report") else "No"}
            - Photos: {"Yes" if claim_data.get("photos") else "No"}
            - Police Report: {"Yes" if claim_data.get("police_report") else "No"}
            - Medical Records: {"Yes" if claim_data.get("medical_records") else "No"}
            - Repair Estimates: {"Yes" if claim_data.get("repair_estimates") else "No"}

            POLICY INFORMATION:
            {self._format_policy_data(policy_data) if policy_data else "Policy data not provided"}

            ASSESSMENT REQUIREMENTS:
            Provide your analysis in the following JSON format:

            {{
                "decision": "approve|reject|human_review|investigate",
                "confidence_score": 0.0-1.0,
                "reasoning": "Detailed explanation of your decision",
                "risk_factors": [
                    {{
                        "factor_type": "fraud|documentation|policy|regulatory|other",
                        "severity": "low|medium|high",
                        "description": "Specific risk description",
                        "confidence": 0.0-1.0
                    }}
                ],
                "policy_coverage_analysis": {{
                    "covered": true|false,
                    "coverage_type": "comprehensive|collision|liability|other",
                    "policy_limits": "analysis of limits",
                    "deductible_applicable": true|false,
                    "exclusions_apply": true|false,
                    "exclusion_details": "if applicable"
                }},
                "fraud_risk_score": 0.0-1.0,
                "documentation_completeness": 0.0-1.0,
                "regulatory_compliance": {{
                    "compliant": true|false,
                    "requirements": ["list of requirements"],
                    "missing_items": ["list of missing items"]
                }},
                "recommended_actions": ["list of recommended next steps"]
            }}

            ANALYSIS FOCUS AREAS:
            1. Policy Coverage: Does the incident fall under policy coverage?
            2. Incident Plausibility: Is the described incident reasonable and consistent?
            3. Documentation Quality: Are required documents present and authentic?
            4. Fraud Indicators: Any suspicious patterns or inconsistencies?
            5. Regulatory Compliance: Does the claim meet regulatory requirements?
            6. Timeline Analysis: Are reporting timelines appropriate?
            7. Amount Reasonableness: Is the claimed amount consistent with described damage?

            Provide thorough analysis with specific reasoning for your decision.
        """
        return prompt

    def _format_policy_data(self, policy_data: Dict[str, Any]) -> str:
        """Format policy data for prompt inclusion."""
        if not policy_data:
            return "No policy data provided"

        return f"""
            - Policy Type: {policy_data.get("policy_type", "Not specified")}
            - Coverage Limits: {policy_data.get("coverage_limits", "Not specified")}
            - Deductible: {policy_data.get("deductible", "Not specified")}
            - Policy Status: {policy_data.get("status", "Not specified")}
            - Effective Date: {policy_data.get("effective_date", "Not specified")}
            - Expiration Date: {policy_data.get("expiration_date", "Not specified")}
        """

    def _parse_llm_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response and extract structured data."""
        try:
            # Try to extract JSON from the response
            start_idx = response_content.find("{")
            end_idx = response_content.rfind("}") + 1

            if start_idx != -1 and end_idx != -1:
                json_str = response_content[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback: create structured response from text
                return self._extract_structured_data_from_text(response_content)

        except json.JSONDecodeError:
            # Fallback to text parsing
            return self._extract_structured_data_from_text(response_content)

    def _extract_structured_data_from_text(self, text: str) -> Dict[str, Any]:
        """Extract structured data from unstructured text response."""
        # Basic text parsing fallback
        text_lower = text.lower()

        # Determine decision
        if "approve" in text_lower and "reject" not in text_lower:
            decision = "approve"
        elif "reject" in text_lower:
            decision = "reject"
        elif "human review" in text_lower or "escalate" in text_lower:
            decision = "human_review"
        else:
            decision = "investigate"

        # Extract confidence (basic pattern matching)
        confidence = 0.5  # Default
        if "high confidence" in text_lower:
            confidence = 0.85
        elif "low confidence" in text_lower:
            confidence = 0.6
        elif "medium confidence" in text_lower:
            confidence = 0.75

        return {
            "decision": decision,
            "confidence_score": confidence,
            "reasoning": text,
            "risk_factors": [],
            "policy_coverage_analysis": {"covered": True},
            "fraud_risk_score": 0.3,
            "documentation_completeness": 0.7,
            "regulatory_compliance": {
                "compliant": True,
                "requirements": [],
                "missing_items": [],
            },
            "recommended_actions": [
                "Review assessment",
                "Proceed with standard processing",
            ],
        }

    def _apply_business_rules(
        self, llm_result: Dict[str, Any], claim_data: Dict[str, Any]
    ) -> AssessmentResult:
        """Apply business rules and create final assessment result."""

        # Extract LLM results
        decision_str = llm_result.get("decision", "investigate").lower()
        confidence_score = float(llm_result.get("confidence_score", 0.5))

        # Map decision string to enum
        decision_mapping = {
            "approve": AssessmentDecision.APPROVE,
            "reject": AssessmentDecision.REJECT,
            "human_review": AssessmentDecision.HUMAN_REVIEW,
            "investigate": AssessmentDecision.INVESTIGATE,
        }
        decision = decision_mapping.get(
            decision_str, AssessmentDecision.INVESTIGATE)

        # Apply confidence-based overrides
        if confidence_score < self.confidence_thresholds["human_review"]:
            decision = AssessmentDecision.HUMAN_REVIEW

        # High-value claims require human review
        amount = self._parse_amount(claim_data.get("amount", 0))
        if amount > 50000:
            decision = AssessmentDecision.HUMAN_REVIEW

        # Determine confidence level
        confidence_level = self._determine_confidence_level(confidence_score)

        # Parse risk factors
        risk_factors = []
        for rf_data in llm_result.get("risk_factors", []):
            risk_factors.append(
                RiskFactor(
                    factor_type=rf_data.get("factor_type", "other"),
                    severity=rf_data.get("severity", "medium"),
                    description=rf_data.get(
                        "description", "Risk factor identified"),
                    confidence=float(rf_data.get("confidence", 0.5)),
                )
            )

        # Build recommended actions
        recommended_actions = llm_result.get("recommended_actions", [])
        if decision == AssessmentDecision.HUMAN_REVIEW:
            recommended_actions.append("Escalate to human reviewer")
        elif decision == AssessmentDecision.INVESTIGATE:
            recommended_actions.append("Initiate investigation process")

        return AssessmentResult(
            decision=decision,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            reasoning=llm_result.get("reasoning", "Assessment completed"),
            risk_factors=risk_factors,
            policy_coverage_analysis=llm_result.get(
                "policy_coverage_analysis", {}),
            fraud_risk_score=float(llm_result.get("fraud_risk_score", 0.3)),
            documentation_completeness=float(
                llm_result.get("documentation_completeness", 0.7)
            ),
            regulatory_compliance=llm_result.get("regulatory_compliance", {}),
            recommended_actions=recommended_actions,
            processing_time_seconds=0.0,  # Will be set by caller
            assessment_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
        )

    def _determine_confidence_level(self, confidence_score: float) -> ConfidenceLevel:
        """Determine confidence level based on score."""
        if confidence_score >= 0.9:
            return ConfidenceLevel.VERY_HIGH
        elif confidence_score >= 0.8:
            return ConfidenceLevel.HIGH
        elif confidence_score >= 0.7:
            return ConfidenceLevel.MEDIUM
        elif confidence_score >= 0.6:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW

    def _validate_claim_data(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate claim data for completeness."""
        required_fields = ["policy_number", "incident_date", "description"]
        missing_fields = []

        for field in required_fields:
            if field not in claim_data or not claim_data[field]:
                missing_fields.append(field)

        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}",
            }

        # Validate date format (basic check)
        incident_date = claim_data.get("incident_date")
        if incident_date:
            try:
                datetime.fromisoformat(incident_date.replace("Z", "+00:00"))
            except ValueError:
                return {
                    "valid": False,
                    "error": "Invalid incident_date format. Use ISO format (YYYY-MM-DD)",
                }

        return {"valid": True}

    def _parse_amount(self, amount: Union[str, int, float]) -> float:
        """Parse amount from various formats into a float."""
        if isinstance(amount, (int, float)):
            return float(amount)
        elif isinstance(amount, str):
            try:
                return float(amount.replace("$", "").replace(",", ""))
            except ValueError:
                return 0.0
        else:
            return 0.0

    def _create_error_result(
        self, error_message: str, start_time: datetime
    ) -> AssessmentResult:
        """Create error assessment result."""
        processing_time = (datetime.now() - start_time).total_seconds()

        return AssessmentResult(
            decision=AssessmentDecision.HUMAN_REVIEW,
            confidence_score=0.0,
            confidence_level=ConfidenceLevel.VERY_LOW,
            reasoning=f"Assessment failed due to error: {error_message}",
            risk_factors=[
                RiskFactor(
                    factor_type="other",
                    severity="high",
                    description=f"Assessment error: {error_message}",
                    confidence=1.0,
                )
            ],
            policy_coverage_analysis={"error": error_message},
            fraud_risk_score=0.0,
            documentation_completeness=0.0,
            regulatory_compliance={
                "compliant": False,
                "requirements": [],
                "missing_items": [],
            },
            recommended_actions=[
                "Manual review required due to assessment error"],
            processing_time_seconds=processing_time,
            assessment_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
        )

    async def assess_claim_validity(
        self, claim_data: Dict[str, Any], policy_terms: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Legacy compatibility method for existing orchestrator integration.

        This method maintains compatibility with the existing ClaimAssessmentAgent
        interface while providing enhanced functionality.
        """
        try:
            result = await self.assess_claim(claim_data, policy_terms)

            # Convert to legacy format
            return {
                "decision": result.decision.value,
                "confidence_score": result.confidence_score,
                "reasoning": result.reasoning,
                "assessment_id": result.assessment_id,
                "risk_factors": [rf.description for rf in result.risk_factors],
                "fraud_risk_score": result.fraud_risk_score,
                "documentation_completeness": result.documentation_completeness,
                "recommended_actions": result.recommended_actions,
                "processing_time": result.processing_time_seconds,
                "enhanced_assessment": True,
            }

        except Exception as e:
            return {
                "decision": "human_review",
                "confidence_score": 0.0,
                "reasoning": f"Assessment failed: {str(e)}",
                "error": str(e),
                "enhanced_assessment": False,
            }

    def get_assessment_capabilities(self) -> Dict[str, Any]:
        """Get information about agent capabilities."""
        return {
            "agent_type": "EnhancedAssessmentAgent",
            "capabilities": [
                "claim_validity_assessment",
                "risk_factor_identification",
                "fraud_detection",
                "policy_coverage_analysis",
                "regulatory_compliance_check",
                "confidence_scoring",
                "image_analysis",
                "document_classification",
                "damage_assessment",
                "multi_modal_processing"
            ],
            "supported_image_formats": list(self.supported_image_formats),
            "confidence_thresholds": self.confidence_thresholds,
            "risk_weights": self.risk_weights,
            "decision_types": [decision.value for decision in AssessmentDecision],
            "confidence_levels": [level.value for level in ConfidenceLevel],
        }
