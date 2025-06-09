#!/usr/bin/env python3
"""
Comprehensive test script for the Orchestrator Agent workflow.

This script tests all aspects of the orchestrator agent including:
- Complexity assessment
- Custom workflow processing
- GraphFlow workflow processing
- Error handling
- Agent coordination
"""

from app.agents.base import ClaimAssessmentAgent, CustomerCommunicationAgent
from app.agents.orchestrator import OrchestratorAgent, WorkflowStage, ClaimComplexity
import asyncio
import json
import sys
import time
from typing import Dict, Any, List

# Add the app directory to the path for imports
sys.path.append("/Users/ali/Dev/ip/simple-insurance-multi-agent/backend")


class WorkflowTester:
    """Comprehensive workflow testing class."""

    def __init__(self):
        self.orchestrator = None
        self.test_results = []

    async def setup(self):
        """Initialize the orchestrator agent."""
        try:
            self.orchestrator = OrchestratorAgent()
            await self.orchestrator.initialize_agents()
            print("✅ Orchestrator agent initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize orchestrator: {str(e)}")
            return False

    def log_test_result(
        self, test_name: str, success: bool, details: Dict[str, Any] = None
    ):
        """Log test results for reporting."""
        result = {
            "test_name": test_name,
            "success": success,
            "timestamp": time.time(),
            "details": details or {},
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if details and not success:
            print(f"   Error: {details.get('error', 'Unknown error')}")

    async def test_complexity_assessment(self):
        """Test claim complexity assessment logic."""
        print("\n🧪 Testing Complexity Assessment...")

        test_cases = [
            {
                "name": "Low Complexity Claim",
                "claim": {
                    "claim_id": "test-low-001",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Small scratch on door",
                    "amount": 500,
                },
                "expected_complexity": ClaimComplexity.LOW,
                "expected_escalation": False,
            },
            {
                "name": "Medium Complexity Claim",
                "claim": {
                    "claim_id": "test-medium-001",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Fender bender in parking lot",
                    "amount": 15000,
                },
                "expected_complexity": ClaimComplexity.MEDIUM,
                "expected_escalation": False,
            },
            {
                "name": "High Complexity Claim - Amount",
                "claim": {
                    "claim_id": "test-high-001",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Major collision on highway",
                    "amount": 75000,
                },
                "expected_complexity": ClaimComplexity.HIGH,
                "expected_escalation": True,
            },
            {
                "name": "High Complexity Claim - Fraud Keywords",
                "claim": {
                    "claim_id": "test-high-002",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Suspected fraud case with litigation pending",
                    "amount": 25000,
                },
                "expected_complexity": ClaimComplexity.HIGH,
                "expected_escalation": True,
            },
        ]

        for test_case in test_cases:
            try:
                complexity = self.orchestrator.assess_claim_complexity(
                    test_case["claim"]
                )
                should_escalate = self.orchestrator.should_escalate_to_human(
                    test_case["claim"], []
                )

                success = (
                    complexity == test_case["expected_complexity"]
                    and should_escalate == test_case["expected_escalation"]
                )

                self.log_test_result(
                    test_case["name"],
                    success,
                    {
                        "actual_complexity": complexity.value,
                        "expected_complexity": test_case["expected_complexity"].value,
                        "actual_escalation": should_escalate,
                        "expected_escalation": test_case["expected_escalation"],
                    },
                )

            except Exception as e:
                self.log_test_result(test_case["name"], False, {"error": str(e)})

    async def test_custom_workflow(self):
        """Test custom workflow processing."""
        print("\n🧪 Testing Custom Workflow Processing...")

        test_claims = [
            {
                "name": "Simple Claim Workflow",
                "claim": {
                    "claim_id": "test-workflow-simple",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Minor door ding",
                    "amount": 800,
                },
            },
            {
                "name": "Complex Claim Workflow",
                "claim": {
                    "claim_id": "test-workflow-complex",
                    "policy_number": "POL789012",
                    "incident_date": "2024-01-15",
                    "description": "Multi-vehicle accident with injuries",
                    "amount": 45000,
                },
            },
        ]

        for test_case in test_claims:
            try:
                start_time = time.time()
                workflow_state = await self.orchestrator.process_claim_workflow(
                    test_case["claim"]
                )
                end_time = time.time()

                success = (
                    workflow_state.claim_id == test_case["claim"]["claim_id"]
                    and workflow_state.current_stage
                    in [WorkflowStage.COMPLETED, WorkflowStage.HUMAN_REVIEW]
                    and len(workflow_state.agent_decisions) > 0
                )

                self.log_test_result(
                    test_case["name"],
                    success,
                    {
                        "final_stage": workflow_state.current_stage.value,
                        "agent_decisions_count": len(workflow_state.agent_decisions),
                        "processing_time": round(end_time - start_time, 2),
                        "requires_human_review": workflow_state.requires_human_review,
                        "workflow_id": workflow_state.workflow_id,
                    },
                )

            except Exception as e:
                self.log_test_result(test_case["name"], False, {"error": str(e)})

    async def test_graphflow_workflow(self):
        """Test AutoGen GraphFlow workflow processing."""
        print("\n🧪 Testing GraphFlow Workflow Processing...")

        test_claim = {
            "claim_id": "test-graphflow-comprehensive",
            "policy_number": "POL123456",
            "incident_date": "2024-01-15",
            "description": "Comprehensive GraphFlow test claim",
            "amount": 5000,
        }

        try:
            start_time = time.time()
            result = await self.orchestrator.run_graphflow_workflow(test_claim)
            end_time = time.time()

            success = (
                result.get("success", False)
                and result.get("workflow_completed", False)
                and
                # Task, Assessment, Communication, Completion
                len(result.get("messages", [])) >= 3
            )

            self.log_test_result(
                "GraphFlow Workflow Execution",
                success,
                {
                    "message_count": len(result.get("messages", [])),
                    "processing_time": round(end_time - start_time, 2),
                    "workflow_completed": result.get("workflow_completed", False),
                    "has_assessment": any(
                        "assess" in msg.lower() for msg in result.get("messages", [])
                    ),
                    "has_communication": any(
                        "dear" in msg.lower() or "thank you" in msg.lower()
                        for msg in result.get("messages", [])
                    ),
                },
            )

        except Exception as e:
            self.log_test_result(
                "GraphFlow Workflow Execution", False, {"error": str(e)}
            )

    async def test_error_handling(self):
        """Test error handling scenarios."""
        print("\n🧪 Testing Error Handling...")

        # Test with invalid claim data
        invalid_claims = [
            {
                "name": "Missing Required Fields",
                "claim": {
                    "claim_id": "test-invalid-001",
                    # Missing policy_number, incident_date, description
                    "amount": 1000,
                },
            },
            {
                "name": "Invalid Amount Format",
                "claim": {
                    "claim_id": "test-invalid-002",
                    "policy_number": "POL123456",
                    "incident_date": "2024-01-15",
                    "description": "Test claim",
                    "amount": "invalid_amount",
                },
            },
        ]

        for test_case in invalid_claims:
            try:
                workflow_state = await self.orchestrator.process_claim_workflow(
                    test_case["claim"]
                )

                # For error handling, we expect the workflow to handle errors gracefully
                success = (
                    workflow_state.current_stage == WorkflowStage.FAILED
                    or workflow_state.error_message is not None
                )

                self.log_test_result(
                    test_case["name"],
                    success,
                    {
                        "final_stage": workflow_state.current_stage.value,
                        "error_message": workflow_state.error_message,
                        "handled_gracefully": workflow_state.current_stage
                        == WorkflowStage.FAILED,
                    },
                )

            except Exception as e:
                # If an exception is thrown, that's also acceptable error handling
                self.log_test_result(test_case["name"], True, {"error_caught": str(e)})

    async def test_agent_coordination(self):
        """Test coordination between different agents."""
        print("\n🧪 Testing Agent Coordination...")

        try:
            # Test individual agent initialization
            assessment_agent = ClaimAssessmentAgent()
            communication_agent = CustomerCommunicationAgent()

            test_claim = {
                "claim_id": "test-coordination-001",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Agent coordination test",
                "amount": 3000,
            }

            # Test assessment agent
            assessment_result = await assessment_agent.assess_claim_validity(test_claim)

            # Test communication agent with assessment context
            context = {
                "assessment_decision": "approved",
                "confidence_score": 0.85,
                "claim_data": test_claim,
            }
            communication_result = await communication_agent.draft_customer_response(
                f"Claim status update for {test_claim['claim_id']}", context
            )

            success = (
                assessment_result.get("status") == "processed"
                and communication_result.get("status") == "success"
            )

            self.log_test_result(
                "Agent Coordination Test",
                success,
                {
                    "assessment_status": assessment_result.get("status"),
                    "communication_status": communication_result.get("status"),
                    "assessment_has_reasoning": "assessment" in assessment_result,
                    "communication_has_draft": "draft" in communication_result,
                },
            )

        except Exception as e:
            self.log_test_result("Agent Coordination Test", False, {"error": str(e)})

    def generate_test_report(self):
        """Generate a comprehensive test report."""
        print("\n📊 Test Report Summary")
        print("=" * 50)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")

        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(
                        f"  - {result['test_name']}: {result['details'].get('error', 'Unknown error')}"
                    )

        print("\n✅ Passed Tests:")
        for result in self.test_results:
            if result["success"]:
                print(f"  - {result['test_name']}")

        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests / total_tests) * 100,
            "results": self.test_results,
        }


async def main():
    """Run all workflow tests."""
    print("🚀 Starting Orchestrator Agent Workflow Tests")
    print("=" * 50)

    tester = WorkflowTester()

    # Setup
    if not await tester.setup():
        print("❌ Setup failed. Exiting.")
        return

    # Run all tests
    await tester.test_complexity_assessment()
    await tester.test_custom_workflow()
    await tester.test_graphflow_workflow()
    await tester.test_error_handling()
    await tester.test_agent_coordination()

    # Generate report
    report = tester.generate_test_report()

    # Save report to file
    with open("orchestrator_test_report.json", "w") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n📄 Detailed test report saved to: orchestrator_test_report.json")

    return report["success_rate"] == 100.0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
