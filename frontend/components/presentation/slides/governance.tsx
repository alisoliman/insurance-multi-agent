"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { governancePillars } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"
import { GovernanceTrace } from "../visualizations/governance-trace"

export function GovernanceSlide({ isCompact, isShort }: SlideProps) {
  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-5 pb-4">
        <SectionHeading
          eyebrow="Trust + traceability"
          title={
            isShort
              ? "If you can't replay it, you can't govern it."
              : "Collaboration only scales when the org can replay who recommended what, and who decided."
          }
          description={
            isShort
              ? undefined
              : "Auditability isn't a report you generate later. It's part of the workflow."
          }
          compact={isCompact}
        />

        <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-3 text-xs uppercase tracking-[0.32em] text-[#92a7bf]">
            Decision trace
          </div>
          <GovernanceTrace compact={isCompact} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {governancePillars.map((pillar) => (
            <Card
              key={pillar.title}
              className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur"
            >
              <CardHeader className={cn(isCompact && "gap-2 pb-3")}>
                <CardTitle className="flex items-center gap-3 text-lg text-[#fff7ec]">
                  <pillar.icon className="size-5 text-[#95f2df]" />
                  {pillar.title}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn("text-sm leading-6 text-[#d1d7df]", isCompact && "pt-0")}>
                {pillar.copy}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SlideFitFrame>
  )
}
