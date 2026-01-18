// frontend/types/agent-outputs.ts
// TypeScript types for structured agent outputs

// =============================================================================
// Enums
// =============================================================================

// Validity status for Claim Assessor
export enum ValidityStatus {
  VALID = "VALID",
  QUESTIONABLE = "QUESTIONABLE",
  INVALID = "INVALID",
}

// Coverage status for Policy Checker
export enum CoverageStatus {
  COVERED = "COVERED",
  NOT_COVERED = "NOT_COVERED",
  PARTIALLY_COVERED = "PARTIALLY_COVERED",
  INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE",
}

// Risk level for Risk Analyst
export enum RiskLevel {
  LOW_RISK = "LOW_RISK",
  MEDIUM_RISK = "MEDIUM_RISK",
  HIGH_RISK = "HIGH_RISK",
}

// Recommendation for Synthesizer
export enum Recommendation {
  APPROVE = "APPROVE",
  DENY = "DENY",
  INVESTIGATE = "INVESTIGATE",
}

// Confidence level
export enum Confidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// =============================================================================
// Structured Output Models
// =============================================================================

// Claim Assessor output - extended for Feature 005
export interface ClaimAssessment {
  validity_status: ValidityStatus | string;
  cost_assessment: string;
  red_flags: string[];
  reasoning: string;
  // Additional fields for workflow summary (Feature 005)
  estimated_repair_cost?: number;
  damage_severity?: string;
}

// Policy Checker output
export interface CoverageVerification {
  coverage_status: CoverageStatus | string;
  cited_sections: string[];
  coverage_details: string;
  // Additional fields for workflow summary (Feature 005)
  policy_details?: string;
  coverage_explanation?: string;
  applicable_exclusions?: string[];
}

// Risk Analyst output
export interface RiskAssessment {
  risk_level: RiskLevel | string;
  risk_score: number; // 0-100
  fraud_indicators: string[];
  analysis: string;
  // Additional fields for workflow summary (Feature 005)
  risk_factors?: string[];
}

// Communication Agent output
export interface CustomerCommunication {
  subject: string;
  body: string;
  requested_items: string[];
}

// Synthesizer output (Final Assessment)
export interface FinalAssessment {
  recommendation: Recommendation | string;
  confidence: Confidence | string;
  summary: string;
  key_findings: string[];
  next_steps: string[];
}

// Union type for all structured outputs
export type StructuredAgentOutput =
  | ClaimAssessment
  | CoverageVerification
  | RiskAssessment
  | CustomerCommunication
  | FinalAssessment;

// =============================================================================
// Tool Call Models
// =============================================================================

// Tool call record
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration_ms?: number;
}

// Agent with tool calls
export interface AgentOutput {
  agent_name: string;
  structured_output?: StructuredAgentOutput | Record<string, unknown>;
  tool_calls?: ToolCall[];
  raw_text?: string; // Fallback when structured output unavailable
}

// =============================================================================
// API Response Models
// =============================================================================

// Conversation entry (existing, extended)
export interface ConversationEntry {
  role: "user" | "assistant" | "tool";
  content: string;
  node: string;
  tool_calls?: ToolCall[]; // Added: structured tool call data
}

// Workflow result (existing, extended)
export interface WorkflowResult {
  success: boolean;
  final_decision: string | null;
  conversation_chronological: ConversationEntry[];
  agent_outputs?: Record<string, AgentOutput>; // Added: structured outputs per agent
}

// =============================================================================
// Type Guards
// =============================================================================

export function isClaimAssessment(obj: unknown): obj is ClaimAssessment {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "validity_status" in obj &&
    "cost_assessment" in obj
  );
}

export function isCoverageVerification(obj: unknown): obj is CoverageVerification {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "coverage_status" in obj &&
    "coverage_details" in obj
  );
}

export function isRiskAssessment(obj: unknown): obj is RiskAssessment {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "risk_level" in obj &&
    "risk_score" in obj
  );
}

export function isCustomerCommunication(obj: unknown): obj is CustomerCommunication {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "subject" in obj &&
    "body" in obj
  );
}

export function isFinalAssessment(obj: unknown): obj is FinalAssessment {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "recommendation" in obj &&
    "confidence" in obj &&
    "key_findings" in obj
  );
}

// =============================================================================
// Agent Name Mapping
// =============================================================================

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  claim_assessor: "Claim Assessor",
  policy_checker: "Policy Checker",
  risk_analyst: "Risk Analyst",
  communication_agent: "Communication Agent",
  synthesizer: "Synthesizer",
  supervisor: "Supervisor",
};

export const AGENT_ICONS: Record<string, string> = {
  claim_assessor: "📋",
  policy_checker: "📜",
  risk_analyst: "🔍",
  communication_agent: "✉️",
  synthesizer: "⚖️",
  supervisor: "👔",
};

export const AGENT_COLORS: Record<string, string> = {
  claim_assessor: "blue",
  policy_checker: "purple",
  risk_analyst: "orange",
  communication_agent: "green",
  synthesizer: "indigo",
  supervisor: "gray",
};
