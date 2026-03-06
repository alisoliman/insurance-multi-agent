"use client"

import { motion } from "motion/react"

import { traceChain, governancePillars } from "../slide-data"

export function GovernanceTrace({ compact = false }: { compact?: boolean }) {
  const w = 700
  const h = compact ? 240 : 280
  const timelineY = h * 0.6
  const nodeSpacing = (w - 120) / (traceChain.length - 1)
  const startX = 60

  const nodes = traceChain.map((step, i) => ({
    ...step,
    x: startX + i * nodeSpacing,
    y: timelineY,
  }))

  const guardrailY = compact ? 40 : 50

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: compact ? "240px" : "280px" }}>
        <defs>
          <pattern id="gov-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <linearGradient id="timeline-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5c483" />
            <stop offset="50%" stopColor="#95f2df" />
            <stop offset="100%" stopColor="#8ecbff" />
          </linearGradient>
          <filter id="pulse-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={w} height={h} fill="url(#gov-grid)" rx="24" />

        {/* Governance guardrail labels */}
        {governancePillars.map((pillar, i) => {
          const x = startX + i * ((w - 120) / (governancePillars.length - 1))
          return (
            <motion.g
              key={pillar.title}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <rect
                x={x - 60}
                y={guardrailY - 12}
                width={120}
                height={24}
                rx={12}
                fill="rgba(255,255,255,0.04)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <text
                x={x}
                y={guardrailY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#91a6bd"
                fontSize="8"
                letterSpacing="0.08em"
              >
                {pillar.title.toUpperCase()}
              </text>
            </motion.g>
          )
        })}

        {/* Dotted lines from guardrails to timeline */}
        {governancePillars.map((pillar, i) => {
          const x = startX + i * ((w - 120) / (governancePillars.length - 1))
          return (
            <motion.line
              key={`line-${pillar.title}`}
              x1={x}
              y1={guardrailY + 14}
              x2={x}
              y2={timelineY - 30}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              strokeDasharray="3 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            />
          )
        })}

        {/* Main timeline line */}
        <motion.line
          x1={nodes[0].x}
          y1={timelineY}
          x2={nodes[nodes.length - 1].x}
          y2={timelineY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Animated gradient overlay on timeline */}
        <motion.line
          x1={nodes[0].x}
          y1={timelineY}
          x2={nodes[nodes.length - 1].x}
          y2={timelineY}
          stroke="url(#timeline-grad)"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6, duration: 1.2 }}
        />

        {/* Traveling pulse */}
        <motion.circle
          r={5}
          fill="#fff7ec"
          opacity={0.8}
          filter="url(#pulse-glow)"
          animate={{
            cx: [nodes[0].x, ...nodes.map((n) => n.x), nodes[nodes.length - 1].x],
            cy: timelineY,
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            times: [0, ...nodes.map((_, i) => (i + 1) / (nodes.length + 1)), 1],
          }}
        />

        {/* Stage nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.title}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 200, damping: 18 }}
          >
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
            />

            {/* Step number */}
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f5c483"
              fontSize="12"
              fontWeight="600"
            >
              {String(i + 1).padStart(2, "0")}
            </text>

            {/* Label below */}
            <text
              x={node.x}
              y={node.y + 36}
              textAnchor="middle"
              fill="#fff7ec"
              fontSize="10"
              fontWeight="500"
            >
              {node.title}
            </text>

            {/* Connector arrows between nodes */}
            {i < nodes.length - 1 && (
              <motion.text
                x={(node.x + nodes[i + 1].x) / 2}
                y={node.y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.25)"
                fontSize="14"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.15 }}
              >
                →
              </motion.text>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
