"""
REST API endpoints for WebSocket connection management and monitoring.
"""

from fastapi import APIRouter, HTTPException
from typing import Any
from pydantic import BaseModel

from app.services.websocket_service import websocket_service
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class BroadcastMessage(BaseModel):
    """Model for broadcasting messages to all clients."""

    message: str
    data: dict[str, Any] = {}
    exclude_client: str = None


class ClientMessage(BaseModel):
    """Model for sending messages to specific clients."""

    client_id: str
    message: str
    data: dict[str, Any] = {}


class AgentActivityMessage(BaseModel):
    """Model for sending agent activity updates."""

    agent_name: str
    activity: str
    data: dict[str, Any] = {}


class WorkflowUpdateMessage(BaseModel):
    """Model for sending workflow updates."""

    claim_id: str
    stage: str
    status: str
    data: dict[str, Any] = {}


class SystemStatusMessage(BaseModel):
    """Model for sending system status updates."""

    status: str
    message: str
    data: dict[str, Any] = {}


@router.get("/connections")
async def get_websocket_connections() -> dict[str, Any]:
    """Get information about current WebSocket connections."""
    try:
        stats = websocket_service.get_connected_clients()
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Error getting WebSocket connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{client_id}/status")
async def check_client_connection(client_id: str) -> dict[str, Any]:
    """Check if a specific client is connected."""
    try:
        is_connected = websocket_service.is_client_connected(client_id)
        return {"success": True, "client_id": client_id, "connected": is_connected}
    except Exception as e:
        logger.error(f"Error checking client connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcast")
async def broadcast_message(message: BroadcastMessage) -> dict[str, Any]:
    """Broadcast a message to all connected WebSocket clients."""
    try:
        broadcast_data = {
            "type": "broadcast",
            "message": message.message,
            "data": message.data,
            "timestamp": None,  # Will be set by the WebSocket service
        }

        await websocket_service.broadcast_message(
            broadcast_data, message.exclude_client
        )

        return {
            "success": True,
            "message": "Message broadcasted successfully",
            "excluded_client": message.exclude_client,
        }
    except Exception as e:
        logger.error(f"Error broadcasting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-to-client")
async def send_to_client(message: ClientMessage) -> dict[str, Any]:
    """Send a message to a specific WebSocket client."""
    try:
        message_data = {
            "type": "direct_message",
            "message": message.message,
            "data": message.data,
            "timestamp": None,  # Will be set by the WebSocket service
        }

        success = await websocket_service.send_to_client(
            message.client_id, message_data
        )

        if success:
            return {
                "success": True,
                "message": f"Message sent to client {message.client_id}",
                "client_id": message.client_id,
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Client {message.client_id} not found or not connected",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message to client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent-activity")
async def send_agent_activity(activity: AgentActivityMessage) -> dict[str, Any]:
    """Send an agent activity update to subscribed clients."""
    try:
        await websocket_service.send_agent_activity(
            activity.agent_name, activity.activity, activity.data
        )

        return {
            "success": True,
            "message": f"Agent activity sent for {activity.agent_name}",
            "agent_name": activity.agent_name,
            "activity": activity.activity,
        }
    except Exception as e:
        logger.error(f"Error sending agent activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflow-update")
async def send_workflow_update(update: WorkflowUpdateMessage) -> dict[str, Any]:
    """Send a workflow update to subscribed clients."""
    try:
        await websocket_service.send_workflow_update(
            update.claim_id, update.stage, update.status, update.data
        )

        return {
            "success": True,
            "message": f"Workflow update sent for claim {update.claim_id}",
            "claim_id": update.claim_id,
            "stage": update.stage,
            "status": update.status,
        }
    except Exception as e:
        logger.error(f"Error sending workflow update: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/system-status")
async def send_system_status(status: SystemStatusMessage) -> dict[str, Any]:
    """Send a system status update to subscribed clients."""
    try:
        await websocket_service.send_system_status(
            status.status, status.message, status.data
        )

        return {
            "success": True,
            "message": "System status update sent",
            "status": status.status,
        }
    except Exception as e:
        logger.error(f"Error sending system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def websocket_health_check() -> dict[str, Any]:
    """Health check endpoint for WebSocket functionality."""
    try:
        stats = websocket_service.get_connected_clients()

        return {
            "success": True,
            "status": "healthy",
            "websocket_service": "operational",
            "active_connections": stats["total_connections"],
            "timestamp": None,  # Could add timestamp if needed
        }
    except Exception as e:
        logger.error(f"WebSocket health check failed: {e}")
        return {"success": False, "status": "unhealthy", "error": str(e)}
