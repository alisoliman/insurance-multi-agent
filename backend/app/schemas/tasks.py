from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class TaskStatus(str, Enum):
    """Task status enum."""

    PENDING = "pending"
    COMPLETED = "completed"


class TaskBase(BaseModel):
    """Base model for tasks."""

    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING


class TaskCreate(TaskBase):
    """Model for creating a task."""

    pass


class TaskUpdate(BaseModel):
    """Model for updating a task."""

    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None


class Task(TaskBase):
    """Model for a task."""

    id: UUID = Field(default_factory=uuid4)

    model_config = ConfigDict(from_attributes=True)


class TaskList(BaseModel):
    """Model for a list of tasks."""

    tasks: List[Task]
    count: int
