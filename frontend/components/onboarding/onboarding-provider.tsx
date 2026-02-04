"use client"

import * as React from "react"
import { onboardingSteps } from "./onboarding-steps"
import { OnboardingModal } from "./onboarding-modal"
import { OnboardingDock } from "./onboarding-dock"

const STORAGE_KEY = "simai-onboarding-v1"

interface OnboardingState {
  hasSeen: boolean
  completed: string[]
  currentStep: number
}

interface OnboardingContextValue {
  isOpen: boolean
  currentStep: number
  completed: Set<string>
  open: (stepIndex?: number) => void
  goTo: (stepIndex: number) => void
  close: () => void
  next: () => void
  prev: () => void
  markComplete: (stepId: string) => void
  reset: () => void
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  const ctx = React.useContext(OnboardingContext)
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return ctx
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(0)
  const [completed, setCompleted] = React.useState<Set<string>>(new Set())
  const [hasSeen, setHasSeen] = React.useState(false)
  const hasHydrated = React.useRef(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setIsOpen(true)
        hasHydrated.current = true
        return
      }
      const parsed = JSON.parse(stored) as OnboardingState
      setCurrentStep(parsed.currentStep ?? 0)
      setCompleted(new Set(parsed.completed ?? []))
      setHasSeen(Boolean(parsed.hasSeen))
      setIsOpen(!parsed.hasSeen)
    } catch {
      setIsOpen(true)
    } finally {
      hasHydrated.current = true
    }
  }, [])

  React.useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") return
    const state: OnboardingState = {
      hasSeen,
      completed: Array.from(completed),
      currentStep
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hasSeen, completed, currentStep])

  const open = React.useCallback((stepIndex?: number) => {
    if (typeof stepIndex === "number") {
      setCurrentStep(Math.min(Math.max(stepIndex, 0), onboardingSteps.length - 1))
    }
    setIsOpen(true)
  }, [])

  const goTo = React.useCallback((stepIndex: number) => {
    setCurrentStep(Math.min(Math.max(stepIndex, 0), onboardingSteps.length - 1))
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
    setHasSeen(true)
  }, [])

  const next = React.useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1))
  }, [])

  const prev = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const markComplete = React.useCallback((stepId: string) => {
    setCompleted((prev) => new Set([...prev, stepId]))
  }, [])

  const reset = React.useCallback(() => {
    setCompleted(new Set())
    setCurrentStep(0)
    setHasSeen(false)
    setIsOpen(true)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = React.useMemo(
    () => ({
      isOpen,
      currentStep,
      completed,
      open,
      goTo,
      close,
      next,
      prev,
      markComplete,
      reset
    }),
    [isOpen, currentStep, completed, open, goTo, close, next, prev, markComplete, reset]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingModal />
      <OnboardingDock />
    </OnboardingContext.Provider>
  )
}
