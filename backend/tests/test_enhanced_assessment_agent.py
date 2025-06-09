"""
Comprehensive test suite for the Enhanced Assessment Agent.

This script tests the Enhanced Assessment Agent with various claim scenarios
to verify accuracy, performance, and decision-making capabilities.
"""

import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any

from app.agents.assessment import (
    EnhancedAssessmentAgent,
    AssessmentDecision,
    ConfidenceLevel,
)


class AssessmentTestSuite:
    """Comprehensive test suite for Enhanced Assessment Agent."""

    def __init__(self):
        self.agent = None
        self.test_results = []
        self.performance_metrics = {}

    async def initialize_agent(self):
        """Initialize the Enhanced Assessment Agent."""
        try:
            self.agent = EnhancedAssessmentAgent()
            print("✅ Enhanced Assessment Agent initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize agent: {str(e)}")
            return False

    def get_test_scenarios(self) -> List[Dict[str, Any]]:
        """Get comprehensive test scenarios covering various claim types."""
        return [
            {
                "name": "Simple Low-Value Auto Claim",
                "expected_decision": "approve",
                "claim_data": {
                    "claim_id": "TEST_001",
                    "policy_number": "AUTO_12345",
                    "incident_date": "2024-01-15",
                    "reported_date": "2024-01-15",
                    "description": "Minor parking lot collision. Small scratch on rear bumper from shopping cart.",
                    "amount": 450,
                    "location": "Walmart parking lot, Main Street",
                    "claimant_name": "John Smith",
                    "incident_report": True,
                    "photos": True,
                    "police_report": False,
                    "repair_estimates": True,
                },
                "policy_data": {
                    "policy_type": "Auto Comprehensive",
                    "coverage_limits": 50000,
                    "deductible": 500,
                    "status": "active",
                    "effective_date": "2023-06-01",
                    "expiration_date": "2024-06-01",
                },
            },
            {
                "name": "High-Value Total Loss Claim",
                "expected_decision": "human_review",
                "claim_data": {
                    "claim_id": "TEST_002",
                    "policy_number": "AUTO_67890",
                    "incident_date": "2024-01-10",
                    "reported_date": "2024-01-11",
                    "description": "Total loss due to collision with commercial truck on highway. Vehicle completely destroyed.",
                    "amount": 75000,
                    "location": "Interstate 95, Mile Marker 45",
                    "claimant_name": "Sarah Johnson",
                    "incident_report": True,
                    "photos": True,
                    "police_report": True,
                    "medical_records": True,
                    "repair_estimates": False,  # Total loss
                },
                "policy_data": {
                    "policy_type": "Auto Full Coverage",
                    "coverage_limits": 100000,
                    "deductible": 1000,
                    "status": "active",
                    "effective_date": "2023-01-01",
                    "expiration_date": "2024-01-01",
                },
            },
            {
                "name": "Suspicious Theft Claim",
                "expected_decision": "investigate",
                "claim_data": {
                    "claim_id": "TEST_003",
                    "policy_number": "AUTO_11111",
                    "incident_date": "2024-01-20",
                    "reported_date": "2024-01-25",  # 5-day delay
                    "description": "Vehicle stolen from secure parking garage. No witnesses, no security footage available.",
                    "amount": 45000,
                    "location": "Downtown parking garage, 5th floor",
                    "claimant_name": "Mike Wilson",
                    "incident_report": False,
                    "photos": False,
                    "police_report": True,
                    "repair_estimates": False,
                },
                "policy_data": {
                    "policy_type": "Auto Comprehensive",
                    "coverage_limits": 60000,
                    "deductible": 1000,
                    "status": "active",
                    "effective_date": "2023-12-01",
                    "expiration_date": "2024-12-01",
                },
            },
            {
                "name": "Fraud Indicators Present",
                "expected_decision": "investigate",
                "claim_data": {
                    "claim_id": "TEST_004",
                    "policy_number": "AUTO_22222",
                    "incident_date": "2024-01-18",
                    "reported_date": "2024-01-19",
                    "description": "Fire damage to vehicle. Claim involves total loss due to electrical fire in garage.",
                    "amount": 55000,
                    "location": "Private garage at home",
                    "claimant_name": "Robert Brown",
                    "incident_report": True,
                    "photos": True,
                    "police_report": False,
                    "repair_estimates": False,
                },
                "policy_data": {
                    "policy_type": "Auto Comprehensive",
                    "coverage_limits": 70000,
                    "deductible": 500,
                    "status": "active",
                    "effective_date": "2023-11-15",  # Recently purchased
                    "expiration_date": "2024-11-15",
                },
            },
            {
                "name": "Well-Documented Medium Claim",
                "expected_decision": "approve",
                "claim_data": {
                    "claim_id": "TEST_005",
                    "policy_number": "AUTO_33333",
                    "incident_date": "2024-01-12",
                    "reported_date": "2024-01-12",
                    "description": "Rear-end collision at traffic light. Other driver admitted fault. Damage to rear bumper and trunk.",
                    "amount": 3500,
                    "location": "Main St & Oak Ave intersection",
                    "claimant_name": "Lisa Davis",
                    "incident_report": True,
                    "photos": True,
                    "police_report": True,
                    "repair_estimates": True,
                },
                "policy_data": {
                    "policy_type": "Auto Collision",
                    "coverage_limits": 50000,
                    "deductible": 500,
                    "status": "active",
                    "effective_date": "2022-03-01",
                    "expiration_date": "2024-03-01",
                },
            },
            {
                "name": "Missing Documentation Claim",
                "expected_decision": "investigate",
                "claim_data": {
                    "claim_id": "TEST_006",
                    "policy_number": "AUTO_44444",
                    "incident_date": "2024-01-08",
                    "reported_date": "2024-01-10",
                    "description": "Hail damage to vehicle during storm. Multiple dents on hood and roof.",
                    "amount": 2800,
                    "location": "Home driveway",
                    "claimant_name": "David Miller",
                    "incident_report": False,
                    "photos": False,
                    "police_report": False,
                    "repair_estimates": True,
                },
                "policy_data": {
                    "policy_type": "Auto Comprehensive",
                    "coverage_limits": 40000,
                    "deductible": 1000,
                    "status": "active",
                    "effective_date": "2023-08-01",
                    "expiration_date": "2024-08-01",
                },
            },
            {
                "name": "Professional Athlete High-Stakes Claim",
                "expected_decision": "human_review",
                "claim_data": {
                    "claim_id": "TEST_007",
                    "policy_number": "AUTO_55555",
                    "incident_date": "2024-01-14",
                    "reported_date": "2024-01-14",
                    "description": "Professional basketball player involved in minor collision. Claims career-ending injury from minor impact.",
                    "amount": 25000,  # Vehicle damage only
                    "location": "Team practice facility parking lot",
                    "claimant_name": "Marcus Thompson",
                    "incident_report": True,
                    "photos": True,
                    "police_report": False,
                    "medical_records": True,
                    "repair_estimates": True,
                },
                "policy_data": {
                    "policy_type": "Auto Premium Coverage",
                    "coverage_limits": 500000,
                    "deductible": 2500,
                    "status": "active",
                    "effective_date": "2023-09-01",
                    "expiration_date": "2024-09-01",
                },
            },
            {
                "name": "Weather-Related Claim with Verification",
                "expected_decision": "approve",
                "claim_data": {
                    "claim_id": "TEST_008",
                    "policy_number": "AUTO_66666",
                    "incident_date": "2024-01-16",
                    "reported_date": "2024-01-16",
                    "description": "Tree fell on vehicle during documented storm. Weather service confirms severe winds in area.",
                    "amount": 8500,
                    "location": "Residential street, Oak Lane",
                    "claimant_name": "Jennifer White",
                    "incident_report": True,
                    "photos": True,
                    "police_report": False,
                    "repair_estimates": True,
                },
                "policy_data": {
                    "policy_type": "Auto Comprehensive",
                    "coverage_limits": 60000,
                    "deductible": 500,
                    "status": "active",
                    "effective_date": "2022-12-01",
                    "expiration_date": "2024-12-01",
                },
            },
        ]

    async def run_single_test(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single test scenario and return results."""
        print(f"\n🧪 Testing: {scenario['name']}")

        start_time = time.time()

        try:
            # Perform assessment
            result = await self.agent.assess_claim(
                scenario["claim_data"], scenario.get("policy_data")
            )

            processing_time = time.time() - start_time

            # Analyze results
            test_result = {
                "scenario_name": scenario["name"],
                "success": True,
                "decision": result.decision.value,
                "expected_decision": scenario.get("expected_decision", "unknown"),
                "decision_matches_expected": result.decision.value
                == scenario.get("expected_decision", "unknown"),
                "confidence_score": result.confidence_score,
                "confidence_level": result.confidence_level.value,
                "processing_time": processing_time,
                "risk_factors_count": len(result.risk_factors),
                "fraud_risk_score": result.fraud_risk_score,
                "documentation_completeness": result.documentation_completeness,
                "reasoning_length": len(result.reasoning),
                "recommended_actions_count": len(result.recommended_actions),
                "assessment_id": result.assessment_id,
                "detailed_reasoning": result.reasoning[:200] + "..."
                if len(result.reasoning) > 200
                else result.reasoning,
            }

            # Print summary
            status_emoji = "✅" if test_result["decision_matches_expected"] else "⚠️"
            print(
                f"  {status_emoji} Decision: {result.decision.value} (expected: {scenario.get('expected_decision', 'unknown')})"
            )
            print(
                f"  📊 Confidence: {result.confidence_score:.2f} ({result.confidence_level.value})"
            )
            print(f"  ⏱️ Processing: {processing_time:.2f}s")
            print(f"  🚨 Risk Factors: {len(result.risk_factors)}")

            return test_result

        except Exception as e:
            processing_time = time.time() - start_time
            print(f"  ❌ Test failed: {str(e)}")

            return {
                "scenario_name": scenario["name"],
                "success": False,
                "error": str(e),
                "processing_time": processing_time,
                "expected_decision": scenario.get("expected_decision", "unknown"),
            }

    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all test scenarios and compile results."""
        print("🚀 Starting Enhanced Assessment Agent Test Suite")
        print("=" * 60)

        if not await self.initialize_agent():
            return {"error": "Failed to initialize agent"}

        scenarios = self.get_test_scenarios()
        self.test_results = []

        # Run all tests
        for scenario in scenarios:
            result = await self.run_single_test(scenario)
            self.test_results.append(result)

        # Compile performance metrics
        successful_tests = [r for r in self.test_results if r.get("success", False)]

        self.performance_metrics = {
            "total_tests": len(self.test_results),
            "successful_tests": len(successful_tests),
            "success_rate": len(successful_tests) / len(self.test_results)
            if self.test_results
            else 0,
            "average_processing_time": sum(
                r.get("processing_time", 0) for r in successful_tests
            )
            / len(successful_tests)
            if successful_tests
            else 0,
            "average_confidence": sum(
                r.get("confidence_score", 0) for r in successful_tests
            )
            / len(successful_tests)
            if successful_tests
            else 0,
            "decision_accuracy": sum(
                1 for r in successful_tests if r.get("decision_matches_expected", False)
            )
            / len(successful_tests)
            if successful_tests
            else 0,
            "average_risk_factors": sum(
                r.get("risk_factors_count", 0) for r in successful_tests
            )
            / len(successful_tests)
            if successful_tests
            else 0,
            "average_fraud_risk": sum(
                r.get("fraud_risk_score", 0) for r in successful_tests
            )
            / len(successful_tests)
            if successful_tests
            else 0,
            "average_documentation_completeness": sum(
                r.get("documentation_completeness", 0) for r in successful_tests
            )
            / len(successful_tests)
            if successful_tests
            else 0,
        }

        return {
            "test_results": self.test_results,
            "performance_metrics": self.performance_metrics,
            "agent_capabilities": self.agent.get_assessment_capabilities()
            if self.agent
            else None,
        }

    def print_summary_report(self):
        """Print a comprehensive summary report."""
        print("\n" + "=" * 60)
        print("📊 ENHANCED ASSESSMENT AGENT TEST SUMMARY")
        print("=" * 60)

        if not self.performance_metrics:
            print("❌ No test results available")
            return

        # Overall Performance
        print(f"\n🎯 OVERALL PERFORMANCE:")
        print(f"  Total Tests: {self.performance_metrics['total_tests']}")
        print(f"  Successful Tests: {self.performance_metrics['successful_tests']}")
        print(f"  Success Rate: {self.performance_metrics['success_rate']:.1%}")
        print(
            f"  Decision Accuracy: {self.performance_metrics['decision_accuracy']:.1%}"
        )

        # Performance Metrics
        print(f"\n⚡ PERFORMANCE METRICS:")
        print(
            f"  Average Processing Time: {self.performance_metrics['average_processing_time']:.2f}s"
        )
        print(
            f"  Average Confidence Score: {self.performance_metrics['average_confidence']:.2f}"
        )
        print(
            f"  Average Risk Factors: {self.performance_metrics['average_risk_factors']:.1f}"
        )
        print(
            f"  Average Fraud Risk Score: {self.performance_metrics['average_fraud_risk']:.2f}"
        )
        print(
            f"  Average Documentation Completeness: {self.performance_metrics['average_documentation_completeness']:.2f}"
        )

        # Decision Breakdown
        print(f"\n🎯 DECISION BREAKDOWN:")
        decision_counts = {}
        for result in self.test_results:
            if result.get("success"):
                decision = result.get("decision", "unknown")
                decision_counts[decision] = decision_counts.get(decision, 0) + 1

        for decision, count in decision_counts.items():
            percentage = (
                (count / self.performance_metrics["successful_tests"]) * 100
                if self.performance_metrics["successful_tests"] > 0
                else 0
            )
            print(f"  {decision.upper()}: {count} ({percentage:.1f}%)")

        # Individual Test Results
        print(f"\n📋 INDIVIDUAL TEST RESULTS:")
        for result in self.test_results:
            if result.get("success"):
                status = "✅" if result.get("decision_matches_expected") else "⚠️"
                print(
                    f"  {status} {result['scenario_name']}: {result['decision']} ({result['confidence_score']:.2f} confidence)"
                )
            else:
                print(
                    f"  ❌ {result['scenario_name']}: FAILED - {result.get('error', 'Unknown error')}"
                )

        print("\n" + "=" * 60)


async def main():
    """Main test execution function."""
    test_suite = AssessmentTestSuite()

    # Run all tests
    results = await test_suite.run_all_tests()

    # Print summary report
    test_suite.print_summary_report()

    # Save detailed results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"enhanced_assessment_test_results_{timestamp}.json"

    with open(filename, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n💾 Detailed results saved to: {filename}")

    return results


if __name__ == "__main__":
    # Run the test suite
    results = asyncio.run(main())
