"use client"

import { cn } from "@/lib/utils"

import { organizationPressures } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"
import { OperationsFlow } from "../visualizations/operations-flow"

export function OperationsSlide({ isCompact }: SlideProps) {
  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-5 pb-4">
        <SectionHeading
          eyebrow="Repetitive work"
          title="The work before the work."
          description="Claims teams aren't short on judgment. They're short on time to use it."
          compact={isCompact}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="mb-3 text-xs uppercase tracking-[0.32em] text-[#92a7bf]">
              Where time drains
            </div>
            <OperationsFlow compact={isCompact} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {organizationPressures.map((pressure) => (
              <div
                key={pressure.title}
                className={cn(
                  "rounded-[1.4rem] border border-white/10 bg-white/7 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur",
                  isCompact && "p-3"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <pressure.icon className="size-4 text-[#f5c483]" />
                  </div>
                  <div className="text-sm font-medium text-[#fff7ec]">{pressure.title}</div>
                </div>
                <div className={cn("mt-2 text-sm leading-6 text-[#cfd6df]", isCompact && "text-[13px] leading-5")}>
                  {pressure.copy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideFitFrame>
  )
}
