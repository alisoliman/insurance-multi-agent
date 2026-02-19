"""Pydantic schemas for claim workflow endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_serializer
import json


def _json_safe(obj: Any) -> Any:
    """Convert numpy types to Python native for JSON serialization."""
    try:
        import numpy as np
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
    except ImportError:
        pass
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_safe(v) for v in obj]
    return obj


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

    def model_post_init(self, __context: Any) -> None:
        # Sanitize numpy types for JSON serialization
        object.__setattr__(self, 'arguments', _json_safe(self.arguments))
        if self.result is not None:
            object.__setattr__(self, 'result', _json_safe(self.result))


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
    
    # Workflow options
    summary_language: Optional[str] = Field(
        "english",
        description="Language for the final summary: 'english' or 'original' (keep in claim's language)"
    )

    # Allow additional fields for flexibility
    model_config = ConfigDict(extra="allow")

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
