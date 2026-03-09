"use client"

import { organizationPressures } from "../slide-data"
import { SectionHeading } from "../slide-shared"
import { OperationsFlow } from "../visualizations/operations-flow"

export function OperationsSlide() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        eyebrow="Repetitive work"
        title="The work before the work."
        description="Claims teams aren't short on judgment. They're short on time to use it."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#08111c]/70 p-5 shadow-lg backdrop-blur">
          <div className="mb-3 text-xs uppercase tracking-[0.32em] text-[#92a7bf]">
            Where time drains
          </div>
          <OperationsFlow />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {organizationPressures.map((pressure) => (
            <div
              key={pressure.title}
              className="rounded-2xl border border-white/10 bg-white/7 px-5 py-4 shadow-lg backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <pressure.icon className="size-4 text-[#f5c483]" />
                </div>
                <div className="text-sm font-medium text-[#fff7ec]">{pressure.title}</div>
              </div>
              <div className="mt-2.5 text-sm leading-relaxed text-[#d1d7df]">
                {pressure.copy}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
