"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { RiskScoreBar } from "./risk-score-bar"
import { cn } from "@/lib/utils"
import { RiskAssessment } from "@/types/agent-outputs"
import { ShieldAlert, AlertOctagon, CheckCircle } from "lucide-react"

interface RiskAssessmentCardProps {
  output: RiskAssessment
  className?: string
}

export const RiskAssessmentCard = React.memo(function RiskAssessmentCard({ output, className }: RiskAssessmentCardProps) {
  const hasFraudIndicators = output.fraud_indicators && output.fraud_indicators.length > 0

  return (
    <Card className={cn("border-l-4 border-l-orange-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Risk Assessment
          </CardTitle>
          <StatusBadge status={output.risk_level} type="risk" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Bar */}
        <RiskScoreBar score={output.risk_score} />

        {/* Fraud Indicators */}
        {hasFraudIndicators && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
              Fraud Indicators
            </h4>
            <ul className="space-y-1.5">
              {output.fraud_indicators.map((indicator, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2 text-red-700 dark:text-red-400"
                >
                  <span className="text-red-500 mt-0.5">⚠</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Fraud Indicators */}
        {!hasFraudIndicators && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            No fraud indicators detected
          </div>
        )}

        {/* Analysis */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Analysis
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {output.analysis}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

export default RiskAssessmentCard
