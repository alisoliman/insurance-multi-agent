"""
Claim-related schemas for API requests and responses.
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional, List


class ClaimData(BaseModel):
    """Model for insurance claim data."""

    claim_id: Optional[str] = None
    policy_number: str
    incident_date: str
    description: str
    amount: Optional[float] = None
    documentation: Optional[List[str]] = None


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


class EnhancedAssessmentResponse(BaseModel):
    """Response model for enhanced claim assessment."""

    success: bool
    assessment_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
