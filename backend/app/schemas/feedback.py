"""
Feedback-related schemas for API requests and responses.
"""

from typing import Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class FeedbackRatingRequest(BaseModel):
    """Request model for individual feedback rating."""

    category: str = Field(
        ..., description="Feedback category (accuracy, speed, clarity, helpfulness, overall_experience)")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str | None = Field(
        None, max_length=500, description="Optional comment for this rating")

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Validate feedback category."""
        valid_categories = ['accuracy', 'speed',
                            'clarity', 'helpfulness', 'overall_experience']
        if v not in valid_categories:
            raise ValueError(
                f'Category must be one of: {", ".join(valid_categories)}')
        return v


class ImmediateAgentFeedbackRequest(BaseModel):
    """Request model for immediate agent feedback."""

    # Context information
    session_id: str | None = Field(None, description="Session ID for tracking")
    claim_id: str | None = Field(None, description="Associated claim ID")
    agent_name: str | None = Field(
        None, description="Name of the agent being rated")
    interaction_id: str | None = Field(
        None, description="Specific interaction ID")

    # Rating data
    ratings: list[FeedbackRatingRequest] = Field(
        ..., min_items=1, description="List of category ratings")
    overall_rating: int | None = Field(
        None, ge=1, le=5, description="Overall rating from 1 to 5")

    # Text feedback
    positive_feedback: str | None = Field(
        None, max_length=1000, description="What worked well")
    improvement_suggestions: str | None = Field(
        None, max_length=1000, description="Suggestions for improvement")
    additional_comments: str | None = Field(
        None, max_length=1000, description="Any additional comments")

    # Optional metadata
    user_id: str | None = Field(None, description="User identifier")


class WorkflowCompletionFeedbackRequest(BaseModel):
    """Request model for workflow completion feedback."""

    # Context information
    session_id: str | None = Field(None, description="Session ID for tracking")
    claim_id: str | None = Field(None, description="Associated claim ID")
    workflow_type: str | None = Field(
        None, description="Type of workflow completed")

    # Rating data
    ratings: list[FeedbackRatingRequest] = Field(
        ..., min_items=1, description="List of category ratings")
    overall_rating: int | None = Field(
        None, ge=1, le=5, description="Overall rating from 1 to 5")

    # Text feedback
    positive_feedback: str | None = Field(
        None, max_length=1000, description="What worked well")
    improvement_suggestions: str | None = Field(
        None, max_length=1000, description="Suggestions for improvement")
    additional_comments: str | None = Field(
        None, max_length=1000, description="Any additional comments")

    # Workflow-specific fields
    completion_time_seconds: float | None = Field(
        None, ge=0, description="Time taken to complete workflow")
    steps_completed: int | None = Field(
        None, ge=0, description="Number of steps completed")
    encountered_issues: bool = Field(
        False, description="Whether user encountered any issues")

    # Optional metadata
    user_id: str | None = Field(None, description="User identifier")


class FeedbackRatingResponse(BaseModel):
    """Response model for individual feedback rating."""

    category: str
    rating: int
    comment: str | None = None


class FeedbackResponse(BaseModel):
    """Response model for feedback data."""

    feedback_id: str
    feedback_type: str
    session_id: str | None = None
    claim_id: str | None = None
    agent_name: str | None = None
    interaction_id: str | None = None

    # Rating data
    ratings: list[FeedbackRatingResponse]
    overall_rating: int | None = None
    average_rating: float

    # Text feedback
    positive_feedback: str | None = None
    improvement_suggestions: str | None = None
    additional_comments: str | None = None

    # Metadata
    user_id: str | None = None
    submitted_at: str
    is_processed: bool
    processed_at: str | None = None
    has_text_feedback: bool


class FeedbackSubmissionResponse(BaseModel):
    """Response model for feedback submission."""

    success: bool
    feedback_id: str | None = None
    message: str
    error: str | None = None


class FeedbackListResponse(BaseModel):
    """Response model for feedback list."""

    success: bool
    feedback: list[FeedbackResponse]
    total_count: int
    page: int
    page_size: int
    error: str | None = None


class FeedbackSummaryResponse(BaseModel):
    """Response model for feedback summary statistics."""

    success: bool
    summary: dict[str, Any] | None = None
    error: str | None = None


class FeedbackQueryParams(BaseModel):
    """Query parameters for feedback filtering."""

    feedback_type: str | None = Field(
        None, description="Filter by feedback type")
    agent_name: str | None = Field(None, description="Filter by agent name")
    claim_id: str | None = Field(None, description="Filter by claim ID")
    session_id: str | None = Field(None, description="Filter by session ID")
    user_id: str | None = Field(None, description="Filter by user ID")
    start_date: str | None = Field(
        None, description="Filter by start date (ISO format)")
    end_date: str | None = Field(
        None, description="Filter by end date (ISO format)")
    min_rating: int | None = Field(
        None, ge=1, le=5, description="Filter by minimum rating")
    max_rating: int | None = Field(
        None, ge=1, le=5, description="Filter by maximum rating")
    is_processed: bool | None = Field(
        None, description="Filter by processing status")
    has_text_feedback: bool | None = Field(
        None, description="Filter by presence of text feedback")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")

    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v: str | None, info) -> str | None:
        """Validate that end_date is after start_date."""
        if v and info.data.get('start_date'):
            try:
                start = datetime.fromisoformat(info.data['start_date'].replace('Z', '+00:00'))
                end = datetime.fromisoformat(v.replace('Z', '+00:00'))
                if end <= start:
                    raise ValueError('end_date must be after start_date')
            except ValueError as e:
                if 'end_date must be after start_date' in str(e):
                    raise e
                raise ValueError('Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)')
        return v

    @field_validator('min_rating', 'max_rating')
    @classmethod
    def validate_rating_range(cls, v: int | None, info) -> int | None:
        """Validate rating range consistency."""
        if v is not None:
            if info.field_name == 'max_rating' and info.data.get('min_rating') is not None:
                if v < info.data['min_rating']:
                    raise ValueError('max_rating must be greater than or equal to min_rating')
        return v
