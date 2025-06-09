#!/usr/bin/env python3
"""
Test script for LLM-driven complexity assessment.

This demonstrates the advanced reasoning capabilities of the new LLM-based
complexity assessor compared to the rule-based approach.
"""

from app.agents.llm_complexity_assessor import (
    LLMComplexityAssessor,
    ComplexityAssessment,
)
import sys
import asyncio
import json
from typing import Dict, Any

# Add the app directory to the path for imports
sys.path.append("/Users/ali/Dev/ip/simple-insurance-multi-agent/backend")


async def test_llm_complexity_assessment():
    """Test the LLM-driven complexity assessment with various claim scenarios."""

    print("🧠 Testing LLM-Driven Complexity Assessment")
    print("=" * 60)

    assessor = LLMComplexityAssessor()

    # Test scenarios that showcase LLM reasoning capabilities
    test_scenarios = [
        {
            "name": "Simple Parking Lot Scratch",
            "claim": {
                "claim_id": "LLM-001",
                "policy_number": "POL123456",
                "incident_date": "2024-01-15",
                "description": "Small scratch on passenger door from shopping cart in grocery store parking lot. No other vehicles involved.",
                "amount": 500,
                "incident_report": True,
                "photos": True,
            },
        },
        {
            "name": "Multi-Vehicle Highway Accident",
            "claim": {
                "claim_id": "LLM-002",
                "policy_number": "POL789012",
                "incident_date": "2024-01-20",
                "description": "Three-car collision on I-95 during heavy rain. Our insured rear-ended vehicle ahead, which then hit another car. Possible hydroplaning involved. Multiple injuries reported.",
                "amount": 45000,
                "incident_report": True,
                "photos": True,
                "police_report": True,
            },
        },
        {
            "name": "Suspicious Fire Claim",
            "claim": {
                "claim_id": "LLM-003",
                "policy_number": "POL345678",
                "incident_date": "2024-01-25",
                "description": "Total loss house fire. Homeowner reports electrical issue in basement. Fire occurred 2 weeks after increasing coverage amount. No smoke detectors found working. Neighbor reports seeing homeowner loading items into truck day before fire.",
                "amount": 350000,
                "incident_report": True,
                "photos": False,
                "police_report": False,
            },
        },
        {
            "name": "Medical Complexity Case",
            "claim": {
                "claim_id": "LLM-004",
                "policy_number": "POL901234",
                "incident_date": "2024-01-30",
                "description": "Slip and fall at commercial property. Claimant reports severe back injury requiring surgery. Pre-existing degenerative disc disease documented. Conflicting witness statements about cause of fall.",
                "amount": 125000,
                "incident_report": True,
                "photos": True,
                "police_report": False,
            },
        },
        {
            "name": "Weather-Related Damage",
            "claim": {
                "claim_id": "LLM-005",
                "policy_number": "POL567890",
                "incident_date": "2024-02-01",
                "description": "Roof damage from hailstorm. Multiple shingles damaged, gutters dented. Weather service confirms severe hail in area on reported date. Similar claims from neighbors.",
                "amount": 8500,
                "incident_report": True,
                "photos": True,
                "police_report": False,
            },
        },
    ]

    results = []

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n🔍 Test {i}: {scenario['name']}")
        print("-" * 40)

        try:
            # Get LLM assessment
            assessment = await assessor.assess_claim_complexity(scenario["claim"])

            # Generate explanation
            explanation = await assessor.explain_decision(scenario["claim"], assessment)

            print(f"✅ Assessment Complete")
            print(f"   Complexity: {assessment.complexity.value.upper()}")
            print(f"   Confidence: {assessment.confidence_score:.1%}")
            print(
                f"   Escalation: {'Yes' if assessment.escalation_recommended else 'No'}"
            )
            print(f"   Processing Time: {assessment.estimated_processing_time}")
            print(
                f"   Risk Factors: {', '.join(assessment.risk_factors[:3])}{'...' if len(assessment.risk_factors) > 3 else ''}"
            )

            # Store result for summary
            results.append(
                {
                    "scenario": scenario["name"],
                    "complexity": assessment.complexity.value,
                    "confidence": assessment.confidence_score,
                    "escalation": assessment.escalation_recommended,
                    "reasoning": assessment.reasoning[:100] + "..."
                    if len(assessment.reasoning) > 100
                    else assessment.reasoning,
                    "risk_factors": assessment.risk_factors,
                }
            )

        except Exception as e:
            print(f"❌ Assessment Failed: {str(e)}")
            results.append({"scenario": scenario["name"], "error": str(e)})

    # Print summary
    print("\n" + "=" * 60)
    print("📊 ASSESSMENT SUMMARY")
    print("=" * 60)

    for result in results:
        if "error" not in result:
            print(f"\n{result['scenario']}:")
            print(f"  • Complexity: {result['complexity'].upper()}")
            print(f"  • Confidence: {result['confidence']:.1%}")
            print(f"  • Escalation: {'Yes' if result['escalation'] else 'No'}")
            print(f"  • Key Risks: {', '.join(result['risk_factors'][:2])}")
        else:
            print(f"\n{result['scenario']}: ERROR - {result['error']}")

    return results


async def compare_approaches():
    """Compare LLM-driven vs rule-based approaches."""

    print("\n🔄 APPROACH COMPARISON")
    print("=" * 60)

    # Import the old rule-based approach
    from app.agents.orchestrator import OrchestratorAgent

    orchestrator = OrchestratorAgent()
    assessor = LLMComplexityAssessor()

    # Test case that shows the difference
    complex_claim = {
        "claim_id": "COMPARE-001",
        "policy_number": "POL999999",
        "incident_date": "2024-02-05",
        "description": "Minor fender bender in parking lot, but claimant is a professional athlete claiming career-ending injury. Medical records show extensive pre-existing conditions. Incident occurred in luxury vehicle worth $200k.",
        "amount": 15000,  # Moderate amount
        "incident_report": True,
        "photos": True,
        "police_report": False,
    }

    print("\nTest Claim: Professional athlete minor collision with major injury claims")
    print(f"Amount: ${complex_claim['amount']:,}")
    print(f"Description: {complex_claim['description'][:80]}...")

    # Rule-based assessment
    rule_complexity = orchestrator.assess_claim_complexity(complex_claim)
    print(f"\n📏 Rule-Based Assessment: {rule_complexity.value.upper()}")
    print("   Logic: Amount < $50k, no fraud keywords, some docs missing")

    # LLM-based assessment
    try:
        llm_assessment = await assessor.assess_claim_complexity(complex_claim)
        print(f"\n🧠 LLM-Based Assessment: {llm_assessment.complexity.value.upper()}")
        print(f"   Confidence: {llm_assessment.confidence_score:.1%}")
        print(f"   Reasoning: {llm_assessment.reasoning[:150]}...")
        print(f"   Risk Factors: {', '.join(llm_assessment.risk_factors)}")

        return {
            "rule_based": rule_complexity.value,
            "llm_based": llm_assessment.complexity.value,
            "llm_reasoning": llm_assessment.reasoning,
            "llm_confidence": llm_assessment.confidence_score,
        }

    except Exception as e:
        print(f"❌ LLM Assessment Failed: {str(e)}")
        return {"error": str(e)}


async def main():
    """Run all tests."""
    print("🚀 LLM-Driven Complexity Assessment Demo")
    print("=" * 60)

    # Test LLM assessments
    llm_results = await test_llm_complexity_assessment()

    # Compare approaches
    comparison = await compare_approaches()

    print("\n✅ Demo Complete!")
    print(f"Tested {len(llm_results)} scenarios with LLM-driven assessment")

    if "error" not in comparison:
        print(
            f"Comparison shows: Rule-based = {comparison['rule_based']}, LLM-based = {comparison['llm_based']}"
        )


if __name__ == "__main__":
    asyncio.run(main())
