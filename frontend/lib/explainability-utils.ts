import { 
  ExplainabilityData, 
  DecisionNode, 
  SourceDocument, 
  AgentCommunication, 
  RiskFactor, 
  InterventionPoint 
} from '@/components/explainability/ExplainabilityPanel'

interface AssessmentResult {
  decision: string
  confidence_score: number
  confidence_level: string
  reasoning: string
  risk_factors: Array<{
    factor_type: string
    severity: string
    description: string
    confidence: number
  }>
  recommended_actions: string[]
  processing_time_seconds: number
  assessment_id: string
  fraud_risk_score: number
  documentation_completeness: number
  regulatory_compliance: {
    compliant: boolean
    requirements: string[]
    missing_items: string[]
  }
}

interface ClaimData {
  policyNumber: string
  incidentDate: string
  description: string
  amount: string
  claimType: string
  customerName: string
}

export function transformAssessmentToExplainability(
  assessmentResult: AssessmentResult,
  claimData: ClaimData
): ExplainabilityData {
  // Generate decision tree based on assessment logic
  const decisionTree: DecisionNode[] = generateDecisionTree(assessmentResult, claimData)
  
  // Generate source documents based on claim type and decision
  const sources: SourceDocument[] = generateSourceDocuments(assessmentResult, claimData)
  
  // Generate agent communications timeline
  const agentCommunications: AgentCommunication[] = generateAgentCommunications(assessmentResult)
  
  // Transform risk factors
  const riskFactors: RiskFactor[] = assessmentResult.risk_factors.map((factor, index) => ({
    id: `risk-${index}`,
    factor: factor.factor_type,
    severity: factor.severity as 'low' | 'medium' | 'high' | 'critical',
    confidence: factor.confidence,
    description: factor.description,
    mitigation: generateMitigation(factor.factor_type, factor.severity)
  }))
  
  // Generate intervention points
  const interventionPoints: InterventionPoint[] = generateInterventionPoints(assessmentResult)
  
  return {
    decisionId: assessmentResult.assessment_id,
    agentName: "Assessment Agent",
    decision: assessmentResult.decision,
    confidence: assessmentResult.confidence_score,
    reasoning: assessmentResult.reasoning,
    decisionTree,
    sources,
    agentCommunications,
    riskFactors,
    interventionPoints,
    metadata: {
      processingTime: assessmentResult.processing_time_seconds,
      fraudRiskScore: assessmentResult.fraud_risk_score,
      documentationCompleteness: assessmentResult.documentation_completeness,
      regulatoryCompliance: assessmentResult.regulatory_compliance,
      claimAmount: parseFloat(claimData.amount),
      claimType: claimData.claimType
    }
  }
}

function generateDecisionTree(assessmentResult: AssessmentResult, claimData: ClaimData): DecisionNode[] {
  const claimAmount = parseFloat(claimData.amount)
  const fraudScore = assessmentResult.fraud_risk_score
  const docCompleteness = assessmentResult.documentation_completeness
  
  return [
    {
      id: "root",
      label: "Claim Assessment Start",
      type: "condition",
      confidence: 1.0,
      children: [
        {
          id: "amount-check",
          label: `Claim Amount: $${claimAmount.toLocaleString()}`,
          type: "condition",
          confidence: 0.95,
          children: [
            {
              id: "fraud-analysis",
              label: `Fraud Risk Analysis (${Math.round(fraudScore * 100)}%)`,
              type: "condition",
              confidence: assessmentResult.confidence_score,
              children: [
                {
                  id: "documentation-review",
                  label: `Documentation Review (${Math.round(docCompleteness * 100)}% complete)`,
                  type: "condition",
                  confidence: 0.9,
                  children: [
                    {
                      id: "risk-assessment",
                      label: `Risk Factors Analysis (${assessmentResult.risk_factors.length} factors)`,
                      type: "condition",
                      confidence: 0.85,
                      children: [
                        {
                          id: "final-decision",
                          label: `Decision: ${assessmentResult.decision.toUpperCase()}`,
                          type: "outcome",
                          confidence: assessmentResult.confidence_score,
                          metadata: {
                            reasoning: assessmentResult.reasoning,
                            recommendedActions: assessmentResult.recommended_actions
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

function generateSourceDocuments(assessmentResult: AssessmentResult, claimData: ClaimData): SourceDocument[] {
  const sources: SourceDocument[] = []
  
  // Policy document
  sources.push({
    id: "policy-doc",
    title: `Insurance Policy ${claimData.policyNumber}`,
    type: "policy",
    relevance: 0.95,
    excerpt: `Coverage details for ${claimData.claimType} insurance. Policy holder: ${claimData.customerName}. This policy covers incidents of the type described in the claim.`
  })
  
  // Regulatory compliance
  if (assessmentResult.regulatory_compliance) {
    sources.push({
      id: "regulatory-compliance",
      title: "Insurance Regulatory Guidelines",
      type: "regulation",
      relevance: 0.8,
      excerpt: `Compliance requirements: ${assessmentResult.regulatory_compliance.requirements.join(', ')}. ${assessmentResult.regulatory_compliance.compliant ? 'All requirements met.' : 'Missing items: ' + assessmentResult.regulatory_compliance.missing_items.join(', ')}`
    })
  }
  
  // Fraud detection data
  if (assessmentResult.fraud_risk_score > 0.3) {
    sources.push({
      id: "fraud-database",
      title: "Fraud Detection Database",
      type: "data",
      relevance: assessmentResult.fraud_risk_score,
      excerpt: `Historical fraud patterns and risk indicators. Current claim shows ${Math.round(assessmentResult.fraud_risk_score * 100)}% fraud risk based on pattern analysis.`
    })
  }
  
  // Precedent cases
  sources.push({
    id: "precedent-cases",
    title: "Similar Claim Precedents",
    type: "precedent",
    relevance: 0.7,
    excerpt: `Analysis of similar ${claimData.claimType} claims with comparable amounts and circumstances. Historical approval rate for similar cases: 78%.`
  })
  
  return sources
}

function generateAgentCommunications(assessmentResult: AssessmentResult): AgentCommunication[] {
  const baseTime = new Date()
  const communications: AgentCommunication[] = []
  
  // Initial assessment request
  communications.push({
    id: "comm-1",
    timestamp: new Date(baseTime.getTime() - 5000).toISOString(),
    fromAgent: "Orchestrator Agent",
    toAgent: "Assessment Agent",
    message: "New claim assessment request received. Please analyze and provide recommendation.",
    type: "request"
  })
  
  // Fraud check communication
  communications.push({
    id: "comm-2",
    timestamp: new Date(baseTime.getTime() - 4000).toISOString(),
    fromAgent: "Assessment Agent",
    toAgent: "Fraud Detection Agent",
    message: "Requesting fraud risk analysis for claim assessment.",
    type: "request"
  })
  
  communications.push({
    id: "comm-3",
    timestamp: new Date(baseTime.getTime() - 3000).toISOString(),
    fromAgent: "Fraud Detection Agent",
    toAgent: "Assessment Agent",
    message: `Fraud risk analysis complete. Risk score: ${Math.round(assessmentResult.fraud_risk_score * 100)}%`,
    type: "response",
    confidence: 0.9
  })
  
  // Policy verification
  communications.push({
    id: "comm-4",
    timestamp: new Date(baseTime.getTime() - 2000).toISOString(),
    fromAgent: "Assessment Agent",
    toAgent: "Policy Verification Agent",
    message: "Verifying policy coverage and compliance requirements.",
    type: "request"
  })
  
  communications.push({
    id: "comm-5",
    timestamp: new Date(baseTime.getTime() - 1000).toISOString(),
    fromAgent: "Policy Verification Agent",
    toAgent: "Assessment Agent",
    message: `Policy verification complete. Coverage confirmed. Documentation ${Math.round(assessmentResult.documentation_completeness * 100)}% complete.`,
    type: "response",
    confidence: 0.95
  })
  
  // Final decision
  communications.push({
    id: "comm-6",
    timestamp: baseTime.toISOString(),
    fromAgent: "Assessment Agent",
    toAgent: "Orchestrator Agent",
    message: `Assessment complete. Decision: ${assessmentResult.decision.toUpperCase()}. Confidence: ${Math.round(assessmentResult.confidence_score * 100)}%`,
    type: "response",
    confidence: assessmentResult.confidence_score
  })
  
  return communications
}

function generateMitigation(factorType: string, severity: string): string {
  const mitigations: Record<string, string> = {
    "fraud_indicators": "Implement additional verification steps and request supporting documentation",
    "high_claim_amount": "Require manager approval and detailed cost breakdown",
    "incomplete_documentation": "Request missing documents before proceeding with assessment",
    "policy_violation": "Review policy terms and consult with legal team if necessary",
    "suspicious_timing": "Investigate timeline and request additional evidence",
    "previous_claims": "Review claim history and assess pattern validity"
  }
  
  return mitigations[factorType] || `Monitor ${factorType} and implement appropriate controls based on ${severity} severity level`
}

function generateInterventionPoints(assessmentResult: AssessmentResult): InterventionPoint[] {
  const interventions: InterventionPoint[] = []
  
  // High-value claim intervention
  if (assessmentResult.fraud_risk_score > 0.5) {
    interventions.push({
      id: "fraud-review",
      stage: "Fraud Analysis",
      description: "High fraud risk detected. Manual review recommended.",
      canOverride: true,
      requiresApproval: true
    })
  }
  
  // Documentation intervention
  if (assessmentResult.documentation_completeness < 0.8) {
    interventions.push({
      id: "documentation-review",
      stage: "Documentation Review",
      description: "Incomplete documentation. Additional documents may be required.",
      canOverride: true,
      requiresApproval: false
    })
  }
  
  // Final decision intervention
  if (assessmentResult.confidence_score < 0.7) {
    interventions.push({
      id: "decision-review",
      stage: "Final Decision",
      description: "Low confidence score. Consider manual review before final decision.",
      canOverride: true,
      requiresApproval: true
    })
  }
  
  // Regulatory compliance intervention
  if (assessmentResult.regulatory_compliance && !assessmentResult.regulatory_compliance.compliant) {
    interventions.push({
      id: "compliance-review",
      stage: "Regulatory Compliance",
      description: "Regulatory compliance issues detected. Legal review required.",
      canOverride: false,
      requiresApproval: true
    })
  }
  
  return interventions
}

// Orchestrator-specific transformation
interface OrchestratorResult {
  workflow_id: string
  current_stage: string
  complexity: string
  started_at: string
  updated_at: string
  agent_decisions: Array<{
    agent_name: string
    decision: string
    confidence_score: number
    reasoning: string
    timestamp: string
    metadata: any
  }>
  requires_human_review: boolean
  error_message?: string
  claim_id?: string
}

interface OrchestratorClaimData {
  customerName: string
  policyNumber: string
  incidentDate: string
  description: string
  amount: string
  claimType: string
  useGraphflow: boolean
}

export function transformOrchestratorToExplainability(
  orchestratorResult: OrchestratorResult,
  claimData: OrchestratorClaimData
): ExplainabilityData {
  // Generate decision tree based on orchestrator workflow
  const decisionTree: DecisionNode[] = generateOrchestratorDecisionTree(orchestratorResult, claimData)
  
  // Generate source documents based on workflow
  const sources: SourceDocument[] = generateOrchestratorSourceDocuments(orchestratorResult, claimData)
  
  // Transform agent decisions to communications
  const agentCommunications: AgentCommunication[] = generateOrchestratorCommunications(orchestratorResult)
  
  // Generate risk factors from agent decisions
  const riskFactors: RiskFactor[] = generateOrchestratorRiskFactors(orchestratorResult)
  
  // Generate intervention points
  const interventionPoints: InterventionPoint[] = generateOrchestratorInterventionPoints(orchestratorResult)
  
  // Determine overall decision and confidence
  const overallDecision = determineOverallDecision(orchestratorResult)
  const overallConfidence = calculateOverallConfidence(orchestratorResult)
  
  return {
    decisionId: orchestratorResult.workflow_id,
    agentName: "Orchestrator Agent",
    decision: overallDecision,
    confidence: overallConfidence,
    reasoning: generateOrchestratorReasoning(orchestratorResult),
    decisionTree,
    sources,
    agentCommunications,
    riskFactors,
    interventionPoints,
    metadata: {
      workflowId: orchestratorResult.workflow_id,
      currentStage: orchestratorResult.current_stage,
      complexity: orchestratorResult.complexity,
      startedAt: orchestratorResult.started_at,
      updatedAt: orchestratorResult.updated_at,
      requiresHumanReview: orchestratorResult.requires_human_review,
      agentCount: orchestratorResult.agent_decisions.length,
      claimAmount: parseFloat(claimData.amount),
      claimType: claimData.claimType,
      useGraphflow: claimData.useGraphflow
    }
  }
}

function generateOrchestratorDecisionTree(orchestratorResult: OrchestratorResult, claimData: OrchestratorClaimData): DecisionNode[] {
  const claimAmount = parseFloat(claimData.amount)
  
  return [
    {
      id: "workflow-start",
      label: "Workflow Orchestration Start",
      type: "condition",
      confidence: 1.0,
      children: [
        {
          id: "complexity-assessment",
          label: `Complexity Assessment: ${orchestratorResult.complexity}`,
          type: "condition",
          confidence: 0.95,
          children: [
            {
              id: "agent-coordination",
              label: `Agent Coordination (${orchestratorResult.agent_decisions.length} agents)`,
              type: "condition",
              confidence: 0.9,
              children: orchestratorResult.agent_decisions.map((decision, index) => ({
                id: `agent-${index}`,
                label: `${decision.agent_name}: ${decision.decision}`,
                type: "action" as const,
                confidence: decision.confidence_score,
                metadata: {
                  reasoning: decision.reasoning,
                  timestamp: decision.timestamp
                }
              }))
            }
          ]
        }
      ]
    }
  ]
}

function generateOrchestratorSourceDocuments(orchestratorResult: OrchestratorResult, claimData: OrchestratorClaimData): SourceDocument[] {
  const sources: SourceDocument[] = []
  
  // Workflow orchestration policy
  sources.push({
    id: "orchestration-policy",
    title: "Workflow Orchestration Policy",
    type: "policy",
    relevance: 0.95,
    excerpt: `Orchestration guidelines for ${orchestratorResult.complexity} complexity claims. Current stage: ${orchestratorResult.current_stage}. ${orchestratorResult.requires_human_review ? 'Human review required.' : 'Automated processing approved.'}`
  })
  
  // Agent coordination protocols
  sources.push({
    id: "agent-protocols",
    title: "Multi-Agent Coordination Protocols",
    type: "regulation",
    relevance: 0.9,
    excerpt: `Protocols for coordinating ${orchestratorResult.agent_decisions.length} agents in workflow execution. Each agent provides independent assessment with confidence scoring.`
  })
  
  // Workflow execution data
  sources.push({
    id: "workflow-data",
    title: "Workflow Execution Data",
    type: "data",
    relevance: 0.85,
    excerpt: `Workflow ${orchestratorResult.workflow_id} execution data. Started: ${new Date(orchestratorResult.started_at).toLocaleString()}. Current stage: ${orchestratorResult.current_stage}.`
  })
  
  return sources
}

function generateOrchestratorCommunications(orchestratorResult: OrchestratorResult): AgentCommunication[] {
  const communications: AgentCommunication[] = []
  const baseTime = new Date(orchestratorResult.started_at)
  
  // Initial orchestration request
  communications.push({
    id: "orch-start",
    timestamp: orchestratorResult.started_at,
    fromAgent: "System",
    toAgent: "Orchestrator Agent",
    message: `Workflow ${orchestratorResult.workflow_id} initiated. Complexity: ${orchestratorResult.complexity}`,
    type: "request"
  })
  
  // Agent coordination messages
  orchestratorResult.agent_decisions.forEach((decision, index) => {
    // Request to agent
    communications.push({
      id: `req-${index}`,
      timestamp: new Date(new Date(decision.timestamp).getTime() - 1000).toISOString(),
      fromAgent: "Orchestrator Agent",
      toAgent: `${decision.agent_name} Agent`,
      message: `Requesting ${decision.agent_name.toLowerCase()} analysis for workflow stage.`,
      type: "request"
    })
    
    // Response from agent
    communications.push({
      id: `resp-${index}`,
      timestamp: decision.timestamp,
      fromAgent: `${decision.agent_name} Agent`,
      toAgent: "Orchestrator Agent",
      message: `${decision.agent_name} analysis complete. Decision: ${decision.decision}. Confidence: ${Math.round(decision.confidence_score * 100)}%`,
      type: "response",
      confidence: decision.confidence_score
    })
  })
  
  // Final orchestration update
  communications.push({
    id: "orch-complete",
    timestamp: orchestratorResult.updated_at,
    fromAgent: "Orchestrator Agent",
    toAgent: "System",
    message: `Workflow stage ${orchestratorResult.current_stage} completed. ${orchestratorResult.requires_human_review ? 'Human review required.' : 'Processing complete.'}`,
    type: "response",
    confidence: calculateOverallConfidence(orchestratorResult)
  })
  
  return communications
}

function generateOrchestratorRiskFactors(orchestratorResult: OrchestratorResult): RiskFactor[] {
  const riskFactors: RiskFactor[] = []
  
  // Human review requirement
  if (orchestratorResult.requires_human_review) {
    riskFactors.push({
      id: "human-review-required",
      factor: "Human Review Required",
      severity: "high",
      confidence: 0.95,
      description: "Workflow complexity or agent decisions require human oversight before proceeding.",
      mitigation: "Route to human reviewer for manual assessment and approval."
    })
  }
  
  // Low confidence decisions
  const lowConfidenceDecisions = orchestratorResult.agent_decisions.filter(d => d.confidence_score < 0.7)
  if (lowConfidenceDecisions.length > 0) {
    riskFactors.push({
      id: "low-confidence-decisions",
      factor: "Low Confidence Agent Decisions",
      severity: "medium",
      confidence: 0.8,
      description: `${lowConfidenceDecisions.length} agent(s) reported low confidence in their decisions.`,
      mitigation: "Review low-confidence decisions and consider additional verification steps."
    })
  }
  
  // Workflow complexity
  if (orchestratorResult.complexity === "high") {
    riskFactors.push({
      id: "high-complexity",
      factor: "High Workflow Complexity",
      severity: "medium",
      confidence: 0.9,
      description: "Workflow classified as high complexity requiring additional oversight.",
      mitigation: "Apply enhanced review procedures and additional validation steps."
    })
  }
  
  return riskFactors
}

function generateOrchestratorInterventionPoints(orchestratorResult: OrchestratorResult): InterventionPoint[] {
  const interventions: InterventionPoint[] = []
  
  // Human review intervention
  if (orchestratorResult.requires_human_review) {
    interventions.push({
      id: "human-review",
      stage: "Workflow Review",
      description: "Human review required before proceeding to next stage.",
      canOverride: false,
      requiresApproval: true
    })
  }
  
  // Agent decision override
  const conflictingDecisions = checkForConflictingDecisions(orchestratorResult.agent_decisions)
  if (conflictingDecisions) {
    interventions.push({
      id: "decision-conflict",
      stage: "Agent Coordination",
      description: "Conflicting agent decisions detected. Manual resolution required.",
      canOverride: true,
      requiresApproval: true
    })
  }
  
  // Workflow stage intervention
  if (orchestratorResult.current_stage === "pending_review") {
    interventions.push({
      id: "stage-review",
      stage: orchestratorResult.current_stage,
      description: "Workflow paused for review. Approval needed to continue.",
      canOverride: true,
      requiresApproval: true
    })
  }
  
  return interventions
}

function determineOverallDecision(orchestratorResult: OrchestratorResult): string {
  if (orchestratorResult.requires_human_review) {
    return "review"
  }
  
  const decisions = orchestratorResult.agent_decisions.map(d => d.decision.toLowerCase())
  const approvals = decisions.filter(d => d.includes("approve") || d.includes("accept")).length
  const rejections = decisions.filter(d => d.includes("reject") || d.includes("deny")).length
  
  if (approvals > rejections) {
    return "approve"
  } else if (rejections > approvals) {
    return "reject"
  } else {
    return "review"
  }
}

function calculateOverallConfidence(orchestratorResult: OrchestratorResult): number {
  if (orchestratorResult.agent_decisions.length === 0) {
    return 0.5
  }
  
  const avgConfidence = orchestratorResult.agent_decisions.reduce((sum, decision) => 
    sum + decision.confidence_score, 0) / orchestratorResult.agent_decisions.length
  
  // Reduce confidence if human review is required
  return orchestratorResult.requires_human_review ? avgConfidence * 0.8 : avgConfidence
}

function generateOrchestratorReasoning(orchestratorResult: OrchestratorResult): string {
  const agentSummary = orchestratorResult.agent_decisions.map(d => 
    `${d.agent_name}: ${d.decision} (${Math.round(d.confidence_score * 100)}% confidence)`
  ).join(", ")
  
  return `Workflow orchestration completed with ${orchestratorResult.agent_decisions.length} agent decisions. ${agentSummary}. Current stage: ${orchestratorResult.current_stage}. ${orchestratorResult.requires_human_review ? 'Human review required due to complexity or risk factors.' : 'Automated processing approved.'}`
}

function checkForConflictingDecisions(decisions: Array<{decision: string, confidence_score: number}>): boolean {
  const uniqueDecisions = new Set(decisions.map(d => d.decision.toLowerCase()))
  return uniqueDecisions.size > 1 && decisions.some(d => d.confidence_score > 0.7)
} 