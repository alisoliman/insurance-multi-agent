"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { governancePillars } from "../slide-data"
import { SectionHeading } from "../slide-shared"
import { GovernanceTrace } from "../visualizations/governance-trace"

export function GovernanceSlide() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        eyebrow="Trust + traceability"
        title="Collaboration only scales when the org can replay who recommended what, and who decided."
        description="Auditability isn't a report you generate later. It's part of the workflow."
      />

      <div className="rounded-2xl border border-white/10 bg-[#08111c]/70 p-5 shadow-lg backdrop-blur">
        <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-[#92a7bf]">
          Decision trace
        </div>
        <GovernanceTrace />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {governancePillars.map((pillar) => (
          <Card
            key={pillar.title}
            className="border-white/10 bg-white/6 text-white shadow-lg backdrop-blur"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-[#fff7ec]">
                <pillar.icon className="size-5 text-[#95f2df]" />
                {pillar.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-[#d1d7df]">
              {pillar.copy}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
