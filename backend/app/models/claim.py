"""Pydantic schemas for claim workflow endpoints."""
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ClaimIn(BaseModel):
    """Request model for claim processing.

    Can accept either:
    - Just a claim_id to load sample data
    - Full claim data (claim_id will be ignored if other fields are present)
    """
    claim_id: Optional[str] = Field(
        None, description="ID of sample claim to load")

    # Optional full claim data fields
    policy_number: Optional[str] = None
    claimant_id: Optional[str] = None
    claimant_name: Optional[str] = None
    incident_date: Optional[str] = None
    claim_type: Optional[str] = None
    description: Optional[str] = None
    estimated_damage: Optional[float] = None
    location: Optional[str] = None
    police_report: Optional[bool] = None
    photos_provided: Optional[bool] = None
    witness_statements: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    supporting_images: Optional[list] = None

    # Allow additional fields for flexibility
    class Config:
        extra = "allow"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in self.model_dump().items() if v is not None}

    def is_sample_claim_request(self) -> bool:
        """Check if this is a request for sample data (only claim_id provided)."""
        data = self.to_dict()
        return len(data) == 1 and "claim_id" in data


class ClaimOut(BaseModel):
    success: bool = True
    final_decision: Optional[str] = None
    conversation: Dict[str, Any]
