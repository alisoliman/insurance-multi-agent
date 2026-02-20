"use client"

import * as React from "react"
import { ListChecks } from "lucide-react"
import { useOnboarding } from "./onboarding-provider"
import { onboardingSteps } from "./onboarding-steps"

export function OnboardingDock() {
  const { open, completed, isOpen } = useOnboarding()
  const total = onboardingSteps.length
  const done = Array.from(completed).filter((id) =>
    onboardingSteps.some((s) => s.id === id)
  ).length
  const isComplete = done >= total

  if (isComplete && !isOpen) return null

  const pct = Math.round((done / total) * 100)

  return (
    <button
      onClick={() => open()}
      className="fixed bottom-5 right-5 z-40 hidden md:flex items-center gap-2.5 rounded-full border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg px-4 py-2 text-sm hover:shadow-xl hover:border-border transition-all group"
    >
      <div className="relative h-5 w-5">
        <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
          <circle
            cx="10" cy="10" r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted/40"
          />
          <circle
            cx="10" cy="10" r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${pct * 0.5} 50`}
            strokeLinecap="round"
            className="text-emerald-500 transition-all duration-500"
          />
        </svg>
        <ListChecks className="absolute inset-0 m-auto h-2.5 w-2.5 text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {done}/{total}
      </span>
    </button>
  )
}
