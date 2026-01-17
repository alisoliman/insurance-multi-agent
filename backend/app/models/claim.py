"""Pydantic schemas for claim workflow endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Agent Output Models for API Response (T004-T005)
# ---------------------------------------------------------------------------


class ToolCallOut(BaseModel):
    """Serialized tool call for API response."""
    id: str
    name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None


class AgentOutputOut(BaseModel):
    """Serialized agent output for API response."""
    agent_name: str
    structured_output: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[ToolCallOut]] = None
    raw_text: Optional[str] = None


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------


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
    """Response model for workflow execution."""
    success: bool = True
    final_decision: Optional[str] = None
    conversation_chronological: Optional[List[Dict[str, str]]] = None
    agent_outputs: Optional[Dict[str, AgentOutputOut]] = None  # NEW: structured outputs per agent
