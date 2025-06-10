from fastapi import HTTPException, status
import logging
from typing import Any

logger = logging.getLogger(__name__)


class NotFoundError(HTTPException):
    """Exception raised when a resource is not found."""

    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestError(HTTPException):
    """Exception raised when the request is invalid."""

    def __init__(self, detail: str = "Bad request") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ValidationError(HTTPException):
    """Exception raised when validation fails."""

    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail
        )

# Insurance-specific exceptions


class ClaimProcessingError(HTTPException):
    """Exception raised when claim processing fails."""

    def __init__(self, detail: str = "Claim processing failed", claim_id: str | None = None) -> None:
        self.claim_id = claim_id
        if claim_id:
            detail = f"Claim {claim_id}: {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class AgentInitializationError(HTTPException):
    """Exception raised when agent initialization fails."""

    def __init__(self, agent_name: str, detail: str = "Agent initialization failed") -> None:
        self.agent_name = agent_name
        detail = f"Agent '{agent_name}': {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class AssessmentError(HTTPException):
    """Exception raised when claim assessment fails."""

    def __init__(self, detail: str = "Assessment failed", claim_id: str | None = None) -> None:
        self.claim_id = claim_id
        if claim_id:
            detail = f"Assessment for claim {claim_id}: {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class CommunicationError(HTTPException):
    """Exception raised when communication generation fails."""

    def __init__(self, detail: str = "Communication generation failed", communication_type: str | None = None) -> None:
        self.communication_type = communication_type
        if communication_type:
            detail = f"Communication ({communication_type}): {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class ImageProcessingError(HTTPException):
    """Exception raised when image processing fails."""

    def __init__(self, detail: str = "Image processing failed", filename: str | None = None) -> None:
        self.filename = filename
        if filename:
            detail = f"Image processing for {filename}: {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class SerializationError(HTTPException):
    """Exception raised when data serialization fails."""

    def __init__(self, detail: str = "Data serialization failed", data_type: str | None = None) -> None:
        self.data_type = data_type
        if data_type:
            detail = f"Serialization failed for {data_type}: {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class WorkflowError(HTTPException):
    """Exception raised when workflow processing fails."""

    def __init__(self, detail: str = "Workflow processing failed", workflow_id: str | None = None) -> None:
        self.workflow_id = workflow_id
        if workflow_id:
            detail = f"Workflow {workflow_id}: {detail}"
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

# Error handling utilities


def handle_agent_error(error: Exception, context: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Handle agent-related errors with appropriate logging and response formatting.

    This centralized error handler ensures consistent error responses across
    all agent operations while providing detailed context for debugging.
    It categorizes errors and applies appropriate HTTP status codes and
    response formats for different error types.
    """
    # Determine error type and appropriate response
    # This categorization helps with error handling and user experience
    if isinstance(error, AgentInitializationError):
        # Agent initialization failures are service unavailable errors
        # These typically indicate configuration or dependency issues
        return {
            "success": False,
            "error_type": "agent_initialization",
            "error": str(error),
            "context": context or {},
            "retry_recommended": True,  # May be transient configuration issue
        }
    elif isinstance(error, AssessmentError):
        # Assessment failures indicate processing issues with specific claims
        # These may be due to data quality or business logic constraints
        return {
            "success": False,
            "error_type": "assessment_failed",
            "error": str(error),
            "context": context or {},
            "retry_recommended": False,  # Likely requires data correction
        }
    elif isinstance(error, CommunicationError):
        # Communication generation failures may be due to LLM issues or data problems
        return {
            "success": False,
            "error_type": "communication_failed",
            "error": str(error),
            "context": context or {},
            "retry_recommended": True,  # May be transient LLM issue
        }
    elif isinstance(error, SerializationError):
        # Serialization errors indicate data structure issues
        # These typically require code fixes rather than retries
        return {
            "success": False,
            "error_type": "serialization_failed",
            "error": str(error),
            "context": context or {},
            "retry_recommended": False,  # Requires code/data structure fix
        }
    else:
        # Generic error handling for unexpected exceptions
        # Provides safe fallback while preserving error information
        return {
            "success": False,
            "error_type": "unexpected_error",
            "error": str(error),
            "context": context or {},
            "retry_recommended": False,  # Unknown error, don't encourage retries
        }


def safe_serialize_response(data: Any) -> dict[str, Any]:
    """
    Safely serialize response data with fallback for non-serializable objects.

    This function prevents serialization errors from breaking API responses
    by providing intelligent fallbacks for complex objects. It's particularly
    important for agent responses that may contain complex data structures.
    """
    try:
        # Attempt direct serialization for simple data types
        # This covers most common cases efficiently
        if isinstance(data, (dict, list, str, int, float, bool, type(None))):
            return {"success": True, "data": data}

        # Handle dataclass objects by converting to dictionary
        # Many of our response objects are dataclasses
        if hasattr(data, '__dataclass_fields__'):
            try:
                from dataclasses import asdict
                return {"success": True, "data": asdict(data)}
            except Exception:
                # Fallback if asdict fails (e.g., non-serializable fields)
                pass

        # Handle objects with to_dict method (common pattern in our codebase)
        if hasattr(data, 'to_dict') and callable(getattr(data, 'to_dict')):
            try:
                return {"success": True, "data": data.to_dict()}
            except Exception:
                # Fallback if to_dict fails
                pass

        # Last resort: convert to string representation
        # This ensures we always return something, even if not ideal
        return {
            "success": True,
            "data": str(data),
            "serialization_note": "Object converted to string representation"
        }

    except Exception as e:
        # Ultimate fallback for any serialization failure
        # This should never happen but provides safety net
        return {
            "success": False,
            "error": f"Serialization failed: {str(e)}",
            "data_type": str(type(data)),
            "fallback_data": "Unable to serialize response"
        }
