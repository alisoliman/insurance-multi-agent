"""
Comprehensive test suite for the Enhanced Communication Agent.

This script tests the Enhanced Communication Agent with various communication scenarios
to verify functionality, performance, and multi-language capabilities.
"""

import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any

from app.agents.communication import (
    EnhancedCommunicationAgent,
    CommunicationType,
    CommunicationContext,
    Language,
    CommunicationTone
)


class CommunicationTestSuite:
    """Comprehensive test suite for Enhanced Communication Agent."""

    def __init__(self):
        self.agent = None
        self.test_results = []
        self.performance_metrics = {}

    async def initialize_agent(self):
        """Initialize the Enhanced Communication Agent."""
        try:
            self.agent = EnhancedCommunicationAgent()
            print("✅ Enhanced Communication Agent initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize agent: {str(e)}")
            return False

    def create_test_scenarios(self) -> List[Dict[str, Any]]:
        """Create comprehensive test scenarios for communication generation."""

        scenarios = [
            {
                "name": "Claim Approval - English",
                "context": CommunicationContext(
                    customer_name="John Smith",
                    claim_id="CLM_APPROVE_001",
                    policy_number="POL_12345",
                    communication_type=CommunicationType.APPROVAL_NOTIFICATION,
                    assessment_result={
                        "decision": "approve",
                        "confidence_score": 0.95,
                        "reasoning": "All documentation complete, clear liability, within policy limits"
                    },
                    policy_details={
                        "policy_type": "Auto Insurance",
                        "coverage_limits": "$50,000",
                        "deductible": "$500"
                    },
                    preferred_language=Language.ENGLISH
                ),
                "expected_tone": CommunicationTone.CONGRATULATORY,
                "expected_elements": ["approved", "congratulations", "payment"]
            },

            {
                "name": "Claim Rejection - English",
                "context": CommunicationContext(
                    customer_name="Sarah Johnson",
                    claim_id="CLM_REJECT_001",
                    policy_number="POL_67890",
                    communication_type=CommunicationType.REJECTION_NOTIFICATION,
                    assessment_result={
                        "decision": "reject",
                        "confidence_score": 0.88,
                        "reasoning": "Incident occurred outside policy coverage period"
                    },
                    policy_details={
                        "policy_type": "Home Insurance",
                        "coverage_limits": "$200,000",
                        "deductible": "$1,000"
                    },
                    preferred_language=Language.ENGLISH
                ),
                "expected_tone": CommunicationTone.EMPATHETIC,
                "expected_elements": ["regret", "appeal", "coverage"]
            },

            {
                "name": "Information Request - Spanish",
                "context": CommunicationContext(
                    customer_name="Maria Garcia",
                    claim_id="CLM_INFO_001",
                    policy_number="POL_54321",
                    communication_type=CommunicationType.INFORMATION_REQUEST,
                    special_instructions="Request police report and additional photos",
                    preferred_language=Language.SPANISH,
                    urgency_level="high"
                ),
                "expected_tone": CommunicationTone.PROFESSIONAL,
                "expected_elements": ["documentation", "required", "submit"]
            },

            {
                "name": "Human Review Notification - French",
                "context": CommunicationContext(
                    customer_name="Pierre Dubois",
                    claim_id="CLM_REVIEW_001",
                    policy_number="POL_98765",
                    communication_type=CommunicationType.HUMAN_REVIEW_NOTIFICATION,
                    assessment_result={
                        "decision": "human_review",
                        "confidence_score": 0.65,
                        "reasoning": "Complex case requiring specialist review"
                    },
                    preferred_language=Language.FRENCH
                ),
                "expected_tone": CommunicationTone.REASSURING,
                "expected_elements": ["specialist", "review", "timeline"]
            },

            {
                "name": "Investigation Update - German",
                "context": CommunicationContext(
                    customer_name="Hans Mueller",
                    claim_id="CLM_INVEST_001",
                    policy_number="POL_11111",
                    communication_type=CommunicationType.INVESTIGATION_UPDATE,
                    assessment_result={
                        "decision": "investigate",
                        "confidence_score": 0.72,
                        "reasoning": "Requires additional investigation for fraud indicators"
                    },
                    preferred_language=Language.GERMAN,
                    urgency_level="normal"
                ),
                "expected_tone": CommunicationTone.PROFESSIONAL,
                "expected_elements": ["investigation", "cooperation", "update"]
            },

            {
                "name": "Status Update - Portuguese",
                "context": CommunicationContext(
                    customer_name="Carlos Silva",
                    claim_id="CLM_STATUS_001",
                    policy_number="POL_22222",
                    communication_type=CommunicationType.CLAIM_STATUS_UPDATE,
                    preferred_language=Language.PORTUGUESE,
                    special_instructions="Provide general status update"
                ),
                "expected_tone": CommunicationTone.PROFESSIONAL,
                "expected_elements": ["status", "processing", "contact"]
            },

            {
                "name": "High-Value Claim Approval",
                "context": CommunicationContext(
                    customer_name="Robert Williams",
                    claim_id="CLM_HIGH_001",
                    policy_number="POL_33333",
                    communication_type=CommunicationType.APPROVAL_NOTIFICATION,
                    assessment_result={
                        "decision": "approve",
                        "confidence_score": 0.91,
                        "reasoning": "High-value claim approved after thorough review"
                    },
                    policy_details={
                        "policy_type": "Commercial Property",
                        "coverage_limits": "$1,000,000",
                        "deductible": "$10,000"
                    },
                    preferred_language=Language.ENGLISH,
                    urgency_level="high"
                ),
                "expected_tone": CommunicationTone.CONGRATULATORY,
                "expected_elements": ["approved", "high-value", "payment"]
            },

            {
                "name": "General Inquiry Response",
                "context": CommunicationContext(
                    customer_name="Lisa Chen",
                    claim_id="CLM_INQUIRY_001",
                    policy_number="POL_44444",
                    communication_type=CommunicationType.GENERAL_INQUIRY_RESPONSE,
                    preferred_language=Language.CHINESE,
                    special_instructions="Response to general policy inquiry"
                ),
                "expected_tone": CommunicationTone.PROFESSIONAL,
                "expected_elements": ["inquiry", "assistance", "policy"]
            }
        ]

        return scenarios

    async def run_communication_test(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single communication generation test."""

        start_time = time.time()

        try:
            # Generate communication
            result = await self.agent.generate_communication(scenario["context"])

            processing_time = time.time() - start_time

            # Analyze results
            analysis = self.analyze_communication_result(result, scenario)

            return {
                "scenario_name": scenario["name"],
                "success": True,
                "processing_time": processing_time,
                "result": {
                    "communication_id": result.communication_id,
                    "subject": result.subject,
                    "content_length": len(result.content),
                    "content_preview": result.content[:200] + "..." if len(result.content) > 200 else result.content,
                    "language": result.language.value,
                    "tone": result.tone.value,
                    "personalization_score": result.personalization_score,
                    "compliance_verified": result.compliance_verified,
                    "processing_time_seconds": result.processing_time_seconds
                },
                "analysis": analysis,
                "metadata": result.metadata
            }

        except Exception as e:
            return {
                "scenario_name": scenario["name"],
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    def analyze_communication_result(self, result, scenario) -> Dict[str, Any]:
        """Analyze the quality and correctness of communication result."""

        analysis = {
            "tone_match": result.tone == scenario["expected_tone"],
            "language_correct": result.language == scenario["context"].preferred_language,
            "has_subject": bool(result.subject and len(result.subject) > 0),
            "has_content": bool(result.content and len(result.content) > 50),
            "personalization_adequate": result.personalization_score >= 0.3,
            "compliance_verified": result.compliance_verified,
            "expected_elements_found": [],
            "quality_score": 0.0
        }

        # Check for expected elements in content
        content_lower = result.content.lower()
        for element in scenario.get("expected_elements", []):
            if element.lower() in content_lower:
                analysis["expected_elements_found"].append(element)

        # Calculate quality score
        quality_factors = [
            analysis["tone_match"],
            analysis["language_correct"],
            analysis["has_subject"],
            analysis["has_content"],
            analysis["personalization_adequate"],
            len(analysis["expected_elements_found"]) > 0
        ]

        analysis["quality_score"] = sum(quality_factors) / len(quality_factors)

        return analysis

    async def run_performance_tests(self) -> Dict[str, Any]:
        """Run performance tests for the communication agent."""

        print("\n🔄 Running performance tests...")

        # Test concurrent communication generation
        concurrent_scenarios = self.create_test_scenarios()[
            :3]  # Use first 3 scenarios

        start_time = time.time()
        concurrent_tasks = [
            self.agent.generate_communication(scenario["context"])
            for scenario in concurrent_scenarios
        ]

        try:
            concurrent_results = await asyncio.gather(*concurrent_tasks)
            concurrent_time = time.time() - start_time

            return {
                "concurrent_generation": {
                    "success": True,
                    "scenarios_count": len(concurrent_scenarios),
                    "total_time": concurrent_time,
                    "average_time_per_communication": concurrent_time / len(concurrent_scenarios),
                    "results_count": len(concurrent_results)
                }
            }
        except Exception as e:
            return {
                "concurrent_generation": {
                    "success": False,
                    "error": str(e),
                    "total_time": time.time() - start_time
                }
            }

    async def test_agent_capabilities(self) -> Dict[str, Any]:
        """Test agent capabilities and configuration."""

        try:
            capabilities = self.agent.get_communication_capabilities()

            return {
                "capabilities_test": {
                    "success": True,
                    "agent_type": capabilities.get("agent_type"),
                    "llm_driven": capabilities.get("llm_driven"),
                    "communication_types_count": len(capabilities.get("communication_types", [])),
                    "supported_languages_count": len(capabilities.get("supported_languages", [])),
                    "tone_options_count": len(capabilities.get("tone_options", [])),
                    "personalization_features_count": len(capabilities.get("personalization_features", [])),
                    "compliance_features_count": len(capabilities.get("compliance_features", []))
                }
            }
        except Exception as e:
            return {
                "capabilities_test": {
                    "success": False,
                    "error": str(e)
                }
            }

    async def run_all_tests(self):
        """Run the complete test suite."""

        print("🚀 Starting Enhanced Communication Agent Test Suite")
        print("=" * 60)

        # Initialize agent
        if not await self.initialize_agent():
            return

        # Test agent capabilities
        capabilities_result = await self.test_agent_capabilities()
        print(
            f"✅ Capabilities test: {capabilities_result['capabilities_test']['success']}")

        # Create test scenarios
        scenarios = self.create_test_scenarios()
        print(f"📋 Created {len(scenarios)} test scenarios")

        # Run individual tests
        print("\n🧪 Running individual communication tests...")

        for i, scenario in enumerate(scenarios, 1):
            print(f"  {i}/{len(scenarios)}: {scenario['name']}")
            result = await self.run_communication_test(scenario)
            self.test_results.append(result)

            if result["success"]:
                print(
                    f"    ✅ Success (Quality: {result['analysis']['quality_score']:.2f})")
            else:
                print(f"    ❌ Failed: {result['error']}")

        # Run performance tests
        performance_result = await self.run_performance_tests()

        # Generate summary
        self.generate_test_summary(capabilities_result, performance_result)

    def generate_test_summary(self, capabilities_result: Dict[str, Any],
                              performance_result: Dict[str, Any]):
        """Generate and display test summary."""

        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)

        # Overall results
        successful_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]

        print(f"Total Tests: {len(self.test_results)}")
        print(
            f"Successful: {len(successful_tests)} ({len(successful_tests)/len(self.test_results)*100:.1f}%)")
        print(
            f"Failed: {len(failed_tests)} ({len(failed_tests)/len(self.test_results)*100:.1f}%)")

        if successful_tests:
            # Performance metrics
            processing_times = [r["processing_time"] for r in successful_tests]
            personalization_scores = [
                r["result"]["personalization_score"] for r in successful_tests]
            quality_scores = [r["analysis"]["quality_score"]
                              for r in successful_tests]

            print(f"\n📈 PERFORMANCE METRICS:")
            print(
                f"Average Processing Time: {sum(processing_times)/len(processing_times):.3f}s")
            print(
                f"Average Personalization Score: {sum(personalization_scores)/len(personalization_scores):.3f}")
            print(
                f"Average Quality Score: {sum(quality_scores)/len(quality_scores):.3f}")

            # Language distribution
            languages = [r["result"]["language"] for r in successful_tests]
            language_counts = {lang: languages.count(
                lang) for lang in set(languages)}
            print(f"\n🌍 LANGUAGE DISTRIBUTION:")
            for lang, count in language_counts.items():
                print(f"  {lang}: {count} tests")

            # Tone distribution
            tones = [r["result"]["tone"] for r in successful_tests]
            tone_counts = {tone: tones.count(tone) for tone in set(tones)}
            print(f"\n🎭 TONE DISTRIBUTION:")
            for tone, count in tone_counts.items():
                print(f"  {tone}: {count} tests")

        # Capabilities summary
        if capabilities_result["capabilities_test"]["success"]:
            caps = capabilities_result["capabilities_test"]
            print(f"\n🔧 AGENT CAPABILITIES:")
            print(f"Agent Type: {caps['agent_type']}")
            print(f"LLM Driven: {caps['llm_driven']}")
            print(f"Communication Types: {caps['communication_types_count']}")
            print(f"Supported Languages: {caps['supported_languages_count']}")
            print(f"Tone Options: {caps['tone_options_count']}")

        # Performance test results
        if performance_result.get("concurrent_generation", {}).get("success"):
            perf = performance_result["concurrent_generation"]
            print(f"\n⚡ CONCURRENT PERFORMANCE:")
            print(f"Concurrent Scenarios: {perf['scenarios_count']}")
            print(f"Total Time: {perf['total_time']:.3f}s")
            print(
                f"Average per Communication: {perf['average_time_per_communication']:.3f}s")

        # Failed tests details
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  {test['scenario_name']}: {test['error']}")

        print("\n" + "=" * 60)
        print("🎉 Test suite completed!")


async def main():
    """Main function to run the test suite."""
    test_suite = CommunicationTestSuite()
    await test_suite.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
