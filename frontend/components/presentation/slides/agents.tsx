"use client"

import { useState } from "react"
import { motion } from "motion/react"

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
import { AgentConstellation } from "../visualizations/agent-constellation"

export function AgentsSlide({ isCompact }: SlideProps) {
  const [activeId, setActiveId] = useState(agentCards[0].id)
  const activeCard = agentCards.find((a) => a.id === activeId) ?? agentCards[0]

  return (
    <SlideFitFrame>
      <div className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Agent constellation"
            title="Five specialists. One legible system."
            description="Click any agent to explore its capabilities."
            compact={isCompact}
          />

          <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
            <AgentConstellation
              activeId={activeId}
              onSelect={setActiveId}
              compact={isCompact}
            />
          </div>
        </div>

        <motion.div
          key={activeCard.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="border-white/10 bg-white/7 text-white shadow-[0_30px_110px_rgba(0,0,0,0.3)] backdrop-blur">
            <CardHeader className={cn("space-y-4", isCompact && "space-y-3 pb-3")}>
              <div className={cn("h-2 w-32 rounded-full bg-gradient-to-r", activeCard.accent)} />
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-3xl text-[#fff7ec]", isCompact && "text-[2rem]")}>
                {activeCard.name}
              </CardTitle>
              <CardDescription className={cn("max-w-2xl text-base leading-7 text-[#d2d7df]", isCompact && "text-sm leading-6")}>
                {activeCard.title}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("grid gap-5 md:grid-cols-2", isCompact && "gap-4 pt-0")}>
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">Capabilities</div>
                {activeCard.capabilities.map((capability) => (
                  <div key={capability} className={cn("rounded-2xl border border-white/8 bg-black/18 px-4 py-2.5 text-sm leading-6 text-[#ecf0f4]", isCompact && "px-3 py-2 text-[13px]")}>
                    {capability}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#95f2df]">Delivers</div>
                {activeCard.delivers.map((deliverable) => (
                  <div key={deliverable} className={cn("rounded-2xl border border-white/8 bg-white/6 px-4 py-2.5 text-sm leading-6 text-[#eef2f6]", isCompact && "px-3 py-2 text-[13px]")}>
                    {deliverable}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SlideFitFrame>
  )
}
