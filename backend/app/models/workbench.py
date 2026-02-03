"""
Pydantic models for Claims Workbench (Feature 005).
Matches schema in backend/app/db/database.py and specs/005-claims-workbench/data-model.md
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ClaimStatus(str, Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_INFO = "awaiting_info"
    APPROVED = "approved"
    DENIED = "denied"

class ClaimPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class DecisionType(str, Enum):
    APPROVED = "approved"
    DENIED = "denied"
    REQUEST_INFO = "request_info"

class AssessmentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class AuditAction(str, Enum):
    CREATED = "created"
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    STATUS_CHANGED = "status_changed"
    AI_PROCESSING_STARTED = "ai_processing_started"
    AI_PROCESSING_COMPLETED = "ai_processing_completed"
    DECISION_RECORDED = "decision_recorded"
    PRIORITY_CHANGED = "priority_changed"

# ---------------------------------------------------------------------------
# Handler Models
# ---------------------------------------------------------------------------

class HandlerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    is_active: bool = True

class HandlerCreate(HandlerBase):
    id: str

class Handler(HandlerBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Claim Models
# ---------------------------------------------------------------------------

class ClaimBase(BaseModel):
    claimant_name: str
    claimant_id: Optional[str] = None  # Optional for demo/seed data, generated if not provided
    policy_number: str
    claim_type: str
    description: str
    incident_date: datetime
    estimated_damage: Optional[float] = None
    location: Optional[str] = None
    priority: ClaimPriority = ClaimPriority.MEDIUM

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(BaseModel):
    status: Optional[ClaimStatus] = None
    priority: Optional[ClaimPriority] = None
    assigned_handler_id: Optional[str] = None
    description: Optional[str] = None
    estimated_damage: Optional[float] = None

class Claim(ClaimBase):
    id: str
    status: ClaimStatus = ClaimStatus.NEW
    assigned_handler_id: Optional[str] = None
    latest_assessment_status: Optional[AssessmentStatus] = None
    ai_recommendation: Optional[str] = None
    ai_risk_level: Optional[str] = None
    ai_risk_score: Optional[int] = None
    version: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# AI Assessment Models
# ---------------------------------------------------------------------------

class AIAssessmentBase(BaseModel):
    claim_id: str
    status: AssessmentStatus = AssessmentStatus.PENDING

class AIAssessmentCreate(AIAssessmentBase):
    pass

class AIAssessment(AIAssessmentBase):
    id: str
    agent_outputs: Optional[Dict[str, Any]] = None
    final_recommendation: Optional[str] = None
    confidence_scores: Optional[Dict[str, float]] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Decision Models
# ---------------------------------------------------------------------------

class ClaimDecisionBase(BaseModel):
    claim_id: str
    decision_type: DecisionType
    notes: Optional[str] = None
    ai_assessment_id: Optional[str] = None

class ClaimDecisionCreate(ClaimDecisionBase):
    handler_id: str

class ClaimDecision(ClaimDecisionBase):
    id: str
    handler_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Audit Log Models
# ---------------------------------------------------------------------------

class AuditLogCreate(BaseModel):
    claim_id: str
    handler_id: Optional[str] = None
    action: AuditAction
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None

class ClaimAuditLog(BaseModel):
    id: str
    claim_id: str
    handler_id: Optional[str] = None
    action: AuditAction
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True
