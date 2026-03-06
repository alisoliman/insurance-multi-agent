"use client"

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Shared props that every slide receives                             */
/* ------------------------------------------------------------------ */

export interface SlideProps {
  isCompact: boolean
  isShort: boolean
}

/* ------------------------------------------------------------------ */
/*  Section heading — consistent pattern across all slides             */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string
  title: string
  description?: string
  compact?: boolean
}) {
  return (
    <div className={cn("shrink-0 space-y-4", compact && "space-y-3")}>
      <Badge
        variant="outline"
        className={cn(
          "border-white/15 bg-white/5 px-3 py-1 text-[11px] tracking-[0.28em] text-[#f7d7b3] uppercase",
          compact && "px-2.5 py-0.5 text-[10px] tracking-[0.24em]"
        )}
      >
        {eyebrow}
      </Badge>
      <div className={cn("space-y-3", compact && "space-y-2")}>
        <h2
          className={cn(
            "font-[family:var(--font-fraunces)] text-4xl leading-[0.95] text-[#fff7ec] sm:text-5xl lg:text-[clamp(2.8rem,4.2vw,3.75rem)]",
            compact && "text-[clamp(2rem,3.5vw,3rem)] leading-[0.97]"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-3xl text-base leading-7 text-[#d5d8df] sm:text-lg",
              compact && "max-w-[46rem] text-sm leading-6 sm:text-base sm:leading-6"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Deck pill — small stat callouts used on opening slide              */
/* ------------------------------------------------------------------ */

export function DeckPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 backdrop-blur">
      <div className="text-[9px] uppercase tracking-[0.28em] text-[#9db0c7]">{label}</div>
      <div className="mt-0.5 text-[12px] font-medium text-[#fff7ec]">{value}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Auto-scaling slide frame                                           */
/*  Measures content height vs available space and applies             */
/*  CSS scale transform to shrink-to-fit. No scrolling.               */
/* ------------------------------------------------------------------ */

export function SlideFitFrame({ children, className }: { children: ReactNode; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const recalc = useCallback(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const available = outer.clientHeight

    // Save current inline styles, measure at scale=1, then restore
    const prevTransform = inner.style.transform
    const prevWidth = inner.style.width
    inner.style.transform = "none"
    inner.style.width = "100%"
    const natural = inner.scrollHeight
    inner.style.transform = prevTransform
    inner.style.width = prevWidth

    if (natural <= 0 || available <= 0) {
      setScale(1)
      return
    }

    const next = Math.min(1, available / natural)
    // Don't scale below 0.65 — content becomes unreadable
    setScale(Math.max(0.65, next))
  }, [])

  useEffect(() => {
    recalc()
    window.addEventListener("resize", recalc)
    return () => window.removeEventListener("resize", recalc)
  }, [recalc])

  // Recalculate when children change (slide transitions)
  useEffect(() => {
    // Small delay lets the DOM settle after React renders
    const id = requestAnimationFrame(recalc)
    return () => cancelAnimationFrame(id)
  }, [children, recalc])

  return (
    <div ref={outerRef} className={cn("h-full overflow-hidden", className)}>
      <div
        ref={innerRef}
        className="origin-top-left"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          width: scale < 1 ? `${100 / scale}%` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
