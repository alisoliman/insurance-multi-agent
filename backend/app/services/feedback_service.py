"""
Feedback service for managing user feedback collection and analysis.

This service handles the business logic for collecting, storing, and analyzing
user feedback on agent interactions and workflow completions.
"""

import logging
from datetime import datetime, timedelta
from typing import Any
from collections import defaultdict

from app.models.domain import (
    Feedback,
    FeedbackRating,
    FeedbackType,
    FeedbackCategory,
    FeedbackSummary
)
from app.schemas.feedback import (
    ImmediateAgentFeedbackRequest,
    WorkflowCompletionFeedbackRequest,
    FeedbackQueryParams
)

logger = logging.getLogger(__name__)


class FeedbackService:
    """Service for managing feedback collection and analysis."""

    def __init__(self) -> None:
        """Initialize the feedback service."""
        # In-memory storage for demo purposes
        # In production, this would be replaced with database persistence
        self._feedback_storage: dict[str, Feedback] = {}
        logger.info("FeedbackService initialized")

    async def submit_immediate_agent_feedback(
        self,
        request: ImmediateAgentFeedbackRequest,
        client_ip: str | None = None,
        user_agent: str | None = None
    ) -> Feedback:
        """
        Submit immediate agent feedback.

        Args:
            request: The feedback request data
            client_ip: Client IP address for tracking
            user_agent: User agent string for tracking

        Returns:
            The created feedback object

        Raises:
            ValueError: If validation fails
        """
        try:
            # Create feedback object
            feedback = Feedback(
                feedback_type=FeedbackType.IMMEDIATE_AGENT,
                session_id=request.session_id,
                claim_id=request.claim_id,
                agent_name=request.agent_name,
                interaction_id=request.interaction_id,
                overall_rating=request.overall_rating,
                positive_feedback=request.positive_feedback,
                improvement_suggestions=request.improvement_suggestions,
                additional_comments=request.additional_comments,
                user_id=request.user_id,
                ip_address=client_ip,
                user_agent=user_agent,
            )

            # Add ratings
            for rating_request in request.ratings:
                category = FeedbackCategory(rating_request.category)
                feedback.add_rating(
                    category=category,
                    rating=rating_request.rating,
                    comment=rating_request.comment
                )

            # Store feedback
            self._feedback_storage[feedback.feedback_id] = feedback

            logger.info(
                f"Immediate agent feedback submitted: {feedback.feedback_id} "
                f"for agent {request.agent_name} with average rating {feedback.calculate_average_rating():.1f}"
            )

            return feedback

        except Exception as e:
            logger.error(
                f"Error submitting immediate agent feedback: {str(e)}")
            raise ValueError(f"Failed to submit feedback: {str(e)}")

    async def submit_workflow_completion_feedback(
        self,
        request: WorkflowCompletionFeedbackRequest,
        client_ip: str | None = None,
        user_agent: str | None = None
    ) -> Feedback:
        """
        Submit workflow completion feedback.

        Args:
            request: The feedback request data
            client_ip: Client IP address for tracking
            user_agent: User agent string for tracking

        Returns:
            The created feedback object

        Raises:
            ValueError: If validation fails
        """
        try:
            # Create feedback object
            feedback = Feedback(
                feedback_type=FeedbackType.WORKFLOW_COMPLETION,
                session_id=request.session_id,
                claim_id=request.claim_id,
                overall_rating=request.overall_rating,
                positive_feedback=request.positive_feedback,
                improvement_suggestions=request.improvement_suggestions,
                additional_comments=request.additional_comments,
                user_id=request.user_id,
                ip_address=client_ip,
                user_agent=user_agent,
            )

            # Add workflow-specific metadata
            workflow_metadata = {}
            if request.workflow_type:
                workflow_metadata["workflow_type"] = request.workflow_type
            if request.completion_time_seconds is not None:
                workflow_metadata["completion_time_seconds"] = request.completion_time_seconds
            if request.steps_completed is not None:
                workflow_metadata["steps_completed"] = request.steps_completed
            if request.encountered_issues is not None:
                workflow_metadata["encountered_issues"] = request.encountered_issues

            # Store metadata in agent_name field for workflow feedback
            # In a real implementation, this would be stored in a separate metadata field
            if workflow_metadata:
                feedback.agent_name = f"workflow_{request.workflow_type or 'unknown'}"

            # Add ratings
            for rating_request in request.ratings:
                category = FeedbackCategory(rating_request.category)
                feedback.add_rating(
                    category=category,
                    rating=rating_request.rating,
                    comment=rating_request.comment
                )

            # Store feedback
            self._feedback_storage[feedback.feedback_id] = feedback

            logger.info(
                f"Workflow completion feedback submitted: {feedback.feedback_id} "
                f"for workflow {request.workflow_type} with average rating {feedback.calculate_average_rating():.1f}"
            )

            return feedback

        except Exception as e:
            logger.error(
                f"Error submitting workflow completion feedback: {str(e)}")
            raise ValueError(f"Failed to submit feedback: {str(e)}")

    async def get_feedback_by_id(self, feedback_id: str) -> Feedback | None:
        """
        Get feedback by ID.

        Args:
            feedback_id: The feedback ID to retrieve

        Returns:
            The feedback object if found, None otherwise
        """
        return self._feedback_storage.get(feedback_id)

    async def get_feedback_list(self, params: FeedbackQueryParams) -> tuple[list[Feedback], int]:
        """
        Get filtered list of feedback with pagination.

        Args:
            params: Query parameters for filtering and pagination

        Returns:
            Tuple of (feedback_list, total_count)
        """
        try:
            # Start with all feedback
            filtered_feedback = list(self._feedback_storage.values())

            # Apply filters
            if params.feedback_type:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.feedback_type.value == params.feedback_type
                ]

            if params.agent_name:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.agent_name and params.agent_name.lower() in f.agent_name.lower()
                ]

            if params.claim_id:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.claim_id == params.claim_id
                ]

            if params.session_id:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.session_id == params.session_id
                ]

            if params.user_id:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.user_id == params.user_id
                ]

            # Date filtering
            if params.start_date:
                start_dt = datetime.fromisoformat(
                    params.start_date.replace('Z', '+00:00'))
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.submitted_at >= start_dt
                ]

            if params.end_date:
                end_dt = datetime.fromisoformat(
                    params.end_date.replace('Z', '+00:00'))
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.submitted_at <= end_dt
                ]

            # Rating filtering
            if params.min_rating is not None:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.calculate_average_rating() >= params.min_rating
                ]

            if params.max_rating is not None:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.calculate_average_rating() <= params.max_rating
                ]

            # Boolean filters
            if params.is_processed is not None:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.is_processed == params.is_processed
                ]

            if params.has_text_feedback is not None:
                filtered_feedback = [
                    f for f in filtered_feedback
                    if f.has_text_feedback == params.has_text_feedback
                ]

            # Sort by submission date (newest first)
            filtered_feedback.sort(key=lambda f: f.submitted_at, reverse=True)

            total_count = len(filtered_feedback)

            # Apply pagination
            start_idx = (params.page - 1) * params.page_size
            end_idx = start_idx + params.page_size
            paginated_feedback = filtered_feedback[start_idx:end_idx]

            logger.info(
                f"Retrieved {len(paginated_feedback)} feedback items (page {params.page}, total {total_count})")

            return paginated_feedback, total_count

        except Exception as e:
            logger.error(f"Error retrieving feedback list: {str(e)}")
            raise ValueError(f"Failed to retrieve feedback: {str(e)}")

    async def get_feedback_summary(self) -> FeedbackSummary:
        """
        Generate feedback summary statistics.

        Returns:
            FeedbackSummary object with aggregated statistics
        """
        try:
            all_feedback = list(self._feedback_storage.values())

            if not all_feedback:
                return FeedbackSummary()

            # Basic counts
            total_count = len(all_feedback)
            processed_count = sum(1 for f in all_feedback if f.is_processed)

            # Recent feedback (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_count = sum(
                1 for f in all_feedback if f.submitted_at >= thirty_days_ago)

            # Average overall rating
            ratings_with_overall = [
                f for f in all_feedback if f.overall_rating is not None]
            avg_overall_rating = (
                sum(f.overall_rating for f in ratings_with_overall) /
                len(ratings_with_overall)
                if ratings_with_overall else 0.0
            )

            # Category averages
            category_ratings: dict[str, list[int]] = defaultdict(list)
            for feedback in all_feedback:
                for rating in feedback.ratings:
                    category_ratings[rating.category.value].append(
                        rating.rating)

            category_averages = {
                category: sum(ratings) / len(ratings)
                for category, ratings in category_ratings.items()
            }

            # Feedback by type
            feedback_by_type: dict[str, int] = defaultdict(int)
            for feedback in all_feedback:
                feedback_by_type[feedback.feedback_type.value] += 1

            # Feedback by agent
            feedback_by_agent: dict[str, int] = defaultdict(int)
            for feedback in all_feedback:
                if feedback.agent_name:
                    feedback_by_agent[feedback.agent_name] += 1

            summary = FeedbackSummary(
                total_feedback_count=total_count,
                average_overall_rating=avg_overall_rating,
                category_averages=category_averages,
                feedback_by_type=dict(feedback_by_type),
                feedback_by_agent=dict(feedback_by_agent),
                recent_feedback_count=recent_count,
                processed_feedback_count=processed_count,
            )

            logger.info(
                f"Generated feedback summary: {total_count} total, {avg_overall_rating:.1f} avg rating")

            return summary

        except Exception as e:
            logger.error(f"Error generating feedback summary: {str(e)}")
            raise ValueError(f"Failed to generate summary: {str(e)}")

    async def mark_feedback_processed(self, feedback_id: str) -> bool:
        """
        Mark feedback as processed.

        Args:
            feedback_id: The feedback ID to mark as processed

        Returns:
            True if successful, False if feedback not found
        """
        try:
            feedback = self._feedback_storage.get(feedback_id)
            if not feedback:
                return False

            feedback.mark_processed()
            logger.info(f"Marked feedback {feedback_id} as processed")
            return True

        except Exception as e:
            logger.error(f"Error marking feedback as processed: {str(e)}")
            return False

    async def delete_feedback(self, feedback_id: str) -> bool:
        """
        Delete feedback by ID.

        Args:
            feedback_id: The feedback ID to delete

        Returns:
            True if successful, False if feedback not found
        """
        try:
            if feedback_id in self._feedback_storage:
                del self._feedback_storage[feedback_id]
                logger.info(f"Deleted feedback {feedback_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"Error deleting feedback: {str(e)}")
            return False

    def get_storage_stats(self) -> dict[str, Any]:
        """
        Get storage statistics for monitoring.

        Returns:
            Dictionary with storage statistics
        """
        return {
            "total_feedback_count": len(self._feedback_storage),
            "storage_type": "in_memory",
            # First 10 IDs for debugging
            "feedback_ids": list(self._feedback_storage.keys())[:10],
        }
