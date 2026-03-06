"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { Fraunces, IBM_Plex_Sans } from "next/font/google"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Expand,
  Eye,
  FileSearch,
  Gauge,
  Handshake,
  Minimize,
  Network,
  PanelTop,
  Radar,
  Rocket,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
})

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
})

const slideMeta = [
  { id: "opening", shortLabel: "Opening", section: "Insurance Workday" },
  { id: "operations", shortLabel: "Reality", section: "Repetitive Work" },
  { id: "personas", shortLabel: "Personas", section: "Who Carries It" },
  { id: "mission", shortLabel: "Thesis", section: "Operating Thesis" },
  { id: "agents", shortLabel: "Agents", section: "Specialist Ecosystem" },
  { id: "workbench", shortLabel: "Workbench", section: "Human-Agent Collaboration" },
  { id: "governance", shortLabel: "Controls", section: "Trust + Traceability" },
  { id: "architecture", shortLabel: "Architecture", section: "Platform Topology" },
  { id: "future", shortLabel: "Future", section: "Where It Goes Next" },
  { id: "close", shortLabel: "Close", section: "Conversation Kickoff" },
] as const

const architectureNodes = [
  {
    id: "users",
    name: "Presenter + Stakeholders",
    kind: "Experience Edge",
    description:
      "The deck frames the project for executives, operations leaders, and handlers before they move into the live product.",
    position: { x: 8, y: 14 },
    accent: "from-[#f7c873] to-[#ff8b68]",
    bullets: [
      "Public entry point through the web experience",
      "Context for why the platform matters before the demo starts",
      "Acts as the narrative edge of the system",
    ],
  },
  {
    id: "frontend",
    name: "Frontend Container App",
    kind: "Experience Surface",
    description:
      "The Next.js experience hosts the workbench, demos, and now the presentation route itself. It frames the conversation and then hands users into the working platform.",
    position: { x: 31, y: 20 },
    accent: "from-[#92f3e8] to-[#5bc0ff]",
    bullets: [
      "Public ingress on Azure Container Apps",
      "Exposes workbench views, agent demos, and platform story",
      "Calls the backend over HTTPS using API_URL",
    ],
  },
  {
    id: "backend",
    name: "Backend Container App",
    kind: "Orchestration Core",
    description:
      "FastAPI is the policy-aware orchestration layer. It exposes claims APIs, workflow endpoints, indexing operations, and the logic that coordinates the specialist agents.",
    position: { x: 54, y: 44 },
    accent: "from-[#5bc0ff] to-[#8a7dff]",
    bullets: [
      "Holds the claims orchestration and workflow services",
      "Stores DB and Azure OpenAI secrets in Container Apps secret storage",
      "Uses the frontend origin to enforce CORS",
    ],
  },
  {
    id: "postgres",
    name: "PostgreSQL Flexible Server",
    kind: "Private Data Plane",
    description:
      "The claims system now persists to PostgreSQL 16 on a private network path. Public access is disabled and name resolution stays inside the virtual network.",
    position: { x: 79, y: 24 },
    accent: "from-[#ffb36b] to-[#ff6f61]",
    bullets: [
      "PostgreSQL 16 on Burstable B1ms",
      "Deployed into a delegated postgres subnet",
      "Application database is claims_app",
    ],
  },
  {
    id: "registry",
    name: "Azure Container Registry",
    kind: "Delivery Spine",
    description:
      "Both workloads pull from the shared registry. The managed identity keeps image delivery passwordless and deployment-ready.",
    position: { x: 77, y: 61 },
    accent: "from-[#ffd979] to-[#d5a2ff]",
    bullets: [
      "Standard ACR tier with admin user disabled",
      "Hosts both backend and frontend images",
      "Supports Azure-side builds for deployment resilience",
    ],
  },
  {
    id: "identity",
    name: "Shared Managed Identity",
    kind: "Trust Fabric",
    description:
      "A single user-assigned identity is attached to both container apps. It currently handles passwordless ACR pulls and can anchor future secret and policy access patterns.",
    position: { x: 53, y: 76 },
    accent: "from-[#9ae76b] to-[#5fd6a4]",
    bullets: [
      "Assigned to frontend and backend container apps",
      "Has AcrPull on the registry scope",
      "Sets up a clean path for future Key Vault integration",
    ],
  },
  {
    id: "observability",
    name: "Container Apps + Log Analytics",
    kind: "Operations Layer",
    description:
      "The Container Apps environment gives the platform public ingress while still living inside a VNet-integrated environment. Log Analytics provides the central operational trail.",
    position: { x: 27, y: 73 },
    accent: "from-[#7ef0c1] to-[#54d7ff]",
    bullets: [
      "Container Apps environment is VNet-integrated on the container-apps subnet",
      "Both apps run on the Consumption workload profile",
      "Platform logs stream into Log Analytics",
    ],
  },
  {
    id: "aoai",
    name: "External Azure OpenAI",
    kind: "Intelligence Plane",
    description:
      "The backend reaches out to Azure OpenAI for chat and embeddings. It is intentionally shown as external because it sits outside this resource group and remains a critical runtime dependency.",
    position: { x: 12, y: 49 },
    accent: "from-[#e7a8ff] to-[#ffa578]",
    bullets: [
      "Supports chat and embeddings for agent behaviors",
      "Lives outside the resource group and primary region",
      "Important external dependency for platform availability",
    ],
  },
] as const

const architectureConnections = [
  { from: "users", to: "frontend", label: "presentation + workbench" },
  { from: "frontend", to: "backend", label: "API calls" },
  { from: "backend", to: "postgres", label: "private database path" },
  { from: "backend", to: "aoai", label: "models + embeddings" },
  { from: "frontend", to: "registry", label: "image pull source" },
  { from: "backend", to: "registry", label: "image pull source" },
  { from: "identity", to: "registry", label: "AcrPull" },
  { from: "observability", to: "frontend", label: "hosts" },
  { from: "observability", to: "backend", label: "hosts" },
] as const

const agentCards = [
  {
    id: "claim-assessor",
    name: "Claim Assessor",
    title: "Transforms evidence into damage and cost judgment",
    icon: FileSearch,
    accent: "from-[#ff986c] to-[#ff6b7a]",
    capabilities: [
      "Reads the incident narrative, loss details, and image evidence",
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
    title: "Maps claim facts against policy language and coverage terms",
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

const personaViews = [
  {
    id: "handler",
    label: "Claims Handler",
    title: "Focuses on caseload, queue movement, and intervention timing",
    summary:
      "The handler view is tuned for momentum. It keeps the next action, the AI recommendation, and the confidence trail in the same field of vision so a human can move work without losing context.",
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
      "Team leads need orchestration rather than single-claim detail. This view makes queue pressure, handoffs, and agent-assisted auto-approvals visible so supervisors can rebalance the system.",
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
      "Operations and compliance personas care about traceability. They need evidence that every recommendation came from the right signals, the right policy context, and the right human checkpoint.",
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
      "The executive view is about outcomes: cycle time, service experience, loss control, and the strategic shape of the operating model as agent capabilities mature.",
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

const repetitiveWorkstreams = [
  {
    icon: Gauge,
    title: "Status chasing",
    copy:
      "Handlers and leads burn time triaging queues, checking next actions, and stitching together what already happened.",
  },
  {
    icon: FileSearch,
    title: "Document loops",
    copy:
      "Police reports, repair estimates, policy wording, and claimant notes get requested, reviewed, and repeated across handoffs.",
  },
  {
    icon: Workflow,
    title: "Context stitching",
    copy:
      "Damage, coverage, risk, and customer communication often live in separate tools and separate mental models.",
  },
] as const

const organizationPressures = [
  {
    icon: Gauge,
    title: "Cycle time pressure",
    copy:
      "Decision latency grows because humans spend time assembling the claim before they can actually judge it.",
  },
  {
    icon: Handshake,
    title: "Service strain",
    copy:
      "Customers feel delay when status requests, missing documents, and follow-up loops bounce across teams.",
  },
  {
    icon: ShieldAlert,
    title: "Leakage and fraud exposure",
    copy:
      "Signals get missed when risk clues, policy context, and damage review are separated across tools and handoffs.",
  },
  {
    icon: Scale,
    title: "Audit reconstruction",
    copy:
      "Organizations end up rebuilding the reasoning after the fact instead of carrying it forward as the claim moves.",
  },
] as const

const insurancePersonas = [
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
      "Has to rebalance queues and escalations without a shared operational picture of what humans and agents already know.",
    needs:
      "Operational visibility into queue pressure, intervention timing, and where the system is slowing down.",
  },
  {
    id: "compliance",
    icon: Scale,
    name: "Compliance + Audit",
    role: "Protects consistency, governance, and recoverability.",
    burden:
      "Often reconstructs why a decision was made after the fact instead of tracing the decision as it happens.",
    needs:
      "A replayable trail of recommendations, overrides, evidence, and customer-facing actions.",
  },
] as const

const governancePillars = [
  {
    icon: Eye,
    title: "Trace every recommendation",
    copy:
      "Each specialist output should stay attributable to evidence, policy context, and the moment it entered the workflow.",
  },
  {
    icon: Handshake,
    title: "Keep humans explicit",
    copy:
      "Approvals, overrides, escalations, and requests for more information must remain visible human checkpoints.",
  },
  {
    icon: ShieldCheck,
    title: "Audit the operating model",
    copy:
      "Leads and compliance need to inspect how the system worked, not just read the final recommendation.",
  },
] as const

const traceChain = [
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

const roadmap = [
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
      "Persona-specific orchestration views across intake, adjudication, fraud, and service",
      "Portfolio-level optimization across handlers, claim types, and SLAs",
      "Broader ecosystem hooks into repair networks, payments, and external data sources",
    ],
  },
] as const

function clampSlideIndex(index: number) {
  return Math.max(0, Math.min(slideMeta.length - 1, index))
}

function resolveSlideIndex(slide: string | null) {
  if (!slide) {
    return 0
  }

  const normalized = slide.trim().toLowerCase()
  const numericIndex = Number(normalized)
  if (!Number.isNaN(numericIndex) && numericIndex >= 1) {
    return clampSlideIndex(numericIndex - 1)
  }

  const metaIndex = slideMeta.findIndex((entry) => entry.id === normalized)
  return metaIndex === -1 ? 0 : metaIndex
}

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 72 : -72,
    y: direction >= 0 ? 18 : -18,
    scale: 0.98,
    filter: "blur(14px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -72 : 72,
    y: direction >= 0 ? -12 : 12,
    scale: 1.01,
    filter: "blur(14px)",
  }),
}

function sectionHeading(
  eyebrow: string,
  title: string,
  description: string,
  compact = false
) {
  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <Badge
        variant="outline"
        className={cn(
          "border-white/15 bg-white/5 px-3 py-1 text-[11px] tracking-[0.28em] text-[#f7d7b3] uppercase",
          compact && "px-2.5 py-0.5 text-[10px] tracking-[0.24em]"
        )}
      >
        {eyebrow}
      </Badge>
      <div className={cn("space-y-3", compact && "space-y-2")}>
        <h2
          className={cn(
            "font-[family:var(--font-fraunces)] text-4xl leading-[0.95] text-[#fff7ec] sm:text-5xl lg:text-6xl",
            compact && "text-[clamp(2.3rem,4vw,4.35rem)] leading-[0.97]"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-3xl text-base leading-7 text-[#d5d8df] sm:text-lg",
              compact && "max-w-[46rem] text-sm leading-6 sm:text-base sm:leading-6"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function deckPill(label: string, value: string) {
  return (
    <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 backdrop-blur">
      <div className="text-[9px] uppercase tracking-[0.28em] text-[#9db0c7]">{label}</div>
      <div className="mt-0.5 text-[12px] font-medium text-[#fff7ec]">{value}</div>
    </div>
  )
}

function ArchitectureDiagram({
  activeNodeId,
  onSelect,
  compact = false,
}: {
  activeNodeId: string
  onSelect: (nodeId: string) => void
  compact?: boolean
}) {
  const activeNode =
    architectureNodes.find((node) => node.id === activeNodeId) ?? architectureNodes[2]

  const nodeLookup = Object.fromEntries(
    architectureNodes.map((node) => [node.id, node])
  ) as Record<string, (typeof architectureNodes)[number]>

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_340px]", compact && "gap-4 lg:grid-cols-[minmax(0,1.35fr)_300px]")}>
      <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className={cn("mb-4 flex items-center justify-between gap-3", compact && "mb-3")}>
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-[#92a7bf]">Live topology</div>
            <div className={cn("text-sm text-[#d0d5df]", compact && "text-[13px] leading-5")}>
              Public presentation layer, private claims data plane, and shared delivery fabric.
            </div>
          </div>
          <Badge className="border-0 bg-[#fff1df] text-[#172233]">Azure verified</Badge>
        </div>

        <div className={cn("hidden rounded-[1.5rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] lg:block", compact ? "h-[min(18.5rem,32vh)]" : "h-[min(26rem,48vh)]")}>
          <div className="relative h-full overflow-hidden rounded-[1.5rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,196,118,0.09),transparent_42%),linear-gradient(180deg,rgba(7,17,29,0.65),rgba(7,17,29,0.98))]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {architectureConnections.map((connection, index) => {
                const from = nodeLookup[connection.from]
                const to = nodeLookup[connection.to]
                const startX = from.position.x + 8
                const startY = from.position.y + 8
                const endX = to.position.x + 8
                const endY = to.position.y + 8
                const curve = `M ${startX}% ${startY}% C ${(startX + endX) / 2}% ${startY}% ${(startX + endX) / 2}% ${endY}% ${endX}% ${endY}%`

                return (
                  <g key={`${connection.from}-${connection.to}`}>
                    <motion.path
                      d={curve}
                      fill="none"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1.5"
                      strokeDasharray="7 10"
                      initial={{ pathLength: 0, opacity: 0.1 }}
                      animate={{ pathLength: 1, opacity: 0.75 }}
                      transition={{ delay: 0.15 + index * 0.06, duration: 0.6 }}
                    />
                    <motion.text
                      x={`${(startX + endX) / 2}%`}
                      y={`${(startY + endY) / 2 - 2}%`}
                      fill="rgba(239,232,222,0.72)"
                      fontSize="10"
                      textAnchor="middle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + index * 0.06 }}
                    >
                      {connection.label}
                    </motion.text>
                  </g>
                )
              })}
            </svg>

            {architectureNodes.map((node, index) => {
              const isActive = node.id === activeNodeId
              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className={cn(
                    "absolute w-40 rounded-[1.35rem] border px-4 py-3 text-left shadow-[0_18px_55px_rgba(4,6,10,0.36)] backdrop-blur transition-all",
                    compact && "w-36 rounded-[1.2rem] px-3 py-2.5",
                    isActive
                      ? "border-white/28 bg-white/14"
                      : "border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10"
                  )}
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.45 }}
                >
                  <div className={cn("h-1.5 rounded-full bg-gradient-to-r", node.accent)} />
                  <div className={cn("mt-3 text-[10px] uppercase tracking-[0.28em] text-[#9bb0c6]", compact && "mt-2 text-[9px]")}>
                    {node.kind}
                  </div>
                  <div className={cn("mt-2 text-sm font-medium leading-snug text-[#fff7ec]", compact && "mt-1.5 text-[13px] leading-5")}>
                    {node.name}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 lg:hidden">
          {architectureNodes.map((node) => {
            const isActive = node.id === activeNodeId
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect(node.id)}
                className={cn(
                  "rounded-[1.2rem] border px-4 py-3 text-left transition-all",
                  isActive
                    ? "border-white/24 bg-white/12"
                    : "border-white/8 bg-white/5"
                )}
              >
                <div className={cn("h-1.5 rounded-full bg-gradient-to-r", node.accent)} />
                <div className="mt-3 text-[10px] uppercase tracking-[0.28em] text-[#9bb0c6]">
                  {node.kind}
                </div>
                <div className="mt-1 text-sm font-medium text-[#fff7ec]">{node.name}</div>
              </button>
            )
          })}
        </div>
      </div>

      <Card className="border-white/10 bg-white/6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur">
        <CardHeader className={cn(compact && "space-y-2 pb-3")}>
          <CardTitle className={cn("font-[family:var(--font-fraunces)] text-3xl text-[#fff7ec]", compact && "text-[2rem]")}>
            {activeNode.name}
          </CardTitle>
          <CardDescription className="text-[#d3d7df]">{activeNode.kind}</CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-5", compact && "space-y-4 pt-0")}>
          <p className={cn("text-sm leading-7 text-[#d9dce3]", compact && "leading-6")}>{activeNode.description}</p>
          <div className="space-y-2">
            {activeNode.bullets.map((bullet) => (
              <div key={bullet} className={cn("rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-[#eef2f5]", compact && "px-3.5 py-2.5 text-[13px] leading-5")}>
                {bullet}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PlatformStoryDeck() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedSlide = searchParams.get("slide")
  const [currentIndex, setCurrentIndex] = useState(() =>
    resolveSlideIndex(requestedSlide)
  )
  const [slideDirection, setSlideDirection] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [activeArchitectureNode, setActiveArchitectureNode] = useState<string>("backend")
  const [activePersona, setActivePersona] = useState<string>(insurancePersonas[0].id)
  const [activeAgent, setActiveAgent] = useState<string>(agentCards[0].id)
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState<string>(roadmap[0].phase)
  const [activeTraceStep, setActiveTraceStep] = useState<string>(traceChain[0].title)
  const activePersonaCard =
    insurancePersonas.find((persona) => persona.id === activePersona) ?? insurancePersonas[0]
  const activeAgentCard = agentCards.find((agent) => agent.id === activeAgent) ?? agentCards[0]
  const activeRoadmapCard =
    roadmap.find((step) => step.phase === activeRoadmapPhase) ?? roadmap[0]
  const activeTraceCard =
    traceChain.find((step) => step.title === activeTraceStep) ?? traceChain[0]
  const currentSlide = slideMeta[currentIndex]
  const isOpeningSlide = currentSlide.id === "opening"
  const isCompactHeight = viewportHeight > 0 && viewportHeight < 900
  const isShortHeight = viewportHeight > 0 && viewportHeight < 760
  const showExpandedRail = !isOpeningSlide && !isShortHeight
  const showPresenterHints = !hasInteracted && !isOpeningSlide
  const shouldAnimateEntrance = hasMounted && hasInteracted
  const contentInsetClass = showExpandedRail
    ? "xl:pl-[19rem] 2xl:pl-[21rem]"
    : "xl:pl-32 2xl:pl-36"
  const mainFrameClass = isShortHeight
    ? "relative z-10 h-[100svh] overflow-hidden px-4 pb-16 pt-[6.65rem] sm:px-8 sm:pt-[7rem] lg:px-12 lg:pt-[7.2rem] xl:pr-20 2xl:pr-24"
    : "relative z-10 h-[100svh] overflow-hidden px-4 pb-24 pt-[8.25rem] sm:px-8 sm:pt-[9rem] lg:px-12 lg:pt-[9.5rem] xl:pr-20 2xl:pr-24"
  const sectionFrameClass = isShortHeight
    ? "h-[calc(100svh-8.4rem)] overflow-hidden"
    : "h-[calc(100svh-10.75rem)] overflow-hidden"
  const headerInnerClass = isShortHeight
    ? "mx-auto flex max-w-[98rem] items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-12"
    : "mx-auto flex max-w-[98rem] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12"

  const syncSlideInUrl = useCallback((nextIndex: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("slide", slideMeta[nextIndex].id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const goToSlide = useCallback((nextIndex: number) => {
    const clamped = clampSlideIndex(nextIndex)
    if (clamped === currentIndex) {
      return
    }
    setHasInteracted(true)
    setSlideDirection(clamped > currentIndex ? 1 : -1)
    startTransition(() => {
      setCurrentIndex(clamped)
      syncSlideInUrl(clamped)
    })
  }, [currentIndex, syncSlideInUrl])

  const shiftSlide = useCallback((direction: number) => {
    const clamped = clampSlideIndex(currentIndex + direction)
    if (clamped === currentIndex) {
      return
    }
    setHasInteracted(true)
    setSlideDirection(direction >= 0 ? 1 : -1)
    startTransition(() => {
      setCurrentIndex(clamped)
      syncSlideInUrl(clamped)
    })
  }, [currentIndex, syncSlideInUrl])

  const toggleFullscreen = useCallback(async () => {
    setHasInteracted(true)
    if (typeof document === "undefined") {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await document.documentElement.requestFullscreen()
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const nextIndex = resolveSlideIndex(requestedSlide)
    if (nextIndex === currentIndex) {
      return
    }

    setSlideDirection(nextIndex > currentIndex ? 1 : -1)
    setCurrentIndex(nextIndex)
  }, [currentIndex, requestedSlide])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight)
    }

    updateViewportHeight()
    window.addEventListener("resize", updateViewportHeight)
    return () => window.removeEventListener("resize", updateViewportHeight)
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousHtmlOverscroll = documentElement.style.overscrollBehavior

    body.style.overflow = "hidden"
    documentElement.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"
    documentElement.style.overscrollBehavior = "none"
    window.scrollTo(0, 0)

    return () => {
      body.style.overflow = previousBodyOverflow
      documentElement.style.overflow = previousHtmlOverflow
      body.style.overscrollBehavior = previousBodyOverscroll
      documentElement.style.overscrollBehavior = previousHtmlOverscroll
    }
  }, [])

  useEffect(() => {
    if (currentIndex > 0) {
      setHasInteracted(true)
    }
  }, [currentIndex])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault()
        shiftSlide(1)
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        shiftSlide(-1)
      }

      if (event.key === "Home") {
        event.preventDefault()
        goToSlide(0)
      }

      if (event.key === "End") {
        event.preventDefault()
        goToSlide(slideMeta.length - 1)
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault()
        void toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToSlide, shiftSlide, toggleFullscreen])

  const openingNarrative = isShortHeight
    ? "A presenter-led introduction to how insurance claims teams lose time to repetitive coordination, and how a governed human-agent model gives that judgment back."
    : "This deck starts with the work inside an insurance organization, the personas carrying it, and the need for traceable human-agent collaboration before it ever gets to the platform itself."

  const slides: Record<(typeof slideMeta)[number]["id"], ReactNode> = {
    opening: (
      <div className="grid h-full gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.82fr)] xl:items-start xl:gap-14">
        <div className="space-y-5 xl:pt-1">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-[#f5c483] backdrop-blur">
              <span>Story deck</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>Operating model narrative</span>
            </div>
            <h1 className={cn(
              "max-w-[13ch] font-[family:var(--font-fraunces)] text-[clamp(3rem,5.2vw,5.1rem)] leading-[0.9] tracking-[-0.052em] text-[#fff7ec]",
              isCompactHeight && "max-w-[13.3ch] text-[clamp(2.55rem,4.7vw,4.65rem)]"
            )}>
              Insurance claims teams spend judgment on repetitive work.
            </h1>
            <p className={cn(
              "max-w-[43rem] text-[15px] leading-7 text-[#d3d7de] sm:text-[1.02rem]",
              isCompactHeight && "max-w-[40rem] text-sm leading-6 sm:text-sm"
            )}>
              {openingNarrative}
            </p>
          </div>

          {isCompactHeight ? (
            <div className="flex flex-wrap gap-2">
              {[
                "Industry lens first",
                "Human-led, agent-guided",
                "Governed AI operations",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#d9dde3] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid max-w-[48rem] gap-2 sm:grid-cols-3">
              {deckPill("Industry lens", "Insurance workday first")}
              {deckPill("Operating model", "Human-led, agent-guided")}
              {deckPill("Control model", "Traceable by design")}
            </div>
          )}

          {!isShortHeight ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rounded-full bg-[#fff2e1] px-6 text-[#172333] hover:bg-[#ffe3c1]"
                onClick={() => shiftSlide(1)}
              >
                Start with the workday
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-full border-white/15 bg-white/5 px-6 text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
              >
                <Link href="/">Jump into the live workbench</Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 xl:pt-8 2xl:pl-4 2xl:pt-12">
          <Card className="border-white/10 bg-white/8 text-white shadow-[0_35px_120px_rgba(0,0,0,0.34)] backdrop-blur">
            <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
              <CardTitle className="flex items-center gap-3 text-[#fff7ec]">
                <PanelTop className="size-5 text-[#9ef2de]" />
                What this deck does
              </CardTitle>
              <CardDescription className={cn("text-[#d0d6df]", isCompactHeight && "text-sm leading-5")}>
                A presenter-led web narrative, not a screenshot gallery.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("grid gap-3 text-sm text-[#eef2f6]", isCompactHeight && "gap-2 pt-0")}>
              <div className={cn("rounded-2xl border border-white/8 bg-black/15 px-4 py-3", isCompactHeight && "px-3.5 py-2.5 text-[13px] leading-5")}>
                Starts with the insurer operating reality before showing the product.
              </div>
              <div className={cn("rounded-2xl border border-white/8 bg-black/15 px-4 py-3", isCompactHeight && "px-3.5 py-2.5 text-[13px] leading-5")}>
                Maps repetitive work across the people who carry claims every day.
              </div>
              <div className={cn("rounded-2xl border border-white/8 bg-black/15 px-4 py-3", isCompactHeight && "px-3.5 py-2.5 text-[13px] leading-5")}>
                Reveals the governed human-agent system built to change that work.
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "4", title: "Core personas", icon: UsersRound },
              { label: "3", title: "Repetitive loops", icon: Workflow },
              { label: "1", title: "Governed workflow", icon: Eye },
            ].map((item) => (
              <motion.div
                key={item.title}
                className="rounded-[1.7rem] border border-white/10 bg-white/8 p-3.5 shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur"
                initial={shouldAnimateEntrance ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <item.icon className="size-5 text-[#f8c977]" />
                <div className="mt-3 font-[family:var(--font-fraunces)] text-[2.6rem] text-[#fff7ec]">
                  {item.label}
                </div>
                <div className="mt-1 text-sm text-[#d0d6df]">{item.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    ),
    operations: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Repetitive work",
          "Claims organizations are not blocked by a lack of judgment. They are blocked by the work required before judgment can happen.",
          "This is the operational drag: status chasing, document loops, context stitching, and reconstruction work that turns skilled people into the integration layer for the process.",
          isCompactHeight
        )}

        <div className="grid flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur">
            <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-[2.4rem] text-[#fff7ec]", isCompactHeight && "text-[2rem]")}>
                Where the day disappears
              </CardTitle>
              <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
                The mundane work is not trivial. It is the operating cost that shapes cycle time, service quality, and team morale.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-3", isCompactHeight && "space-y-2 pt-0")}>
              {repetitiveWorkstreams.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-[1.45rem] border border-white/8 bg-black/18 px-4 py-3.5",
                    isCompactHeight && "px-3.5 py-3"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="size-5 text-[#95f2df]" />
                    <div className="text-sm font-medium text-[#fff7ec]">{item.title}</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#d5dae2]">{item.copy}</div>
                </div>
              ))}

              {!isCompactHeight ? (
                <div className="rounded-[1.45rem] border border-dashed border-white/12 bg-white/4 px-4 py-3 text-sm leading-6 text-[#d8dde4]">
                  The cost shows up everywhere: slower decisions, weaker service, harder governance, and more pressure on the people doing the work.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {organizationPressures.map((pressure) => (
              <div
                key={pressure.title}
                className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <pressure.icon className="size-[18px] text-[#f5c483]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#fff7ec]">{pressure.title}</div>
                    <div className="text-[12px] uppercase tracking-[0.18em] text-[#91a6bd]">What the org absorbs</div>
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-[#cfd6df]">{pressure.copy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    personas: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Core personas",
          "Different personas feel the same friction differently.",
          "A useful claims platform has to fit the real operating roles inside an insurer. It has to help intake, handlers, team leads, and compliance without flattening them into one generic user.",
          isCompactHeight
        )}

        {isShortHeight ? (
          <div className="grid flex-1 gap-4 lg:grid-cols-[0.42fr_0.58fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-4 shadow-[0_22px_80px_rgba(0,0,0,0.26)] backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#91a6bd]">
                Who the deck is speaking to
              </div>
              <div className="mt-3 space-y-2">
                {insurancePersonas.map((persona) => {
                  const isActive = persona.id === activePersonaCard.id
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setActivePersona(persona.id)}
                      className={cn(
                        "w-full rounded-[1.15rem] border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-white/20 bg-white/12 text-[#fff7ec]"
                          : "border-white/8 bg-black/18 text-[#d0d7df] hover:border-white/14 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <persona.icon className={cn("size-4", isActive ? "text-[#95f2df]" : "text-[#f5c483]")} />
                        <div>
                          <div className="text-sm font-medium">{persona.name}</div>
                          <div className="text-[11px] text-[#95a7ba]">Insurance role</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <motion.div
              key={activePersonaCard.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="rounded-[1.8rem] border border-white/10 bg-[#09131f]/78 p-5 shadow-[0_26px_90px_rgba(0,0,0,0.28)] backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
                  <activePersonaCard.icon className="size-5 text-[#95f2df]" />
                </div>
                <div>
                  <div className="text-lg font-medium text-[#fff7ec]">{activePersonaCard.name}</div>
                  <div className="mt-1 text-sm leading-6 text-[#d6dce4]">{activePersonaCard.role}</div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.3rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#d1d8e0]">
                {activePersonaCard.burden}
              </div>
              <div className="mt-3 rounded-[1.3rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#eef2f5]">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                  What they need
                </div>
                <div className="mt-2">{activePersonaCard.needs}</div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {insurancePersonas.map((persona, index) => (
                <motion.div
                  key={persona.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + index * 0.05 }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[0_22px_80px_rgba(0,0,0,0.26)] backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
                      <persona.icon className="size-5 text-[#95f2df]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#fff7ec]">{persona.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                        Insurance role
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm leading-6 text-[#eef2f5]">{persona.role}</div>
                  <div className="mt-3 rounded-[1.2rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#d1d8e0]">
                    {persona.burden}
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                      What they need
                    </div>
                    <div className="mt-2 rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#eef2f5]">
                      {persona.needs}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/18 px-5 py-4 text-sm leading-6 text-[#d9dee5]">
              The common requirement is straightforward: compress analysis and coordination without erasing accountability, role clarity, or decision traceability.
            </div>
          </>
        )}
      </div>
    ),
    mission: (
      <div className="grid h-full gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          {sectionHeading(
            "Operating thesis",
            "The platform exists to give claims organizations back time for judgment without making the work less governable.",
            "The response is not full autonomy. It is a human-led operating model where specialist agents compress repetitive analysis, the workbench presents one decision frame, and controls stay attached to the flow.",
            isCompactHeight
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Gauge,
                title: "Reduce repetitive work",
                copy: "Move status chasing, evidence assembly, and triage summaries out of the human critical path.",
              },
              {
                icon: Scale,
                title: "Keep judgment human",
                copy: "Let agents accelerate analysis while the handler, lead, or reviewer stays explicit in the decision loop.",
              },
              {
                icon: Eye,
                title: "Make the work traceable",
                copy: "Carry the why across policy context, evidence, specialist outputs, and customer follow-up.",
              },
            ].map((pillar) => (
              <Card
                key={pillar.title}
                className="border-white/10 bg-white/6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur"
              >
                <CardHeader className={cn(isCompactHeight && "gap-2 pb-3")}>
                  <CardTitle className={cn("flex items-center gap-3 text-xl text-[#fff7ec]", isCompactHeight && "text-lg")}>
                    <pillar.icon className="size-5 text-[#95f2df]" />
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("text-sm leading-7 text-[#d1d6de]", isCompactHeight && "pt-0 leading-6")}>
                  {pillar.copy}
                </CardContent>
              </Card>
            ))}
          </div>

          {isCompactHeight ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/18 px-5 py-4 text-sm leading-6 text-[#d9dde3]">
              The design intent is simple: take the mundane work off the critical path without making the claims organization less governable.
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 xl:grid-rows-2">
          {[
            {
              stage: "Without this model",
              title: "People become the integration layer",
              points: [
                "Evidence, policy reading, risk review, and customer follow-up live in separate mental models.",
                "The decision arrives late because the team must reconstruct the claim before it can judge it.",
              ],
            },
            {
              stage: "With the platform",
              title: "The operating model becomes the integration layer",
              points: [
                "Specialist agents contribute structured outputs instead of opaque prose.",
                "The workbench turns orchestration, auditability, and service into one working system.",
              ],
            },
          ].map((panel, index) => (
            <motion.div
              key={panel.stage}
              className="rounded-[1.8rem] border border-white/10 bg-black/18 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">{panel.stage}</div>
              <h3 className={cn("mt-3 font-[family:var(--font-fraunces)] text-3xl text-[#fff7ec]", isCompactHeight && "text-[2rem]")}>
                {panel.title}
              </h3>
              <div className="mt-4 space-y-2">
                {panel.points.map((point) => (
                  <div key={point} className={cn("rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-7 text-[#d4d8df]", isCompactHeight && "px-3.5 py-2.5 leading-6")}>
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    architecture: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Architecture",
          isShortHeight
            ? "Public experience, private claims data, shared delivery."
            : "Once the operating model is clear, the system topology becomes legible.",
          isShortHeight
            ? "Container Apps handles the experience, PostgreSQL stays private, identity stays shared, and Azure OpenAI remains an explicit external dependency."
            : "This view mirrors the live Azure deployment: public conversation surfaces on Container Apps, a private PostgreSQL path inside the VNet, a shared delivery identity, and an external Azure OpenAI dependency kept explicit.",
          isCompactHeight
        )}
        <ArchitectureDiagram
          activeNodeId={activeArchitectureNode}
          onSelect={setActiveArchitectureNode}
          compact={isCompactHeight}
        />
      </div>
    ),
    agents: (
      <div className="grid h-full gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-4">
          {sectionHeading(
            "Agent constellation",
            "Each agent owns a specific kind of judgment so the platform can stay legible.",
            "The point is not to create a monolithic super-agent. It is to create a stable ecosystem of specialist roles whose outputs can be compared, synthesized, escalated, and trusted.",
            isCompactHeight
          )}
          <div className="space-y-2.5">
            {agentCards.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveAgent(agent.id)}
                className={cn(
                  "w-full rounded-[1.35rem] border px-4 py-3 text-left transition-all",
                  activeAgent === agent.id
                    ? "border-white/24 bg-white/12 shadow-[0_28px_90px_rgba(0,0,0,0.28)]"
                    : "border-white/8 bg-white/5 hover:border-white/16 hover:bg-white/8"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-[#122031]", agent.accent)}>
                    <agent.icon className="size-[18px]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#fff7ec]">{agent.name}</div>
                    <div className="text-[13px] leading-5 text-[#cfd5de]">{agent.title}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeAgentCard.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <Card className="border-white/10 bg-white/7 text-white shadow-[0_30px_110px_rgba(0,0,0,0.3)] backdrop-blur">
            <CardHeader className={cn("space-y-4", isCompactHeight && "space-y-3 pb-3")}>
              <div className={cn("h-2 w-32 rounded-full bg-gradient-to-r", activeAgentCard.accent)} />
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompactHeight && "text-[2.4rem]")}>
                {activeAgentCard.name}
              </CardTitle>
              <CardDescription className={cn("max-w-2xl text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
                {activeAgentCard.title}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("grid gap-5 md:grid-cols-2", isCompactHeight && "gap-4 pt-0")}>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">Capabilities</div>
                {activeAgentCard.capabilities.map((capability) => (
                  <div key={capability} className={cn("rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-7 text-[#ecf0f4]", isCompactHeight && "px-3.5 py-2.5 leading-6")}>
                    {capability}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#95f2df]">What it delivers</div>
                {activeAgentCard.delivers.map((deliverable) => (
                  <div key={deliverable} className={cn("rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-7 text-[#eef2f6]", isCompactHeight && "px-3.5 py-2.5 leading-6")}>
                    {deliverable}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BrainCircuit,
                label: "Structured outputs",
                copy: "Every specialist contributes data the synthesizer can actually reason over.",
              },
              {
                icon: Workflow,
                label: "Composable roles",
                copy: "The platform can re-route or expand specialist roles without collapsing the workflow model.",
              },
              {
                icon: UsersRound,
                label: "Human checkpoints",
                copy: "Agent outputs are meant to accelerate judgment, not hide it.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-3.5">
                <item.icon className="size-5 text-[#95f2df]" />
                <div className="mt-2 text-[13px] font-medium text-[#fff7ec]">{item.label}</div>
                <div className="mt-1.5 text-[13px] leading-5 text-[#d1d7df]">{item.copy}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    ),
    workbench: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Workbench",
          isShortHeight
            ? "Role-based collaboration needs the right frame."
            : "Human-agent collaboration becomes real when each persona gets the right frame, the right controls, and the right trace.",
          isShortHeight
            ? ""
            : "The workbench is the operational stage. The same claims system can present different views to handlers, team leads, compliance partners, and sponsors so each person sees the orchestration they need rather than a generic dashboard.",
          isCompactHeight
        )}

        <Tabs defaultValue={personaViews[0].id} className="flex flex-1 flex-col gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1.5 rounded-[1.35rem] border border-white/8 bg-white/6 p-1.5">
            {personaViews.map((persona) => (
              <TabsTrigger
                key={persona.id}
                value={persona.id}
                className="rounded-[1rem] px-3 py-1.5 text-sm text-[#e9edf2] data-[state=active]:bg-[#fff1de] data-[state=active]:text-[#152133] dark:data-[state=active]:bg-[#fff1de] dark:data-[state=active]:text-[#152133]"
              >
                {persona.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {personaViews.map((persona) => (
            <TabsContent key={persona.id} value={persona.id} className="flex-1">
              {isShortHeight ? (
                <div className="grid h-full gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                  <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                        Operational focus
                      </div>
                      <CardTitle className="font-[family:var(--font-fraunces)] text-[2rem] leading-[1.02] text-[#fff7ec]">
                        {persona.label}
                      </CardTitle>
                      <CardDescription className="text-sm leading-6 text-[#d2d7df]">
                        {persona.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {persona.lenses.slice(0, 2).map((lens) => (
                          <div key={lens} className="rounded-full border border-white/8 bg-black/18 px-3 py-2 text-[13px] leading-5 text-[#edf1f5]">
                            {lens}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.6rem] border border-white/10 bg-[#09131f]/78 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.3)] backdrop-blur">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                          Primary view
                        </div>
                        <Badge className="border-white/10 bg-white/8 text-[#fff7ec]">
                          {persona.label}
                        </Badge>
                      </div>

                      <div className="grid gap-3">
                        {persona.panels.slice(0, 2).map((panel, index) => (
                          <div
                            key={panel}
                            className={cn(
                              "rounded-[1.35rem] border px-4 py-3 text-sm leading-6",
                              index === 0
                                ? "border-[#95f2df]/30 bg-[#95f2df]/10 text-[#effcf8]"
                                : "border-white/8 bg-black/18 text-[#d4d9e0]"
                            )}
                          >
                            {panel}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-white/7 p-4">
                      <div className="flex items-center gap-3">
                        <Radar className="size-5 text-[#8ecbff]" />
                        <div className="text-sm font-medium text-[#fff7ec]">Signals surfaced</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {persona.lenses.slice(0, 2).map((lens) => (
                          <div key={lens} className="rounded-2xl border border-white/8 bg-black/16 px-4 py-3 text-sm leading-6 text-[#eaf0f5]">
                            {lens}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid h-full gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                  <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
                    <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
                      <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompactHeight && "text-[2.25rem]")}>
                        {persona.title}
                      </CardTitle>
                      <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
                        {persona.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">What this persona sees</div>
                        <div className="mt-3 grid gap-2">
                          {persona.lenses.slice(0, isCompactHeight ? 2 : persona.lenses.length).map((lens) => (
                            <div key={lens} className="rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#edf1f5]">
                              {lens}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#95f2df]">Workbench composition</div>
                        <div className="mt-3 grid gap-2">
                          {persona.panels.slice(0, isCompactHeight ? 2 : persona.panels.length).map((panel) => (
                            <div key={panel} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#edf1f5]">
                              {panel}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-[2rem] border border-white/10 bg-[#09131f]/78 p-4 shadow-[0_34px_120px_rgba(0,0,0,0.32)] backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                          Persona lens
                        </div>
                        <div className="mt-1 text-[13px] leading-5 text-[#d4d8df]">
                          A stylized view of how the same platform re-composes around a role.
                        </div>
                      </div>
                      <Badge className="border-white/10 bg-white/8 text-[#fff7ec]">
                        {persona.label}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-3">
                        <div className="rounded-[1.5rem] border border-white/8 bg-white/7 p-4">
                          <div className="flex items-center gap-3">
                            <BriefcaseBusiness className="size-5 text-[#95f2df]" />
                            <div className="text-sm font-medium text-[#fff7ec]">Primary view</div>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {persona.panels.slice(0, isCompactHeight ? 2 : persona.panels.length).map((panel, index) => (
                              <div
                                key={panel}
                                className={cn(
                                  "rounded-2xl border px-4 py-3 text-sm leading-6",
                                  index === 0
                                    ? "border-[#95f2df]/30 bg-[#95f2df]/10 text-[#effcf8]"
                                    : "border-white/8 bg-black/18 text-[#d4d9e0]"
                                )}
                              >
                                {panel}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/8 bg-black/18 p-4">
                          <div className="flex items-center gap-3">
                            <UsersRound className="size-5 text-[#f5c483]" />
                            <div className="text-sm font-medium text-[#fff7ec]">Human-agent handshake</div>
                          </div>
                          <div className="mt-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#e7ebef]">
                            Agents compress evidence, policy, and risk into actionable insight. The persona view determines how much orchestration control, explanation depth, and intervention tooling is visible.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/8 bg-white/7 p-4">
                        <div className="flex items-center gap-3">
                          <Radar className="size-5 text-[#8ecbff]" />
                          <div className="text-sm font-medium text-[#fff7ec]">Signals surfaced</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {persona.lenses.slice(0, isCompactHeight ? 2 : persona.lenses.length).map((lens) => (
                            <div key={lens} className="rounded-2xl border border-white/8 bg-black/16 px-4 py-3 text-sm leading-6 text-[#eaf0f5]">
                              {lens}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    ),
    governance: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Trust + traceability",
          isShortHeight
            ? "Traceability makes collaboration governable."
            : "Human-agent collaboration only scales when the organization can see who recommended what, based on which signals, and who decided the next step.",
          isShortHeight
            ? ""
            : "Auditability is not a report you generate later. It is part of the workflow design: evidence stays attached, specialist outputs stay attributable, and human checkpoints remain explicit.",
          isCompactHeight
        )}

        {isShortHeight ? (
          <div className="grid flex-1 gap-4">
            <div className="grid gap-2 md:grid-cols-3">
              {governancePillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-white shadow-[0_18px_70px_rgba(0,0,0,0.2)] backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <pillar.icon className="size-5 text-[#95f2df]" />
                    <div className="text-sm font-medium text-[#fff7ec]">{pillar.title}</div>
                  </div>
                </div>
              ))}
            </div>

            <Card className="border-white/10 bg-[#09131f]/78 text-white shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="font-[family:var(--font-fraunces)] text-[2rem] text-[#fff7ec]">
                  The decision trace
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#d2d7df]">
                  The organization should be able to replay the path from evidence to action without guessing where the reasoning lived.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0">
                <div className="grid gap-2 md:grid-cols-4">
                  {traceChain.map((step, index) => {
                    const isActive = step.title === activeTraceCard.title
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => setActiveTraceStep(step.title)}
                        className={cn(
                          "rounded-[1.15rem] border px-3 py-3 text-left transition-all",
                          isActive
                            ? "border-white/20 bg-white/12 text-[#fff7ec]"
                            : "border-white/8 bg-black/18 text-[#d0d7df] hover:border-white/14 hover:bg-white/8"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <step.icon className={cn("size-4", isActive ? "text-[#95f2df]" : "text-[#f5c483]")} />
                            <div className="text-sm font-medium">{step.title}</div>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-[1.35rem] border border-white/8 bg-black/18 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#f5c483]">
                      <activeTraceCard.icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#fff7ec]">{activeTraceCard.title}</div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                        Active trace step
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#d2d8e0]">{activeTraceCard.copy}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid flex-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3">
              {governancePillars.map((pillar) => (
                <Card
                  key={pillar.title}
                  className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur"
                >
                  <CardHeader className={cn(isCompactHeight && "gap-2 pb-3")}>
                    <CardTitle className="flex items-center gap-3 text-xl text-[#fff7ec]">
                      <pillar.icon className="size-5 text-[#95f2df]" />
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("text-sm leading-6 text-[#d1d7df]", isCompactHeight && "pt-0")}>
                    {pillar.copy}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-white/10 bg-[#09131f]/78 text-white shadow-[0_32px_110px_rgba(0,0,0,0.3)] backdrop-blur">
              <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
                <CardTitle className={cn("font-[family:var(--font-fraunces)] text-[2.4rem] text-[#fff7ec]", isCompactHeight && "text-[2rem]")}>
                  The decision trace
                </CardTitle>
                <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
                  A claims organization should be able to replay the path from evidence to action without guessing where the reasoning lived.
                </CardDescription>
              </CardHeader>
              <CardContent className={cn("space-y-3", isCompactHeight && "space-y-2 pt-0")}>
                {traceChain.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[1.45rem] border border-white/8 bg-black/18 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#f5c483]">
                        <step.icon className="size-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-[#fff7ec]">{step.title}</div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                        </div>
                        <div className="mt-1 text-sm leading-6 text-[#d2d8e0]">{step.copy}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {!isCompactHeight ? (
                  <div className="rounded-[1.45rem] border border-dashed border-white/12 bg-white/4 px-4 py-3 text-sm leading-6 text-[#dbe0e6]">
                    This is the control model: recommendations are visible, overrides are captured, and customer communication stays tied to the decision rationale.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    ),
    future: (
      <div className="flex h-full flex-col gap-6">
        {sectionHeading(
          "Future horizon",
          isShortHeight
            ? "The long game is a smarter claims operating system."
            : "The long game is not a bigger assistant. It is a smarter claims operating system.",
          isShortHeight
            ? "This release proves the shape of the model. The next leap is letting those roles negotiate, adapt, and rebalance as part of a broader claims mesh."
            : "Today’s implementation proves the shape of the system: specialist intelligence, transparent outputs, and human orchestration. The next leap is letting those roles negotiate, adapt, and rebalance as part of a broader claims mesh.",
          isCompactHeight
        )}

        {isShortHeight ? (
          <div className="grid flex-1 gap-4 lg:grid-cols-[0.38fr_0.62fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-white/6 p-4 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#91a6bd]">
                Evolution path
              </div>
              <div className="mt-3 space-y-2">
                {roadmap.map((step) => {
                  const isActive = step.phase === activeRoadmapCard.phase
                  return (
                    <button
                      key={step.phase}
                      type="button"
                      onClick={() => setActiveRoadmapPhase(step.phase)}
                      className={cn(
                        "w-full rounded-[1.15rem] border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-white/20 bg-white/12 text-[#fff7ec]"
                          : "border-white/8 bg-black/18 text-[#d0d7df] hover:border-white/14 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{step.phase}</div>
                          <div className="text-[11px] text-[#95a7ba]">{step.title}</div>
                        </div>
                        <Rocket className={cn("size-4", isActive ? "text-[#95f2df]" : "text-[#f5c483]")} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <Card className="border-white/10 bg-[#09131f]/78 text-white shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="border-0 bg-[#fff1de] text-[#152133]">{activeRoadmapCard.phase}</Badge>
                  <Rocket className="size-5 text-[#95f2df]" />
                </div>
                <CardTitle className="font-[family:var(--font-fraunces)] text-[2.1rem] text-[#fff7ec]">
                  {activeRoadmapCard.title}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#d2d7df]">
                  {activeRoadmapCard.focus}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0 md:grid-cols-3">
                {activeRoadmapCard.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#edf1f5]">
                    {bullet}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {roadmap.map((step, index) => (
              <motion.div
                key={step.phase}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.08 }}
              >
                <Card className="h-full border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.27)] backdrop-blur">
                  <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="border-0 bg-[#fff1de] text-[#152133]">{step.phase}</Badge>
                      <Rocket className="size-5 text-[#95f2df]" />
                    </div>
                    <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompactHeight && "text-[2.2rem]")}>
                      {step.title}
                    </CardTitle>
                    <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
                      {step.focus}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={cn("space-y-3", isCompactHeight && "space-y-2 pt-0")}>
                    {step.bullets.map((bullet) => (
                      <div key={bullet} className={cn("rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-7 text-[#edf1f5]", isCompactHeight && "px-3.5 py-2.5 leading-6")}>
                        {bullet}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isCompactHeight && !isShortHeight ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Workflow,
                label: "Adaptive orchestration",
                copy: "Claims flows become policy-aware networks instead of fixed pipelines.",
              },
              {
                icon: BrainCircuit,
                label: "Agent negotiation",
                copy: "Specialists challenge and refine each other before a human ever opens the claim.",
              },
              {
                icon: ShieldCheck,
                label: "Governed autonomy",
                copy: "More automation only arrives when guardrails, auditability, and controls scale with it.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 text-white">
                <item.icon className="size-5 text-[#f5c483]" />
                <div className="mt-4 text-lg font-medium text-[#fff7ec]">{item.label}</div>
                <div className="mt-2 text-sm leading-7 text-[#d4d8df]">{item.copy}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ),
    close: (
      <div className="grid h-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          {sectionHeading(
            "Conversation starter",
            "The real question is not whether agents can help with claims. It is what kind of claims organization you want to become.",
            "This deck is meant to open that conversation. The platform already shows how explainable specialist agents, private-by-design data access, and persona-aware workbenches can coexist inside one operating model. The next step is choosing how far to push that model.",
            isCompactHeight
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Which parts of the claim lifecycle should remain human-led by policy rather than capability?",
              "Which personas need new orchestration views as the agent mesh expands?",
              "What signals would justify more autonomy versus more review?",
              "Where should ecosystem integrations plug in next: repair, payments, fraud, or customer service?",
            ].slice(0, isCompactHeight ? 3 : 4).map((question) => (
              <div key={question} className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-[#edf1f5]">
                {question}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-full bg-[#fff2e1] px-6 text-[#172333] hover:bg-[#ffe3c1]"
            >
              <Link href="/">
                Enter the live workbench
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/15 bg-white/5 px-6 text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
              onClick={() => goToSlide(0)}
            >
              Restart presentation
            </Button>
          </div>
        </div>

        <Card className="border-white/10 bg-white/7 text-white shadow-[0_34px_110px_rgba(0,0,0,0.32)] backdrop-blur">
          <CardHeader className={cn(isCompactHeight && "space-y-2 pb-3")}>
            <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompactHeight && "text-[2.25rem]")}>
              What the platform can already prove
            </CardTitle>
            <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompactHeight && "text-sm leading-6")}>
              This is already more than a concept deck. It is a working product with a narrative layer built directly into it.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-4", isCompactHeight && "space-y-3 pt-0")}>
            {[
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
                copy: "The UI can evolve from one dashboard into multiple orchestration views for different operators.",
              },
              {
                icon: Sparkles,
                title: "Narrative built into the product",
                copy: "A presenter can now move from story to live platform without leaving the app.",
              },
            ].slice(0, isCompactHeight ? 3 : 4).map((item) => (
              <div key={item.title} className="rounded-[1.45rem] border border-white/8 bg-black/18 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 size-5 text-[#95f2df]" />
                  <div>
                    <div className="text-sm font-medium text-[#fff7ec]">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#d3d8df]">{item.copy}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    ),
  }

  const progress = ((currentIndex + 1) / slideMeta.length) * 100

  return (
    <div
      className={cn(
        fraunces.variable,
        plexSans.variable,
        "h-[100svh] max-h-[100svh] overflow-hidden bg-[#06111a] text-[#f8ead8]"
      )}
    >
      <div className="relative isolate h-[100svh] overflow-hidden font-[family:var(--font-plex-sans)]">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 15% 20%, rgba(255, 187, 111, 0.18), transparent 25%), radial-gradient(circle at 82% 24%, rgba(94, 209, 184, 0.15), transparent 30%), linear-gradient(135deg, #06111a 0%, #0a1a29 45%, #120f1f 100%)",
              "radial-gradient(circle at 25% 18%, rgba(255, 187, 111, 0.15), transparent 28%), radial-gradient(circle at 74% 28%, rgba(94, 209, 184, 0.19), transparent 30%), linear-gradient(135deg, #06111a 0%, #0a1a29 42%, #171226 100%)",
              "radial-gradient(circle at 20% 32%, rgba(255, 187, 111, 0.14), transparent 28%), radial-gradient(circle at 78% 18%, rgba(94, 209, 184, 0.16), transparent 34%), linear-gradient(135deg, #07111b 0%, #0c1b2c 45%, #130f22 100%)",
            ],
          }}
          transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:86px_86px] opacity-25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(4,8,14,0.24)_55%,rgba(4,8,14,0.82)_100%)]" />

        <header className="fixed inset-x-0 top-0 z-30">
          <div className={headerInnerClass}>
            <div className={cn(
              "rounded-[1.15rem] border border-white/10 bg-black/20 px-4 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur",
              isShortHeight && "px-3.5 py-2"
            )}>
              <div className={cn(
                "flex items-center gap-3 text-[9px] uppercase tracking-[0.32em] text-[#9fb0c4]",
                isShortHeight && "gap-2 text-[8px]"
              )}>
                <span>Contoso AI Claims</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{isOpeningSlide ? "Story deck" : "Presentation route"}</span>
              </div>
              <div className={cn("mt-1.5 text-sm font-medium text-[#fff7ec]", isShortHeight && "mt-1 text-[13px]")}>
                {currentSlide.section}
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-1.5 rounded-full border border-white/10 bg-black/24 px-1.5 py-1.5 backdrop-blur",
              isShortHeight && "gap-1 px-1 py-1"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftSlide(-1)}
                disabled={currentIndex === 0}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec] disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="px-3 text-sm text-[#d2d7df]">
                {String(currentIndex + 1).padStart(2, "0")} / {String(slideMeta.length).padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftSlide(1)}
                disabled={currentIndex === slideMeta.length - 1}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec] disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void toggleFullscreen()}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Expand className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="h-px w-full bg-white/6">
            <motion.div
              className="h-px bg-gradient-to-r from-[#f5c483] via-[#95f2df] to-[#8ecbff]"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
        </header>

        <aside className={cn("fixed left-6 z-20 hidden xl:block", isShortHeight ? "top-24" : "top-32")}>
          <AnimatePresence initial={false} mode="wait">
            {showExpandedRail ? (
              <motion.div
                key="expanded-rail"
                initial={
                  shouldAnimateEntrance ? { opacity: 0, x: -18, filter: "blur(10px)" } : false
                }
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -18, filter: "blur(10px)" }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="max-h-[calc(100vh-10rem)] w-[14.75rem] overflow-y-auto rounded-[1.8rem] border border-white/10 bg-black/18 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur"
              >
                <div className="mb-3 px-3 text-[10px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                  Slide map
                </div>
                <div className="space-y-2">
                  {slideMeta.map((slide, index) => {
                    const isActive = index === currentIndex
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-2 text-left transition-all",
                          isActive
                            ? "bg-white/12 text-[#fff7ec]"
                            : "text-[#c5ccd6] hover:bg-white/8 hover:text-[#fff7ec]"
                        )}
                      >
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            isActive ? "bg-[#fff1de]" : "bg-white/25"
                          )}
                        />
                        <div>
                          <div className="text-xs font-medium">{slide.shortLabel}</div>
                          <div className="text-[11px] text-[#98aabd]">{slide.section}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compact-rail"
                initial={
                  shouldAnimateEntrance ? { opacity: 0, x: -18, filter: "blur(10px)" } : false
                }
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -18, filter: "blur(10px)" }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="w-[4.95rem] rounded-[1.8rem] border border-white/10 bg-black/18 px-3 py-4 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur"
              >
                <div className="text-center text-[10px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                  Flow
                </div>
                <div className="mt-4 flex flex-col items-center gap-3">
                  {slideMeta.map((slide, index) => {
                    const isActive = index === currentIndex
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border text-xs transition-all",
                          isActive
                            ? "border-white/20 bg-[#fff1de] text-[#152133]"
                            : "border-white/10 bg-white/6 text-[#d5dbe3] hover:bg-white/10"
                        )}
                        title={slide.section}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        <main
          className={cn(
            mainFrameClass,
            contentInsetClass
          )}
        >
          <div className={cn("mx-auto h-full", isOpeningSlide ? "max-w-[96rem]" : "max-w-[90rem]")}>
            <AnimatePresence initial={false} mode="wait" custom={slideDirection}>
              <motion.section
                key={currentSlide.id}
                custom={slideDirection}
                variants={slideVariants}
                initial={shouldAnimateEntrance ? "enter" : false}
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: "easeInOut" }}
                className={sectionFrameClass}
              >
                {slides[currentSlide.id]}
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
          <AnimatePresence initial={false}>
            {showPresenterHints ? (
              <motion.div
                initial={shouldAnimateEntrance ? { opacity: 0, y: 18 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="mx-auto mb-6 hidden w-fit items-center gap-3 rounded-full border border-white/10 bg-black/22 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#9fb0c4] backdrop-blur md:flex"
              >
                <span>Use ← → or space to navigate</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>Press F for fullscreen</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </footer>
      </div>
    </div>
  )
}
