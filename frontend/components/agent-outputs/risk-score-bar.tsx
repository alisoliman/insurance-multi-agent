"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface RiskScoreBarProps {
  score: number // 0-100
  className?: string
  showLabel?: boolean
}

/**
 * Get the color class based on risk score.
 * Green (0-33): Low risk
 * Yellow (34-66): Medium risk  
 * Red (67-100): High risk
 */
function getScoreColorClass(score: number): string {
  if (score <= 33) {
    return "[&>div]:bg-green-500 dark:[&>div]:bg-green-400"
  }
  if (score <= 66) {
    return "[&>div]:bg-yellow-500 dark:[&>div]:bg-yellow-400"
  }
  return "[&>div]:bg-red-500 dark:[&>div]:bg-red-400"
}

function getRiskLabel(score: number): string {
  if (score <= 33) return "Low Risk"
  if (score <= 66) return "Medium Risk"
  return "High Risk"
}

function getLabelColorClass(score: number): string {
  if (score <= 33) {
    return "text-green-700 dark:text-green-400"
  }
  if (score <= 66) {
    return "text-yellow-700 dark:text-yellow-400"
  }
  return "text-red-700 dark:text-red-400"
}

export function RiskScoreBar({ score, className, showLabel = true }: RiskScoreBarProps) {
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score))
  const colorClass = getScoreColorClass(clampedScore)
  const labelColorClass = getLabelColorClass(clampedScore)
  const riskLabel = getRiskLabel(clampedScore)

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Risk Score</span>
        <div className="flex items-center gap-2">
          <span className={cn("font-bold", labelColorClass)}>
            {clampedScore}
          </span>
          {showLabel && (
            <span className={cn("text-xs font-medium", labelColorClass)}>
              ({riskLabel})
            </span>
          )}
        </div>
      </div>
      <Progress
        value={clampedScore}
        className={cn(
          "h-2.5 bg-secondary",
          colorClass
        )}
        aria-label={`Risk score: ${clampedScore} out of 100 - ${riskLabel}`}
      />
    </div>
  )
}

export default RiskScoreBar
