"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import { CoverageVerification } from "@/types/agent-outputs"
import { FileCheck, BookOpen } from "lucide-react"

interface CoverageVerificationCardProps {
  output: CoverageVerification
  className?: string
}

export const CoverageVerificationCard = React.memo(function CoverageVerificationCard({ output, className }: CoverageVerificationCardProps) {
  const hasCitedSections = output.cited_sections && output.cited_sections.length > 0

  return (
    <Card className={cn("border-l-4 border-l-purple-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4 text-purple-500" />
            Coverage Verification
          </CardTitle>
          <StatusBadge status={output.coverage_status} type="coverage" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage Details */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Coverage Details
          </h4>
          <p className="text-sm">{output.coverage_details}</p>
        </div>

        {/* Cited Sections */}
        {hasCitedSections && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-purple-500" />
              Cited Policy Sections
            </h4>
            <ul className="space-y-1.5">
              {output.cited_sections.map((section, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="text-purple-500 mt-0.5">§</span>
                  <span className="font-medium">{section}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Cited Sections */}
        {!hasCitedSections && (
          <div className="text-sm text-muted-foreground italic">
            No specific policy sections cited
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default CoverageVerificationCard
