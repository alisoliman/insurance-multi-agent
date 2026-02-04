"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { onboardingSteps } from "./onboarding-steps"
import { useOnboarding } from "./onboarding-provider"

interface OnboardingCueProps {
  stepId: string
  className?: string
}

export function OnboardingCue({ stepId, className }: OnboardingCueProps) {
  const { currentStep, completed, open, isOpen } = useOnboarding()
  const activeStep = onboardingSteps[currentStep]
  const isComplete = completed.size >= onboardingSteps.length

  if (isComplete || isOpen || completed.has(stepId) || !activeStep || activeStep.id !== stepId) {
    return null
  }

  const stepIndex = onboardingSteps.findIndex((step) => step.id === stepId)

  return (
    <Card className={cn("border-l-4 border-l-primary bg-primary/5 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Onboarding • Step {stepIndex + 1} of {onboardingSteps.length}
          </div>
          <div className="mt-1 text-base font-semibold">{activeStep.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{activeStep.description}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => open()}>
          <Sparkles className="mr-2 h-4 w-4" />
          Open Guide
        </Button>
      </div>
    </Card>
  )
}
