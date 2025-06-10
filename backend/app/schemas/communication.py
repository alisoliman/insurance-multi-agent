"""
Communication-related schemas for API requests and responses with AutoGen structured output support.
"""

from datetime import datetime
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field, validator


class CommunicationType(str, Enum):
    """Enumeration of communication types."""
    CLAIM_STATUS_UPDATE = "claim_status_update"
    APPROVAL_NOTIFICATION = "approval_notification"
    REJECTION_NOTIFICATION = "rejection_notification"
    INFORMATION_REQUEST = "information_request"
    HUMAN_REVIEW_NOTIFICATION = "human_review_notification"
    INVESTIGATION_UPDATE = "investigation_update"
    GENERAL_INQUIRY_RESPONSE = "general_inquiry_response"


class CommunicationTone(str, Enum):
    """Enumeration of communication tones."""
    PROFESSIONAL = "professional"
    EMPATHETIC = "empathetic"
    URGENT = "urgent"
    REASSURING = "reassuring"
    CONGRATULATORY = "congratulatory"


class Language(str, Enum):
    """Supported languages for communication."""
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    PORTUGUESE = "pt"
    CHINESE = "zh"


class UrgencyLevel(str, Enum):
    """Urgency levels for communications."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class CommunicationRequest(BaseModel):
    """Request model for communication generation with comprehensive validation."""

    customer_name: str = Field(..., min_length=1,
                               max_length=100, description="Customer's full name")
    claim_id: str = Field(..., min_length=1, max_length=50,
                          description="Unique claim identifier")
    policy_number: str = Field(..., min_length=1,
                               max_length=50, description="Policy number")
    communication_type: CommunicationType = Field(
        ..., description="Type of communication to generate")
    preferred_language: Language = Field(
        default=Language.ENGLISH, description="Preferred language for communication")
    urgency_level: UrgencyLevel = Field(
        default=UrgencyLevel.NORMAL, description="Urgency level of the communication")
    special_instructions: Optional[str] = Field(
        None, max_length=500, description="Special instructions for communication")

    # Optional context data
    assessment_result: Optional[dict[str, Any]] = Field(
        None, description="Assessment result data")
    policy_details: Optional[dict[str, Any]] = Field(
        None, description="Policy details")
    communication_history: Optional[List[dict[str, Any]]] = Field(
        None, description="Previous communications")

    @validator('customer_name')
    def validate_customer_name(cls, v):
        if not v.strip():
            raise ValueError('Customer name cannot be empty')
        return v.strip()

    @validator('claim_id')
    def validate_claim_id(cls, v):
        if not v.strip():
            raise ValueError('Claim ID cannot be empty')
        return v.strip().upper()

    @validator('policy_number')
    def validate_policy_number(cls, v):
        if not v.strip():
            raise ValueError('Policy number cannot be empty')
        return v.strip().upper()


class CommunicationResponse(BaseModel):
    """Simplified response model for AutoGen communication generation."""

    # Core communication content
    subject: str = Field(..., min_length=1, max_length=200,
                         description="Email/communication subject line")
    content: str = Field(..., min_length=10,
                         description="Main communication content")

    # Metadata
    communication_id: str = Field(...,
                                  description="Unique identifier for this communication")
    communication_type: CommunicationType = Field(
        ..., description="Type of communication generated")
    language: Language = Field(...,
                               description="Language of the generated communication")
    tone: CommunicationTone = Field(...,
                                    description="Tone used in the communication")

    # Quality metrics
    personalization_score: float = Field(..., ge=0.0,
                                         le=1.0, description="Personalization score (0-1)")
    compliance_verified: bool = Field(...,
                                      description="Whether compliance requirements are met")

    # Processing information
    generated_at: datetime = Field(
        default_factory=datetime.now, description="Generation timestamp")
    processing_time_seconds: float = Field(...,
                                           ge=0.0, description="Time taken to generate")

    # Additional metadata
    metadata: Optional[dict[str, str]] = Field(
        default_factory=dict, description="Additional metadata (string values only)")


class AssessmentBasedCommunicationRequest(BaseModel):
    """Request model for assessment-based communication generation."""

    assessment_result: dict[str,
                            Any] = Field(..., description="Complete assessment result")
    customer_data: dict[str,
                        Any] = Field(..., description="Customer information")
    communication_type: Optional[CommunicationType] = Field(
        None, description="Specific communication type")
    preferred_language: Language = Field(
        default=Language.ENGLISH, description="Preferred language")
    urgency_level: UrgencyLevel = Field(
        default=UrgencyLevel.NORMAL, description="Urgency level")
    special_instructions: Optional[str] = Field(
        None, max_length=500, description="Special instructions")


class CommunicationError(BaseModel):
    """Model for communication generation errors."""

    error_code: str = Field(..., description="Error code")
    error_message: str = Field(..., description="Human-readable error message")
    error_details: Optional[dict[str, Any]] = Field(
        None, description="Additional error details")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Error timestamp")
    request_id: Optional[str] = Field(
        None, description="Request ID for tracking")
