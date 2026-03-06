"use client"

import { motion } from "motion/react"

import { agentCards } from "../slide-data"

const centerX = 250
const centerY = 180
const orbitRadius = 120

const agentPositions = agentCards
  .filter((a) => a.id !== "synthesizer")
  .map((agent, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2
    return {
      ...agent,
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
      angle,
    }
  })

export function AgentConstellation({
  activeId,
  onSelect,
  compact = false,
}: {
  activeId: string
  onSelect: (id: string) => void
  compact?: boolean
}) {
  const w = 500
  const h = compact ? 360 : 400

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ maxHeight: compact ? "360px" : "400px" }}
        role="img"
        aria-label="Agent constellation diagram showing specialized AI agents orbiting around a central Synthesizer agent: Claims Intake, Document Analyst, Investigator, Compliance, and Resolution agents"
      >
        <defs>
          <pattern id="agent-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(186,162,255,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .orbit-animation { animation: none !important; }
            .pulse-animation { animation: none !important; }
          }
        `}</style>
        <rect width={w} height={h} fill="url(#agent-grid)" rx="24" />

        {/* Orbit ring */}
        <motion.circle
          className="orbit-animation"
          cx={centerX}
          cy={centerY}
          r={orbitRadius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="4 8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Center glow */}
        <circle cx={centerX} cy={centerY} r={60} fill="url(#center-glow)" />

        {/* Connection lines from agents to center */}
        {agentPositions.map((agent, i) => {
          const isActive = activeId === agent.id
          const gradientId = `line-${agent.id}`
          return (
            <g key={`line-${agent.id}`}>
              <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={String(agent.x)} y1={String(agent.y)} x2={String(centerX)} y2={String(centerY)}>
                  <stop offset="0%" stopColor={isActive ? "#fff7ec" : "rgba(255,255,255,0.15)"} />
                  <stop offset="100%" stopColor="rgba(186,162,255,0.4)" />
                </linearGradient>
              </defs>
              <motion.line
                x1={agent.x}
                y1={agent.y}
                x2={centerX}
                y2={centerY}
                stroke={`url(#${gradientId})`}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "0" : "4 8"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
              />

              {/* Animated data particle flowing to center */}
              {isActive && (
                <motion.circle
                  r={3}
                  fill="#fff7ec"
                  initial={{ cx: agent.x, cy: agent.y, opacity: 0 }}
                  animate={{
                    cx: [agent.x, centerX],
                    cy: [agent.y, centerY],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              )}
            </g>
          )
        })}

        {/* Center node — Synthesizer */}
        <motion.g
          style={{ cursor: "pointer" }}
          onClick={() => onSelect("synthesizer")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 18 }}
        >
          <circle
            cx={centerX}
            cy={centerY}
            r={32}
            fill={activeId === "synthesizer" ? "rgba(186,162,255,0.2)" : "rgba(255,255,255,0.06)"}
            stroke={activeId === "synthesizer" ? "rgba(186,162,255,0.6)" : "rgba(255,255,255,0.15)"}
            strokeWidth={activeId === "synthesizer" ? 2 : 1.5}
          />
          <text
            x={centerX}
            y={centerY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff7ec"
            fontSize="9"
            fontWeight="600"
          >
            Synthesizer
          </text>
        </motion.g>

        {/* Agent nodes */}
        {agentPositions.map((agent, i) => {
          const isActive = activeId === agent.id
          const colors = agent.accent.match(/#[a-f0-9]{6}/gi) ?? ["#fff"]
          const primaryColor = colors[0]

          return (
            <motion.g
              key={agent.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(agent.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 200, damping: 18 }}
            >
              {/* Active pulse ring */}
              {isActive && (
                <motion.circle
                  className="pulse-animation"
                  cx={agent.x}
                  cy={agent.y}
                  r={30}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth={1}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
              )}

              <circle
                cx={agent.x}
                cy={agent.y}
                r={24}
                fill={isActive ? `${primaryColor}22` : "rgba(255,255,255,0.05)"}
                stroke={isActive ? primaryColor : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? 2 : 1.5}
              />

              {/* Agent initial */}
              <text
                x={agent.x}
                y={agent.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? "#fff7ec" : "#d0d6df"}
                fontSize="11"
                fontWeight="600"
              >
                {agent.name.split(" ").map((w) => w[0]).join("")}
              </text>

              {/* Label below */}
              <text
                x={agent.x}
                y={agent.y + 38}
                textAnchor="middle"
                fill={isActive ? "#fff7ec" : "#9fb0c4"}
                fontSize="10"
                fontWeight="500"
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
