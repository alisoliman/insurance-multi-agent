// frontend/components/agent-outputs/index.ts
// Barrel export for all agent output components

// Base components
export { StatusBadge } from "./status-badge"
export { RiskScoreBar } from "./risk-score-bar"

// Agent output cards
export { ClaimAssessmentCard } from "./claim-assessment-card"
export { CoverageVerificationCard } from "./coverage-verification-card"
export { RiskAssessmentCard } from "./risk-assessment-card"
export { CustomerCommunicationCard } from "./customer-communication-card"
export { FinalAssessmentCard } from "./final-assessment-card"

// Workflow summary for viewers (Feature 005 - US6)
export { 
  WorkflowSummary, 
  KeyMetric, 
  RiskScoreDisplay, 
  CoverageStatusDisplay,
  DecisionDisplay,
  AGENT_ROLE_DESCRIPTIONS,
} from "./workflow-summary"

// Tool call visualization
export { ToolCallCard } from "./tool-call-card"

// Timeline components
export { AgentTraceStep, AgentTraceTimeline } from "./agent-trace-step"

// Conversation timeline
export { ConversationStep } from "./conversation-step"

// Re-export types for convenience
export type {
  ClaimAssessment,
  CoverageVerification,
  RiskAssessment,
  CustomerCommunication,
  FinalAssessment,
  ToolCall,
  AgentOutput,
  WorkflowResult,
} from "@/types/agent-outputs"
