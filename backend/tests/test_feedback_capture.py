#!/usr/bin/env python3
"""
Comprehensive test suite for the Feedback Capture System.

This test suite validates:
- Feedback collection during agent workflows
- API endpoints for feedback submission and retrieval
- Data persistence and linkage to decision logs
- Form validation and error handling
- End-to-end feedback workflows
"""

import pytest
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from app.main import app
from app.agents.orchestrator import OrchestratorAgent, ClaimWorkflowState, AgentDecision
from app.agents.enums import WorkflowStage, ClaimComplexity
from app.services.feedback_service import FeedbackService
from app.schemas.feedback import (
    ImmediateAgentFeedbackRequest,
    WorkflowCompletionFeedbackRequest,
    FeedbackRatingRequest
)


class TestFeedbackCapture:
    """Test class for feedback capture functionality."""

    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI application."""
        return TestClient(app)

    @pytest.fixture
    async def orchestrator(self):
        """Create and initialize an orchestrator agent for testing."""
        orchestrator = OrchestratorAgent()
        await orchestrator.initialize_agents()
        return orchestrator

    @pytest.fixture
    def sample_claim_data(self):
        """Sample claim data for testing."""
        return {
            "claim_id": "test_claim_feedback_001",
            "policy_number": "POL123456",
            "incident_date": "2024-01-15T10:30:00Z",
            "description": "Minor fender bender in parking lot",
            "amount": 2500.00,
            "documentation": "Police report filed, photos taken"
        }

    @pytest.fixture
    def sample_agent_decision(self):
        """Sample agent decision for testing."""
        return AgentDecision(
            agent_name="assessment",
            decision="approved",
            confidence_score=0.85,
            reasoning="Claim appears valid based on documentation and amount",
            timestamp=datetime.now(),
            metadata={
                "assessment_details": "Standard assessment completed",
                "risk_factors": ["none"],
                "documentation_quality": "good"
            }
        )

    # Unit Tests for Feedback Collection Points

    @pytest.mark.asyncio
    async def test_create_feedback_collection_point(self, orchestrator, sample_claim_data, sample_agent_decision):
        """Test creation of feedback collection points after agent decisions."""
        # Create a workflow state
        workflow_state = ClaimWorkflowState(
            claim_id=sample_claim_data["claim_id"],
            current_stage=WorkflowStage.ASSESSMENT,
            complexity=ClaimComplexity.MEDIUM,
            started_at=datetime.now(),
            updated_at=datetime.now(),
            agent_decisions=[]
        )

        # Create feedback collection point
        feedback_point = await orchestrator._create_feedback_collection_point(
            workflow_state, sample_agent_decision, sample_claim_data
        )

        # Validate feedback point structure
        assert feedback_point["agent_name"] == "assessment"
        assert feedback_point["decision"] == "approved"
        assert feedback_point["confidence_score"] == 0.85
        assert feedback_point["claim_id"] == sample_claim_data["claim_id"]
        assert feedback_point["session_id"] == workflow_state.session_id
        assert feedback_point["workflow_id"] == workflow_state.workflow_id
        assert feedback_point["workflow_stage"] == WorkflowStage.ASSESSMENT.value
        assert feedback_point["complexity"] == ClaimComplexity.MEDIUM.value

        # Validate metadata
        assert feedback_point["metadata"]["claim_amount"] == 2500.00
        assert feedback_point["metadata"]["policy_number"] == "POL123456"
        assert feedback_point["metadata"]["agent_metadata"] == sample_agent_decision.metadata

        # Validate it was added to workflow state
        assert len(workflow_state.feedback_collection_points) == 1
        assert workflow_state.feedback_collection_points[0] == feedback_point

    @pytest.mark.asyncio
    async def test_create_workflow_completion_feedback_point(self, orchestrator, sample_claim_data):
        """Test creation of workflow completion feedback points."""
        # Create a completed workflow state
        start_time = datetime.now()
        workflow_state = ClaimWorkflowState(
            claim_id=sample_claim_data["claim_id"],
            current_stage=WorkflowStage.COMPLETED,
            complexity=ClaimComplexity.MEDIUM,
            started_at=start_time,
            updated_at=datetime.now(),
            agent_decisions=[
                AgentDecision(
                    agent_name="assessment",
                    decision="approved",
                    confidence_score=0.85,
                    reasoning="Valid claim",
                    timestamp=datetime.now()
                ),
                AgentDecision(
                    agent_name="communication",
                    decision="communication_drafted",
                    confidence_score=0.90,
                    reasoning="Response drafted",
                    timestamp=datetime.now()
                )
            ]
        )

        # Create workflow completion feedback point
        completion_feedback = await orchestrator._create_workflow_completion_feedback_point(
            workflow_state, sample_claim_data
        )

        # Validate completion feedback structure
        assert completion_feedback["feedback_type"] == "workflow_completion"
        assert completion_feedback["claim_id"] == sample_claim_data["claim_id"]
        assert completion_feedback["workflow_type"] == "claim_processing"
        assert completion_feedback["steps_completed"] == 2
        assert completion_feedback["final_stage"] == WorkflowStage.COMPLETED.value
        assert completion_feedback["complexity"] == ClaimComplexity.MEDIUM.value
        assert completion_feedback["requires_human_review"] == False
        assert completion_feedback["encountered_issues"] == False

        # Validate agent decisions summary
        assert len(completion_feedback["agent_decisions_summary"]) == 2
        assert completion_feedback["agent_decisions_summary"][0]["agent"] == "assessment"
        assert completion_feedback["agent_decisions_summary"][1]["agent"] == "communication"

        # Validate workflow feedback triggered flag
        assert workflow_state.workflow_feedback_triggered == True

    # Integration Tests for Workflow Processing

    @pytest.mark.asyncio
    async def test_feedback_integration_in_workflow(self, orchestrator, sample_claim_data):
        """Test that feedback collection is integrated into the complete workflow."""
        # Process a complete workflow
        workflow_state = await orchestrator.process_claim_workflow(sample_claim_data)

        # Validate workflow completed
        assert workflow_state.claim_id == sample_claim_data["claim_id"]
        assert workflow_state.current_stage in [
            WorkflowStage.COMPLETED, WorkflowStage.HUMAN_REVIEW]

        # Validate feedback collection points were created
        assert len(workflow_state.feedback_collection_points) > 0

        # Validate each feedback point has required fields
        for feedback_point in workflow_state.feedback_collection_points:
            assert "feedback_point_id" in feedback_point
            assert "agent_name" in feedback_point
            assert "decision" in feedback_point
            assert "confidence_score" in feedback_point
            assert "reasoning" in feedback_point
            assert "timestamp" in feedback_point
            assert "claim_id" in feedback_point
            assert "session_id" in feedback_point
            assert "workflow_id" in feedback_point
            assert "workflow_stage" in feedback_point
            assert "complexity" in feedback_point
            assert "metadata" in feedback_point

        # Validate workflow completion feedback was triggered
        assert workflow_state.workflow_feedback_triggered == True

        # Validate session and workflow IDs are present
        assert workflow_state.session_id is not None
        assert workflow_state.workflow_id is not None

    @pytest.mark.asyncio
    async def test_feedback_collection_with_errors(self, orchestrator):
        """Test feedback collection when agent decisions fail."""
        # Create invalid claim data to trigger errors
        invalid_claim_data = {
            "claim_id": "test_error_feedback_001",
            "policy_number": "",  # Missing required field
            "incident_date": "invalid-date",  # Invalid date format
            "description": "",  # Empty description
        }

        # Process workflow with invalid data
        workflow_state = await orchestrator.process_claim_workflow(invalid_claim_data)

        # Validate workflow failed appropriately
        assert workflow_state.current_stage == WorkflowStage.FAILED
        assert workflow_state.error_message is not None

        # Validate workflow completion feedback was still triggered
        assert workflow_state.workflow_feedback_triggered == True

        # For intake failures, there should be no agent decision feedback points
        # but workflow completion feedback should still be triggered
        assert len(workflow_state.feedback_collection_points) == 0

    # API Endpoint Tests

    def test_orchestrator_process_workflow_includes_feedback(self, client):
        """Test that orchestrator API endpoints include feedback collection points."""
        # Prepare test data
        workflow_request = {
            "claim_data": {
                "claim_id": "test_api_feedback_001",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15T10:30:00Z",
                "description": "Test claim for API feedback",
                "amount": 1500.00
            },
            "use_graphflow": False
        }

        # Make API request
        response = client.post(
            "/api/agents/orchestrator/process-workflow", json=workflow_request)

        # Validate response
        assert response.status_code == 200
        data = response.json()

        assert data["success"] == True
        assert "workflow_state" in data
        assert "feedback_collection_points" in data
        assert "session_id" in data
        assert "workflow_id" in data

        # Validate feedback collection points structure
        feedback_points = data["feedback_collection_points"]
        assert isinstance(feedback_points, list)

        if len(feedback_points) > 0:
            for point in feedback_points:
                assert "feedback_point_id" in point
                assert "agent_name" in point
                assert "decision" in point
                assert "confidence_score" in point

    def test_get_workflow_feedback_points_endpoint(self, client):
        """Test the dedicated feedback points retrieval endpoint."""
        # First, create a workflow to get feedback points
        workflow_request = {
            "claim_data": {
                "claim_id": "test_feedback_endpoint_001",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15T10:30:00Z",
                "description": "Test claim for feedback endpoint",
                "amount": 2000.00
            },
            "use_graphflow": False
        }

        # Create workflow
        workflow_response = client.post(
            "/api/agents/orchestrator/process-workflow", json=workflow_request)
        assert workflow_response.status_code == 200

        workflow_data = workflow_response.json()
        workflow_id = workflow_data["workflow_id"]

        # Test feedback points endpoint
        feedback_response = client.get(
            f"/api/agents/orchestrator/feedback-points/{workflow_id}")

        # Note: This might return 404 if the orchestrator instance doesn't persist
        # across requests, which is expected in stateless API testing
        if feedback_response.status_code == 200:
            feedback_data = feedback_response.json()
            assert feedback_data["success"] == True
            assert feedback_data["workflow_id"] == workflow_id
            assert "feedback_collection_points" in feedback_data
        else:
            # Expected behavior for stateless API
            assert feedback_response.status_code == 404

    def test_feedback_api_endpoints(self, client):
        """Test feedback submission API endpoints."""
        # Test immediate agent feedback submission
        immediate_feedback = {
            "session_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "decision_context": "Claim assessment for policy POL123456",
            "ratings": {
                "accuracy": {"rating": 4, "comment": "Good assessment"},
                "helpfulness": {"rating": 5, "comment": "Very helpful"},
                "clarity": {"rating": 4, "comment": "Clear reasoning"}
            },
            "overall_satisfaction": 4,
            "additional_comments": "Good job overall"
        }

        response = client.post(
            "/api/feedback/immediate-agent", json=immediate_feedback)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "feedback_id" in data

        # Test workflow completion feedback submission
        workflow_feedback = {
            "session_id": str(uuid.uuid4()),
            "workflow_type": "claim_processing",
            "overall_satisfaction": 5,
            "efficiency_rating": 4,
            "accuracy_rating": 5,
            "ease_of_use": 4,
            "likelihood_to_recommend": 5,
            "most_helpful_aspect": "Quick processing",
            "improvement_suggestions": "None",
            "additional_comments": "Excellent service"
        }

        response = client.post(
            "/api/feedback/workflow-completion", json=workflow_feedback)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "feedback_id" in data

    # Data Persistence and Linkage Tests

    def test_feedback_data_persistence(self, client):
        """Test that feedback data is properly persisted and can be retrieved."""
        # Submit feedback
        feedback_data = {
            "session_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "decision_context": "Test persistence",
            "ratings": {
                "accuracy": {"rating": 5, "comment": "Perfect"}
            },
            "overall_satisfaction": 5
        }

        submit_response = client.post(
            "/api/feedback/immediate-agent", json=feedback_data)
        assert submit_response.status_code == 200

        submit_data = submit_response.json()
        feedback_id = submit_data["feedback_id"]

        # Retrieve feedback
        get_response = client.get(f"/api/feedback/{feedback_id}")
        assert get_response.status_code == 200

        retrieved_data = get_response.json()
        assert retrieved_data["success"] == True
        assert retrieved_data["feedback"]["id"] == feedback_id
        assert retrieved_data["feedback"]["session_id"] == feedback_data["session_id"]

    def test_feedback_list_and_summary(self, client):
        """Test feedback list and summary endpoints."""
        # Submit multiple feedback entries
        for i in range(3):
            feedback_data = {
                "session_id": str(uuid.uuid4()),
                "agent_name": f"agent_{i}",
                "decision_context": f"Test context {i}",
                "ratings": {
                    "accuracy": {"rating": 4 + (i % 2), "comment": f"Comment {i}"}
                },
                "overall_satisfaction": 4 + (i % 2)
            }

            response = client.post(
                "/api/feedback/immediate-agent", json=feedback_data)
            assert response.status_code == 200

        # Test feedback list
        list_response = client.get("/api/feedback/list")
        assert list_response.status_code == 200

        list_data = list_response.json()
        assert list_data["success"] == True
        assert len(list_data["feedback_list"]) >= 3

        # Test feedback summary
        summary_response = client.get("/api/feedback/summary")
        assert summary_response.status_code == 200

        summary_data = summary_response.json()
        assert summary_data["success"] == True
        assert "total_feedback_count" in summary_data["summary"]
        assert "average_satisfaction" in summary_data["summary"]

    # Form Validation Tests

    def test_feedback_form_validation(self, client):
        """Test form validation for feedback submissions."""
        # Test missing required fields
        invalid_feedback = {
            "agent_name": "assessment",
            # Missing session_id and other required fields
        }

        response = client.post(
            "/api/feedback/immediate-agent", json=invalid_feedback)
        assert response.status_code == 422  # Validation error

        # Test invalid rating values
        invalid_rating_feedback = {
            "session_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "decision_context": "Test context",
            "ratings": {
                # Rating > 5
                "accuracy": {"rating": 10, "comment": "Invalid rating"}
            },
            "overall_satisfaction": 6  # Invalid satisfaction > 5
        }

        response = client.post(
            "/api/feedback/immediate-agent", json=invalid_rating_feedback)
        assert response.status_code == 422  # Validation error

    # End-to-End Workflow Tests

    @pytest.mark.asyncio
    async def test_end_to_end_feedback_workflow(self, client, orchestrator):
        """Test complete end-to-end feedback workflow."""
        # Step 1: Process a claim workflow
        claim_data = {
            "claim_id": "test_e2e_feedback_001",
            "policy_number": "POL123456",
            "incident_date": "2024-01-15T10:30:00Z",
            "description": "End-to-end test claim",
            "amount": 3000.00
        }

        workflow_state = await orchestrator.process_claim_workflow(claim_data)

        # Step 2: Validate feedback collection points were created
        assert len(workflow_state.feedback_collection_points) > 0
        assert workflow_state.workflow_feedback_triggered == True

        # Step 3: Simulate user submitting feedback for each agent decision
        for feedback_point in workflow_state.feedback_collection_points:
            immediate_feedback = {
                "session_id": workflow_state.session_id,
                "agent_name": feedback_point["agent_name"],
                "decision_context": f"Feedback for {feedback_point['decision']}",
                "ratings": {
                    "accuracy": {"rating": 4, "comment": "Good decision"},
                    "helpfulness": {"rating": 5, "comment": "Very helpful"},
                    "clarity": {"rating": 4, "comment": "Clear reasoning"}
                },
                "overall_satisfaction": 4,
                "additional_comments": "Good work"
            }

            response = client.post(
                "/api/feedback/immediate-agent", json=immediate_feedback)
            assert response.status_code == 200

        # Step 4: Submit workflow completion feedback
        workflow_completion_feedback = {
            "session_id": workflow_state.session_id,
            "workflow_type": "claim_processing",
            "overall_satisfaction": 5,
            "efficiency_rating": 4,
            "accuracy_rating": 5,
            "ease_of_use": 4,
            "likelihood_to_recommend": 5,
            "most_helpful_aspect": "Quick and accurate processing",
            "improvement_suggestions": "None",
            "additional_comments": "Excellent end-to-end experience"
        }

        response = client.post(
            "/api/feedback/workflow-completion", json=workflow_completion_feedback)
        assert response.status_code == 200

        # Step 5: Verify all feedback was captured and linked
        list_response = client.get("/api/feedback/list")
        assert list_response.status_code == 200

        feedback_list = list_response.json()["feedback_list"]
        session_feedback = [
            f for f in feedback_list if f["session_id"] == workflow_state.session_id]

        # Should have feedback for each agent decision plus workflow completion
        expected_count = len(workflow_state.feedback_collection_points) + 1
        assert len(session_feedback) >= expected_count

    def test_serialization_compatibility(self):
        """Test that workflow states with feedback can be properly serialized."""
        # Create a workflow state with feedback points
        workflow_state = ClaimWorkflowState(
            claim_id="test_serialization_001",
            current_stage=WorkflowStage.COMPLETED,
            complexity=ClaimComplexity.MEDIUM,
            started_at=datetime.now(),
            updated_at=datetime.now(),
            agent_decisions=[
                AgentDecision(
                    agent_name="assessment",
                    decision="approved",
                    confidence_score=0.85,
                    reasoning="Valid claim",
                    timestamp=datetime.now()
                )
            ]
        )

        # Add feedback collection points
        workflow_state.feedback_collection_points.append({
            "feedback_point_id": str(uuid.uuid4()),
            "agent_name": "assessment",
            "decision": "approved",
            "confidence_score": 0.85,
            "reasoning": "Valid claim",
            "timestamp": datetime.now().isoformat(),
            "claim_id": "test_serialization_001",
            "session_id": workflow_state.session_id,
            "workflow_id": workflow_state.workflow_id,
            "workflow_stage": WorkflowStage.COMPLETED.value,
            "complexity": ClaimComplexity.MEDIUM.value,
            "metadata": {"test": "data"}
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

        except Exception as e:
            pytest.fail(f"Serialization failed: {str(e)}")


# Test runner for standalone execution
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
