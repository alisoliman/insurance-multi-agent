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

import { architectureModules } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"
import { ArchitectureMap } from "../visualizations/architecture-map"

export function ArchitectureSlide({ isCompact, isShort }: SlideProps) {
  const [activeId, setActiveId] = useState("orchestration")
  const activeModule = architectureModules.find((m) => m.id === activeId) ?? architectureModules[1]

  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-5 pb-4">
        <SectionHeading
          eyebrow="Architecture"
          title={
            isShort
              ? "Public experience. Private data. Shared trust."
              : "Before meeting the agents — see where they live."
          }
          description="Five modules, clear boundaries. Click any module to explore."
          compact={isCompact}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px]">
          <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
            <ArchitectureMap
              activeId={activeId}
              onSelect={setActiveId}
              compact={isCompact}
            />
          </div>

          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-white/10 bg-white/6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur">
              <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
                <div className={cn("h-2 w-24 rounded-full bg-gradient-to-r", activeModule.accent)} />
                <CardTitle className={cn("font-[family:var(--font-fraunces)] text-2xl text-[#fff7ec]", isCompact && "text-xl")}>
                  {activeModule.name}
                </CardTitle>
                <CardDescription className="text-[#d3d7df]">{activeModule.role}</CardDescription>
              </CardHeader>
              <CardContent className={cn("space-y-4", isCompact && "space-y-3 pt-0")}>
                <p className={cn("text-sm leading-7 text-[#d9dce3]", isCompact && "leading-6")}>
                  {activeModule.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </SlideFitFrame>
  )
}
