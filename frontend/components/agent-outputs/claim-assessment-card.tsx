"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import { ClaimAssessment } from "@/types/agent-outputs"
import { AlertTriangle, CheckCircle, FileText } from "lucide-react"

interface ClaimAssessmentCardProps {
  output: ClaimAssessment
  className?: string
}

export const ClaimAssessmentCard = React.memo(function ClaimAssessmentCard({ output, className }: ClaimAssessmentCardProps) {
  const hasRedFlags = output.red_flags && output.red_flags.length > 0

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-500" />
            Claim Assessment
          </CardTitle>
          <StatusBadge status={output.validity_status} type="validity" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Assessment */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Cost Assessment
          </h4>
          <p className="text-sm">{output.cost_assessment}</p>
        </div>

        {/* Red Flags */}
        {hasRedFlags && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              Red Flags
            </h4>
            <ul className="space-y-1.5">
              {output.red_flags.map((flag, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2 text-red-700 dark:text-red-400"
                >
                  <span className="text-red-500 mt-0.5">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Red Flags indicator */}
        {!hasRedFlags && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            No red flags identified
          </div>
        )}

        {/* Reasoning (expandable) */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Reasoning
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {output.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

export default ClaimAssessmentCard
