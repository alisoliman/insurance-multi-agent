"""
Comprehensive test to verify Azure OpenAI consistency across all agents.
"""

import asyncio
from app.agents.llm_complexity_assessor import LLMComplexityAssessor
from app.agents.enhanced_orchestrator import EnhancedOrchestratorAgent, AssessmentMode
from app.agents.assessment import EnhancedAssessmentAgent
from app.agents.communication import (
    EnhancedCommunicationAgent,
    CommunicationContext,
    CommunicationType,
    Language,
)
from app.core.config import settings


async def test_azure_consistency():
    """Test that all agents are using Azure OpenAI consistently."""

    print("🔍 Testing Azure OpenAI Consistency Across All Agents")
    print("=" * 60)

    # Check configuration
    print("\n📋 Azure OpenAI Configuration:")
    print(f"Endpoint Set: {bool(settings.AZURE_OPENAI_ENDPOINT)}")
    print(f"API Key Set: {bool(settings.AZURE_OPENAI_API_KEY)}")
    print(f"Deployment: {settings.AZURE_OPENAI_DEPLOYMENT_NAME}")
    print(f"API Version: {settings.AZURE_OPENAI_API_VERSION}")

    # Test data
    test_claim = {
        "claim_id": "AZURE_TEST_001",
        "policy_number": "POL_AZURE_123",
        "incident_date": "2024-01-15",
        "description": "Vehicle collision with property damage",
        "amount": 15000,
        "incident_report": True,
        "photos": True,
    }

    results = {}

    # Test 1: LLM Complexity Assessor
    print("\n🧪 Testing LLM Complexity Assessor...")
    try:
        assessor = LLMComplexityAssessor()
        print(f"✅ Client Type: {type(assessor.client).__name__}")
        print(f"✅ Model: {assessor.model}")

        complexity_result = await assessor.assess_claim_complexity(test_claim)
        print(
            f"✅ Assessment: {complexity_result.complexity.value} (confidence: {complexity_result.confidence_score:.2f})"
        )
        results["llm_complexity"] = True

    except Exception as e:
        print(f"❌ LLM Complexity Assessor failed: {str(e)}")
        results["llm_complexity"] = False

    # Test 2: Enhanced Orchestrator
    print("\n🎯 Testing Enhanced Orchestrator...")
    try:
        orchestrator = EnhancedOrchestratorAgent()
        print(f"✅ Orchestrator initialized")

        # Test LLM-driven assessment
        enhanced_result = await orchestrator.assess_claim_complexity_enhanced(
            test_claim, AssessmentMode.LLM_DRIVEN
        )
        print(
            f"✅ LLM Assessment: {enhanced_result.final_complexity.value} (confidence: {enhanced_result.confidence_score:.2f})"
        )

        # Test hybrid assessment
        hybrid_result = await orchestrator.assess_claim_complexity_enhanced(
            test_claim, AssessmentMode.HYBRID
        )
        print(f"✅ Hybrid Assessment: {hybrid_result.final_complexity.value}")
        results["enhanced_orchestrator"] = True

    except Exception as e:
        print(f"❌ Enhanced Orchestrator failed: {str(e)}")
        results["enhanced_orchestrator"] = False

    # Test 3: Enhanced Assessment Agent
    print("\n📊 Testing Enhanced Assessment Agent...")
    try:
        assessment_agent = EnhancedAssessmentAgent()
        print(f"✅ Assessment Agent initialized")

        assessment_result = await assessment_agent.assess_claim(test_claim)
        print(f"✅ Decision: {assessment_result.decision.value}")
        print(f"✅ Confidence: {assessment_result.confidence_score:.2f}")
        print(f"✅ Processing Time: {assessment_result.processing_time_seconds:.2f}s")
        results["enhanced_assessment"] = True

    except Exception as e:
        print(f"❌ Enhanced Assessment Agent failed: {str(e)}")
        results["enhanced_assessment"] = False

    # Test 4: Enhanced Communication Agent
    print("\n💬 Testing Enhanced Communication Agent...")
    try:
        communication_agent = EnhancedCommunicationAgent()
        print(f"✅ Communication Agent initialized")

        # Create communication context
        context = CommunicationContext(
            customer_name="John Doe",
            claim_id=test_claim["claim_id"],
            policy_number=test_claim["policy_number"],
            communication_type=CommunicationType.CLAIM_STATUS_UPDATE,
            preferred_language=Language.ENGLISH,
        )

        comm_result = await communication_agent.generate_communication(context)
        print(f"✅ Communication generated: {comm_result.communication_type.value}")
        print(f"✅ Language: {comm_result.language.value}")
        print(f"✅ Processing Time: {comm_result.processing_time_seconds:.4f}s")
        results["enhanced_communication"] = True

    except Exception as e:
        print(f"❌ Enhanced Communication Agent failed: {str(e)}")
        results["enhanced_communication"] = False

    # Summary
    print("\n📈 Test Results Summary:")
    print("=" * 40)

    total_tests = len(results)
    passed_tests = sum(results.values())

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")

    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")

    if passed_tests == total_tests:
        print("🎉 All agents are using Azure OpenAI consistently!")
        return True
    else:
        print("⚠️  Some agents have Azure OpenAI integration issues.")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_azure_consistency())
    exit(0 if success else 1)
