from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.exceptions import NotFoundError
from app.schemas.tasks import Task, TaskCreate, TaskList, TaskStatus, TaskUpdate

router = APIRouter()

# In-memory storage for tasks
tasks_db: List[Task] = []


@router.get("/", response_model=TaskList)
async def list_tasks(
    skip: int = 0,
    limit: int = 10,
    status: Optional[TaskStatus] = None,
) -> TaskList:
    """
    List all tasks with optional filtering by status.
    """
    filtered_tasks = tasks_db
    
    if status:
        filtered_tasks = [task for task in tasks_db if task.status == status]
    
    paginated_tasks = filtered_tasks[skip : skip + limit]
    
    return TaskList(tasks=paginated_tasks, count=len(filtered_tasks))


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: UUID) -> Task:
    """
    Get a specific task by ID.
    """
    for task in tasks_db:
        if task.id == task_id:
            return task
    
    raise NotFoundError(f"Task with ID {task_id} not found")


@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate) -> Task:
    """
    Create a new task.
    """
    new_task = Task(**task.model_dump())
    tasks_db.append(new_task)
    return new_task


@router.put("/{task_id}", response_model=Task)
async def update_task(task_id: UUID, task_update: TaskUpdate) -> Task:
    """
    Update a task by ID.
    """
    for i, task in enumerate(tasks_db):
        if task.id == task_id:
            update_data = task_update.model_dump(exclude_unset=True)
            updated_task = task.model_copy(update=update_data)
            tasks_db[i] = updated_task
            return updated_task
    
    raise NotFoundError(f"Task with ID {task_id} not found")


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: UUID) -> None:
    """
    Delete a task by ID.
    """
    for i, task in enumerate(tasks_db):
        if task.id == task_id:
            tasks_db.pop(i)
            return
    
    raise NotFoundError(f"Task with ID {task_id} not found")
