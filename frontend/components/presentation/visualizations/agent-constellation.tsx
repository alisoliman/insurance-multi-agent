"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"

import { agentCards } from "../slide-data"

/* ------------------------------------------------------------------ */
/*  Layout constants                                                    */
/* ------------------------------------------------------------------ */

const W = 500
const H = 400
const CX = 250
const CY = 195
const ORBIT_R = 130
const SYNTH_COLOR = "#baa2ff"

/* ------------------------------------------------------------------ */
/*  Derived agent positions + parsed colors                            */
/* ------------------------------------------------------------------ */

const agents = agentCards
  .filter((a) => a.id !== "synthesizer")
  .map((agent, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2
    const colors = agent.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff"]
    return {
      ...agent,
      x: CX + Math.cos(angle) * ORBIT_R,
      y: CY + Math.sin(angle) * ORBIT_R,
      angle,
      color: colors[0],
    }
  })

/* ------------------------------------------------------------------ */
/*  Curved bezier connection from agent node edge → center node edge   */
/* ------------------------------------------------------------------ */

const NODE_R = 26
const CENTER_R = 36

function connectionPath(ax: number, ay: number, bias: number) {
  const dx = ax - CX
  const dy = ay - CY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len

  // Start at the edge of the agent circle, end at the edge of the center circle
  const sx = ax - ux * (NODE_R + 4)
  const sy = ay - uy * (NODE_R + 4)
  const ex = CX + ux * (CENTER_R + 4)
  const ey = CY + uy * (CENTER_R + 4)

  // Perpendicular offset for curve
  const nx = -uy
  const ny = ux
  const off = len * bias
  const cpx = (sx + ex) / 2 + nx * off
  const cpy = (sy + ey) / 2 + ny * off

  // Midpoint on quadratic bezier at t=0.5 (for particle animation)
  const mx = 0.25 * sx + 0.5 * cpx + 0.25 * ex
  const my = 0.25 * sy + 0.5 * cpy + 0.25 * ey

  return { d: `M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}`, sx, sy, ex, ey, mx, my }
}

const curveBiases = [0.2, -0.2, 0.22, -0.18]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AgentConstellation({
  activeId,
  onSelect,
  compact = false,
}: {
  activeId: string
  onSelect: (id: string) => void
  compact?: boolean
}) {
  const h = compact ? 370 : H

  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${h}`}
        className="w-full"
        style={{ maxHeight: compact ? "370px" : `${H}px` }}
        role="img"
        aria-label="Agent constellation: Claim Assessor, Policy Checker, Risk Analyst, and Communication Agent orbiting a central Synthesizer"
      >
        <defs>
          {/* Dot-grid background (matches architecture-map) */}
          <pattern id="constellation-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.55" fill="rgba(255,255,255,0.07)" />
          </pattern>

          {/* Center radial glow */}
          <radialGradient id="cg-ambient" cx="50%" cy="49%" r="42%">
            <stop offset="0%" stopColor="rgba(186,162,255,0.20)" />
            <stop offset="50%" stopColor="rgba(186,162,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Orbit ring gradient */}
          <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(186,162,255,0.30)" />
            <stop offset="50%" stopColor="rgba(140,229,255,0.18)" />
            <stop offset="100%" stopColor="rgba(186,162,255,0.30)" />
          </linearGradient>

          {/* Connection gradients per agent */}
          {agents.map((agent) => {
            const isActive = activeId === agent.id
            return (
              <linearGradient
                key={`cg-${agent.id}`}
                id={`cg-${agent.id}`}
                gradientUnits="userSpaceOnUse"
                x1={String(agent.x)}
                y1={String(agent.y)}
                x2={String(CX)}
                y2={String(CY)}
              >
                <stop offset="0%" stopColor={agent.color} stopOpacity={isActive ? "0.85" : "0.25"} />
                <stop offset="100%" stopColor={SYNTH_COLOR} stopOpacity={isActive ? "0.65" : "0.12"} />
              </linearGradient>
            )
          })}

          {/* Glow filters */}
          <filter id="cg-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
          <filter id="cg-glow-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
          </filter>
        </defs>

        {/* ---- Background layers ---- */}
        <rect width={W} height={h} fill="url(#constellation-dots)" rx="20" />
        <rect width={W} height={h} fill="url(#cg-ambient)" rx="20" />

        {/* ---- Orbit ring with glow ---- */}
        <circle
          cx={CX} cy={CY} r={ORBIT_R}
          fill="none" stroke="url(#orbit-grad)" strokeWidth={8}
          opacity={0.08} filter="url(#cg-glow)"
        />
        <motion.circle
          cx={CX} cy={CY} r={ORBIT_R}
          fill="none" stroke="url(#orbit-grad)" strokeWidth={1.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 0.5 }}
        />
        <circle
          cx={CX} cy={CY} r={ORBIT_R + 10}
          fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth={0.5}
          strokeDasharray="2 8"
        />

        {/* ---- Curved connection lines ---- */}
        {agents.map((agent, i) => {
          const isActive = activeId === agent.id
          const bias = curveBiases[i % curveBiases.length]
          const { d, sx, sy, mx, my, ex, ey } = connectionPath(agent.x, agent.y, bias)

          return (
            <g key={`conn-${agent.id}`}>
              {/* Glow behind active connection */}
              {isActive && (
                <path
                  d={d} fill="none"
                  stroke={agent.color} strokeWidth={6}
                  opacity={0.12} filter="url(#cg-glow)"
                  strokeLinecap="round"
                />
              )}

              <motion.path
                d={d}
                fill="none"
                stroke={`url(#cg-${agent.id})`}
                strokeWidth={isActive ? 2.5 : 1}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.55 }}
              />

              {/* Data particle traveling along curve */}
              {isActive && !reducedMotion && (
                <motion.circle
                  r={3.5}
                  fill={agent.color}
                  filter="url(#cg-glow)"
                  animate={{
                    cx: [sx, mx, ex],
                    cy: [sy, my, ey],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>
          )
        })}

        {/* ---- Center node — Synthesizer ---- */}
        <motion.g
          style={{ cursor: "pointer" }}
          onClick={() => onSelect("synthesizer")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 16 }}
        >
          {/* Ambient glow */}
          <circle
            cx={CX} cy={CY} r={CENTER_R + 6}
            fill={SYNTH_COLOR}
            opacity={activeId === "synthesizer" ? 0.2 : 0.08}
            filter="url(#cg-glow-lg)"
          />
          {/* Outer ring */}
          <circle
            cx={CX} cy={CY} r={CENTER_R}
            fill={activeId === "synthesizer" ? "rgba(186,162,255,0.14)" : "rgba(255,255,255,0.04)"}
            stroke={activeId === "synthesizer" ? SYNTH_COLOR : "rgba(255,255,255,0.15)"}
            strokeWidth={activeId === "synthesizer" ? 2 : 1.5}
          />
          <text
            x={CX} y={CY + 1}
            textAnchor="middle" dominantBaseline="middle"
            fill="#fff7ec" fontSize="9.5" fontWeight="600"
            letterSpacing="0.03em"
          >
            Synthesizer
          </text>
        </motion.g>

        {/* ---- Agent nodes ---- */}
        {agents.map((agent, i) => {
          const isActive = activeId === agent.id

          return (
            <motion.g
              key={agent.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(agent.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.1, type: "spring", stiffness: 180, damping: 16 }}
            >
              {/* Glow behind active node */}
              {isActive && (
                <circle
                  cx={agent.x} cy={agent.y} r={NODE_R + 4}
                  fill={agent.color} opacity={0.18}
                  filter="url(#cg-glow)"
                />
              )}

              {/* Pulse ring */}
              {isActive && !reducedMotion && (
                <motion.circle
                  cx={agent.x} cy={agent.y} r={NODE_R}
                  fill="none" stroke={agent.color} strokeWidth={1.5}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}

              {/* Node disc */}
              <circle
                cx={agent.x} cy={agent.y} r={NODE_R}
                fill={isActive ? `${agent.color}18` : "rgba(255,255,255,0.04)"}
                stroke={isActive ? agent.color : "rgba(255,255,255,0.10)"}
                strokeWidth={isActive ? 2 : 1.2}
              />

              {/* Initials */}
              <text
                x={agent.x} y={agent.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill={isActive ? "#fff7ec" : "#c0c8d4"}
                fontSize="12" fontWeight="600"
              >
                {agent.name.split(" ").map((w) => w[0]).join("")}
              </text>

              {/* Label */}
              <text
                x={agent.x} y={agent.y + 42}
                textAnchor="middle"
                fill={isActive ? "#fff7ec" : "#9fb0c4"}
                fontSize="10" fontWeight="500"
              >
                {agent.name}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
