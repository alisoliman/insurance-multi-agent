"use client"

import { motion } from "motion/react"

import { architectureModules, architectureFlows } from "../slide-data"

/* Pentagon layout — orchestration center, 4 modules around it */
const layout: Record<string, { x: number; y: number }> = {
  experience:    { x: 80,  y: 30  },
  intelligence:  { x: 500, y: 30  },
  orchestration: { x: 290, y: 150 },
  trust:         { x: 80,  y: 270 },
  data:          { x: 500, y: 270 },
}

const nodeW = 170
const nodeH = 72

function getCenter(id: string) {
  const pos = layout[id]
  return { cx: pos.x + nodeW / 2, cy: pos.y + nodeH / 2 }
}

/* Curved path between two module centers */
function connectionPath(fromId: string, toId: string) {
  const from = getCenter(fromId)
  const to = getCenter(toId)
  const midX = (from.cx + to.cx) / 2
  const midY = (from.cy + to.cy) / 2
  // Perpendicular offset for a subtle curve
  const dx = to.cx - from.cx
  const dy = to.cy - from.cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const off = len * 0.1
  const cpx = midX + (dy / len) * off
  const cpy = midY - (dx / len) * off
  return `M ${from.cx} ${from.cy} Q ${cpx} ${cpy} ${to.cx} ${to.cy}`
}

export function ArchitectureMap({
  activeId,
  onSelect,
  compact = false,
}: {
  activeId: string
  onSelect: (id: string) => void
  compact?: boolean
}) {
  const w = 750
  const h = compact ? 370 : 400

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: compact ? "370px" : "400px" }}>
        <defs>
          <pattern id="arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <filter id="active-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for each module accent */}
          {architectureModules.map((mod) => {
            const colors = mod.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff", "#aaa"]
            return (
              <linearGradient key={`grad-${mod.id}`} id={`arch-grad-${mod.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colors[1] ?? colors[0]} stopOpacity="0.08" />
              </linearGradient>
            )
          })}
        </defs>
        <rect width={w} height={h} fill="url(#arch-grid)" rx="24" />

        {/* ── Connection lines ── */}
        {architectureFlows.map((flow, i) => {
          const d = connectionPath(flow.from, flow.to)
          const from = getCenter(flow.from)
          const to = getCenter(flow.to)
          const isHighlighted = activeId === flow.from || activeId === flow.to
          const midX = (from.cx + to.cx) / 2
          const midY = (from.cy + to.cy) / 2

          return (
            <g key={`${flow.from}-${flow.to}`}>
              <motion.path
                d={d}
                fill="none"
                stroke={isHighlighted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeDasharray={isHighlighted ? "none" : "6 10"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.7 }}
              />

              {/* Flow label */}
              <motion.text
                x={midX}
                y={midY - 10}
                textAnchor="middle"
                fill={isHighlighted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
                fontSize="10"
                fontWeight={isHighlighted ? 500 : 400}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.12 }}
              >
                {flow.label}
              </motion.text>

              {/* Traveling particle — always visible, brighter when highlighted */}
              <motion.circle
                r={isHighlighted ? 4 : 2.5}
                fill={isHighlighted ? "#fff7ec" : "rgba(255,255,255,0.35)"}
                animate={{
                  cx: [from.cx, to.cx],
                  cy: [from.cy, to.cy],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: isHighlighted ? 2.2 : 3.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: i * 0.6,
                }}
              />
            </g>
          )
        })}

        {/* ── Module nodes ── */}
        {architectureModules.map((mod, i) => {
          const pos = layout[mod.id]
          const isActive = activeId === mod.id
          const colors = mod.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff"]
          const primaryColor = colors[0]

          return (
            <motion.g
              key={mod.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(mod.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12 + i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
            >
              {/* Active pulse ring */}
              {isActive && (
                <motion.rect
                  x={pos.x - 5}
                  y={pos.y - 5}
                  width={nodeW + 10}
                  height={nodeH + 10}
                  rx={22}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth={1.5}
                  filter="url(#active-glow)"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 0.15, 0.6] }}
                  transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
                />
              )}

              {/* Node body */}
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx={18}
                fill={isActive ? `url(#arch-grad-${mod.id})` : "rgba(255,255,255,0.04)"}
                stroke={isActive ? primaryColor : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? 2 : 1.5}
              />

              {/* Accent bar */}
              <rect
                x={pos.x + 14}
                y={pos.y + 10}
                width={30}
                height={3.5}
                rx={1.75}
                fill={primaryColor}
                opacity={isActive ? 1 : 0.45}
              />

              {/* Module name */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 32}
                textAnchor="middle"
                fill={isActive ? "#fff7ec" : "#d0d6df"}
                fontSize="13"
                fontWeight="600"
              >
                {mod.name}
              </text>

              {/* Module role */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 52}
                textAnchor="middle"
                fill={isActive ? "#9fb0c4" : "#6b7f94"}
                fontSize="10"
              >
                {mod.role}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
