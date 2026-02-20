"use client"

import * as React from "react"
import { onboardingSteps } from "./onboarding-steps"
import { OnboardingModal } from "./onboarding-modal"
import { OnboardingDock } from "./onboarding-dock"

const STORAGE_KEY = "simai-onboarding-v1"
const DISABLED_KEY = "simai-onboarding-disabled"

interface OnboardingState {
  hasSeen: boolean
  completed: string[]
  currentStep: number
}

interface OnboardingContextValue {
  isOpen: boolean
  currentStep: number
  completed: Set<string>
  isDisabled: boolean
  open: (stepIndex?: number) => void
  goTo: (stepIndex: number) => void
  close: () => void
  next: () => void
  prev: () => void
  markComplete: (stepId: string) => void
  reset: () => void
  setDisabled: (value: boolean) => void
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
  const [isDisabled, setIsDisabled] = React.useState(false)
  const hasHydrated = React.useRef(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      const disabled = window.localStorage.getItem(DISABLED_KEY)
      if (disabled === "true") {
        setIsDisabled(true)
        setHasSeen(true)
        setIsOpen(false)
      }
      if (!stored) {
        // First visit — don't auto-open, just initialize
        hasHydrated.current = true
        return
      }
      const parsed = JSON.parse(stored) as OnboardingState
      setCurrentStep(parsed.currentStep ?? 0)
      setCompleted(new Set(parsed.completed ?? []))
      setHasSeen(Boolean(parsed.hasSeen))
      if (disabled !== "true") {
        // Don't auto-open — let the user open via dock or header button
        setIsOpen(false)
      }
    } catch {
      // Corrupted state — just reset quietly
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
    window.localStorage.setItem(DISABLED_KEY, String(isDisabled))
  }, [hasSeen, completed, currentStep, isDisabled])

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
    setIsDisabled(false)
    setIsOpen(true)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(DISABLED_KEY)
    }
  }, [])

  const setDisabled = React.useCallback((value: boolean) => {
    setIsDisabled(value)
    if (value) {
      setHasSeen(true)
      setIsOpen(false)
    } else {
      setHasSeen(false)
      setIsOpen(true)
    }
  }, [])

  const value = React.useMemo(
    () => ({
      isOpen,
      currentStep,
      completed,
      isDisabled,
      open,
      goTo,
      close,
      next,
      prev,
      markComplete,
      reset,
      setDisabled,
    }),
    [isOpen, currentStep, completed, isDisabled, open, goTo, close, next, prev, markComplete, reset, setDisabled]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {!isDisabled && <OnboardingModal />}
      {!isDisabled && <OnboardingDock />}
    </OnboardingContext.Provider>
  )
}
