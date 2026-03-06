"use client"

import { motion } from "motion/react"

import { architectureModules, architectureFlows } from "../slide-data"

/* Pentagon layout — orchestration center, 4 modules at corners */
const layout: Record<string, { x: number; y: number }> = {
  experience:    { x: 60,  y: 24  },
  intelligence:  { x: 490, y: 24  },
  orchestration: { x: 275, y: 152 },
  trust:         { x: 60,  y: 280 },
  data:          { x: 490, y: 280 },
}

const nodeW = 180
const nodeH = 76
const edgePad = 6 // gap between box border and line start/end

function getCenter(id: string) {
  const pos = layout[id]
  return { cx: pos.x + nodeW / 2, cy: pos.y + nodeH / 2 }
}

/**
 * Find the point where a ray from the node center toward (tx,ty) exits
 * the node rectangle, plus a small outward padding so the line doesn't
 * touch the border.
 */
function getEdgePoint(nodeId: string, tx: number, ty: number) {
  const pos = layout[nodeId]
  const cx = pos.x + nodeW / 2
  const cy = pos.y + nodeH / 2
  const dx = tx - cx
  const dy = ty - cy

  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const scaleX = dx !== 0 ? (nodeW / 2) / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? (nodeH / 2) / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)

  // Point on the rectangle edge
  const ex = cx + dx * scale
  const ey = cy + dy * scale

  // Push outward by edgePad along the same direction
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { x: ex + (dx / len) * edgePad, y: ey + (dy / len) * edgePad }
}

/* Subtle curve factor per edge — keeps lines from stacking on top of each other */
const curveBias: Record<string, number> = {
  "experience->orchestration": 0.12,
  "orchestration->intelligence": 0.12,
  "orchestration->data": 0.12,
  "trust->experience": -0.10,
  "trust->orchestration": 0.10,
}

function connectionPath(fromId: string, toId: string) {
  const fromC = getCenter(fromId)
  const toC = getCenter(toId)

  // Edge points (where lines visually start and end)
  const from = getEdgePoint(fromId, toC.cx, toC.cy)
  const to = getEdgePoint(toId, fromC.cx, fromC.cy)

  // Control point is computed from centers so the curve direction is natural
  const midX = (fromC.cx + toC.cx) / 2
  const midY = (fromC.cy + toC.cy) / 2
  const dx = toC.cx - fromC.cx
  const dy = toC.cy - fromC.cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const bias = curveBias[`${fromId}->${toId}`] ?? 0.10
  const off = len * bias
  const cpx = midX + (dy / len) * off
  const cpy = midY - (dx / len) * off

  return {
    d: `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`,
    from,
    to,
    cpx,
    cpy,
  }
}

/* Label sits near the midpoint of the curve, offset outward */
function getLabelPos(fromId: string, toId: string) {
  const { from, to, cpx, cpy } = connectionPath(fromId, toId)
  const t = 0.5
  const qx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cpx + t * t * to.x
  const qy = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cpy + t * t * to.y
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const labelOff = 16
  const labelX = qx + (dy / len) * labelOff
  const labelY = qy - (dx / len) * labelOff
  return { labelX, labelY }
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
  const w = 730
  const h = compact ? 380 : 400

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: compact ? "380px" : "400px" }}>
        <defs>
          {/* Subtle dot grid */}
          <pattern id="arch-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="0.6" fill="rgba(255,255,255,0.06)" />
          </pattern>

          {/* Radial ambient glow at the center */}
          <radialGradient id="arch-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(138,125,255,0.10)" />
            <stop offset="60%" stopColor="rgba(91,192,255,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Active node glow filter */}
          <filter id="active-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Flow label backdrop */}
          <filter id="label-bg" x="-6" y="-4" width="112%" height="140%">
            <feFlood floodColor="rgba(8,17,28,0.75)" result="bg" />
            <feMerge>
              <feMergeNode in="bg" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for each module accent — node fill */}
          {architectureModules.map((mod) => {
            const colors = mod.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff", "#aaa"]
            return (
              <linearGradient key={`grad-${mod.id}`} id={`arch-grad-${mod.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.22" />
                <stop offset="100%" stopColor={colors[1] ?? colors[0]} stopOpacity="0.06" />
              </linearGradient>
            )
          })}

          {/* Gradient stroke for each connection — from source to target accent */}
          {architectureFlows.map((flow) => {
            const fromMod = architectureModules.find((m) => m.id === flow.from)
            const toMod = architectureModules.find((m) => m.id === flow.to)
            const fromColor = fromMod?.accent.match(/#[a-f0-9]{6}/gi)?.[0] ?? "#fff"
            const toColor = toMod?.accent.match(/#[a-f0-9]{6}/gi)?.[0] ?? "#aaa"
            const conn = connectionPath(flow.from, flow.to)
            return (
              <linearGradient
                key={`flow-grad-${flow.from}-${flow.to}`}
                id={`flow-grad-${flow.from}-${flow.to}`}
                x1={conn.from.x} y1={conn.from.y}
                x2={conn.to.x} y2={conn.to.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={fromColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={toColor} stopOpacity="0.5" />
              </linearGradient>
            )
          })}
        </defs>

        {/* Background layers */}
        <rect width={w} height={h} fill="url(#arch-dots)" rx="20" />
        <rect width={w} height={h} fill="url(#arch-center-glow)" rx="20" />

        {/* ── Connection lines ── */}
        {architectureFlows.map((flow, i) => {
          const conn = connectionPath(flow.from, flow.to)
          const { d, from, to } = conn
          const isHighlighted = activeId === flow.from || activeId === flow.to
          const { labelX, labelY } = getLabelPos(flow.from, flow.to)
          const gradId = `flow-grad-${flow.from}-${flow.to}`

          return (
            <g key={`${flow.from}-${flow.to}`}>
              {/* Base glow line (wider, faded) */}
              {isHighlighted && (
                <motion.path
                  d={d}
                  fill="none"
                  stroke={`url(#${gradId})`}
                  strokeWidth={6}
                  strokeLinecap="round"
                  opacity={0.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                />
              )}

              {/* Primary connection line */}
              <motion.path
                d={d}
                fill="none"
                stroke={isHighlighted ? `url(#${gradId})` : "rgba(255,255,255,0.08)"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeLinecap="round"
                strokeDasharray={isHighlighted ? "none" : "4 8"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              />

              {/* Flow label — auto-width pill */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                {(() => {
                  const textLen = flow.label.length * 5.2 + 14
                  const pillW = Math.max(40, textLen)
                  return (
                    <>
                      <rect
                        x={labelX - pillW / 2}
                        y={labelY - 9}
                        width={pillW}
                        height={16}
                        rx={8}
                        fill={isHighlighted ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
                        stroke={isHighlighted ? "rgba(255,255,255,0.10)" : "none"}
                        strokeWidth={0.5}
                      />
                      <text
                        x={labelX}
                        y={labelY + 3}
                        textAnchor="middle"
                        fill={isHighlighted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)"}
                        fontSize="8.5"
                        fontWeight={isHighlighted ? 500 : 400}
                        letterSpacing="0.03em"
                      >
                        {flow.label}
                      </text>
                    </>
                  )
                })()}
              </motion.g>

              {/* Traveling particle */}
              <motion.circle
                r={isHighlighted ? 3.5 : 2}
                fill={isHighlighted ? "#fff7ec" : "rgba(255,255,255,0.25)"}
                filter={isHighlighted ? "url(#active-glow)" : undefined}
                animate={{
                  cx: [from.x, to.x],
                  cy: [from.y, to.y],
                  opacity: [0, 0.85, 0.85, 0],
                }}
                transition={{
                  duration: isHighlighted ? 2.4 : 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: i * 0.7,
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
              transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 220, damping: 20 }}
            >
              {/* Outer glow ring when active */}
              {isActive && (
                <motion.rect
                  x={pos.x - 6}
                  y={pos.y - 6}
                  width={nodeW + 12}
                  height={nodeH + 12}
                  rx={22}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth={1.5}
                  filter="url(#active-glow)"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.12, 0.5] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              )}

              {/* Node body */}
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx={16}
                fill={isActive ? `url(#arch-grad-${mod.id})` : "rgba(255,255,255,0.03)"}
                stroke={isActive ? primaryColor : "rgba(255,255,255,0.10)"}
                strokeWidth={isActive ? 1.5 : 1}
              />

              {/* Inner highlight edge — top */}
              <rect
                x={pos.x + 1}
                y={pos.y + 1}
                width={nodeW - 2}
                height={nodeH - 2}
                rx={15}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.5}
              />

              {/* Accent bar */}
              <rect
                x={pos.x + 16}
                y={pos.y + 12}
                width={isActive ? 36 : 24}
                height={3}
                rx={1.5}
                fill={primaryColor}
                opacity={isActive ? 1 : 0.35}
              />

              {/* Module name */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 34}
                textAnchor="middle"
                fill={isActive ? "#fff7ec" : "#c8d0da"}
                fontSize="13"
                fontWeight="600"
                letterSpacing="0.01em"
              >
                {mod.name}
              </text>

              {/* Module role */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 53}
                textAnchor="middle"
                fill={isActive ? "#9fb0c4" : "#576879"}
                fontSize="9.5"
                letterSpacing="0.02em"
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
