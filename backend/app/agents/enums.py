"""
Shared enums for the agents module to avoid circular imports.
"""

from enum import Enum

class ClaimComplexity(Enum):
    """Enum for claim complexity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class WorkflowStage(Enum):
    """Enum for workflow stages."""
    INTAKE = "intake"
    ASSESSMENT = "assessment"
    IMAGE_PROCESSING = "image_processing"  # New stage for image processing
    COMMUNICATION = "communication"
    HUMAN_REVIEW = "human_review"
    COMPLETED = "completed"
    ESCALATED = "escalated"
    FAILED = "failed"
