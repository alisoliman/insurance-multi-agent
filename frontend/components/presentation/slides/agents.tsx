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

import { agentCards } from "../slide-data"
import { SectionHeading } from "../slide-shared"
import { AgentConstellation } from "../visualizations/agent-constellation"

export function AgentsSlide() {
  const [activeId, setActiveId] = useState(agentCards[0].id)
  const activeCard = agentCards.find((a) => a.id === activeId) ?? agentCards[0]

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <SectionHeading
          eyebrow="Agent constellation"
          title="Five specialists. One legible system."
          description="Click any agent to explore its capabilities."
        />

        <div className="rounded-2xl border border-white/10 bg-[#08111c]/70 p-4 shadow-lg backdrop-blur">
          <AgentConstellation
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
      </div>

      <motion.div
        key={activeCard.id}
        className="flex flex-col"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="flex flex-1 flex-col border-white/10 bg-white/7 text-white shadow-lg backdrop-blur">
          <CardHeader className="space-y-4">
            <div className={`h-2 w-32 rounded-full bg-gradient-to-r ${activeCard.accent}`} />
            <CardTitle className="font-[family:var(--font-fraunces)] text-2xl text-[#fff7ec] lg:text-3xl">
              {activeCard.name}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed text-[#d1d7df] lg:text-base">
              {activeCard.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid flex-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#f5c483]">Capabilities</div>
              {activeCard.capabilities.map((capability) => (
                <div key={capability} className="flex flex-1 items-center rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-relaxed text-[#ecf0f4]">
                  {capability}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#95f2df]">Delivers</div>
              {activeCard.delivers.map((deliverable) => (
                <div key={deliverable} className="flex flex-1 items-center rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-relaxed text-[#eef2f6]">
                  {deliverable}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
