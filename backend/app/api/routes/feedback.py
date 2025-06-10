"""
Feedback API routes for collecting and managing user feedback.

This module provides endpoints for submitting feedback on agent interactions
and workflow completions, as well as retrieving and analyzing feedback data.
"""

import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import JSONResponse

from app.schemas.feedback import (
    ImmediateAgentFeedbackRequest,
    WorkflowCompletionFeedbackRequest,
    FeedbackSubmissionResponse,
    FeedbackResponse,
    FeedbackListResponse,
    FeedbackSummaryResponse,
    FeedbackQueryParams,
    FeedbackRatingResponse,
)
from app.services.feedback_service import FeedbackService
from app.core.exceptions import safe_serialize_response

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize feedback service
feedback_service = FeedbackService()


def get_client_info(request: Request) -> tuple[str | None, str | None]:
    """
    Extract client IP and user agent from request.

    Args:
        request: FastAPI request object

    Returns:
        Tuple of (client_ip, user_agent)
    """
    # Get client IP (handle proxy headers)
    client_ip = (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or
        request.headers.get("X-Real-IP") or
        request.client.host if request.client else None
    )

    # Get user agent
    user_agent = request.headers.get("User-Agent")

    return client_ip, user_agent


@router.post("/immediate-agent", response_model=FeedbackSubmissionResponse)
async def submit_immediate_agent_feedback(
    request: ImmediateAgentFeedbackRequest,
    http_request: Request
) -> dict[str, Any]:
    """
    Submit immediate feedback for an agent interaction.

    This endpoint allows users to provide real-time feedback on their
    interaction with an AI agent, including ratings and comments.

    Args:
        request: The feedback data including ratings and comments
        http_request: HTTP request for extracting client information

    Returns:
        Success response with feedback ID

    Raises:
        HTTPException: If submission fails
    """
    try:
        # Extract client information for tracking
        client_ip, user_agent = get_client_info(http_request)

        # Submit feedback through service
        feedback = await feedback_service.submit_immediate_agent_feedback(
            request=request,
            client_ip=client_ip,
            user_agent=user_agent
        )

        # Return success response
        result = {
            "success": True,
            "feedback_id": feedback.feedback_id,
            "message": f"Immediate agent feedback submitted successfully with average rating {feedback.calculate_average_rating():.1f}/5",
            "error": None
        }

        logger.info(
            f"Immediate agent feedback submitted: {feedback.feedback_id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error in immediate agent feedback: {str(e)}")
        error_result = {
            "success": False,
            "feedback_id": None,
            "message": "Failed to submit feedback",
            "error": str(e)
        }
        return error_result

    except Exception as e:
        logger.error(f"Unexpected error in immediate agent feedback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while submitting feedback"
        )


@router.post("/workflow-completion", response_model=FeedbackSubmissionResponse)
async def submit_workflow_completion_feedback(
    request: WorkflowCompletionFeedbackRequest,
    http_request: Request
) -> dict[str, Any]:
    """
    Submit feedback for a completed workflow.

    This endpoint allows users to provide feedback after completing
    a workflow or process, including performance metrics and satisfaction ratings.

    Args:
        request: The feedback data including ratings, comments, and workflow metrics
        http_request: HTTP request for extracting client information

    Returns:
        Success response with feedback ID

    Raises:
        HTTPException: If submission fails
    """
    try:
        # Extract client information for tracking
        client_ip, user_agent = get_client_info(http_request)

        # Submit feedback through service
        feedback = await feedback_service.submit_workflow_completion_feedback(
            request=request,
            client_ip=client_ip,
            user_agent=user_agent
        )

        # Return success response
        result = {
            "success": True,
            "feedback_id": feedback.feedback_id,
            "message": f"Workflow completion feedback submitted successfully with average rating {feedback.calculate_average_rating():.1f}/5",
            "error": None
        }

        logger.info(
            f"Workflow completion feedback submitted: {feedback.feedback_id}")
        return result

    except ValueError as e:
        logger.error(
            f"Validation error in workflow completion feedback: {str(e)}")
        error_result = {
            "success": False,
            "feedback_id": None,
            "message": "Failed to submit feedback",
            "error": str(e)
        }
        return error_result

    except Exception as e:
        logger.error(
            f"Unexpected error in workflow completion feedback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while submitting feedback"
        )


@router.get("/list", response_model=FeedbackListResponse)
async def get_feedback_list(
    feedback_type: str | None = Query(
        None, description="Filter by feedback type"),
    agent_name: str | None = Query(None, description="Filter by agent name"),
    claim_id: str | None = Query(None, description="Filter by claim ID"),
    session_id: str | None = Query(None, description="Filter by session ID"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    start_date: str | None = Query(
        None, description="Filter by start date (ISO format)"),
    end_date: str | None = Query(
        None, description="Filter by end date (ISO format)"),
    min_rating: int | None = Query(
        None, ge=1, le=5, description="Filter by minimum rating"),
    max_rating: int | None = Query(
        None, ge=1, le=5, description="Filter by maximum rating"),
    is_processed: bool | None = Query(
        None, description="Filter by processing status"),
    has_text_feedback: bool | None = Query(
        None, description="Filter by presence of text feedback"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
) -> dict[str, Any]:
    """
    Get a filtered and paginated list of feedback.

    This endpoint provides comprehensive filtering and pagination capabilities
    for retrieving feedback data with various search criteria.

    Returns:
        Paginated list of feedback with metadata

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        # Create query parameters object
        params = FeedbackQueryParams(
            feedback_type=feedback_type,
            agent_name=agent_name,
            claim_id=claim_id,
            session_id=session_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            min_rating=min_rating,
            max_rating=max_rating,
            is_processed=is_processed,
            has_text_feedback=has_text_feedback,
            page=page,
            page_size=page_size
        )

        # Get feedback list from service
        feedback_list, total_count = await feedback_service.get_feedback_list(params)

        # Convert to response format
        feedback_responses = []
        for feedback in feedback_list:
            feedback_dict = feedback.to_dict()

            # Convert ratings to response format
            rating_responses = [
                FeedbackRatingResponse(
                    category=rating["category"],
                    rating=rating["rating"],
                    comment=rating["comment"]
                )
                for rating in feedback_dict["ratings"]
            ]

            feedback_response = FeedbackResponse(
                feedback_id=feedback_dict["feedback_id"],
                feedback_type=feedback_dict["feedback_type"],
                session_id=feedback_dict["session_id"],
                claim_id=feedback_dict["claim_id"],
                agent_name=feedback_dict["agent_name"],
                interaction_id=feedback_dict["interaction_id"],
                ratings=rating_responses,
                overall_rating=feedback_dict["overall_rating"],
                average_rating=feedback_dict["average_rating"],
                positive_feedback=feedback_dict["positive_feedback"],
                improvement_suggestions=feedback_dict["improvement_suggestions"],
                additional_comments=feedback_dict["additional_comments"],
                user_id=feedback_dict["user_id"],
                submitted_at=feedback_dict["submitted_at"],
                is_processed=feedback_dict["is_processed"],
                processed_at=feedback_dict["processed_at"],
                has_text_feedback=feedback_dict["has_text_feedback"]
            )
            feedback_responses.append(feedback_response)

        # Return response
        result = {
            "success": True,
            "feedback": feedback_responses,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "error": None
        }

        logger.info(
            f"Retrieved {len(feedback_responses)} feedback items (page {page})")
        return result

    except ValueError as e:
        logger.error(f"Validation error in feedback list: {str(e)}")
        error_result = {
            "success": False,
            "feedback": [],
            "total_count": 0,
            "page": page,
            "page_size": page_size,
            "error": str(e)
        }
        return error_result

    except Exception as e:
        logger.error(f"Unexpected error in feedback list: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving feedback"
        )


@router.get("/summary", response_model=FeedbackSummaryResponse)
async def get_feedback_summary() -> dict[str, Any]:
    """
    Get feedback summary statistics.

    This endpoint provides aggregated statistics about all feedback,
    including average ratings, category breakdowns, and trends.

    Returns:
        Summary statistics for all feedback

    Raises:
        HTTPException: If summary generation fails
    """
    try:
        # Get summary from service
        summary = await feedback_service.get_feedback_summary()

        # Return response
        result = {
            "success": True,
            "summary": summary.to_dict(),
            "error": None
        }

        logger.info(
            f"Generated feedback summary with {summary.total_feedback_count} total feedback items")
        return result

    except Exception as e:
        logger.error(f"Unexpected error in feedback summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating summary"
        )


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback_by_id(feedback_id: str) -> dict[str, Any]:
    """
    Get specific feedback by ID.

    Args:
        feedback_id: The unique identifier of the feedback to retrieve

    Returns:
        The feedback data

    Raises:
        HTTPException: If feedback not found or retrieval fails
    """
    try:
        # Get feedback from service
        feedback = await feedback_service.get_feedback_by_id(feedback_id)

        if not feedback:
            raise HTTPException(
                status_code=404,
                detail=f"Feedback with ID {feedback_id} not found"
            )

        # Convert to response format
        feedback_dict = feedback.to_dict()

        # Convert ratings to response format
        rating_responses = [
            FeedbackRatingResponse(
                category=rating["category"],
                rating=rating["rating"],
                comment=rating["comment"]
            )
            for rating in feedback_dict["ratings"]
        ]

        result = FeedbackResponse(
            feedback_id=feedback_dict["feedback_id"],
            feedback_type=feedback_dict["feedback_type"],
            session_id=feedback_dict["session_id"],
            claim_id=feedback_dict["claim_id"],
            agent_name=feedback_dict["agent_name"],
            interaction_id=feedback_dict["interaction_id"],
            ratings=rating_responses,
            overall_rating=feedback_dict["overall_rating"],
            average_rating=feedback_dict["average_rating"],
            positive_feedback=feedback_dict["positive_feedback"],
            improvement_suggestions=feedback_dict["improvement_suggestions"],
            additional_comments=feedback_dict["additional_comments"],
            user_id=feedback_dict["user_id"],
            submitted_at=feedback_dict["submitted_at"],
            is_processed=feedback_dict["is_processed"],
            processed_at=feedback_dict["processed_at"],
            has_text_feedback=feedback_dict["has_text_feedback"]
        )

        logger.info(f"Retrieved feedback: {feedback_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error retrieving feedback {feedback_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving feedback"
        )


@router.patch("/{feedback_id}/processed")
async def mark_feedback_processed(feedback_id: str) -> dict[str, Any]:
    """
    Mark feedback as processed.

    This endpoint allows administrators to mark feedback as processed
    after it has been reviewed and acted upon.

    Args:
        feedback_id: The unique identifier of the feedback to mark as processed

    Returns:
        Success confirmation

    Raises:
        HTTPException: If feedback not found or update fails
    """
    try:
        # Mark as processed through service
        success = await feedback_service.mark_feedback_processed(feedback_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Feedback with ID {feedback_id} not found"
            )

        result = {
            "success": True,
            "message": f"Feedback {feedback_id} marked as processed",
            "feedback_id": feedback_id
        }

        logger.info(f"Marked feedback as processed: {feedback_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error marking feedback as processed {feedback_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while updating feedback"
        )


@router.delete("/{feedback_id}")
async def delete_feedback(feedback_id: str) -> dict[str, Any]:
    """
    Delete feedback by ID.

    This endpoint allows administrators to permanently delete feedback.
    Use with caution as this operation cannot be undone.

    Args:
        feedback_id: The unique identifier of the feedback to delete

    Returns:
        Success confirmation

    Raises:
        HTTPException: If feedback not found or deletion fails
    """
    try:
        # Delete through service
        success = await feedback_service.delete_feedback(feedback_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Feedback with ID {feedback_id} not found"
            )

        result = {
            "success": True,
            "message": f"Feedback {feedback_id} deleted successfully",
            "feedback_id": feedback_id
        }

        logger.info(f"Deleted feedback: {feedback_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error deleting feedback {feedback_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while deleting feedback"
        )


@router.get("/admin/storage-stats")
async def get_storage_stats() -> dict[str, Any]:
    """
    Get storage statistics for monitoring and debugging.

    This endpoint provides information about the current state of
    feedback storage for administrative purposes.

    Returns:
        Storage statistics and metadata
    """
    try:
        stats = feedback_service.get_storage_stats()

        result = {
            "success": True,
            "stats": stats,
            # Would use datetime.now() in real implementation
            "timestamp": "2024-01-01T00:00:00Z"
        }

        logger.info("Retrieved feedback storage statistics")
        return result

    except Exception as e:
        logger.error(f"Error retrieving storage stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving statistics"
        )
