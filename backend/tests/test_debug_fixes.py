#!/usr/bin/env python3
"""
Test script to verify debugging fixes for orchestrator agent issues.

This script specifically tests the two issues identified in the test report:
1. Low complexity claim assessment
2. Invalid amount format handling
"""

from app.agents.orchestrator import OrchestratorAgent, ClaimComplexity, WorkflowStage
import sys
import asyncio
from typing import Dict, Any

# Add the app directory to the path for imports
sys.path.append("/Users/ali/Dev/ip/simple-insurance-multi-agent/backend")


async def test_complexity_fix():
    """Test that the complexity assessment fix works correctly."""
    print("🧪 Testing Complexity Assessment Fix...")

    orchestrator = OrchestratorAgent()

    # Test case that was failing: Low complexity claim
    low_complexity_claim = {
        "claim_id": "test-low-001",
        "policy_number": "POL123456",
        "incident_date": "2024-01-15",
        "description": "Small scratch on door",
        "amount": 500,
    }

    complexity = orchestrator.assess_claim_complexity(low_complexity_claim)

    print(f"   Low complexity claim ($500, simple description):")
    print(f"   Expected: LOW, Actual: {complexity.value}")

    if complexity == ClaimComplexity.LOW:
        print("   ✅ FIXED: Low complexity assessment now works correctly")
        return True
    else:
        print("   ❌ STILL BROKEN: Low complexity assessment failed")
        return False


async def test_invalid_amount_fix():
    """Test that invalid amount format handling works correctly."""
    print("\n🧪 Testing Invalid Amount Format Fix...")

    orchestrator = OrchestratorAgent()

    # Test case that was failing: Invalid amount format
    invalid_amount_claim = {
        "claim_id": "test-invalid-amount",
        "policy_number": "POL123456",
        "incident_date": "2024-01-15",
        "description": "Test claim with invalid amount",
        "amount": "invalid_amount_format",
    }

    try:
        workflow_state = await orchestrator.process_claim_workflow(invalid_amount_claim)

        print(f"   Invalid amount claim:")
        print(f"   Final stage: {workflow_state.current_stage.value}")
        print(f"   Error message: {workflow_state.error_message}")

        if (
            workflow_state.current_stage == WorkflowStage.FAILED
            and workflow_state.error_message
        ):
            print("   ✅ FIXED: Invalid amount format now fails gracefully")
            return True
        else:
            print("   ❌ STILL BROKEN: Invalid amount format not handled properly")
            return False

    except Exception as e:
        print(f"   ❌ EXCEPTION: {str(e)}")
        return False


async def test_edge_cases():
    """Test additional edge cases to ensure robustness."""
    print("\n🧪 Testing Additional Edge Cases...")

    orchestrator = OrchestratorAgent()

    test_cases = [
        {
            "name": "Negative Amount",
            "claim": {
                "claim_id": "test-negative",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Test claim",
                "amount": -1000,
            },
            "should_fail": True,
        },
        {
            "name": "Zero Amount",
            "claim": {
                "claim_id": "test-zero",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Test claim",
                "amount": 0,
            },
            "should_fail": False,
        },
        {
            "name": "String Amount Valid",
            "claim": {
                "claim_id": "test-string-valid",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Test claim",
                "amount": "$1,500.00",
            },
            "should_fail": False,
        },
        {
            "name": "Low Amount with Docs",
            "claim": {
                "claim_id": "test-low-with-docs",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Small scratch",
                "amount": 500,
                "incident_report": "report.pdf",
                "photos": "photos.zip",
            },
            "should_fail": False,
            "expected_complexity": ClaimComplexity.LOW,
        },
    ]

    results = []

    for test_case in test_cases:
        try:
            workflow_state = await orchestrator.process_claim_workflow(
                test_case["claim"]
            )

            if test_case["should_fail"]:
                success = workflow_state.current_stage == WorkflowStage.FAILED
                status = "✅" if success else "❌"
                print(
                    f"   {status} {test_case['name']}: Expected failure, got {workflow_state.current_stage.value}"
                )
            else:
                success = workflow_state.current_stage != WorkflowStage.FAILED
                status = "✅" if success else "❌"
                print(
                    f"   {status} {test_case['name']}: Expected success, got {workflow_state.current_stage.value}"
                )

                # Check complexity if specified
                if "expected_complexity" in test_case:
                    complexity = orchestrator.assess_claim_complexity(
                        test_case["claim"]
                    )
                    complexity_correct = complexity == test_case["expected_complexity"]
                    complexity_status = "✅" if complexity_correct else "❌"
                    print(
                        f"      {complexity_status} Complexity: Expected {test_case['expected_complexity'].value}, got {complexity.value}"
                    )
                    success = success and complexity_correct

            results.append(success)

        except Exception as e:
            print(f"   ❌ {test_case['name']}: Exception - {str(e)}")
            results.append(False)

    return all(results)


async def main():
    """Run all debugging tests."""
    print("🔧 Running Debugging Fix Verification Tests\n")

    try:
        # Test the specific fixes
        complexity_fixed = await test_complexity_fix()
        amount_fixed = await test_invalid_amount_fix()
        edge_cases_pass = await test_edge_cases()

        # Summary
        print(f"\n📊 Test Results Summary:")
        print(
            f"   Complexity Assessment Fix: {'✅ PASSED' if complexity_fixed else '❌ FAILED'}"
        )
        print(
            f"   Invalid Amount Format Fix: {'✅ PASSED' if amount_fixed else '❌ FAILED'}"
        )
        print(f"   Edge Cases: {'✅ PASSED' if edge_cases_pass else '❌ FAILED'}")

        total_passed = sum([complexity_fixed, amount_fixed, edge_cases_pass])
        print(f"\n🎯 Overall: {total_passed}/3 test categories passed")

        if total_passed == 3:
            print("🎉 All debugging fixes verified successfully!")
        else:
            print("⚠️  Some issues still need attention.")

    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())
