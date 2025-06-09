"""
WebSocket routes for real-time communication with agents and dashboard.
"""

import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from app.agents.base import ClaimAssessmentAgent, CustomerCommunicationAgent
from app.agents.orchestrator import OrchestratorAgent
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time communication."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_data: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_data[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.now().isoformat(),
            "subscriptions": [],
        }
        logger.info(
            f"WebSocket client connected: {self.client_data[websocket]['client_id']}"
        )

        # Send welcome message
        await self.send_personal_message(
            {
                "type": "connection_established",
                "client_id": self.client_data[websocket]["client_id"],
                "timestamp": datetime.now().isoformat(),
                "message": "Connected to Insurance Multi-Agent System",
            },
            websocket,
        )

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            client_id = self.client_data.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            if websocket in self.client_data:
                del self.client_data[websocket]
            logger.info(f"WebSocket client disconnected: {client_id}")

    async def send_personal_message(
        self, message: Dict[str, Any], websocket: WebSocket
    ):
        """Send a message to a specific WebSocket connection."""
        if websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any], exclude: WebSocket = None):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            if connection != exclude:
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_text(json.dumps(message))
                    else:
                        disconnected.append(connection)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def send_to_subscribers(self, message: Dict[str, Any], event_type: str):
        """Send message to clients subscribed to a specific event type."""
        disconnected = []
        for connection in self.active_connections:
            client_data = self.client_data.get(connection, {})
            if event_type in client_data.get("subscriptions", []):
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_text(json.dumps(message))
                    else:
                        disconnected.append(connection)
                except Exception as e:
                    logger.error(f"Error sending to subscriber: {e}")
                    disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections."""
        return {
            "total_connections": len(self.active_connections),
            "clients": [
                {
                    "client_id": data["client_id"],
                    "connected_at": data["connected_at"],
                    "subscriptions": data["subscriptions"],
                }
                for data in self.client_data.values()
            ],
        }


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for dashboard communication."""
    await manager.connect(websocket)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            await handle_websocket_message(websocket, message)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint_with_id(websocket: WebSocket, client_id: str):
    """WebSocket endpoint with specific client ID."""
    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(websocket, message)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(websocket)


async def handle_websocket_message(websocket: WebSocket, message: Dict[str, Any]):
    """Handle incoming WebSocket messages from clients."""
    message_type = message.get("type")
    client_data = manager.client_data.get(websocket, {})
    client_id = client_data.get("client_id", "unknown")

    logger.info(f"Received message from {client_id}: {message_type}")

    try:
        if message_type == "subscribe":
            # Subscribe to specific event types
            event_types = message.get("events", [])
            client_data["subscriptions"].extend(event_types)
            client_data["subscriptions"] = list(
                set(client_data["subscriptions"])
            )  # Remove duplicates

            await manager.send_personal_message(
                {
                    "type": "subscription_confirmed",
                    "events": event_types,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

        elif message_type == "unsubscribe":
            # Unsubscribe from specific event types
            event_types = message.get("events", [])
            for event in event_types:
                if event in client_data["subscriptions"]:
                    client_data["subscriptions"].remove(event)

            await manager.send_personal_message(
                {
                    "type": "unsubscription_confirmed",
                    "events": event_types,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

        elif message_type == "agent_process":
            # Process message through an agent and return result
            await handle_agent_process(websocket, message)

        elif message_type == "workflow_start":
            # Start a workflow and provide real-time updates
            await handle_workflow_start(websocket, message)

        elif message_type == "ping":
            # Respond to ping with pong
            await manager.send_personal_message(
                {"type": "pong", "timestamp": datetime.now().isoformat()}, websocket
            )

        elif message_type == "get_stats":
            # Send connection statistics
            stats = manager.get_connection_stats()
            await manager.send_personal_message(
                {
                    "type": "stats",
                    "data": stats,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

        elif message_type == "custom_message":
            # Handle custom messages from the test panel
            custom_msg = message.get("message", "")
            await manager.send_personal_message(
                {
                    "type": "custom_message_received",
                    "original_message": custom_msg,
                    "response": f"Received your custom message: {custom_msg}",
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

            # Also broadcast as a system status for demonstration
            await broadcast_system_status(
                "info",
                f"Custom message received: {custom_msg}",
                {"client_id": client_id, "message": custom_msg},
            )

        elif message_type == "workflow_simulate":
            # Handle workflow simulation requests
            workflow_type = message.get("workflow_type", "claim_processing")
            await handle_workflow_simulation(websocket, workflow_type, client_id)

        else:
            # Unknown message type
            await manager.send_personal_message(
                {
                    "type": "error",
                    "message": f"Unknown message type: {message_type}",
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

    except Exception as e:
        logger.error(f"Error handling message from {client_id}: {e}")
        await manager.send_personal_message(
            {
                "type": "error",
                "message": f"Error processing message: {str(e)}",
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )


async def handle_agent_process(websocket: WebSocket, message: Dict[str, Any]):
    """Handle agent processing requests via WebSocket."""
    agent_type = message.get("agent_type")
    user_message = message.get("message")
    request_id = message.get("request_id", "unknown")

    if not agent_type or not user_message:
        await manager.send_personal_message(
            {
                "type": "agent_error",
                "request_id": request_id,
                "message": "Missing agent_type or message",
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )
        return

    # Send processing started notification
    await manager.send_personal_message(
        {
            "type": "agent_processing_started",
            "request_id": request_id,
            "agent_type": agent_type,
            "timestamp": datetime.now().isoformat(),
        },
        websocket,
    )

    try:
        # Select and initialize the appropriate agent
        if agent_type == "assessment":
            agent = ClaimAssessmentAgent()
        elif agent_type == "communication":
            agent = CustomerCommunicationAgent()
        elif agent_type == "orchestrator":
            agent = OrchestratorAgent()
        else:
            raise ValueError(f"Invalid agent type: {agent_type}")

        # Process the message
        response = await agent.process_message(user_message)

        # Send the response
        await manager.send_personal_message(
            {
                "type": "agent_response",
                "request_id": request_id,
                "agent_type": agent_type,
                "agent_name": agent.name,
                "message": user_message,
                "response": response,
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )

    except Exception as e:
        logger.error(f"Error processing agent message: {e}")
        await manager.send_personal_message(
            {
                "type": "agent_error",
                "request_id": request_id,
                "agent_type": agent_type,
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )


async def handle_workflow_start(websocket: WebSocket, message: Dict[str, Any]):
    """Handle workflow start requests with real-time updates."""
    claim_data = message.get("claim_data")
    request_id = message.get("request_id", "unknown")

    if not claim_data:
        await manager.send_personal_message(
            {
                "type": "workflow_error",
                "request_id": request_id,
                "message": "Missing claim_data",
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )
        return

    try:
        # Initialize orchestrator
        orchestrator = OrchestratorAgent()

        # Send workflow started notification
        await manager.send_personal_message(
            {
                "type": "workflow_started",
                "request_id": request_id,
                "claim_id": claim_data.get("claim_id"),
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )

        # Process workflow with periodic updates
        # Note: This is a simplified version - in a real implementation,
        # you'd want to run this in a background task and provide more granular updates

        # Simulate workflow stages with updates
        stages = ["validation", "assessment", "communication", "completion"]

        for i, stage in enumerate(stages):
            await manager.send_personal_message(
                {
                    "type": "workflow_progress",
                    "request_id": request_id,
                    "stage": stage,
                    "progress": (i + 1) / len(stages) * 100,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

            # Simulate processing time
            await asyncio.sleep(1)

        # Send completion notification
        await manager.send_personal_message(
            {
                "type": "workflow_completed",
                "request_id": request_id,
                "claim_id": claim_data.get("claim_id"),
                "result": "Workflow completed successfully",
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )

    except Exception as e:
        logger.error(f"Error processing workflow: {e}")
        await manager.send_personal_message(
            {
                "type": "workflow_error",
                "request_id": request_id,
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )


async def handle_workflow_simulation(
    websocket: WebSocket, workflow_type: str, client_id: str
):
    """Handle workflow simulation requests for testing purposes."""
    import asyncio
    import random

    try:
        # Generate a random claim ID for simulation
        claim_id = f"SIM-{random.randint(1000, 9999)}"

        # Send simulation started notification
        await manager.send_personal_message(
            {
                "type": "workflow_simulation_started",
                "workflow_type": workflow_type,
                "claim_id": claim_id,
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )

        # Broadcast that simulation started
        await broadcast_system_status(
            "info",
            f"Workflow simulation started: {workflow_type}",
            {
                "client_id": client_id,
                "claim_id": claim_id,
                "workflow_type": workflow_type,
            },
        )

        # Simulate different workflow stages with realistic delays
        stages = [
            {"name": "initialization", "duration": 0.5},
            {"name": "data_validation", "duration": 1.0},
            {"name": "agent_assessment", "duration": 2.0},
            {"name": "communication_prep", "duration": 1.5},
            {"name": "final_processing", "duration": 1.0},
        ]

        for i, stage in enumerate(stages):
            # Send stage start notification
            await manager.send_personal_message(
                {
                    "type": "workflow_stage_update",
                    "claim_id": claim_id,
                    "stage": stage["name"],
                    "status": "in_progress",
                    "progress": (i / len(stages)) * 100,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

            # Broadcast workflow update
            await broadcast_workflow_update(
                claim_id,
                stage["name"],
                "in_progress",
                {"progress": (i / len(stages)) * 100, "workflow_type": workflow_type},
            )

            # Simulate processing time
            await asyncio.sleep(stage["duration"])

            # Send stage completion
            await manager.send_personal_message(
                {
                    "type": "workflow_stage_update",
                    "claim_id": claim_id,
                    "stage": stage["name"],
                    "status": "completed",
                    "progress": ((i + 1) / len(stages)) * 100,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

            # Simulate some agent activity during processing
            if stage["name"] == "agent_assessment":
                await broadcast_agent_activity(
                    "assessment_agent",
                    "analyzing_claim",
                    {"claim_id": claim_id, "stage": stage["name"]},
                )
            elif stage["name"] == "communication_prep":
                await broadcast_agent_activity(
                    "communication_agent",
                    "preparing_response",
                    {"claim_id": claim_id, "stage": stage["name"]},
                )

        # Send final completion notification
        await manager.send_personal_message(
            {
                "type": "workflow_simulation_completed",
                "workflow_type": workflow_type,
                "claim_id": claim_id,
                "result": f"Simulation of {workflow_type} completed successfully",
                "total_duration": sum(stage["duration"] for stage in stages),
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )

        # Final broadcast
        await broadcast_system_status(
            "success",
            f"Workflow simulation completed: {workflow_type}",
            {
                "client_id": client_id,
                "claim_id": claim_id,
                "workflow_type": workflow_type,
            },
        )

    except Exception as e:
        logger.error(f"Error in workflow simulation: {e}")
        await manager.send_personal_message(
            {
                "type": "workflow_simulation_error",
                "workflow_type": workflow_type,
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
            },
            websocket,
        )


# Utility functions for broadcasting events from other parts of the application


async def broadcast_agent_activity(
    agent_name: str, activity: str, data: Dict[str, Any] = None
):
    """Broadcast agent activity to all subscribed clients."""
    message = {
        "type": "agent_activity",
        "agent_name": agent_name,
        "activity": activity,
        "data": data or {},
        "timestamp": datetime.now().isoformat(),
    }
    await manager.send_to_subscribers(message, "agent_activity")


async def broadcast_workflow_update(
    claim_id: str, stage: str, status: str, data: Dict[str, Any] = None
):
    """Broadcast workflow updates to all subscribed clients."""
    message = {
        "type": "workflow_update",
        "claim_id": claim_id,
        "stage": stage,
        "status": status,
        "data": data or {},
        "timestamp": datetime.now().isoformat(),
    }
    await manager.send_to_subscribers(message, "workflow_updates")


async def broadcast_system_status(
    status: str, message: str, data: Dict[str, Any] = None
):
    """Broadcast system status updates to all subscribed clients."""
    broadcast_message = {
        "type": "system_status",
        "status": status,
        "message": message,
        "data": data or {},
        "timestamp": datetime.now().isoformat(),
    }
    await manager.send_to_subscribers(broadcast_message, "system_status")
