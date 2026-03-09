"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { roadmap } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"

export function FutureSlide({ isCompact, isShort }: SlideProps) {
  const [activePhase, setActivePhase] = useState(roadmap[0].phase)
  const activeCard = roadmap.find((r) => r.phase === activePhase) ?? roadmap[0]

  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-6 pb-4">
        <SectionHeading
          eyebrow="Future horizon"
          title={
            isShort
              ? "From assistant to operating system."
              : "The long game isn't a bigger assistant. It's a smarter claims operating system."
          }
          description="Today proves the shape. Next: agents negotiate, adapt, and rebalance as part of a broader claims mesh."
          compact={isCompact}
        />

        {isShort ? (
          <div className="grid gap-4 lg:grid-cols-[0.38fr_0.62fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-white/6 p-4 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#91a6bd]">
                Evolution path
              </div>
              <div className="mt-3 space-y-2">
                {roadmap.map((step) => {
                  const isActive = step.phase === activeCard.phase
                  return (
                    <button
                      key={step.phase}
                      type="button"
                      onClick={() => setActivePhase(step.phase)}
                      className={cn(
                        "w-full rounded-[1.15rem] border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-white/20 bg-white/12 text-[#fff7ec]"
                          : "border-white/8 bg-black/18 text-[#d1d7df] hover:border-white/14 hover:bg-white/8"
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
                  <Badge className="border-0 bg-[#fff1de] text-[#152133]">{activeCard.phase}</Badge>
                  <Rocket className="size-5 text-[#95f2df]" />
                </div>
                <CardTitle className="font-[family:var(--font-fraunces)] text-[2.1rem] text-[#fff7ec]">
                  {activeCard.title}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-[#d1d7df]">
                  {activeCard.focus}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0 md:grid-cols-3">
                {activeCard.bullets.map((bullet) => (
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
                <Card className="flex h-full flex-col border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.27)] backdrop-blur">
                  <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="border-0 bg-[#fff1de] text-[#152133]">{step.phase}</Badge>
                      <Rocket className="size-5 text-[#95f2df]" />
                    </div>
                    <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompact && "text-[2rem]")}>
                      {step.title}
                    </CardTitle>
                    <CardDescription className={cn("text-base leading-7 text-[#d1d7df]", isCompact && "text-sm leading-6")}>
                      {step.focus}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={cn("flex flex-1 flex-col gap-3", isCompact && "gap-2 pt-0")}>
                    {step.bullets.map((bullet) => (
                      <div key={bullet} className={cn("flex flex-1 items-center rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-[15px] leading-7 text-[#edf1f5]", isCompact && "px-3.5 py-2.5 text-sm leading-6")}>
                        {bullet}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SlideFitFrame>
  )
}
