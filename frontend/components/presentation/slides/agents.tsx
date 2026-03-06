"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { BrainCircuit, UsersRound, Workflow } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { agentCards } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"

export function AgentsSlide({ isCompact }: SlideProps) {
  const [activeId, setActiveId] = useState(agentCards[0].id)
  const activeCard = agentCards.find((a) => a.id === activeId) ?? agentCards[0]

  return (
    <SlideFitFrame>
      <div className="grid gap-6 pb-4 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Agent constellation"
            title="Five specialists. One legible system."
            description="Not a monolithic super-agent — a stable ecosystem of specialist roles whose outputs can be compared, synthesized, and trusted."
            compact={isCompact}
          />
          <div className="space-y-2.5">
            {agentCards.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveId(agent.id)}
                className={cn(
                  "w-full rounded-[1.35rem] border px-4 py-3 text-left transition-all",
                  activeId === agent.id
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
          key={activeCard.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <Card className="border-white/10 bg-white/7 text-white shadow-[0_30px_110px_rgba(0,0,0,0.3)] backdrop-blur">
            <CardHeader className={cn("space-y-4", isCompact && "space-y-3 pb-3")}>
              <div className={cn("h-2 w-32 rounded-full bg-gradient-to-r", activeCard.accent)} />
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompact && "text-[2.2rem]")}>
                {activeCard.name}
              </CardTitle>
              <CardDescription className={cn("max-w-2xl text-base leading-7 text-[#d2d7df]", isCompact && "text-sm leading-6")}>
                {activeCard.title}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("grid gap-5 md:grid-cols-2", isCompact && "gap-4 pt-0")}>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">Capabilities</div>
                {activeCard.capabilities.map((capability) => (
                  <div key={capability} className={cn("rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-7 text-[#ecf0f4]", isCompact && "px-3.5 py-2.5 leading-6")}>
                    {capability}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#95f2df]">What it delivers</div>
                {activeCard.delivers.map((deliverable) => (
                  <div key={deliverable} className={cn("rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-7 text-[#eef2f6]", isCompact && "px-3.5 py-2.5 leading-6")}>
                    {deliverable}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: BrainCircuit, label: "Structured outputs", copy: "Every specialist contributes data the synthesizer can reason over." },
              { icon: Workflow, label: "Composable roles", copy: "Re-route or expand specialist roles without collapsing the workflow." },
              { icon: UsersRound, label: "Human checkpoints", copy: "Agent outputs accelerate judgment — never replace it." },
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
    </SlideFitFrame>
  )
}
