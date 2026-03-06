"use client"

import { motion } from "motion/react"
import { Eye, Gauge, Scale } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideScrollArea } from "../slide-shared"

export function MissionSlide({ isCompact }: SlideProps) {
  const pillars = [
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
  ]

  const contrasts = [
    {
      stage: "Without this model",
      title: "People become the integration layer",
      points: [
        "Evidence, policy reading, risk review, and customer follow-up live in separate mental models.",
        "The decision arrives late because the team must reconstruct the claim before judging it.",
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
  ]

  return (
    <SlideScrollArea>
      <div className="grid min-h-full gap-6 pb-8 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Operating thesis"
            title="Give claims teams back time for judgment — without making the work less governable."
            description="The answer is not full autonomy. It's a human-led model where specialist agents compress repetitive analysis, the workbench presents one decision frame, and controls stay attached to the flow."
            compact={isCompact}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-white/10 bg-white/6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur"
              >
                <CardHeader className={cn(isCompact && "gap-2 pb-3")}>
                  <CardTitle className={cn("flex items-center gap-3 text-xl text-[#fff7ec]", isCompact && "text-lg")}>
                    <pillar.icon className="size-5 text-[#95f2df]" />
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("text-sm leading-7 text-[#d1d6de]", isCompact && "pt-0 leading-6")}>
                  {pillar.copy}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-rows-2">
          {contrasts.map((panel, index) => (
            <motion.div
              key={panel.stage}
              className="rounded-[1.8rem] border border-white/10 bg-black/18 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#f5c483]">{panel.stage}</div>
              <h3 className={cn("mt-3 font-[family:var(--font-fraunces)] text-3xl text-[#fff7ec]", isCompact && "text-[2rem]")}>
                {panel.title}
              </h3>
              <div className="mt-4 space-y-2">
                {panel.points.map((point) => (
                  <div key={point} className={cn("rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-7 text-[#d4d8df]", isCompact && "px-3.5 py-2.5 leading-6")}>
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideScrollArea>
  )
}
