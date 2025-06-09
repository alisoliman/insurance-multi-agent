"""
WebSocket service for sending real-time updates from anywhere in the application.
"""

from typing import Dict, Any, Optional
from app.api.routes.websocket import (
    manager,
    broadcast_agent_activity,
    broadcast_workflow_update,
    broadcast_system_status,
)


class WebSocketService:
    """Service for sending WebSocket messages from anywhere in the application."""

    @staticmethod
    async def send_agent_activity(
        agent_name: str, activity: str, data: Dict[str, Any] = None
    ):
        """Send agent activity update to subscribed clients."""
        await broadcast_agent_activity(agent_name, activity, data)

    @staticmethod
    async def send_workflow_update(
        claim_id: str, stage: str, status: str, data: Dict[str, Any] = None
    ):
        """Send workflow update to subscribed clients."""
        await broadcast_workflow_update(claim_id, stage, status, data)

    @staticmethod
    async def send_system_status(
        status: str, message: str, data: Dict[str, Any] = None
    ):
        """Send system status update to subscribed clients."""
        await broadcast_system_status(status, message, data)

    @staticmethod
    async def broadcast_message(message: Dict[str, Any], exclude_client: str = None):
        """Broadcast a custom message to all connected clients."""
        # Find the WebSocket connection to exclude if client ID is provided
        exclude_websocket = None
        if exclude_client:
            for websocket, client_data in manager.client_data.items():
                if client_data.get("client_id") == exclude_client:
                    exclude_websocket = websocket
                    break

        await manager.broadcast(message, exclude=exclude_websocket)

    @staticmethod
    async def send_to_client(client_id: str, message: Dict[str, Any]) -> bool:
        """Send a message to a specific client by ID."""
        for websocket, client_data in manager.client_data.items():
            if client_data.get("client_id") == client_id:
                await manager.send_personal_message(message, websocket)
                return True
        return False

    @staticmethod
    def get_connected_clients() -> Dict[str, Any]:
        """Get information about currently connected clients."""
        return manager.get_connection_stats()

    @staticmethod
    def is_client_connected(client_id: str) -> bool:
        """Check if a specific client is connected."""
        for client_data in manager.client_data.values():
            if client_data.get("client_id") == client_id:
                return True
        return False


# Global instance for easy import
websocket_service = WebSocketService()
