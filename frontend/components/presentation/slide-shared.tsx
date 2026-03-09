"use client"

import { Badge } from "@/components/ui/badge"

/* ------------------------------------------------------------------ */
/*  Section heading — consistent pattern across all slides             */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="shrink-0 space-y-3">
      <Badge
        variant="outline"
        className="border-white/15 bg-white/5 px-3 py-1 text-[11px] tracking-[0.28em] text-[#f7d7b3] uppercase"
      >
        {eyebrow}
      </Badge>
      <div className="space-y-2">
        <h2 className="font-[family:var(--font-fraunces)] text-3xl leading-tight text-[#fff7ec] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-[#d1d7df] sm:text-base lg:text-lg">
            {description}
          </p>
        )}
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
      <div className="mt-0.5 text-xs font-medium text-[#fff7ec]">{value}</div>
    </div>
  )
}
