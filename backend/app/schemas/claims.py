"""
Claim-related schemas for API requests and responses.
"""

from typing import Any
from pydantic import BaseModel, Field

from fastapi import UploadFile, File, Form


class ClaimData(BaseModel):
    """Model for insurance claim data."""

    claim_id: str | None = None
    policy_number: str
    incident_date: str
    description: str
    amount: float | None = None
    documentation: list[str] | None = None


class ClaimDataWithImages(BaseModel):
    """Model for insurance claim data with image support."""

    claim_id: str | None = None
    policy_number: str
    incident_date: str
    description: str
    amount: float | None = None
    documentation: list[str] | None = None
    image_files: list[str] | None = Field(
        default=None,
        description="List of uploaded image file names for processing"
    )


class ExtractedData(BaseModel):
    """Model for structured data extracted from images."""

    document_type: str | None = None
    vendor_name: str | None = None
    # Allow both strings and structured objects
    amounts: list[str | dict[str, Any]] | None = None
    dates: list[str] | None = None
    names: list[str] | None = None
    invoice_number: str | None = None
    # Allow both strings and structured objects
    line_items: list[str | dict[str, Any]] | None = None
    tax_amount: str | None = None
    total_amount: str | None = None
    payment_terms: str | None = None
    key_details: list[str] | None = None


class DamageAssessment(BaseModel):
    """Model for damage assessment data."""

    severity: str
    estimated_cost: str | None = None
    description: str | None = None
    affected_areas: list[str] | None = None


class FraudIndicators(BaseModel):
    """Model for fraud analysis indicators."""

    suspicious_elements: list[str] | None = None
    authenticity_score: float | None = None
    concerns: list[str] | None = None


class ImageAnalysisResult(BaseModel):
    """Model for individual image analysis results."""

    filename: str
    file_size: int
    image_type: str
    classification: str
    confidence_score: float
    relevance_score: float
    extracted_text: str | None = None
    extracted_data: ExtractedData | None = None
    damage_assessment: DamageAssessment | None = None
    fraud_indicators: FraudIndicators | None = None
    processing_time_seconds: float


class MultiImageAssessmentResult(BaseModel):
    """Model for multi-image assessment results."""

    total_images_processed: int
    processing_time_seconds: float
    image_analyses: list[ImageAnalysisResult]
    overall_relevance_score: float
    recommended_actions: list[str]
    summary: str


class CustomerInquiry(BaseModel):
    """Model for customer inquiry data."""

    inquiry: str
    customer_id: str | None = None
    claim_status: str | None = None
    policy_type: str | None = None


class WorkflowRequest(BaseModel):
    """Request model for workflow processing."""

    claim_data: ClaimData
    use_graphflow: bool = False


class WorkflowStatusResponse(BaseModel):
    """Response model for workflow status."""

    success: bool
    workflow_state: dict[str, Any] | None = None
    error: str | None = None


class EnhancedAssessmentRequest(BaseModel):
    """Request model for enhanced claim assessment."""

    claim_data: ClaimData
    policy_data: dict[str, Any] | None = None


class EnhancedAssessmentWithImagesRequest(BaseModel):
    """Request model for enhanced claim assessment with image support."""

    claim_data: ClaimDataWithImages
    policy_data: dict[str, Any] | None = None


class EnhancedAssessmentResponse(BaseModel):
    """Response model for enhanced claim assessment."""

    success: bool
    assessment_result: dict[str, Any] | None = None
    error: str | None = None


class EnhancedAssessmentWithImagesResponse(BaseModel):
    """Response model for enhanced claim assessment with image analysis."""

    success: bool
    assessment_result: dict[str, Any] | None = None
    image_analysis_result: MultiImageAssessmentResult | None = None
    error: str | None = None

# Form data models for multipart/form-data requests


class ClaimFormData:
    """Form data model for claim submission with images."""

    def __init__(
        self,
        policy_number: str = Form(...),
        incident_date: str = Form(...),
        description: str = Form(...),
        amount: float | None = Form(None),
        claim_id: str | None = Form(None),
        # JSON string of documentation list
        documentation: str | None = Form(None),
        images: list[UploadFile] = File(default=[]),
        policy_data: str | None = Form(None),  # JSON string of policy data
    ):
        self.policy_number = policy_number
        self.incident_date = incident_date
        self.description = description
        self.amount = amount
        self.claim_id = claim_id
        self.documentation = documentation
        self.images = images
        self.policy_data = policy_data

    def to_claim_data_with_images(self) -> ClaimDataWithImages:
        """Convert form data to ClaimDataWithImages model."""
        import json

        documentation = None
        if self.documentation:
            try:
                documentation = json.loads(self.documentation)
            except json.JSONDecodeError:
                documentation = [self.documentation]

        return ClaimDataWithImages(
            claim_id=self.claim_id,
            policy_number=self.policy_number,
            incident_date=self.incident_date,
            description=self.description,
            amount=self.amount,
            documentation=documentation,
            image_files=[img.filename for img in self.images if img.filename]
        )

    def get_policy_data(self) -> dict[str, Any] | None:
        """Parse and return policy data from JSON string."""
        if not self.policy_data:
            return None

        try:
            import json
            return json.loads(self.policy_data)
        except json.JSONDecodeError:
            return None
