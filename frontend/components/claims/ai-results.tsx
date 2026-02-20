"use client"

import * as React from "react"
import { AIAssessment } from "@/lib/api/claims"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AIResultsProps {
  assessment: AIAssessment | null
  isLoading?: boolean
}

export function AIResults({ assessment, isLoading }: AIResultsProps) {
  const formatRecommendation = (value?: string | null) => {
    if (!value) return "PENDING"
    return value.replace("Recommendation.", "").toUpperCase()
  }

  const getRecommendationTone = (value?: string | null) => {
    const normalized = formatRecommendation(value)
    if (normalized === "APPROVE") return "bg-green-50 text-green-700 border-green-200"
    if (normalized === "DENY") return "bg-red-50 text-red-700 border-red-200"
    if (normalized === "INVESTIGATE") return "bg-amber-50 text-amber-700 border-amber-200"
    return "bg-muted text-foreground border-border"
  }

  const getStatusTone = (value?: string | null) => {
    if (!value) return "bg-muted text-foreground border-border"
    if (value.includes("LOW")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (value.includes("HIGH")) return "bg-red-50 text-red-700 border-red-200"
    if (value.includes("MEDIUM")) return "bg-amber-50 text-amber-700 border-amber-200"
    if (value.includes("COVERED") && !value.includes("NOT")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (value.includes("NOT_COVERED") || value.includes("INVALID")) return "bg-red-50 text-red-700 border-red-200"
    return "bg-muted text-foreground border-border"
  }

  const getRiskProgressColor = (score: number | null) => {
    if (score === null) return "bg-muted"
    if (score < 30) return "bg-green-500"
    if (score < 70) return "bg-amber-500"
    return "bg-red-500"
  }

  const getRiskIcon = (level?: string) => {
    if (!level) return <ShieldQuestion className="w-4 h-4" />
    if (level.includes("LOW")) return <ShieldCheck className="w-4 h-4 text-green-600" />
    if (level.includes("HIGH")) return <ShieldAlert className="w-4 h-4 text-red-600" />
    return <AlertTriangle className="w-4 h-4 text-amber-600" />
  }

  const renderList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return <div className="text-sm text-muted-foreground">None reported.</div>
    }
    return (
      <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    )
  }
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Processing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-busy="true"></div>
          <p className="text-muted-foreground" aria-live="polite">Agents are analyzing the claim…</p>
        </CardContent>
      </Card>
    )
  }

  if (!assessment) {
    return null
  }

  if (assessment.status === 'pending' || assessment.status === 'processing') {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>AI Processing</CardTitle>
            <Badge variant="outline">{assessment.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-busy="true"></div>
          <p className="text-muted-foreground" aria-live="polite">Agents are analyzing the claim…</p>
        </CardContent>
      </Card>
    )
  }

  if (assessment.status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Processing Failed</AlertTitle>
        <AlertDescription>
          {assessment.error_message || "An unknown error occurred during AI processing."}
        </AlertDescription>
      </Alert>
    )
  }

  const outputs = assessment.agent_outputs || {}
  const synthesizer = (outputs["synthesizer"] as Record<string, unknown>) || {}
  const claimAssessor = (outputs["claim_assessor"] as Record<string, unknown>) || {}
  const policyChecker = (outputs["policy_checker"] as Record<string, unknown>) || {}
  const riskAnalyst = (outputs["risk_analyst"] as Record<string, unknown>) || {}
  const communication = (outputs["communication_agent"] as Record<string, unknown>) || {}

  const recommendation = (synthesizer["recommendation"] as string | undefined) || assessment.final_recommendation
  const confidence = (synthesizer["confidence"] as string | undefined) || assessment.confidence_scores?.supervisor
  const summary = synthesizer["summary"] as string | undefined
  const keyFindings = Array.isArray(synthesizer["key_findings"]) ? (synthesizer["key_findings"] as string[]) : undefined
  const nextSteps = Array.isArray(synthesizer["next_steps"]) ? (synthesizer["next_steps"] as string[]) : undefined

  const riskScore = typeof riskAnalyst["risk_score"] === "number" ? (riskAnalyst["risk_score"] as number) : null
  const riskLevel = riskAnalyst["risk_level"] as string | undefined
  const fraudIndicators = Array.isArray(riskAnalyst["fraud_indicators"]) ? (riskAnalyst["fraud_indicators"] as string[]) : undefined
  const riskAnalysis = riskAnalyst["analysis"] as string | undefined

  const validityStatus = claimAssessor["validity_status"] as string | undefined
  const costAssessment = claimAssessor["cost_assessment"] as string | undefined
  const redFlags = Array.isArray(claimAssessor["red_flags"]) ? (claimAssessor["red_flags"] as string[]) : undefined
  const reasoning = claimAssessor["reasoning"] as string | undefined

  const coverageStatus = policyChecker["coverage_status"] as string | undefined
  const coverageDetails = policyChecker["coverage_details"] as string | undefined
  const citedSections = Array.isArray(policyChecker["cited_sections"]) ? (policyChecker["cited_sections"] as string[]) : undefined

  const emailSubject = communication["subject"] as string | undefined
  const requestedItems = Array.isArray(communication["requested_items"]) ? (communication["requested_items"] as string[]) : undefined
  const emailBody = communication["body"] as string | undefined

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Supervisor Recommendation</CardTitle>
            {(() => {
              const rec = formatRecommendation(recommendation)
              if (rec === "DENY") return (
                <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Deny Recommended
                </Badge>
              )
              if (rec === "INVESTIGATE") return (
                <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Investigation Needed
                </Badge>
              )
              return (
                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approval Recommended
                </Badge>
              )
            })()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Recommendation</div>
              <div className="mt-2">
                <Badge variant="outline" className={getRecommendationTone(recommendation)}>
                  {formatRecommendation(recommendation)}
                </Badge>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="mt-2 font-semibold">{confidence || "—"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                Risk Score {getRiskIcon(riskLevel)}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{riskScore !== null ? riskScore : "—"}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2">
                <Progress 
                  value={riskScore !== null ? riskScore : 0} 
                  indicatorClassName={getRiskProgressColor(riskScore)}
                  aria-label={`Risk score: ${riskScore ?? 0} out of 100`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="text-xs text-muted-foreground">Summary</div>
              <div className="mt-2 text-sm">
                {summary ? summary : assessment.final_recommendation || "No summary available."}
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-xs text-muted-foreground">Next Steps</div>
              <div className="mt-2">
                {renderList(nextSteps)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Key Findings</div>
            <div className="mt-2">
              {renderList(keyFindings)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agent Details</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Claim Assessor</CardTitle>
              <Badge variant="outline" className={getStatusTone(validityStatus)}>
                {validityStatus || "N/A"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Cost Assessment</div>
                <div className="mt-1">{costAssessment || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Red Flags</div>
                <div className="mt-1">{renderList(redFlags)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reasoning</div>
                <div className="mt-1">{reasoning || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Policy Checker</CardTitle>
              <Badge variant="outline" className={getStatusTone(coverageStatus)}>
                {coverageStatus || "—"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Coverage Details</div>
                <div className="mt-1">{coverageDetails || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cited Sections</div>
                <div className="mt-1">{renderList(citedSections)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Risk Analyst</CardTitle>
              <Badge variant="outline" className={getStatusTone(riskLevel)}>
                {riskLevel || "—"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Risk Score</div>
                <div className="mt-1 font-semibold">{riskScore !== null ? riskScore : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fraud Indicators</div>
                <div className="mt-1">{renderList(fraudIndicators)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Analysis</div>
                <div className="mt-1">{riskAnalysis || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Subject</div>
                <div className="mt-1">{emailSubject || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Requested Items</div>
                <div className="mt-1">{renderList(requestedItems)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Draft Body</div>
                <div className="mt-1 whitespace-pre-wrap">{emailBody || "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
