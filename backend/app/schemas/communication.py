"""
Communication-related schemas for API requests and responses.
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional


class CommunicationRequest(BaseModel):
    """Request model for communication generation."""

    customer_name: str
    claim_id: str
    policy_number: str
    communication_type: str
    assessment_result: Optional[Dict[str, Any]] = None
    policy_details: Optional[Dict[str, Any]] = None
    preferred_language: str = "en"
    special_instructions: Optional[str] = None
    urgency_level: str = "normal"


class AssessmentBasedCommunicationRequest(BaseModel):
    """Request model for assessment-based communication generation."""

    assessment_result: Dict[str, Any]
    customer_data: Dict[str, Any]
