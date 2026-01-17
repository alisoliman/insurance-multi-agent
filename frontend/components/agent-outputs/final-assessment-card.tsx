"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import { FinalAssessment, Recommendation } from "@/types/agent-outputs"
import { Scale, CheckCircle2, XCircle, Search, ArrowRight, Lightbulb } from "lucide-react"

interface FinalAssessmentCardProps {
  output: FinalAssessment
  className?: string
}

// Icon based on recommendation
function getRecommendationIcon(recommendation: string) {
  switch (recommendation) {
    case Recommendation.APPROVE:
      return <CheckCircle2 className="h-6 w-6 text-green-500" />
    case Recommendation.DENY:
      return <XCircle className="h-6 w-6 text-red-500" />
    case Recommendation.INVESTIGATE:
      return <Search className="h-6 w-6 text-yellow-500" />
    default:
      return <Scale className="h-6 w-6 text-indigo-500" />
  }
}

// Background color based on recommendation
function getRecommendationBgClass(recommendation: string) {
  switch (recommendation) {
    case Recommendation.APPROVE:
      return "bg-green-500/5 border-green-500/20"
    case Recommendation.DENY:
      return "bg-red-500/5 border-red-500/20"
    case Recommendation.INVESTIGATE:
      return "bg-yellow-500/5 border-yellow-500/20"
    default:
      return "bg-indigo-500/5 border-indigo-500/20"
  }
}

export function FinalAssessmentCard({ output, className }: FinalAssessmentCardProps) {
  const hasKeyFindings = output.key_findings && output.key_findings.length > 0
  const hasNextSteps = output.next_steps && output.next_steps.length > 0

  return (
    <Card className={cn(
      "border-2",
      getRecommendationBgClass(output.recommendation),
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {getRecommendationIcon(output.recommendation)}
            <div>
              <CardTitle className="text-lg">Final Assessment</CardTitle>
              <CardDescription className="mt-1">
                Synthesized recommendation from all agents
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge 
              status={output.recommendation} 
              type="recommendation" 
              className="text-sm px-3 py-1"
            />
            <StatusBadge 
              status={output.confidence} 
              type="confidence" 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary */}
        <div className="rounded-lg bg-background/60 p-4 border">
          <h4 className="text-sm font-semibold mb-2">Summary</h4>
          <p className="text-sm leading-relaxed">{output.summary}</p>
        </div>

        {/* Key Findings */}
        {hasKeyFindings && (
          <div>
            <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-indigo-500" />
              Key Findings
            </h4>
            <ul className="space-y-2">
              {output.key_findings.map((finding, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {hasNextSteps && (
          <div>
            <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4 text-indigo-500" />
              Next Steps
            </h4>
            <ol className="space-y-2">
              {output.next_steps.map((step, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FinalAssessmentCard
