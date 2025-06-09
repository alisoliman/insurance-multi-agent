#!/usr/bin/env python3
"""
Demonstration of LLM-Driven vs Rule-Based Complexity Assessment

This script demonstrates the conceptual differences between traditional
rule-based complexity assessment and modern LLM-driven approaches.
"""

from app.agents.orchestrator import OrchestratorAgent, ClaimComplexity
import sys
from typing import Dict, Any
from enum import Enum

# Add the app directory to the path for imports
sys.path.append("/Users/ali/Dev/ip/simple-insurance-multi-agent/backend")


class MockLLMAssessment:
    """Mock LLM assessment to demonstrate the concept without API calls."""

    def __init__(
        self,
        complexity: str,
        confidence: float,
        reasoning: str,
        risk_factors: list,
        escalation: bool,
    ):
        self.complexity = ClaimComplexity(complexity)
        self.confidence_score = confidence
        self.reasoning = reasoning
        self.risk_factors = risk_factors
        self.escalation_recommended = escalation
        self.estimated_processing_time = "2-4 business days"
        self.required_expertise = ["general_adjuster"]


def mock_llm_complexity_assessment(claim_data: Dict[str, Any]) -> MockLLMAssessment:
    """
    Mock LLM assessment that demonstrates advanced reasoning capabilities.

    This simulates what a real LLM would analyze and decide.
    """

    description = claim_data.get("description", "").lower()
    amount = claim_data.get("amount", 0)

    # Simulate LLM reasoning for different scenarios
    if "professional athlete" in description and "career-ending" in description:
        return MockLLMAssessment(
            complexity="high",
            confidence=0.92,
            reasoning="Despite moderate claim amount, this case involves a professional athlete claiming career-ending injury from a minor collision. The high-value career implications, potential for significant future earnings loss, and likelihood of expert medical testimony and legal representation make this a complex case requiring specialized handling.",
            risk_factors=[
                "high_profile_claimant",
                "career_impact_claims",
                "medical_complexity",
                "potential_litigation",
            ],
            escalation=True,
        )

    elif "fire" in description and "coverage" in description and amount > 100000:
        return MockLLMAssessment(
            complexity="high",
            confidence=0.89,
            reasoning="Multiple fraud indicators present: recent coverage increase, convenient timing, missing safety equipment, and suspicious pre-fire activity. The high claim amount combined with these red flags requires thorough investigation by specialized fraud investigators.",
            risk_factors=[
                "fraud_indicators",
                "timing_suspicious",
                "high_value",
                "investigation_required",
            ],
            escalation=True,
        )

    elif "three-car" in description or "multiple injuries" in description:
        return MockLLMAssessment(
            complexity="high",
            confidence=0.85,
            reasoning="Multi-vehicle accident with injuries involves complex liability determination, multiple insurance carriers, potential subrogation, and medical claim management. Weather conditions add additional complexity to fault determination.",
            risk_factors=[
                "multi_party_liability",
                "injury_claims",
                "weather_factors",
                "subrogation_potential",
            ],
            escalation=False,
        )

    elif "slip and fall" in description and "pre-existing" in description:
        return MockLLMAssessment(
            complexity="medium",
            confidence=0.78,
            reasoning="Slip and fall with pre-existing conditions requires careful medical evaluation to determine causation. Conflicting witness statements add complexity but case is manageable with proper medical review.",
            risk_factors=[
                "medical_causation",
                "pre_existing_conditions",
                "witness_conflicts",
            ],
            escalation=False,
        )

    elif "hailstorm" in description and "neighbors" in description:
        return MockLLMAssessment(
            complexity="low",
            confidence=0.91,
            reasoning="Weather-related damage with corroborating evidence from weather service and similar neighbor claims. Straightforward property damage claim with clear causation and standard repair process.",
            risk_factors=["weather_verification_needed"],
            escalation=False,
        )

    elif amount < 1000 and "scratch" in description:
        return MockLLMAssessment(
            complexity="low",
            confidence=0.94,
            reasoning="Minor cosmetic damage with low financial impact. Clear causation, minimal investigation required, standard repair process applicable.",
            risk_factors=["minimal_risk"],
            escalation=False,
        )

    else:
        return MockLLMAssessment(
            complexity="medium",
            confidence=0.70,
            reasoning="Standard claim requiring moderate investigation and documentation review.",
            risk_factors=["standard_processing"],
            escalation=False,
        )


def demonstrate_assessment_approaches():
    """Demonstrate the differences between rule-based and LLM-driven approaches."""

    print("🔍 COMPLEXITY ASSESSMENT APPROACH COMPARISON")
    print("=" * 70)

    # Initialize rule-based orchestrator
    orchestrator = OrchestratorAgent()

    # Test scenarios that highlight the differences
    test_scenarios = [
        {
            "name": "Professional Athlete Case",
            "description": "Minor fender bender, but claimant is professional athlete claiming career-ending injury",
            "claim": {
                "claim_id": "DEMO-001",
                "policy_number": "POL999999",
                "incident_date": "2024-02-05",
                "description": "Minor fender bender in parking lot, but claimant is a professional athlete claiming career-ending injury. Medical records show extensive pre-existing conditions. Incident occurred in luxury vehicle worth $200k.",
                "amount": 15000,
                "incident_report": True,
                "photos": True,
                "police_report": False,
            },
        },
        {
            "name": "Suspicious Fire Claim",
            "description": "High-value fire claim with multiple fraud indicators",
            "claim": {
                "claim_id": "DEMO-002",
                "policy_number": "POL888888",
                "incident_date": "2024-01-25",
                "description": "Total loss house fire. Homeowner reports electrical issue in basement. Fire occurred 2 weeks after increasing coverage amount. No smoke detectors found working. Neighbor reports seeing homeowner loading items into truck day before fire.",
                "amount": 350000,
                "incident_report": True,
                "photos": False,
                "police_report": False,
            },
        },
        {
            "name": "Simple Scratch",
            "description": "Straightforward minor damage claim",
            "claim": {
                "claim_id": "DEMO-003",
                "policy_number": "POL777777",
                "incident_date": "2024-01-15",
                "description": "Small scratch on passenger door from shopping cart in grocery store parking lot. No other vehicles involved.",
                "amount": 500,
                "incident_report": True,
                "photos": True,
                "police_report": False,
            },
        },
    ]

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n📋 Scenario {i}: {scenario['name']}")
        print("-" * 50)
        print(f"Description: {scenario['description']}")
        print(f"Amount: ${scenario['claim']['amount']:,}")

        # Rule-based assessment
        rule_result = orchestrator.assess_claim_complexity(scenario["claim"])
        print(f"\n📏 RULE-BASED ASSESSMENT: {rule_result.value.upper()}")
        print("   Logic:")
        print(
            f"   • Amount threshold: ${scenario['claim']['amount']:,} ({'< $10k' if scenario['claim']['amount'] < 10000 else '< $50k' if scenario['claim']['amount'] < 50000 else '≥ $50k'})"
        )
        print(
            f"   • Keyword matching: {'fraud/litigation keywords found' if any(word in scenario['claim']['description'].lower() for word in ['fraud', 'litigation', 'lawsuit']) else 'no fraud keywords'}"
        )
        print(
            f"   • Documentation: {'some missing' if not scenario['claim'].get('police_report') else 'complete'}"
        )

        # LLM-driven assessment (mocked)
        llm_result = mock_llm_complexity_assessment(scenario["claim"])
        print(f"\n🧠 LLM-DRIVEN ASSESSMENT: {llm_result.complexity.value.upper()}")
        print(f"   Confidence: {llm_result.confidence_score:.1%}")
        print(f"   Reasoning: {llm_result.reasoning}")
        print(f"   Risk Factors: {', '.join(llm_result.risk_factors)}")
        print(f"   Escalation: {'Yes' if llm_result.escalation_recommended else 'No'}")

        # Highlight differences
        if rule_result != llm_result.complexity:
            print(f"\n⚠️  ASSESSMENT DISAGREEMENT:")
            print(f"   Rule-based sees this as {rule_result.value.upper()}")
            print(f"   LLM-driven sees this as {llm_result.complexity.value.upper()}")
            print(f"   LLM reasoning shows why context matters beyond simple rules")
        else:
            print(
                f"\n✅ ASSESSMENT AGREEMENT: Both approaches agree on {rule_result.value.upper()} complexity"
            )

    print("\n" + "=" * 70)
    print("📊 KEY DIFFERENCES SUMMARY")
    print("=" * 70)

    print("\n📏 RULE-BASED APPROACH:")
    print("   ✓ Fast and consistent")
    print("   ✓ Predictable outcomes")
    print("   ✓ Easy to audit and explain")
    print("   ✗ Limited contextual understanding")
    print("   ✗ Misses nuanced scenarios")
    print("   ✗ Requires manual rule updates")

    print("\n🧠 LLM-DRIVEN APPROACH:")
    print("   ✓ Contextual understanding")
    print("   ✓ Nuanced reasoning")
    print("   ✓ Adapts to complex scenarios")
    print("   ✓ Identifies subtle risk patterns")
    print("   ✓ Provides detailed explanations")
    print("   ✗ Requires API calls (cost/latency)")
    print("   ✗ Potential for inconsistency")
    print("   ✗ Needs fallback mechanisms")

    print("\n🔄 HYBRID APPROACH (RECOMMENDED):")
    print("   ✓ Combines strengths of both")
    print("   ✓ LLM for complex cases, rules for simple ones")
    print("   ✓ Confidence-based decision making")
    print("   ✓ Fallback to rules if LLM fails")
    print("   ✓ Continuous improvement through comparison")


def show_implementation_evolution():
    """Show how the implementation has evolved."""

    print("\n🚀 IMPLEMENTATION EVOLUTION")
    print("=" * 70)

    print("\n📈 EVOLUTION STAGES:")
    print("\n1️⃣ TRADITIONAL RULE-BASED (Current Production)")
    print("   • Static thresholds and keyword matching")
    print("   • Fast but limited contextual understanding")
    print("   • Good for straightforward cases")

    print("\n2️⃣ LLM-ENHANCED (Proposed)")
    print("   • AI-driven contextual analysis")
    print("   • Structured output with reasoning")
    print("   • Better handling of edge cases")

    print("\n3️⃣ HYBRID INTELLIGENT (Future)")
    print("   • Best of both approaches")
    print("   • Confidence-based routing")
    print("   • Continuous learning and improvement")

    print("\n🎯 NEXT STEPS:")
    print("   1. Implement LLM complexity assessor")
    print("   2. Create hybrid orchestrator")
    print("   3. Add API endpoints for new assessment modes")
    print("   4. Implement A/B testing framework")
    print("   5. Monitor and optimize performance")


if __name__ == "__main__":
    print("🧠 LLM-Driven Complexity Assessment Demonstration")
    print("=" * 70)
    print("This demo shows the conceptual differences between traditional")
    print("rule-based and modern LLM-driven complexity assessment.")
    print()

    demonstrate_assessment_approaches()
    show_implementation_evolution()

    print("\n✅ Demonstration Complete!")
    print("The LLM-driven approach provides much more nuanced and")
    print("contextual complexity assessment compared to simple rules.")
