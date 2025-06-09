"""
Claim-related schemas for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Union
from fastapi import UploadFile, File, Form


class ClaimData(BaseModel):
    """Model for insurance claim data."""

    claim_id: Optional[str] = None
    policy_number: str
    incident_date: str
    description: str
    amount: Optional[float] = None
    documentation: Optional[List[str]] = None


class ClaimDataWithImages(BaseModel):
    """Model for insurance claim data with image support."""

    claim_id: Optional[str] = None
    policy_number: str
    incident_date: str
    description: str
    amount: Optional[float] = None
    documentation: Optional[List[str]] = None
    image_files: Optional[List[str]] = Field(
        default=None,
        description="List of uploaded image file names for processing"
    )


class ExtractedData(BaseModel):
    """Model for structured data extracted from images."""

    document_type: Optional[str] = None
    vendor_name: Optional[str] = None
    # Allow both strings and structured objects
    amounts: Optional[List[Union[str, Dict[str, Any]]]] = None
    dates: Optional[List[str]] = None
    names: Optional[List[str]] = None
    invoice_number: Optional[str] = None
    # Allow both strings and structured objects
    line_items: Optional[List[Union[str, Dict[str, Any]]]] = None
    tax_amount: Optional[str] = None
    total_amount: Optional[str] = None
    payment_terms: Optional[str] = None
    key_details: Optional[List[str]] = None


class DamageAssessment(BaseModel):
    """Model for damage assessment data."""

    severity: str
    estimated_cost: Optional[str] = None
    description: Optional[str] = None
    affected_areas: Optional[List[str]] = None


class FraudIndicators(BaseModel):
    """Model for fraud analysis indicators."""

    suspicious_elements: Optional[List[str]] = None
    authenticity_score: Optional[float] = None
    concerns: Optional[List[str]] = None


class ImageAnalysisResult(BaseModel):
    """Model for individual image analysis results."""

    filename: str
    file_size: int
    image_type: str
    classification: str
    confidence_score: float
    relevance_score: float
    extracted_text: Optional[str] = None
    extracted_data: Optional[ExtractedData] = None
    damage_assessment: Optional[DamageAssessment] = None
    fraud_indicators: Optional[FraudIndicators] = None
    processing_time_seconds: float


class MultiImageAssessmentResult(BaseModel):
    """Model for multi-image assessment results."""

    total_images_processed: int
    processing_time_seconds: float
    image_analyses: List[ImageAnalysisResult]
    overall_relevance_score: float
    recommended_actions: List[str]
    summary: str


class CustomerInquiry(BaseModel):
    """Model for customer inquiry data."""

    inquiry: str
    customer_id: Optional[str] = None
    claim_status: Optional[str] = None
    policy_type: Optional[str] = None


class WorkflowRequest(BaseModel):
    """Request model for workflow processing."""

    claim_data: ClaimData
    use_graphflow: bool = False


class WorkflowStatusResponse(BaseModel):
    """Response model for workflow status."""

    success: bool
    workflow_state: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class EnhancedAssessmentRequest(BaseModel):
    """Request model for enhanced claim assessment."""

    claim_data: ClaimData
    policy_data: Optional[Dict[str, Any]] = None


class EnhancedAssessmentWithImagesRequest(BaseModel):
    """Request model for enhanced claim assessment with image support."""

    claim_data: ClaimDataWithImages
    policy_data: Optional[Dict[str, Any]] = None


class EnhancedAssessmentResponse(BaseModel):
    """Response model for enhanced claim assessment."""

    success: bool
    assessment_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class EnhancedAssessmentWithImagesResponse(BaseModel):
    """Response model for enhanced claim assessment with image analysis."""

    success: bool
    assessment_result: Optional[Dict[str, Any]] = None
    image_analysis_result: Optional[MultiImageAssessmentResult] = None
    error: Optional[str] = None


# Form data models for multipart/form-data requests
class ClaimFormData:
    """Form data model for claim submission with images."""

    def __init__(
        self,
        policy_number: str = Form(...),
        incident_date: str = Form(...),
        description: str = Form(...),
        amount: Optional[float] = Form(None),
        claim_id: Optional[str] = Form(None),
        # JSON string of documentation list
        documentation: Optional[str] = Form(None),
        images: List[UploadFile] = File(default=[]),
        policy_data: Optional[str] = Form(None),  # JSON string of policy data
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

    def get_policy_data(self) -> Optional[Dict[str, Any]]:
        """Parse and return policy data from JSON string."""
        if not self.policy_data:
            return None

        try:
            import json
            return json.loads(self.policy_data)
        except json.JSONDecodeError:
            return None
