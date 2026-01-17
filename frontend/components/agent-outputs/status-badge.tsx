"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ValidityStatus,
  CoverageStatus,
  RiskLevel,
  Recommendation,
  Confidence,
} from "@/types/agent-outputs"

type StatusType = "validity" | "coverage" | "risk" | "recommendation" | "confidence"

interface StatusBadgeProps {
  status: string
  type: StatusType
  className?: string
}

// Color mapping for different status types
const STATUS_COLORS: Record<StatusType, Record<string, string>> = {
  validity: {
    [ValidityStatus.VALID]: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    [ValidityStatus.QUESTIONABLE]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    [ValidityStatus.INVALID]: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
  coverage: {
    [CoverageStatus.COVERED]: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    [CoverageStatus.PARTIALLY_COVERED]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    [CoverageStatus.NOT_COVERED]: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    [CoverageStatus.INSUFFICIENT_EVIDENCE]: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30",
  },
  risk: {
    [RiskLevel.LOW_RISK]: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    [RiskLevel.MEDIUM_RISK]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    [RiskLevel.HIGH_RISK]: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
  recommendation: {
    [Recommendation.APPROVE]: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    [Recommendation.INVESTIGATE]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    [Recommendation.DENY]: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
  confidence: {
    [Confidence.HIGH]: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    [Confidence.MEDIUM]: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    [Confidence.LOW]: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
}

// Human-readable labels
const STATUS_LABELS: Record<string, string> = {
  // Validity
  VALID: "Valid",
  QUESTIONABLE: "Questionable",
  INVALID: "Invalid",
  // Coverage
  COVERED: "Covered",
  NOT_COVERED: "Not Covered",
  PARTIALLY_COVERED: "Partially Covered",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
  // Risk
  LOW_RISK: "Low Risk",
  MEDIUM_RISK: "Medium Risk",
  HIGH_RISK: "High Risk",
  // Recommendation
  APPROVE: "Approve",
  DENY: "Deny",
  INVESTIGATE: "Investigate",
  // Confidence
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const colorMap = STATUS_COLORS[type] || {}
  const colorClass = colorMap[status] || "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30"
  const label = STATUS_LABELS[status] || status.replace(/_/g, " ")

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-xs px-2.5 py-0.5 border",
        colorClass,
        className
      )}
    >
      {label}
    </Badge>
  )
}

export default StatusBadge
