"use client"

import * as React from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { onboardingSteps } from "./onboarding-steps"
import { useOnboarding } from "./onboarding-provider"

export function OnboardingChecklist() {
  const { completed, open } = useOnboarding()
  const completedCount = onboardingSteps.filter((step) => completed.has(step.id)).length
  const isComplete = completedCount >= onboardingSteps.length

  if (isComplete) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Demo Onboarding</CardTitle>
          <div className="text-xs text-muted-foreground">
            {completedCount} of {onboardingSteps.length} steps completed
          </div>
        </div>
        <Button variant="outline" onClick={() => open()}>
          Resume Guide
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {onboardingSteps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            {completed.has(step.id) ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.description}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
