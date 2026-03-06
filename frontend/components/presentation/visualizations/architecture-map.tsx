"use client"

import { motion } from "motion/react"

import { architectureModules, architectureFlows } from "../slide-data"

const layout: Record<string, { x: number; y: number }> = {
  experience: { x: 150, y: 60 },
  orchestration: { x: 350, y: 175 },
  intelligence: { x: 580, y: 60 },
  data: { x: 580, y: 260 },
  trust: { x: 150, y: 260 },
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
  const w = 720
  const h = compact ? 340 : 380
  const nodeW = 140
  const nodeH = 60

  const getCenter = (id: string) => {
    const pos = layout[id]
    return { cx: pos.x + nodeW / 2, cy: pos.y + nodeH / 2 }
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: compact ? "340px" : "380px" }}>
        <defs>
          <pattern id="arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={w} height={h} fill="url(#arch-grid)" rx="24" />

        {/* Connection flows */}
        {architectureFlows.map((flow, i) => {
          const from = getCenter(flow.from)
          const to = getCenter(flow.to)
          const midX = (from.cx + to.cx) / 2
          const midY = (from.cy + to.cy) / 2
          const isHighlighted = activeId === flow.from || activeId === flow.to

          return (
            <g key={`${flow.from}-${flow.to}`}>
              <motion.path
                d={`M ${from.cx} ${from.cy} Q ${midX} ${from.cy} ${to.cx} ${to.cy}`}
                fill="none"
                stroke={isHighlighted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}
                strokeWidth={isHighlighted ? 2 : 1.5}
                strokeDasharray="6 10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              />

              {/* Flow label */}
              <motion.text
                x={midX + (from.cy === to.cy ? 0 : 12)}
                y={midY - 8}
                textAnchor="middle"
                fill={isHighlighted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}
                fontSize="9"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                {flow.label}
              </motion.text>

              {/* Animated particle on highlighted connections */}
              {isHighlighted && (
                <motion.circle
                  r={3}
                  fill="#fff7ec"
                  opacity={0.7}
                  animate={{
                    cx: [from.cx, to.cx],
                    cy: [from.cy, to.cy],
                    opacity: [0, 0.8, 0.8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              )}
            </g>
          )
        })}

        {/* Module nodes */}
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
              transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
            >
              {/* Active pulse */}
              {isActive && (
                <motion.rect
                  x={pos.x - 4}
                  y={pos.y - 4}
                  width={nodeW + 8}
                  height={nodeH + 8}
                  rx={22}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth={1}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}

              {/* Node body */}
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeW}
                height={nodeH}
                rx={18}
                fill={isActive ? `${primaryColor}18` : "rgba(255,255,255,0.04)"}
                stroke={isActive ? primaryColor : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? 2 : 1.5}
              />

              {/* Color accent bar */}
              <rect
                x={pos.x + 12}
                y={pos.y + 8}
                width={24}
                height={3}
                rx={1.5}
                fill={primaryColor}
                opacity={isActive ? 1 : 0.5}
              />

              {/* Module name */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 28}
                textAnchor="middle"
                fill={isActive ? "#fff7ec" : "#d0d6df"}
                fontSize="11"
                fontWeight="600"
              >
                {mod.name}
              </text>

              {/* Module role */}
              <text
                x={pos.x + nodeW / 2}
                y={pos.y + 44}
                textAnchor="middle"
                fill={isActive ? "#9fb0c4" : "#6b7f94"}
                fontSize="8"
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
