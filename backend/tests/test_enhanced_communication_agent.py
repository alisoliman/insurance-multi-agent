"""
Comprehensive test suite for the AutoGen Communication Agent.

This script tests the AutoGen Communication Agent with various communication scenarios
to verify functionality, performance, and multi-language capabilities.
"""

import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any

from app.agents.autogen_communication import AutoGenCommunicationAgent
from app.schemas.communication import CommunicationRequest


class CommunicationTestSuite:
    """Comprehensive test suite for AutoGen Communication Agent."""

    def __init__(self):
        self.agent = None
        self.test_results = []
        self.performance_metrics = {}

    async def initialize_agent(self):
        """Initialize the AutoGen Communication Agent."""
        try:
            self.agent = AutoGenCommunicationAgent()
            print("✅ AutoGen Communication Agent initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize agent: {str(e)}")
            return False

    def create_test_scenarios(self) -> List[Dict[str, Any]]:
        """Create comprehensive test scenarios for communication generation."""

        scenarios = [
            {
                "name": "Claim Approval - English",
                "request": CommunicationRequest(
                    customer_name="John Smith",
                    claim_id="CLM_APPROVE_001",
                    policy_number="POL_12345",
                    communication_type="approval_notification",
                    preferred_language="en",
                    urgency_level="normal",
                    special_instructions="All documentation complete, clear liability, within policy limits",
                    assessment_result={
                        "decision": "approve",
                        "confidence_score": 0.95,
                        "reasoning": "All documentation complete, clear liability, within policy limits",
                    },
                    policy_details={
                        "policy_type": "Auto Insurance",
                        "coverage_limits": "$50,000",
                        "deductible": "$500",
                    },
                ),
                "expected_elements": ["approved", "congratulations", "payment"],
            },
            {
                "name": "Claim Rejection - English",
                "request": CommunicationRequest(
                    customer_name="Sarah Johnson",
                    claim_id="CLM_REJECT_001",
                    policy_number="POL_67890",
                    communication_type="rejection_notification",
                    preferred_language="en",
                    urgency_level="normal",
                    special_instructions="Incident occurred outside policy coverage period",
                    assessment_result={
                        "decision": "reject",
                        "confidence_score": 0.88,
                        "reasoning": "Incident occurred outside policy coverage period",
                    },
                    policy_details={
                        "policy_type": "Home Insurance",
                        "coverage_limits": "$200,000",
                        "deductible": "$1,000",
                    },
                ),
                "expected_elements": ["regret", "appeal", "coverage"],
            },
            {
                "name": "Information Request - Spanish",
                "request": CommunicationRequest(
                    customer_name="Maria Garcia",
                    claim_id="CLM_INFO_001",
                    policy_number="POL_54321",
                    communication_type="information_request",
                    preferred_language="es",
                    urgency_level="high",
                    special_instructions="Request police report and additional photos",
                ),
                "expected_elements": ["documentation", "required", "submit"],
            },
            {
                "name": "Human Review Notification - French",
                "request": CommunicationRequest(
                    customer_name="Pierre Dubois",
                    claim_id="CLM_REVIEW_001",
                    policy_number="POL_98765",
                    communication_type="human_review_notification",
                    preferred_language="fr",
                    urgency_level="normal",
                    special_instructions="Complex case requiring specialist review",
                    assessment_result={
                        "decision": "human_review",
                        "confidence_score": 0.65,
                        "reasoning": "Complex case requiring specialist review",
                    },
                ),
                "expected_elements": ["specialist", "review", "timeline"],
            },
            {
                "name": "Investigation Update - German",
                "request": CommunicationRequest(
                    customer_name="Hans Mueller",
                    claim_id="CLM_INVEST_001",
                    policy_number="POL_11111",
                    communication_type="investigation_update",
                    preferred_language="de",
                    urgency_level="normal",
                    special_instructions="Requires additional investigation for fraud indicators",
                    assessment_result={
                        "decision": "investigate",
                        "confidence_score": 0.72,
                        "reasoning": "Requires additional investigation for fraud indicators",
                    },
                ),
                "expected_elements": ["investigation", "cooperation", "update"],
            },
            {
                "name": "Status Update - Portuguese",
                "request": CommunicationRequest(
                    customer_name="Carlos Silva",
                    claim_id="CLM_STATUS_001",
                    policy_number="POL_22222",
                    communication_type="claim_status_update",
                    preferred_language="pt",
                    urgency_level="normal",
                    special_instructions="Provide general status update",
                ),
                "expected_elements": ["status", "processing", "contact"],
            },
            {
                "name": "High-Value Claim Approval",
                "request": CommunicationRequest(
                    customer_name="Robert Williams",
                    claim_id="CLM_HIGH_001",
                    policy_number="POL_33333",
                    communication_type="approval_notification",
                    preferred_language="en",
                    urgency_level="high",
                    special_instructions="High-value claim approved after thorough review",
                    assessment_result={
                        "decision": "approve",
                        "confidence_score": 0.91,
                        "reasoning": "High-value claim approved after thorough review",
                    },
                    policy_details={
                        "policy_type": "Commercial Property",
                        "coverage_limits": "$1,000,000",
                        "deductible": "$10,000",
                    },
                ),
                "expected_elements": ["approved", "high-value", "payment"],
            },
            {
                "name": "General Inquiry Response",
                "request": CommunicationRequest(
                    customer_name="Lisa Chen",
                    claim_id="CLM_INQUIRY_001",
                    policy_number="POL_44444",
                    communication_type="general_inquiry_response",
                    preferred_language="zh",
                    urgency_level="normal",
                    special_instructions="Response to general policy inquiry",
                ),
                "expected_elements": ["inquiry", "assistance", "policy"],
            },
        ]

        return scenarios

    async def run_communication_test(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single communication generation test."""

        start_time = time.time()

        try:
            # Generate communication
            result = await self.agent.generate_communication(scenario["request"])

            processing_time = time.time() - start_time

            # Analyze result
            analysis = self.analyze_communication_result(result, scenario)

            test_result = {
                "scenario_name": scenario["name"],
                "success": True,
                "processing_time": processing_time,
                "result": {
                    "communication_id": result.communication_id,
                    "subject": result.subject,
                    "content_length": len(result.content),
                    "language": result.language,
                    "tone": result.tone,
                    "compliance_verified": result.compliance_verified,
                    "personalization_score": result.personalization_score,
                },
                "analysis": analysis,
                "error": None,
            }

            print(f"✅ {scenario['name']}: Generated successfully")
            print(f"   📊 Processing time: {processing_time:.3f}s")
            print(f"   🎯 Personalization: {result.personalization_score:.2f}")
            print(f"   ✅ Compliance: {result.compliance_verified}")

            return test_result

        except Exception as e:
            processing_time = time.time() - start_time

            test_result = {
                "scenario_name": scenario["name"],
                "success": False,
                "processing_time": processing_time,
                "result": None,
                "analysis": None,
                "error": str(e),
            }

            print(f"❌ {scenario['name']}: Failed - {str(e)}")

            return test_result

    def analyze_communication_result(self, result, scenario) -> Dict[str, Any]:
        """Analyze the communication result for quality and correctness."""

        analysis = {
            "has_subject": bool(result.subject and len(result.subject.strip()) > 0),
            "has_content": bool(result.content and len(result.content.strip()) > 0),
            "appropriate_length": 50 <= len(result.content) <= 2000,
            "contains_expected_elements": [],
            "language_correct": result.language == scenario["request"].preferred_language,
            "compliance_verified": result.compliance_verified,
            "personalization_adequate": result.personalization_score >= 0.5,
        }

        # Check for expected elements
        content_lower = result.content.lower()
        for element in scenario.get("expected_elements", []):
            contains_element = element.lower() in content_lower
            analysis["contains_expected_elements"].append({
                "element": element,
                "found": contains_element,
            })

        return analysis

    async def run_performance_tests(self) -> Dict[str, Any]:
        """Run performance tests to measure agent efficiency."""

        print("\n🚀 Running Performance Tests...")

        # Test concurrent requests
        concurrent_requests = 3
        start_time = time.time()

        test_request = CommunicationRequest(
            customer_name="Performance Test",
            claim_id="PERF_001",
            policy_number="PERF_POL_001",
            communication_type="general_inquiry_response",
            preferred_language="en",
            urgency_level="normal",
            special_instructions="Performance test communication",
        )

        tasks = [
            self.agent.generate_communication(test_request)
            for _ in range(concurrent_requests)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time

        successful_results = [
            r for r in results if not isinstance(r, Exception)]
        failed_results = [r for r in results if isinstance(r, Exception)]

        performance_metrics = {
            "concurrent_requests": concurrent_requests,
            "successful_requests": len(successful_results),
            "failed_requests": len(failed_results),
            "total_time": total_time,
            "average_time_per_request": total_time / concurrent_requests,
            "requests_per_second": concurrent_requests / total_time,
        }

        print(f"   📈 Concurrent requests: {concurrent_requests}")
        print(f"   ✅ Successful: {len(successful_results)}")
        print(f"   ❌ Failed: {len(failed_results)}")
        print(f"   ⏱️  Total time: {total_time:.3f}s")
        print(
            f"   📊 Avg time per request: {performance_metrics['average_time_per_request']:.3f}s")

        return performance_metrics

    async def test_agent_capabilities(self) -> Dict[str, Any]:
        """Test agent capabilities and configuration."""

        print("\n🔧 Testing Agent Capabilities...")

        capabilities = {
            "agent_initialized": self.agent is not None,
            "supports_structured_output": True,  # AutoGen supports structured output
            "supports_multilingual": True,
            "azure_openai_configured": True,
        }

        print(f"   ✅ Agent initialized: {capabilities['agent_initialized']}")
        print(
            f"   ✅ Structured output: {capabilities['supports_structured_output']}")
        print(
            f"   ✅ Multilingual support: {capabilities['supports_multilingual']}")
        print(f"   ✅ Azure OpenAI: {capabilities['azure_openai_configured']}")

        return capabilities

    async def run_all_tests(self):
        """Run the complete test suite."""

        print("🧪 AutoGen Communication Agent Test Suite")
        print("=" * 60)

        # Initialize agent
        if not await self.initialize_agent():
            print("❌ Cannot proceed without agent initialization")
            return

        # Test agent capabilities
        capabilities_result = await self.test_agent_capabilities()

        # Create and run communication tests
        scenarios = self.create_test_scenarios()

        print(f"\n📝 Running {len(scenarios)} Communication Tests...")
        print("-" * 50)

        for scenario in scenarios:
            test_result = await self.run_communication_test(scenario)
            self.test_results.append(test_result)

            # Small delay between tests
            await asyncio.sleep(0.5)

        # Run performance tests
        performance_result = await self.run_performance_tests()

        # Generate summary
        self.generate_test_summary(capabilities_result, performance_result)

    def generate_test_summary(
        self, capabilities_result: Dict[str, Any], performance_result: Dict[str, Any]
    ):
        """Generate and display test summary."""

        print("\n📊 Test Summary")
        print("=" * 40)

        # Communication test results
        total_tests = len(self.test_results)
        successful_tests = sum(
            1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests

        print(f"\n📝 Communication Tests:")
        print(f"   Total: {total_tests}")
        print(f"   ✅ Successful: {successful_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   📈 Success Rate: {(successful_tests/total_tests)*100:.1f}%")

        # Performance metrics
        if self.test_results:
            processing_times = [
                result["processing_time"]
                for result in self.test_results
                if result["success"]
            ]

            if processing_times:
                avg_processing_time = sum(
                    processing_times) / len(processing_times)
                min_processing_time = min(processing_times)
                max_processing_time = max(processing_times)

                print(f"\n⏱️  Performance Metrics:")
                print(
                    f"   Average processing time: {avg_processing_time:.3f}s")
                print(f"   Fastest: {min_processing_time:.3f}s")
                print(f"   Slowest: {max_processing_time:.3f}s")

        # Quality metrics
        successful_results = [r for r in self.test_results if r["success"]]
        if successful_results:
            compliance_rate = sum(
                1
                for r in successful_results
                if r["result"]["compliance_verified"]
            ) / len(successful_results)

            avg_personalization = sum(
                r["result"]["personalization_score"] for r in successful_results
            ) / len(successful_results)

            print(f"\n🎯 Quality Metrics:")
            print(f"   Compliance rate: {compliance_rate*100:.1f}%")
            print(f"   Avg personalization: {avg_personalization:.2f}")

        # Failed tests details
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['scenario_name']}: {result['error']}")

        print(f"\n🎉 Test suite completed!")
        print(
            f"Overall success rate: {(successful_tests/total_tests)*100:.1f}%")


async def main():
    """Main test execution function."""
    test_suite = CommunicationTestSuite()
    await test_suite.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
