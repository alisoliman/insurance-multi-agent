"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { FileSearch, Gauge, Workflow } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const drains: { id: string; icon: LucideIcon; label: string; color: string }[] = [
  { id: "status", icon: Gauge, label: "Status chasing", color: "#95f2df" },
  { id: "docs", icon: FileSearch, label: "Document loops", color: "#f5c483" },
  { id: "context", icon: Workflow, label: "Context stitching", color: "#8ecbff" },
]

export function OperationsFlow({ compact = false }: { compact?: boolean }) {
  const [activeDrain, setActiveDrain] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const w = 680
  const h = compact ? 280 : 340
  const entryX = 60
  const entryY = h / 2
  const splitX = 180
  const loopRadius = compact ? 36 : 44
  const nodeSpacingY = compact ? 80 : 100

  const drainPositions = drains.map((_, i) => ({
    x: splitX + 160,
    y: entryY + (i - 1) * nodeSpacingY,
  }))

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ maxHeight: compact ? "280px" : "340px" }}
        role="img"
        aria-label="Operations workflow diagram showing claim processing pipeline with intake, triage, investigation, and resolution stages"
      >
        {/* Background grid */}
        <defs>
          <pattern id="ops-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#ops-grid)" rx="24" />

        {/* Entry point — "Claim arrives" */}
        <motion.circle
          cx={entryX}
          cy={entryY}
          r={18}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.5}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.text
          x={entryX}
          y={entryY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff7ec"
          fontSize="10"
          fontWeight="500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Claim
        </motion.text>

        {/* Split line from entry to branch point */}
        <motion.line
          x1={entryX + 18}
          y1={entryY}
          x2={splitX}
          y2={entryY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
          strokeDasharray="6 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        {/* Branch lines to each drain */}
        {drainPositions.map((pos, i) => {
          const drain = drains[i]
          const isActive = activeDrain === drain.id
          return (
            <g key={drain.id}>
              {/* Branch path */}
              <motion.path
                d={`M ${splitX} ${entryY} C ${splitX + 60} ${entryY} ${pos.x - 60} ${pos.y} ${pos.x - loopRadius - 8} ${pos.y}`}
                fill="none"
                stroke={isActive ? drain.color : "rgba(255,255,255,0.15)"}
                strokeWidth={isActive ? 2 : 1.5}
                strokeDasharray="6 8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }}
              />

              {/* Loop circle — represents repetitive cycle */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={loopRadius}
                fill={isActive ? `${drain.color}15` : "rgba(255,255,255,0.04)"}
                stroke={isActive ? drain.color : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "0" : "4 6"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActiveDrain(drain.id)}
                onMouseLeave={() => setActiveDrain(null)}
                onClick={() => setActiveDrain(isActive ? null : drain.id)}
              />

              {/* Rotating arrow inside loop */}
              <motion.g
                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                transition={prefersReducedMotion ? {} : { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                style={{ transformOrigin: `${pos.x}px ${pos.y}px`, cursor: "pointer" }}
              >
                <circle
                  cx={pos.x + loopRadius * 0.65}
                  cy={pos.y - loopRadius * 0.15}
                  r={3}
                  fill={isActive ? drain.color : "rgba(255,255,255,0.3)"}
                />
              </motion.g>

              {/* Label */}
              <motion.text
                x={pos.x + loopRadius + 14}
                y={pos.y - 6}
                fill={isActive ? "#fff7ec" : "#d1d7df"}
                fontSize="12"
                fontWeight="500"
                style={{ cursor: "pointer" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.12 }}
              >
                {drain.label}
              </motion.text>

              {/* Exit arrow — time consumed */}
              <motion.line
                x1={pos.x + loopRadius + 8}
                y1={pos.y}
                x2={w - 40}
                y2={pos.y}
                stroke={isActive ? drain.color : "rgba(255,255,255,0.08)"}
                strokeWidth={1}
                strokeDasharray="3 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.0 + i * 0.12, duration: 0.4 }}
              />
            </g>
          )
        })}

        {/* Time consumed label on right */}
        <motion.text
          x={w - 30}
          y={24}
          textAnchor="end"
          fill="#91a6bd"
          fontSize="9"
          letterSpacing="0.15em"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.4 }}
        >
          TIME CONSUMED →
        </motion.text>
      </svg>
    </div>
  )
}
