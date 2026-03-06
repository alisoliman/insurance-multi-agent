"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface HandlerPersona {
  id: string
  name: string
  role: string
  avatar: string
}

const DEMO_HANDLERS: HandlerPersona[] = [
  { id: "handler-001", name: "Sarah Chen", role: "Claims Adjuster", avatar: "SC" },
  { id: "handler-002", name: "James Mitchell", role: "Senior Reviewer", avatar: "JM" },
  { id: "handler-003", name: "Priya Patel", role: "Claims Manager", avatar: "PP" },
]

interface HandlerContextValue {
  handler: HandlerPersona
  handlers: HandlerPersona[]
  setHandlerId: (id: string) => void
}

const HandlerContext = createContext<HandlerContextValue | null>(null)

export function HandlerProvider({ children }: { children: ReactNode }) {
  const [handlerId, setHandlerIdState] = useState("handler-001")

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.localStorage?.getItem !== "function"
    ) {
      return
    }

    const storedHandlerId = window.localStorage.getItem("demo-handler-id")
    if (storedHandlerId) {
      setHandlerIdState(storedHandlerId)
    }
  }, [])

  const handler = DEMO_HANDLERS.find((h) => h.id === handlerId) || DEMO_HANDLERS[0]

  const setHandlerId = useCallback((id: string) => {
    setHandlerIdState(id)
    if (typeof window.localStorage?.setItem === "function") {
      window.localStorage.setItem("demo-handler-id", id)
    }
  }, [])

  return (
    <HandlerContext.Provider value={{ handler, handlers: DEMO_HANDLERS, setHandlerId }}>
      {children}
    </HandlerContext.Provider>
  )
}

export function useHandler() {
  const ctx = useContext(HandlerContext)
  if (!ctx) throw new Error("useHandler must be used within HandlerProvider")
  return ctx
}
