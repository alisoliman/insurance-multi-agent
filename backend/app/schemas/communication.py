"""
Communication-related schemas for API requests and responses.
"""

from typing import Any
from pydantic import BaseModel


class CommunicationRequest(BaseModel):
    """Request model for communication generation."""

    customer_name: str
    claim_id: str
    policy_number: str
    communication_type: str
    assessment_result: dict[str, Any] | None = None
    policy_details: dict[str, Any] | None = None
    preferred_language: str = "en"
    special_instructions: str | None = None
    urgency_level: str = "normal"


class AssessmentBasedCommunicationRequest(BaseModel):
    """Request model for assessment-based communication generation."""

    assessment_result: dict[str, Any]
    customer_data: dict[str, Any]
