"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { onboardingSteps } from "./onboarding-steps"
import { useOnboarding } from "./onboarding-provider"

interface OnboardingCueProps {
  stepId: string
  className?: string
}

export function OnboardingCue({ stepId, className }: OnboardingCueProps) {
  const { completed, open, isOpen } = useOnboarding()
  const isComplete = completed.size >= onboardingSteps.length
  const step = onboardingSteps.find((s) => s.id === stepId)

  // Only show if this step is not yet completed
  if (isComplete || isOpen || completed.has(stepId) || !step) {
    return null
  }

  const stepIndex = onboardingSteps.findIndex((s) => s.id === stepId)

  return (
    <button
      onClick={() => open(stepIndex)}
      className={`w-full flex items-center gap-2 rounded-md border border-dashed border-primary/30 bg-primary/[0.03] px-3 py-2 text-left group hover:border-primary/50 hover:bg-primary/[0.06] transition-colors ${className || ""}`}
    >
      <span className="text-[11px] text-muted-foreground">
        Step {stepIndex + 1}:
      </span>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {step.title}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/50 ml-auto" />
    </button>
  )
}
