#!/usr/bin/env python3
"""
Simplified test suite for the Feedback Integration System.

This test suite validates the core feedback integration functionality
with correct API formats and realistic test scenarios.
"""

import pytest
import asyncio
import json
import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from app.main import app
from app.agents.orchestrator import OrchestratorAgent, ClaimWorkflowState
from app.agents.enums import WorkflowStage, ClaimComplexity


class TestFeedbackIntegration:
    """Test class for feedback integration functionality."""

    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI application."""
        return TestClient(app)

    @pytest.fixture
    def sample_claim_data(self):
        """Sample claim data for testing."""
        return {
            "claim_id": "test_feedback_integration_001",
            "policy_number": "POL123456",
            "incident_date": "2024-01-15T10:30:00Z",
            "description": "Minor fender bender in parking lot",
            "amount": 2500.00,
            "documentation": "Police report filed, photos taken"
        }

    @pytest.mark.asyncio
    async def test_workflow_creates_feedback_points(self, sample_claim_data):
        """Test that processing a workflow creates feedback collection points."""
        # Initialize orchestrator
        orchestrator = OrchestratorAgent()
        await orchestrator.initialize_agents()

        # Process workflow
        workflow_state = await orchestrator.process_claim_workflow(sample_claim_data)

        # Validate workflow completed
        assert workflow_state.claim_id == sample_claim_data["claim_id"]
        assert workflow_state.current_stage in [
            WorkflowStage.COMPLETED, WorkflowStage.HUMAN_REVIEW]

        # Validate feedback collection points were created
        assert len(workflow_state.feedback_collection_points) > 0
        print(
            f"Created {len(workflow_state.feedback_collection_points)} feedback collection points")

        # Validate workflow completion feedback was triggered
        assert workflow_state.workflow_feedback_triggered == True
        print("Workflow completion feedback triggered successfully")

        # Validate session and workflow IDs are present
        assert workflow_state.session_id is not None
        assert workflow_state.workflow_id is not None
        print(f"Session ID: {workflow_state.session_id}")
        print(f"Workflow ID: {workflow_state.workflow_id}")

    def test_orchestrator_api_returns_feedback_data(self, client, sample_claim_data):
        """Test that orchestrator API endpoints return feedback collection data."""
        # Create proper ClaimData structure
        claim_data = {
            "claim_id": sample_claim_data["claim_id"],
            "policy_number": sample_claim_data["policy_number"],
            "incident_date": sample_claim_data["incident_date"],
            "description": sample_claim_data["description"],
            "amount": sample_claim_data["amount"]
        }

        workflow_request = {
            "claim_data": claim_data,
            "use_graphflow": False
        }

        # Make API request
        response = client.post(
            "/api/agents/orchestrator/process-workflow", json=workflow_request)

        # Validate response
        assert response.status_code == 200
        data = response.json()

        assert data["success"] == True
        assert "feedback_collection_points" in data
        assert "session_id" in data
        assert "workflow_id" in data

        print(
            f"API returned {len(data['feedback_collection_points'])} feedback collection points")
        print(f"Session ID: {data['session_id']}")
        print(f"Workflow ID: {data['workflow_id']}")

    def test_feedback_api_with_correct_format(self, client):
        """Test feedback submission API with correct schema format."""
        # Test immediate agent feedback with correct format
        immediate_feedback = {
            "session_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "ratings": [
                {
                    "category": "accuracy",
                    "rating": 4,
                    "comment": "Good assessment"
                },
                {
                    "category": "helpfulness",
                    "rating": 5,
                    "comment": "Very helpful"
                }
            ],
            "overall_rating": 4,
            "additional_comments": "Good job overall"
        }

        response = client.post(
            "/api/feedback/immediate-agent", json=immediate_feedback)

        # Check if successful or get error details
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "feedback_id" in data

        print(
            f"Feedback submitted successfully with ID: {data['feedback_id']}")

    def test_feedback_list_endpoint(self, client):
        """Test feedback list endpoint."""
        response = client.get("/api/feedback/list")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] == True
        assert "feedback" in data
        assert "total_count" in data

        print(f"Feedback list returned {data['total_count']} items")

    def test_feedback_summary_endpoint(self, client):
        """Test feedback summary endpoint."""
        response = client.get("/api/feedback/summary")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] == True
        assert "summary" in data

        print(f"Feedback summary: {data['summary']}")

    def test_workflow_state_serialization(self):
        """Test that workflow states with feedback can be serialized."""
        # Create a workflow state with feedback points
        workflow_state = ClaimWorkflowState(
            claim_id="test_serialization_001",
            current_stage=WorkflowStage.COMPLETED,
            complexity=ClaimComplexity.MEDIUM,
            started_at=datetime.now(),
            updated_at=datetime.now(),
            agent_decisions=[]
        )

        # Add a feedback collection point
        workflow_state.feedback_collection_points.append({
            "feedback_point_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "decision": "approved",
            "timestamp": datetime.now().isoformat(),
            "claim_id": "test_serialization_001"
        })

        workflow_state.workflow_feedback_triggered = True

        # Test serialization
        try:
            serialized = workflow_state.to_dict()
            json_str = json.dumps(serialized)

            # Validate serialization succeeded
            assert len(json_str) > 0

            # Validate deserialization
            deserialized = json.loads(json_str)
            assert deserialized["claim_id"] == "test_serialization_001"
            assert len(deserialized["feedback_collection_points"]) == 1
            assert deserialized["workflow_feedback_triggered"] == True

            print("Workflow state serialization test passed")

        except Exception as e:
            pytest.fail(f"Serialization failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_end_to_end_feedback_flow(self, client, sample_claim_data):
        """Test complete end-to-end feedback flow."""
        print("\n=== End-to-End Feedback Flow Test ===")

        # Step 1: Process workflow via API
        # Create proper ClaimData structure
        claim_data = {
            "claim_id": sample_claim_data["claim_id"],
            "policy_number": sample_claim_data["policy_number"],
            "incident_date": sample_claim_data["incident_date"],
            "description": sample_claim_data["description"],
            "amount": sample_claim_data["amount"]
        }

        workflow_request = {
            "claim_data": claim_data,
            "use_graphflow": False
        }

        workflow_response = client.post(
            "/api/agents/orchestrator/process-workflow", json=workflow_request)
        assert workflow_response.status_code == 200

        workflow_data = workflow_response.json()
        session_id = workflow_data["session_id"]
        feedback_points = workflow_data["feedback_collection_points"]

        print(
            f"Step 1: Workflow processed with {len(feedback_points)} feedback points")

        # Step 2: Submit feedback for each agent decision
        for i, feedback_point in enumerate(feedback_points):
            immediate_feedback = {
                "session_id": session_id,
                "agent_name": feedback_point["agent_name"],
                "ratings": [
                    {
                        "category": "accuracy",
                        "rating": 4,
                        "comment": f"Good decision for {feedback_point['agent_name']}"
                    }
                ],
                "overall_rating": 4,
                "additional_comments": f"Feedback for agent decision {i+1}"
            }

            feedback_response = client.post(
                "/api/feedback/immediate-agent", json=immediate_feedback)
            assert feedback_response.status_code == 200

            feedback_data = feedback_response.json()
            print(
                f"Step 2.{i+1}: Submitted feedback for {feedback_point['agent_name']} - ID: {feedback_data['feedback_id']}")

        # Step 3: Submit workflow completion feedback
        workflow_completion_feedback = {
            "session_id": session_id,
            "workflow_type": "claim_processing",
            "ratings": [
                {
                    "category": "overall_experience",
                    "rating": 5,
                    "comment": "Excellent workflow"
                }
            ],
            "overall_rating": 5,
            "additional_comments": "Great end-to-end experience"
        }

        completion_response = client.post(
            "/api/feedback/workflow-completion", json=workflow_completion_feedback)
        assert completion_response.status_code == 200

        completion_data = completion_response.json()
        print(
            f"Step 3: Submitted workflow completion feedback - ID: {completion_data['feedback_id']}")

        # Step 4: Verify all feedback was captured
        list_response = client.get("/api/feedback/list")
        assert list_response.status_code == 200

        feedback_list = list_response.json()["feedback"]
        session_feedback = [
            f for f in feedback_list if f["session_id"] == session_id]

        # Should have feedback for each agent decision plus workflow completion
        expected_count = len(feedback_points) + 1
        assert len(session_feedback) >= expected_count

        print(
            f"Step 4: Verified {len(session_feedback)} feedback entries for session")
        print("=== End-to-End Test Completed Successfully ===\n")


# Test runner for standalone execution
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
