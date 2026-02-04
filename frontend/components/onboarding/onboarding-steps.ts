export type OnboardingAction =
  | { type: "seed"; count?: number }
  | { type: "route"; path: string }
  | { type: "none" }

export interface OnboardingStep {
  id: string
  title: string
  description: string
  bullets: string[]
  ctaLabel: string
  action: OnboardingAction
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "seed",
    title: "Seed a demo workload",
    description: "Generate fresh claims so the queues and analytics light up immediately.",
    bullets: [
      "Creates five sample claims with varied types and priorities",
      "Automatically kicks off AI processing in the background",
      "Perfect reset before a customer demo"
    ],
    ctaLabel: "Seed 5 claims",
    action: { type: "seed", count: 5 }
  },
  {
    id: "processing",
    title: "Watch the AI processing pipeline",
    description: "See claims flowing through multi-agent analysis in real time.",
    bullets: [
      "Live queue of pending + processing items",
      "Instant visibility into throughput",
      "Great place to explain the orchestration layer"
    ],
    ctaLabel: "Open AI Processing",
    action: { type: "route", path: "/claims/processing-queue" }
  },
  {
    id: "review",
    title: "Triage the Review Queue",
    description: "Claims ready for human oversight appear here with AI summaries.",
    bullets: [
      "Filter by status, type, and date",
      "AI recommendation + risk surface up front",
      "Pick up a claim in one click"
    ],
    ctaLabel: "Open Review Queue",
    action: { type: "route", path: "/claims/queue" }
  },
  {
    id: "detail",
    title: "Inspect full AI analysis",
    description: "Open a claim to show the structured agent outputs and synthesis.",
    bullets: [
      "Supervisor summary + key findings",
      "Risk scoring + fraud indicators",
      "Policy coverage evidence and citations"
    ],
    ctaLabel: "Open a Claim",
    action: { type: "route", path: "/claims/queue" }
  },
  {
    id: "decision",
    title: "Record a decision",
    description: "Demonstrate the final human decision loop with notes and audit trail.",
    bullets: [
      "Approve, deny, or request info",
      "Decision is audit-logged instantly",
      "Communication draft is generated when needed"
    ],
    ctaLabel: "Go to My Claims",
    action: { type: "route", path: "/claims" }
  },
  {
    id: "auto",
    title: "Show auto-approvals",
    description: "Highlight low-risk auto-approvals and AI throughput metrics.",
    bullets: [
      "System-approved claims with AI evidence",
      "Daily and total auto-approval counts",
      "Great moment to mention efficiency gains"
    ],
    ctaLabel: "Open Auto-Approvals",
    action: { type: "route", path: "/claims/auto-approvals" }
  },
  {
    id: "agents",
    title: "Explore agent demos",
    description: "Dive deeper into each agent or the full workflow demo.",
    bullets: [
      "Claim Assessor, Policy Checker, Risk Analyst",
      "Communication Agent drafting experience",
      "End-to-end workflow replay"
    ],
    ctaLabel: "Open Workflow Demo",
    action: { type: "route", path: "/demo" }
  }
]
