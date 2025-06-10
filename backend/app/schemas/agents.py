"""
Agent-related schemas for API requests and responses.
"""

from pydantic import BaseModel

class AgentTestRequest(BaseModel):
    """Request model for testing agent functionality."""

    message: str
    agent_type: str = "assessment"  # "assessment" or "communication"

class AgentTestResponse(BaseModel):
    """Response model for agent test results."""

    success: bool
    agent_name: str
    message: str
    response: str
    error: str | None = None
