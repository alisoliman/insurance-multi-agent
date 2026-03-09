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

import { architectureModules } from "../slide-data"
import { SectionHeading } from "../slide-shared"
import { ArchitectureMap } from "../visualizations/architecture-map"

export function ArchitectureSlide() {
  const [activeId, setActiveId] = useState("orchestration")
  const activeModule = architectureModules.find((m) => m.id === activeId) ?? architectureModules[1]
  const accentColors = activeModule.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff"]

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        eyebrow="Architecture"
        title="Before meeting the agents — see where they live."
        description="Five modules, clear boundaries. Click any module to explore."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div className="rounded-2xl border border-white/8 bg-[#08111c]/60 p-3 shadow-lg backdrop-blur">
          <ArchitectureMap
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>

        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex"
        >
          <Card className="flex flex-col border-white/8 bg-white/[0.04] text-white shadow-lg backdrop-blur">
            <CardHeader className="space-y-3">
              <div
                className="h-1.5 w-28 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${accentColors[0]}, ${accentColors[1] ?? accentColors[0]})`,
                }}
              />
              <CardTitle className="font-[family:var(--font-fraunces)] text-xl text-[#fff7ec] lg:text-2xl">
                {activeModule.name}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-[#9fb0c4]">
                {activeModule.role}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-5">
              <p className="text-sm leading-relaxed text-[#d1d7df]">
                {activeModule.description}
              </p>

              <div className="mt-auto space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b7f94]">
                  Key aspects
                </p>
                <div className="space-y-2">
                  {activeModule.aspects.map((aspect, i) => (
                    <motion.div
                      key={aspect}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                      className="flex items-start gap-2.5 rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2.5"
                    >
                      <div
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accentColors[0], opacity: 0.7 }}
                      />
                      <span className="text-[13px] leading-snug text-[#d1d7df]">
                        {aspect}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
