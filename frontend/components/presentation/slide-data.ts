import {
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Eye,
  FileSearch,
  Gauge,
  Handshake,
  Network,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Slide metadata — defines order, URL slug, and nav labels           */
/* ------------------------------------------------------------------ */

export const slideMeta = [
  { id: "opening", shortLabel: "Opening", section: "Insurance Workday" },
  { id: "operations", shortLabel: "Reality", section: "Repetitive Work" },
  { id: "personas", shortLabel: "Personas", section: "Who Carries It" },
  { id: "mission", shortLabel: "Thesis", section: "Operating Thesis" },
  { id: "architecture", shortLabel: "Architecture", section: "Platform Topology" },
  { id: "agents", shortLabel: "Agents", section: "Specialist Ecosystem" },
  { id: "workbench", shortLabel: "Workbench", section: "Human-Agent Collaboration" },
  { id: "governance", shortLabel: "Controls", section: "Trust + Traceability" },
  { id: "future", shortLabel: "Future", section: "Where It Goes Next" },
  { id: "close", shortLabel: "Close", section: "Conversation Kickoff" },
] as const

export type SlideId = (typeof slideMeta)[number]["id"]

/* ------------------------------------------------------------------ */
/*  Architecture diagram                                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Architecture — simplified conceptual modules                       */
/* ------------------------------------------------------------------ */

export interface ArchitectureModule {
  id: string
  name: string
  role: string
  description: string
  accent: string
  aspects: readonly string[]
}

export const architectureModules: readonly ArchitectureModule[] = [
  {
    id: "experience",
    name: "Experience Layer",
    role: "What users see and touch",
    description: "The web application that hosts the workbench, agent demos, and this presentation. Public-facing, persona-aware, and the entry point for every interaction.",
    accent: "from-[#92f3e8] to-[#5bc0ff]",
    aspects: ["Persona-aware workbench views", "Embedded presentation mode", "Real-time agent output panels"],
  },
  {
    id: "orchestration",
    name: "Orchestration Core",
    role: "Where decisions get coordinated",
    description: "The API and workflow engine that coordinates specialist agents, enforces policy logic, and exposes the claims lifecycle to the experience layer.",
    accent: "from-[#5bc0ff] to-[#8a7dff]",
    aspects: ["Multi-agent workflow routing", "Policy enforcement engine", "Claims lifecycle API"],
  },
  {
    id: "intelligence",
    name: "Intelligence Plane",
    role: "Where agents reason",
    description: "Large language models for chat and embeddings. An external dependency kept explicit — the system degrades visibly if it's unavailable, never silently.",
    accent: "from-[#e7a8ff] to-[#ffa578]",
    aspects: ["LLM chat + embedding access", "Explicit degradation signals", "Token-aware rate management"],
  },
  {
    id: "data",
    name: "Private Data Plane",
    role: "Where claims live",
    description: "Claims data persists on a private network path. No public access — name resolution and traffic stay inside the virtual network boundary.",
    accent: "from-[#ffb36b] to-[#ff6f61]",
    aspects: ["Private network isolation", "Claims + policy persistence", "No public endpoint exposure"],
  },
  {
    id: "trust",
    name: "Trust + Delivery Fabric",
    role: "Identity, deployment, observability",
    description: "Shared identity for passwordless operations, container registry for deployment, and centralized logging. The invisible infrastructure that keeps the system governable.",
    accent: "from-[#9ae76b] to-[#5fd6a4]",
    aspects: ["Passwordless managed identity", "Container registry + CD", "Centralized log aggregation"],
  },
] as const

export const architectureFlows = [
  { from: "experience", to: "orchestration", label: "API calls" },
  { from: "orchestration", to: "intelligence", label: "reasoning" },
  { from: "orchestration", to: "data", label: "private path" },
  { from: "trust", to: "experience", label: "identity" },
  { from: "trust", to: "orchestration", label: "identity" },
] as const

/* ------------------------------------------------------------------ */
/*  Agent cards                                                        */
/* ------------------------------------------------------------------ */

export interface AgentCard {
  id: string
  name: string
  title: string
  icon: LucideIcon
  accent: string
  capabilities: string[]
  delivers: string[]
}

export const agentCards: readonly AgentCard[] = [
  {
    id: "claim-assessor",
    name: "Claim Assessor",
    title: "Transforms evidence into damage and cost judgment",
    icon: FileSearch,
    accent: "from-[#ff986c] to-[#ff6b7a]",
    capabilities: [
      "Reads incident narrative, loss details, and image evidence",
      "Evaluates damage credibility and estimated repair reasonableness",
      "Flags inconsistencies and produces a structured assessment",
    ],
    delivers: [
      "Validity status",
      "Cost assessment narrative",
      "Red-flag inventory for downstream review",
    ],
  },
  {
    id: "policy-checker",
    name: "Policy Checker",
    title: "Maps claim facts against coverage terms",
    icon: ShieldCheck,
    accent: "from-[#8ce5ff] to-[#5bc0ff]",
    capabilities: [
      "Looks up policy data and coverage limits",
      "Uses indexed documents to reason across policy language",
      "Surfaces exclusions, deductibles, and evidence gaps",
    ],
    delivers: [
      "Coverage determination",
      "Policy rationale",
      "Missing-document callouts",
    ],
  },
  {
    id: "risk-analyst",
    name: "Risk Analyst",
    title: "Assesses fraud, anomaly patterns, and escalation pressure",
    icon: ShieldAlert,
    accent: "from-[#ffd06f] to-[#ff9e53]",
    capabilities: [
      "Inspects claimant history and behavioral signals",
      "Rates suspicion and operational risk",
      "Identifies when humans should slow the workflow down",
    ],
    delivers: [
      "Risk level",
      "Fraud indicators",
      "Escalation rationale",
    ],
  },
  {
    id: "communication-agent",
    name: "Communication Agent",
    title: "Turns internal reasoning into customer-facing follow-up",
    icon: Handshake,
    accent: "from-[#98f0c8] to-[#5ed1b8]",
    capabilities: [
      "Drafts requests for missing documentation",
      "Converts agent findings into plain-language outreach",
      "Keeps handoffs consistent across the claims team",
    ],
    delivers: [
      "Follow-up outreach drafts",
      "Missing-items summaries",
      "Tone-safe customer communication",
    ],
  },
  {
    id: "synthesizer",
    name: "Synthesizer",
    title: "Reconciles specialist outputs into a final recommendation",
    icon: Workflow,
    accent: "from-[#baa2ff] to-[#7d8eff]",
    capabilities: [
      "Collects structured outputs from the specialist agents",
      "Builds the final recommendation trail for the workflow",
      "Packages a decision that a human can quickly interrogate",
    ],
    delivers: [
      "Final assessment",
      "Decision-ready summary",
      "Explainable reasoning chain",
    ],
  },
] as const

/* ------------------------------------------------------------------ */
/*  Persona views (workbench slide)                                    */
/* ------------------------------------------------------------------ */

export interface PersonaView {
  id: string
  label: string
  title: string
  summary: string
  lenses: string[]
  panels: string[]
}

export const personaViews: readonly PersonaView[] = [
  {
    id: "handler",
    label: "Claims Handler",
    title: "Focuses on caseload, queue movement, and intervention timing",
    summary:
      "Tuned for momentum. Keeps next action, AI recommendation, and confidence trail in the same field of vision so a human can move work without losing context.",
    lenses: [
      "My claims and processing queues",
      "Assessment summaries and missing evidence prompts",
      "Fast jump from AI output to human override",
    ],
    panels: [
      "Personal caseload and pipeline status",
      "Claim drill-down with structured agent outputs",
      "Decision controls for approve, deny, or request more information",
    ],
  },
  {
    id: "lead",
    label: "Claims Lead",
    title: "Watches throughput, exceptions, and workload balance",
    summary:
      "Team leads need orchestration over single-claim detail. Makes queue pressure, handoffs, and agent-assisted auto-approvals visible so supervisors can rebalance the system.",
    lenses: [
      "Queue depth and processing velocity",
      "Handlers with rising caseload pressure",
      "Auto-approval volume versus human review volume",
    ],
    panels: [
      "Operational queue insights",
      "Escalation hotspots and exception buckets",
      "Resourcing decisions across the team",
    ],
  },
  {
    id: "ops",
    label: "Operations + Compliance",
    title: "Keeps trust, auditability, and governance in view",
    summary:
      "Operations and compliance care about traceability. Every recommendation needs the right signals, right policy context, and right human checkpoint.",
    lenses: [
      "Agent reasoning transparency",
      "Coverage and communication consistency",
      "Audit-ready decision trace",
    ],
    panels: [
      "Workflow trace and decision lineage",
      "Policy document and index controls",
      "Human override history and rationale",
    ],
  },
  {
    id: "executive",
    label: "Executive Sponsor",
    title: "Sees the platform as a transformation engine, not a ticket queue",
    summary:
      "About outcomes: cycle time, service experience, loss control, and the strategic shape of the operating model as agent capabilities mature.",
    lenses: [
      "Processing speed and service quality",
      "Automation-to-human mix",
      "Narrative of platform capability growth",
    ],
    panels: [
      "Outcome metrics and demo-ready storyline",
      "Architecture posture and risk controls",
      "Roadmap for broader multi-agent adoption",
    ],
  },
] as const

/* ------------------------------------------------------------------ */
/*  Operations slide                                                   */
/* ------------------------------------------------------------------ */

export interface WorkstreamItem {
  icon: LucideIcon
  title: string
  copy: string
}

export const repetitiveWorkstreams: readonly WorkstreamItem[] = [
  {
    icon: Gauge,
    title: "Status chasing",
    copy: "Handlers and leads burn time triaging queues, checking next actions, and stitching together what already happened.",
  },
  {
    icon: FileSearch,
    title: "Document loops",
    copy: "Police reports, repair estimates, policy wording, and claimant notes get requested, reviewed, and repeated across handoffs.",
  },
  {
    icon: Workflow,
    title: "Context stitching",
    copy: "Damage, coverage, risk, and customer communication live in separate tools and separate mental models.",
  },
] as const

export const organizationPressures: readonly WorkstreamItem[] = [
  {
    icon: Gauge,
    title: "Cycle time pressure",
    copy: "Decision latency grows because humans spend time assembling the claim before they can actually judge it.",
  },
  {
    icon: Handshake,
    title: "Service strain",
    copy: "Customers feel delay when status requests, missing documents, and follow-up loops bounce across teams.",
  },
  {
    icon: ShieldAlert,
    title: "Leakage and fraud exposure",
    copy: "Signals get missed when risk clues, policy context, and damage review are separated across tools and handoffs.",
  },
  {
    icon: Scale,
    title: "Audit reconstruction",
    copy: "Organizations rebuild reasoning after the fact instead of carrying it forward as the claim moves.",
  },
] as const

/* ------------------------------------------------------------------ */
/*  Personas slide                                                     */
/* ------------------------------------------------------------------ */

export interface InsurancePersona {
  id: string
  icon: LucideIcon
  name: string
  role: string
  burden: string
  needs: string
}

export const insurancePersonas: readonly InsurancePersona[] = [
  {
    id: "intake",
    icon: BriefcaseBusiness,
    name: "FNOL + Intake",
    role: "Captures first notice and verifies the basics.",
    burden:
      "Re-enters claimant facts, policy data, and attachment status before a claim is even ready for judgment.",
    needs:
      "An intake frame that confirms what is known, what is missing, and what can safely wait.",
  },
  {
    id: "handler",
    icon: UsersRound,
    name: "Claims Handler",
    role: "Owns the claim and keeps it moving.",
    burden:
      "Spends hours assembling evidence, policy context, and outbound follow-up before making a real decision.",
    needs:
      "One decision view that pulls evidence, coverage, risk, and next actions into the same frame.",
  },
  {
    id: "lead",
    icon: Gauge,
    name: "Claims Lead",
    role: "Balances throughput, exceptions, and workload pressure.",
    burden:
      "Rebalances queues and escalations without a shared operational picture of what humans and agents already know.",
    needs:
      "Operational visibility into queue pressure, intervention timing, and where the system is slowing down.",
  },
  {
    id: "compliance",
    icon: Scale,
    name: "Compliance + Audit",
    role: "Protects consistency, governance, and recoverability.",
    burden:
      "Reconstructs why a decision was made after the fact instead of tracing it as it happens.",
    needs:
      "A replayable trail of recommendations, overrides, evidence, and customer-facing actions.",
  },
] as const

/* ------------------------------------------------------------------ */
/*  Governance slide                                                   */
/* ------------------------------------------------------------------ */

export const governancePillars: readonly WorkstreamItem[] = [
  {
    icon: Eye,
    title: "Trace every recommendation",
    copy: "Each specialist output stays attributable to evidence, policy context, and the moment it entered the workflow.",
  },
  {
    icon: Handshake,
    title: "Keep humans explicit",
    copy: "Approvals, overrides, escalations, and requests for more information remain visible human checkpoints.",
  },
  {
    icon: ShieldCheck,
    title: "Audit the operating model",
    copy: "Leads and compliance need to inspect how the system worked, not just read the final recommendation.",
  },
] as const

export interface TraceStep {
  icon: LucideIcon
  title: string
  copy: string
}

export const traceChain: readonly TraceStep[] = [
  {
    icon: FileSearch,
    title: "Evidence + policy context",
    copy: "Narrative, media, claimant signals, policy wording, and prior notes enter one traceable frame.",
  },
  {
    icon: BrainCircuit,
    title: "Specialist outputs",
    copy: "Damage, coverage, risk, and communication agents produce structured reasoning instead of opaque prose.",
  },
  {
    icon: Workflow,
    title: "Synthesis + recommendation",
    copy: "The workflow packages the next-best action, open questions, and confidence trail for a person to interrogate.",
  },
  {
    icon: Handshake,
    title: "Human action + outreach",
    copy: "Final action, override rationale, and customer communication all land on the same decision trail.",
  },
] as const

/* ------------------------------------------------------------------ */
/*  Future / roadmap slide                                             */
/* ------------------------------------------------------------------ */

export interface RoadmapPhase {
  phase: string
  title: string
  focus: string
  bullets: string[]
}

export const roadmap: readonly RoadmapPhase[] = [
  {
    phase: "Now",
    title: "Guided human co-pilot",
    focus: "Summaries, recommendations, and structured decision support inside the claims workbench.",
    bullets: [
      "Specialist agents operate as explainable assistants",
      "Humans remain the decision authority on sensitive claims",
      "Queues, metrics, and outreach become orchestration surfaces",
    ],
  },
  {
    phase: "Next",
    title: "Negotiating swarm",
    focus: "Agents begin coordinating with each other, not just reporting back one at a time.",
    bullets: [
      "Dynamic escalation between specialists based on confidence",
      "Conflict resolution between coverage, risk, and damage assessments",
      "Agent collaboration contracts that expose disagreements to humans",
    ],
  },
  {
    phase: "Later",
    title: "Adaptive claims mesh",
    focus: "The operating model shifts from task routing to adaptive autonomous flows governed by policy and guardrails.",
    bullets: [
      "Persona-specific orchestration across intake, adjudication, fraud, and service",
      "Portfolio-level optimization across handlers, claim types, and SLAs",
      "Broader ecosystem hooks into repair networks, payments, and external data",
    ],
  },
] as const

/* ------------------------------------------------------------------ */
/*  Close slide                                                        */
/* ------------------------------------------------------------------ */

export const closeQuestions = [
  "Which parts of the claim lifecycle should remain human-led by policy rather than capability?",
  "Which personas need new orchestration views as the agent mesh expands?",
  "What signals would justify more autonomy versus more review?",
  "Where should ecosystem integrations plug in next: repair, payments, fraud, or customer service?",
] as const

export const closeProofPoints: readonly { icon: LucideIcon; title: string; copy: string }[] = [
  {
    icon: Network,
    title: "Architecture with intent",
    copy: "Public conversation surfaces, private claims data path, and a clear identity and deployment spine.",
  },
  {
    icon: Bot,
    title: "Specialist agent roles",
    copy: "Each agent has a distinct capability boundary and output contract.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Persona-aware workbench",
    copy: "The UI evolves from one dashboard into multiple orchestration views for different operators.",
  },
  {
    icon: Sparkles,
    title: "Narrative built into the product",
    copy: "A presenter moves from story to live platform without leaving the app.",
  },
] as const
