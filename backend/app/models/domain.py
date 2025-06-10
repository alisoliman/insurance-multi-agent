"""
Domain models for core business entities.

This module contains domain models that represent the core business concepts
of the insurance claims processing system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
import uuid


class ClaimStatus(Enum):
    """Enumeration of claim statuses."""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_INFORMATION = "pending_information"
    CLOSED = "closed"


class PolicyType(Enum):
    """Enumeration of policy types."""
    AUTO = "auto"
    HOME = "home"
    HEALTH = "health"
    LIFE = "life"
    BUSINESS = "business"
    TRAVEL = "travel"


class DocumentType(Enum):
    """Enumeration of document types."""
    INCIDENT_REPORT = "incident_report"
    POLICE_REPORT = "police_report"
    MEDICAL_REPORT = "medical_report"
    REPAIR_ESTIMATE = "repair_estimate"
    PHOTOS = "photos"
    RECEIPTS = "receipts"
    WITNESS_STATEMENT = "witness_statement"
    OTHER = "other"


class FeedbackType(Enum):
    """Enumeration of feedback types."""
    IMMEDIATE_AGENT = "immediate_agent"
    WORKFLOW_COMPLETION = "workflow_completion"


class FeedbackCategory(Enum):
    """Enumeration of feedback categories."""
    ACCURACY = "accuracy"
    SPEED = "speed"
    CLARITY = "clarity"
    HELPFULNESS = "helpfulness"
    OVERALL_EXPERIENCE = "overall_experience"


@dataclass
class Customer:
    """Customer domain model."""
    customer_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str | None = None
    date_of_birth: datetime | None = None
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def full_name(self) -> str:
        """Get the customer's full name."""
        return f"{self.first_name} {self.last_name}"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "customer_id": self.customer_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class Policy:
    """Insurance policy domain model."""
    policy_number: str
    policy_type: PolicyType
    customer_id: str
    coverage_amount: float
    deductible: float
    premium: float
    effective_date: datetime
    expiration_date: datetime
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def is_expired(self) -> bool:
        """Check if the policy is expired."""
        return datetime.now() > self.expiration_date

    @property
    def days_until_expiration(self) -> int:
        """Get days until policy expiration."""
        if self.is_expired:
            return 0
        delta = self.expiration_date - datetime.now()
        return delta.days

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "policy_number": self.policy_number,
            "policy_type": self.policy_type.value,
            "customer_id": self.customer_id,
            "coverage_amount": self.coverage_amount,
            "deductible": self.deductible,
            "premium": self.premium,
            "effective_date": self.effective_date.isoformat(),
            "expiration_date": self.expiration_date.isoformat(),
            "is_active": self.is_active,
            "is_expired": self.is_expired,
            "days_until_expiration": self.days_until_expiration,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class Document:
    """Document domain model."""
    document_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    document_type: DocumentType = DocumentType.OTHER
    filename: str = ""
    file_path: str | None = None
    file_size: int = 0
    mime_type: str | None = None
    uploaded_at: datetime = field(default_factory=datetime.now)
    uploaded_by: str | None = None
    description: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "document_id": self.document_id,
            "document_type": self.document_type.value,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "uploaded_at": self.uploaded_at.isoformat(),
            "uploaded_by": self.uploaded_by,
            "description": self.description,
        }


@dataclass
class Claim:
    """Insurance claim domain model."""
    claim_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    policy_number: str = ""
    customer_id: str = ""
    incident_date: datetime | None = None
    reported_date: datetime = field(default_factory=datetime.now)
    description: str = ""
    claimed_amount: float = 0.0
    approved_amount: float | None = None
    status: ClaimStatus = ClaimStatus.SUBMITTED
    documents: list[Document] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    assigned_adjuster: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    @property
    def days_since_reported(self) -> int:
        """Get days since the claim was reported."""
        delta = datetime.now() - self.reported_date
        return delta.days

    @property
    def is_recent(self) -> bool:
        """Check if the claim was reported recently (within 30 days)."""
        return self.days_since_reported <= 30

    @property
    def has_documents(self) -> bool:
        """Check if the claim has any documents."""
        return len(self.documents) > 0

    def add_document(self, document: Document) -> None:
        """Add a document to the claim."""
        self.documents.append(document)
        self.updated_at = datetime.now()

    def add_note(self, note: str) -> None:
        """Add a note to the claim."""
        timestamp = datetime.now().isoformat()
        self.notes.append(f"[{timestamp}] {note}")
        self.updated_at = datetime.now()

    def update_status(self, new_status: ClaimStatus, note: str | None = None) -> None:
        """Update the claim status with optional note."""
        old_status = self.status
        self.status = new_status
        self.updated_at = datetime.now()

        status_note = f"Status changed from {old_status.value} to {new_status.value}"
        if note:
            status_note += f": {note}"
        self.add_note(status_note)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "claim_id": self.claim_id,
            "policy_number": self.policy_number,
            "customer_id": self.customer_id,
            "incident_date": self.incident_date.isoformat() if self.incident_date else None,
            "reported_date": self.reported_date.isoformat(),
            "description": self.description,
            "claimed_amount": self.claimed_amount,
            "approved_amount": self.approved_amount,
            "status": self.status.value,
            "documents": [doc.to_dict() for doc in self.documents],
            "notes": self.notes,
            "assigned_adjuster": self.assigned_adjuster,
            "days_since_reported": self.days_since_reported,
            "is_recent": self.is_recent,
            "has_documents": self.has_documents,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


@dataclass
class AgentActivity:
    """Agent activity tracking domain model."""
    activity_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    agent_name: str = ""
    activity_type: str = ""
    claim_id: str | None = None
    description: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    duration_seconds: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "activity_id": self.activity_id,
            "agent_name": self.agent_name,
            "activity_type": self.activity_type,
            "claim_id": self.claim_id,
            "description": self.description,
            "timestamp": self.timestamp.isoformat(),
            "duration_seconds": self.duration_seconds,
            "metadata": self.metadata,
        }


@dataclass
class FeedbackRating:
    """Individual feedback rating for a specific category."""
    category: FeedbackCategory
    rating: int  # 1-5 scale
    comment: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "category": self.category.value,
            "rating": self.rating,
            "comment": self.comment,
        }


@dataclass
class Feedback:
    """Feedback domain model for collecting user feedback on agent interactions."""
    feedback_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    feedback_type: FeedbackType = FeedbackType.IMMEDIATE_AGENT
    session_id: str | None = None
    claim_id: str | None = None
    agent_name: str | None = None
    interaction_id: str | None = None

    # Rating data
    ratings: list[FeedbackRating] = field(default_factory=list)
    overall_rating: int | None = None  # 1-5 scale

    # Text feedback
    positive_feedback: str | None = None
    improvement_suggestions: str | None = None
    additional_comments: str | None = None

    # Metadata
    user_id: str | None = None
    submitted_at: datetime = field(default_factory=datetime.now)
    ip_address: str | None = None
    user_agent: str | None = None

    # Processing flags
    is_processed: bool = False
    processed_at: datetime | None = None

    def add_rating(self, category: FeedbackCategory, rating: int, comment: str | None = None) -> None:
        """Add a rating for a specific category."""
        # Validate rating range
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")

        # Remove existing rating for this category if it exists
        self.ratings = [r for r in self.ratings if r.category != category]

        # Add new rating
        feedback_rating = FeedbackRating(
            category=category, rating=rating, comment=comment)
        self.ratings.append(feedback_rating)

    def get_rating(self, category: FeedbackCategory) -> FeedbackRating | None:
        """Get rating for a specific category."""
        for rating in self.ratings:
            if rating.category == category:
                return rating
        return None

    def calculate_average_rating(self) -> float:
        """Calculate average rating across all categories."""
        if not self.ratings:
            return 0.0
        return sum(rating.rating for rating in self.ratings) / len(self.ratings)

    @property
    def has_text_feedback(self) -> bool:
        """Check if feedback contains any text comments."""
        return bool(
            self.positive_feedback or
            self.improvement_suggestions or
            self.additional_comments or
            any(rating.comment for rating in self.ratings)
        )

    def mark_processed(self) -> None:
        """Mark feedback as processed."""
        self.is_processed = True
        self.processed_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "feedback_id": self.feedback_id,
            "feedback_type": self.feedback_type.value,
            "session_id": self.session_id,
            "claim_id": self.claim_id,
            "agent_name": self.agent_name,
            "interaction_id": self.interaction_id,
            "ratings": [rating.to_dict() for rating in self.ratings],
            "overall_rating": self.overall_rating,
            "positive_feedback": self.positive_feedback,
            "improvement_suggestions": self.improvement_suggestions,
            "additional_comments": self.additional_comments,
            "user_id": self.user_id,
            "submitted_at": self.submitted_at.isoformat(),
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "is_processed": self.is_processed,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "average_rating": self.calculate_average_rating(),
            "has_text_feedback": self.has_text_feedback,
        }


@dataclass
class FeedbackSummary:
    """Summary statistics for feedback analysis."""
    total_feedback_count: int = 0
    average_overall_rating: float = 0.0
    category_averages: dict[str, float] = field(default_factory=dict)
    feedback_by_type: dict[str, int] = field(default_factory=dict)
    feedback_by_agent: dict[str, int] = field(default_factory=dict)
    recent_feedback_count: int = 0  # Last 30 days
    processed_feedback_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "total_feedback_count": self.total_feedback_count,
            "average_overall_rating": self.average_overall_rating,
            "category_averages": self.category_averages,
            "feedback_by_type": self.feedback_by_type,
            "feedback_by_agent": self.feedback_by_agent,
            "recent_feedback_count": self.recent_feedback_count,
            "processed_feedback_count": self.processed_feedback_count,
        }
