"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { governancePillars, traceChain } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideScrollArea } from "../slide-shared"

export function GovernanceSlide({ isCompact, isShort }: SlideProps) {
  return (
    <SlideScrollArea>
      <div className="flex min-h-full flex-col gap-6 pb-8">
        <SectionHeading
          eyebrow="Trust + traceability"
          title={
            isShort
              ? "Traceability makes collaboration governable."
              : "Human-agent collaboration only scales when the org can see who recommended what, based on which signals, and who decided the next step."
          }
          description={
            isShort
              ? undefined
              : "Auditability is part of the workflow design: evidence stays attached, specialist outputs stay attributable, and human checkpoints remain explicit."
          }
          compact={isCompact}
        />

        <div className="grid flex-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {governancePillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur"
              >
                <CardHeader className={cn(isCompact && "gap-2 pb-3")}>
                  <CardTitle className="flex items-center gap-3 text-xl text-[#fff7ec]">
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

          <Card className="border-white/10 bg-[#09131f]/78 text-white shadow-[0_32px_110px_rgba(0,0,0,0.3)] backdrop-blur">
            <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-[2.4rem] text-[#fff7ec]", isCompact && "text-[2rem]")}>
                The decision trace
              </CardTitle>
              <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompact && "text-sm leading-6")}>
                Replay the path from evidence to action without guessing where the reasoning lived.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-3", isCompact && "space-y-2 pt-0")}>
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

              <div className="rounded-[1.45rem] border border-dashed border-white/12 bg-white/4 px-4 py-3 text-sm leading-6 text-[#dbe0e6]">
                Recommendations are visible, overrides are captured, and customer communication stays tied to the decision rationale.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SlideScrollArea>
  )
}
