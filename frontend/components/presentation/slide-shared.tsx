"use client"

import { type ReactNode } from "react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { ArchitectureNode } from "./slide-data"
import { architectureConnections, architectureNodes } from "./slide-data"

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
/*  Scrollable slide wrapper — fixes the truncation problem            */
/* ------------------------------------------------------------------ */

export function SlideScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative h-full", className)}>
      <div className="deck-scroll h-full overflow-y-auto pr-2">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#06111a]/80 to-transparent" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Architecture interactive diagram                                   */
/* ------------------------------------------------------------------ */

export function ArchitectureDiagram({
  activeNodeId,
  onSelect,
  compact = false,
}: {
  activeNodeId: string
  onSelect: (nodeId: string) => void
  compact?: boolean
}) {
  const activeNode =
    architectureNodes.find((node) => node.id === activeNodeId) ?? architectureNodes[2]

  const nodeLookup = Object.fromEntries(
    architectureNodes.map((node) => [node.id, node])
  ) as Record<string, ArchitectureNode>

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_340px]", compact && "gap-4 lg:grid-cols-[minmax(0,1.35fr)_300px]")}>
      <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/70 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className={cn("mb-4 flex items-center justify-between gap-3", compact && "mb-3")}>
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-[#92a7bf]">Live topology</div>
            <div className={cn("text-sm text-[#d0d5df]", compact && "text-[13px] leading-5")}>
              Public presentation layer, private claims data plane, and shared delivery fabric.
            </div>
          </div>
          <Badge className="border-0 bg-[#fff1df] text-[#172233]">Azure verified</Badge>
        </div>

        <div className={cn("hidden rounded-[1.5rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] lg:block", compact ? "h-[min(18.5rem,32vh)]" : "h-[min(26rem,48vh)]")}>
          <div className="relative h-full overflow-hidden rounded-[1.5rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,196,118,0.09),transparent_42%),linear-gradient(180deg,rgba(7,17,29,0.65),rgba(7,17,29,0.98))]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {architectureConnections.map((connection, index) => {
                const from = nodeLookup[connection.from]
                const to = nodeLookup[connection.to]
                const startX = from.position.x + 8
                const startY = from.position.y + 8
                const endX = to.position.x + 8
                const endY = to.position.y + 8
                const curve = `M ${startX}% ${startY}% C ${(startX + endX) / 2}% ${startY}% ${(startX + endX) / 2}% ${endY}% ${endX}% ${endY}%`

                return (
                  <g key={`${connection.from}-${connection.to}`}>
                    <motion.path
                      d={curve}
                      fill="none"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1.5"
                      strokeDasharray="7 10"
                      initial={{ pathLength: 0, opacity: 0.1 }}
                      animate={{ pathLength: 1, opacity: 0.75 }}
                      transition={{ delay: 0.15 + index * 0.06, duration: 0.6 }}
                    />
                    <motion.text
                      x={`${(startX + endX) / 2}%`}
                      y={`${(startY + endY) / 2 - 2}%`}
                      fill="rgba(239,232,222,0.72)"
                      fontSize="10"
                      textAnchor="middle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + index * 0.06 }}
                    >
                      {connection.label}
                    </motion.text>
                  </g>
                )
              })}
            </svg>

            {architectureNodes.map((node, index) => {
              const isActive = node.id === activeNodeId
              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className={cn(
                    "absolute w-40 rounded-[1.35rem] border px-4 py-3 text-left shadow-[0_18px_55px_rgba(4,6,10,0.36)] backdrop-blur transition-all",
                    compact && "w-36 rounded-[1.2rem] px-3 py-2.5",
                    isActive
                      ? "border-white/28 bg-white/14"
                      : "border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10"
                  )}
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.45 }}
                >
                  <div className={cn("h-1.5 rounded-full bg-gradient-to-r", node.accent)} />
                  <div className={cn("mt-3 text-[10px] uppercase tracking-[0.28em] text-[#9bb0c6]", compact && "mt-2 text-[9px]")}>
                    {node.kind}
                  </div>
                  <div className={cn("mt-2 text-sm font-medium leading-snug text-[#fff7ec]", compact && "mt-1.5 text-[13px] leading-5")}>
                    {node.name}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 lg:hidden">
          {architectureNodes.map((node) => {
            const isActive = node.id === activeNodeId
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect(node.id)}
                className={cn(
                  "rounded-[1.2rem] border px-4 py-3 text-left transition-all",
                  isActive
                    ? "border-white/24 bg-white/12"
                    : "border-white/8 bg-white/5"
                )}
              >
                <div className={cn("h-1.5 rounded-full bg-gradient-to-r", node.accent)} />
                <div className="mt-3 text-[10px] uppercase tracking-[0.28em] text-[#9bb0c6]">
                  {node.kind}
                </div>
                <div className="mt-1 text-sm font-medium text-[#fff7ec]">{node.name}</div>
              </button>
            )
          })}
        </div>
      </div>

      <Card className="border-white/10 bg-white/6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur">
        <CardHeader className={cn(compact && "space-y-2 pb-3")}>
          <CardTitle className={cn("font-[family:var(--font-fraunces)] text-3xl text-[#fff7ec]", compact && "text-[2rem]")}>
            {activeNode.name}
          </CardTitle>
          <CardDescription className="text-[#d3d7df]">{activeNode.kind}</CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-5", compact && "space-y-4 pt-0")}>
          <p className={cn("text-sm leading-7 text-[#d9dce3]", compact && "leading-6")}>{activeNode.description}</p>
          <div className="space-y-2">
            {activeNode.bullets.map((bullet) => (
              <div key={bullet} className={cn("rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-[#eef2f5]", compact && "px-3.5 py-2.5 text-[13px] leading-5")}>
                {bullet}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
