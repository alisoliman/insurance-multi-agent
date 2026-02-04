"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useOnboarding } from "./onboarding-provider"
import { onboardingSteps } from "./onboarding-steps"

export function OnboardingDock() {
  const { open, completed, isOpen } = useOnboarding()
  const isComplete = completed.size >= onboardingSteps.length
  if (isComplete && !isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:block">
      <Button
        onClick={() => open()}
        className="shadow-lg"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Demo Guide
      </Button>
    </div>
  )
}
