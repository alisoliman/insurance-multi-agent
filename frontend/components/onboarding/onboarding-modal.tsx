"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Play } from "lucide-react"
import { seedClaims } from "@/lib/api/claims"
import { onboardingSteps } from "./onboarding-steps"
import { useOnboarding } from "./onboarding-provider"
import { AnimatePresence, motion } from "motion/react"

export function OnboardingModal() {
  const router = useRouter()
  const { isOpen, close, currentStep, next, prev, completed, markComplete, goTo } = useOnboarding()
  const step = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleAction = async () => {
    if (!step) return
    if (step.action.type === "seed") {
      try {
        const result = await seedClaims(step.action.count ?? 5)
        toast.success(`Created ${result.claims_created} sample claims`)
        markComplete(step.id)
      } catch (error) {
        console.error("Failed to seed claims", error)
        toast.error("Failed to seed claims")
      }
      return
    }

    if (step.action.type === "route") {
      router.push(step.action.path)
      markComplete(step.id)
      close()
      return
    }
  }

  const handleNext = () => {
    if (!step) return
    if (!completed.has(step.id)) {
      markComplete(step.id)
    }
    next()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Demo Onboarding · Step {currentStep + 1} of {onboardingSteps.length}
          </div>
          <DialogTitle className="text-2xl">Welcome to the Claims Workbench</DialogTitle>
          <DialogDescription className="text-sm">
            A guided tour to help you demo the platform with confidence. Run the steps in order or jump around.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-amber-500/10 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="min-h-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {completed.has(step.id) && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Badge>
                  )}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  {step.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={handleAction}>
                    <Play className="mr-2 h-4 w-4" />
                    {step.ctaLabel}
                  </Button>
                  <Button variant="outline" onClick={() => markComplete(step.id)}>
                    Mark complete
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>

          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">All steps</div>
            <div className="space-y-2">
              {onboardingSteps.map((item, index) => {
                const isActive = index === currentStep
                return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (index === currentStep) return
                    goTo(index)
                  }}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${isActive ? "border-primary/60 bg-muted/60" : "hover:border-primary/40"}`}
                >
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  {completed.has(item.id) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                  )}
                </button>
              )})}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>
              Skip for now
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={isLastStep ? close : handleNext}>
              {isLastStep ? "Finish" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
