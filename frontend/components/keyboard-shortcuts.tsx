"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const shortcuts = [
  { keys: ["?"], description: "Show this help" },
  { keys: ["n"], description: "Create new claim" },
  { keys: ["g", "d"], description: "Go to Dashboard" },
  { keys: ["g", "q"], description: "Go to Review Queue" },
  { keys: ["g", "c"], description: "Go to My Claims" },
  { keys: ["Esc"], description: "Close dialogs" },
]

export function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = React.useState(false)
  const [keySequence, setKeySequence] = React.useState<string[]>([])
  const sequenceTimeout = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return
      }

      // Clear sequence timeout
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current)
      }

      const key = e.key.toLowerCase()
      const newSequence = [...keySequence, key]
      setKeySequence(newSequence)

      // Set timeout to clear sequence
      sequenceTimeout.current = setTimeout(() => {
        setKeySequence([])
      }, 500)

      // Handle single key shortcuts
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault()
        setShowHelp(true)
        setKeySequence([])
        return
      }

      if (key === "escape") {
        setShowHelp(false)
        setKeySequence([])
        return
      }

      // Handle key sequences
      const sequence = newSequence.join("")

      if (sequence === "gd") {
        e.preventDefault()
        router.push("/")
        setKeySequence([])
        return
      }

      if (sequence === "gq") {
        e.preventDefault()
        router.push("/claims/queue")
        setKeySequence([])
        return
      }

      if (sequence === "gc") {
        e.preventDefault()
        router.push("/claims")
        setKeySequence([])
        return
      }

      // Single 'n' for new claim - trigger click on create button if exists
      if (newSequence.length === 1 && key === "n") {
        const createBtn = document.querySelector("[data-create-claim-trigger]") as HTMLButtonElement
        if (createBtn) {
          e.preventDefault()
          createBtn.click()
          setKeySequence([])
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current)
      }
    }
  }, [keySequence, router])

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <React.Fragment key={j}>
                    <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="text-muted-foreground text-xs self-center">then</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">?</kbd> at any time to show this help
        </p>
      </DialogContent>
    </Dialog>
  )
}
