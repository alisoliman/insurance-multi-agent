import uuid
from typing import Dict, List

import pytest
from fastapi.testclient import TestClient

from app.schemas.tasks import Task, TaskStatus


def test_create_task(client: TestClient) -> None:
    """Test creating a task."""
    task_data = {
        "title": "Test Task",
        "description": "This is a test task",
        "status": "pending"
    }
    
    response = client.post("/api/tasks/", json=task_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["description"] == task_data["description"]
    assert data["status"] == task_data["status"]
    assert "id" in data


def test_list_tasks(client: TestClient) -> None:
    """Test listing tasks."""
    # Create a task first
    task_data = {
        "title": "Another Task",
        "description": "This is another test task",
        "status": "pending"
    }
    client.post("/api/tasks/", json=task_data)
    
    response = client.get("/api/tasks/")
    assert response.status_code == 200
    
    data = response.json()
    assert "tasks" in data
    assert "count" in data
    assert isinstance(data["tasks"], list)
    assert data["count"] >= 1


def test_get_task(client: TestClient) -> None:
    """Test getting a specific task."""
    # Create a task first
    task_data = {
        "title": "Task to Get",
        "description": "This is a task to get",
        "status": "pending"
    }
    create_response = client.post("/api/tasks/", json=task_data)
    task_id = create_response.json()["id"]
    
    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["description"] == task_data["description"]
    assert data["id"] == task_id


def test_update_task(client: TestClient) -> None:
    """Test updating a task."""
    # Create a task first
    task_data = {
        "title": "Task to Update",
        "description": "This is a task to update",
        "status": "pending"
    }
    create_response = client.post("/api/tasks/", json=task_data)
    task_id = create_response.json()["id"]
    
    update_data = {
        "title": "Updated Task",
        "status": "completed"
    }
    
    response = client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["status"] == update_data["status"]
    assert data["description"] == task_data["description"]  # Should remain unchanged


def test_delete_task(client: TestClient) -> None:
    """Test deleting a task."""
    # Create a task first
    task_data = {
        "title": "Task to Delete",
        "description": "This is a task to delete",
        "status": "pending"
    }
    create_response = client.post("/api/tasks/", json=task_data)
    task_id = create_response.json()["id"]
    
    # Delete the task
    response = client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/api/tasks/{task_id}")
    assert get_response.status_code == 404


def test_filter_tasks_by_status(client: TestClient) -> None:
    """Test filtering tasks by status."""
    # Create tasks with different statuses
    pending_task = {
        "title": "Pending Task",
        "description": "This is a pending task",
        "status": "pending"
    }
    completed_task = {
        "title": "Completed Task",
        "description": "This is a completed task",
        "status": "completed"
    }
    
    client.post("/api/tasks/", json=pending_task)
    client.post("/api/tasks/", json=completed_task)
    
    # Filter by pending status
    response = client.get("/api/tasks/?status=pending")
    assert response.status_code == 200
    
    data = response.json()
    assert all(task["status"] == "pending" for task in data["tasks"])
    
    # Filter by completed status
    response = client.get("/api/tasks/?status=completed")
    assert response.status_code == 200
    
    data = response.json()
    assert all(task["status"] == "completed" for task in data["tasks"])


def test_root_endpoint(client: TestClient) -> None:
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
