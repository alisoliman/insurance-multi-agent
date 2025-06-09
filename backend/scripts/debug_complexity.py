#!/usr/bin/env python3
"""
Debug script to understand complexity assessment logic.
"""

from app.agents.orchestrator import OrchestratorAgent, ClaimComplexity
import sys

sys.path.append("/Users/ali/Dev/ip/simple-insurance-multi-agent/backend")


def debug_complexity_assessment():
    """Debug the complexity assessment step by step."""
    orchestrator = OrchestratorAgent()

    # Test case that was failing
    claim = {
        "claim_id": "test-low-001",
        "policy_number": "POL123456",
        "incident_date": "2024-01-15",
        "description": "Small scratch on door",
        "amount": 500,
    }

    print("🔍 Debugging Complexity Assessment")
    print(f"Claim: {claim}")
    print()

    # Step through the logic manually
    complexity_score = 0

    # Check amount
    amount = orchestrator._parse_amount(claim.get("amount", 0))
    print(f"1. Amount parsing: {claim.get('amount')} -> {amount}")

    if amount > 50000:
        complexity_score += 2
        print(f"   Amount > 50000: +2 (score now {complexity_score})")
    elif amount > 10000:
        complexity_score += 1
        print(f"   Amount > 10000: +1 (score now {complexity_score})")
    else:
        print(f"   Amount <= 10000: +0 (score still {complexity_score})")

    # Check keywords
    description = claim.get("description", "").lower()
    keywords = orchestrator.escalation_criteria["complex_keywords"]
    print(f"2. Keyword check in '{description}':")
    print(f"   Looking for: {keywords}")

    keyword_found = False
    for keyword in keywords:
        if keyword in description:
            complexity_score += 2
            keyword_found = True
            print(f"   Found '{keyword}': +2 (score now {complexity_score})")
            break

    if not keyword_found:
        print(f"   No keywords found: +0 (score still {complexity_score})")

    # Check documentation
    required_docs = ["incident_report", "photos", "police_report"]
    missing_docs = [doc for doc in required_docs if not claim.get(doc)]
    print(f"3. Documentation check:")
    print(f"   Required docs: {required_docs}")
    print(f"   Missing docs: {missing_docs} (count: {len(missing_docs)})")

    # Updated logic: Only add complexity for missing docs if amount is significant
    # For very low amounts (< $1000), don't penalize for missing docs
    # For moderate amounts ($1000-$5000), only penalize if all docs missing
    # For higher amounts (> $5000), penalize if more than 1 doc missing
    if amount > 5000 and len(missing_docs) > 1:
        complexity_score += 1
        print(
            f"   Documentation penalty applied (amount > $5000, >1 missing): +1 (score now {complexity_score})"
        )
    elif amount >= 1000 and len(missing_docs) >= 3:
        complexity_score += 1
        print(
            f"   Documentation penalty applied (amount >= $1000, all missing): +1 (score now {complexity_score})"
        )
    else:
        print(
            f"   No documentation penalty (amount < $1000 or insufficient missing docs) (score still {complexity_score})"
        )

    print(f"\n4. Final complexity score: {complexity_score}")

    # Determine complexity level
    if complexity_score >= 3:
        final_complexity = ClaimComplexity.HIGH
    elif complexity_score >= 1:
        final_complexity = ClaimComplexity.MEDIUM
    else:
        final_complexity = ClaimComplexity.LOW

    print(f"5. Final complexity: {final_complexity.value}")

    # Compare with actual method
    actual_complexity = orchestrator.assess_claim_complexity(claim)
    print(f"6. Actual method result: {actual_complexity.value}")

    if final_complexity == actual_complexity:
        print("✅ Manual calculation matches method")
    else:
        print("❌ Manual calculation differs from method")


if __name__ == "__main__":
    debug_complexity_assessment()
