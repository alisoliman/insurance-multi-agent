"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  CheckCircle2,
  Circle,
  Play,
  ChevronRight,
  Database,
  Eye,
  ClipboardList,
  Search,
  Stamp,
  Zap,
  FlaskConical,
} from "lucide-react"
import { seedClaims } from "@/lib/api/claims"
import { onboardingSteps, type OnboardingStep } from "./onboarding-steps"
import { useOnboarding } from "./onboarding-provider"
import { AnimatePresence, motion } from "motion/react"

const STEP_ICONS: Record<string, React.ReactNode> = {
  seed: <Database className="h-4 w-4" />,
  processing: <Eye className="h-4 w-4" />,
  review: <ClipboardList className="h-4 w-4" />,
  detail: <Search className="h-4 w-4" />,
  decision: <Stamp className="h-4 w-4" />,
  auto: <Zap className="h-4 w-4" />,
  agents: <FlaskConical className="h-4 w-4" />,
}

export function OnboardingModal() {
  const router = useRouter()
  const { isOpen, close, completed, markComplete } = useOnboarding()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const completedCount = Array.from(completed).filter((id) =>
    onboardingSteps.some((s) => s.id === id)
  ).length
  const progress = Math.round((completedCount / onboardingSteps.length) * 100)

  const handleAction = async (step: OnboardingStep) => {
    if (step.action.type === "seed") {
      try {
        const result = await seedClaims(step.action.count ?? 5)
        toast.success(`Created ${result.claims_created} sample claims`)
        markComplete(step.id)
      } catch {
        toast.error("Failed to seed claims")
      }
      return
    }
    if (step.action.type === "route") {
      markComplete(step.id)
      close()
      router.push(step.action.path)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] p-0 flex flex-col border-l border-border/60 [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40 space-y-3">
          <SheetTitle className="text-base font-semibold tracking-tight">
            Demo Walkthrough
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Follow these steps to showcase the platform.
          </SheetDescription>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{completedCount} of {onboardingSteps.length} complete</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </SheetHeader>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {onboardingSteps.map((step, index) => {
              const isDone = completed.has(step.id)
              const isExpanded = expandedId === step.id

              return (
                <div key={step.id}>
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className={`
                      w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
                      ${isExpanded ? "bg-accent/60" : "hover:bg-accent/40"}
                    `}
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                      ) : (
                        <div className="relative">
                          <Circle className="h-[18px] w-[18px] text-muted-foreground/40" />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium leading-tight ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {step.description}
                      </div>
                    </div>
                    {/* Chevron */}
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[30px] pl-3 pb-2 border-l-2 border-border/40">
                          <ul className="space-y-1 mt-1.5">
                            {step.bullets.map((bullet) => (
                              <li key={bullet} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant={isDone ? "outline" : "default"}
                              className="h-7 text-xs gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAction(step)
                              }}
                            >
                              {STEP_ICONS[step.id] || <Play className="h-3 w-3" />}
                              {step.ctaLabel}
                            </Button>
                            {!isDone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markComplete(step.id)
                                }}
                              >
                                Skip
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between">
          <button
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
          {completedCount === onboardingSteps.length && (
            <span className="text-xs text-emerald-600 font-medium">All done ✓</span>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
