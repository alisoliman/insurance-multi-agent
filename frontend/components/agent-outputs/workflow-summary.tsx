"use client"

/**
 * WorkflowSummary component - Feature 005 - US6 (T037-T039)
 * 
 * Provides viewer-focused enhancements:
 * - Agent role descriptions for non-technical viewers
 * - Key metrics highlighting with color coding
 * - Final decision with contributing factors
 */

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  IconFileText, 
  IconShield, 
  IconTrendingUp, 
  IconMessage,
  IconRobot,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconSearch,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { 
  WorkflowResult, 
  ClaimAssessment, 
  CoverageVerification, 
  RiskAssessment,
  FinalAssessment,
  isClaimAssessment,
  isCoverageVerification,
  isRiskAssessment,
  isFinalAssessment,
} from "@/types/agent-outputs"

/**
 * Agent role descriptions for non-technical viewers (T037)
 */
export const AGENT_ROLE_DESCRIPTIONS = {
  claim_assessor: {
    icon: IconFileText,
    title: "Claim Assessor",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    shortDescription: "Evaluates the damage",
    fullDescription: "Analyzes photos and documentation to determine the extent of damage and estimate repair costs.",
  },
  policy_checker: {
    icon: IconShield,
    title: "Policy Checker",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    shortDescription: "Verifies coverage",
    fullDescription: "Reviews the insurance policy to confirm what is covered and identify any exclusions that may apply.",
  },
  risk_analyst: {
    icon: IconTrendingUp,
    title: "Risk Analyst",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    shortDescription: "Assesses risk factors",
    fullDescription: "Examines the claim for potential fraud indicators and evaluates the overall risk level.",
  },
  communication_agent: {
    icon: IconMessage,
    title: "Communication Agent",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    shortDescription: "Drafts customer emails",
    fullDescription: "Prepares professional correspondence to communicate with the customer about their claim status.",
  },
  supervisor: {
    icon: IconRobot,
    title: "Supervisor",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    shortDescription: "Makes the final decision",
    fullDescription: "Coordinates all agents and synthesizes their findings into a final recommendation.",
  },
}

interface KeyMetricProps {
  label: string
  value: string | number
  status: "success" | "warning" | "error" | "neutral"
  icon?: React.ReactNode
}

/**
 * Key metric with color coding (T038)
 */
export function KeyMetric({ label, value, status, icon }: KeyMetricProps) {
  const statusStyles = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  }

  return (
    <div className={cn("rounded-lg p-3 border", statusStyles[status])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

interface RiskScoreDisplayProps {
  score: number
}

/**
 * Prominent risk score display with color coding (T038)
 */
export function RiskScoreDisplay({ score }: RiskScoreDisplayProps) {
  const getScoreConfig = (s: number) => {
    if (s <= 33) return { label: "Low Risk", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-500", status: "success" as const }
    if (s <= 66) return { label: "Medium Risk", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-500", status: "warning" as const }
    return { label: "High Risk", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500", status: "error" as const }
  }

  const config = getScoreConfig(score)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Risk Score</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold", config.color)}>{score}</span>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>
      </div>
      <Progress
        value={score}
        className={cn("h-3", `[&>div]:${config.bgColor}`)}
      />
    </div>
  )
}

interface CoverageStatusDisplayProps {
  hasCoverage: boolean
  coverageDetails?: string
  exclusions?: string[]
}

/**
 * Coverage status with prominent color coding (T038)
 */
export function CoverageStatusDisplay({ hasCoverage, coverageDetails, exclusions }: CoverageStatusDisplayProps) {
  return (
    <div className={cn(
      "rounded-lg p-4 border-2",
      hasCoverage 
        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {hasCoverage ? (
          <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <IconX className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
        <span className={cn(
          "text-lg font-bold",
          hasCoverage ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
        )}>
          {hasCoverage ? "Covered" : "Not Covered"}
        </span>
      </div>
      {coverageDetails && (
        <p className="text-sm text-muted-foreground">{coverageDetails}</p>
      )}
      {exclusions && exclusions.length > 0 && (
        <div className="mt-2">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            ⚠️ Exclusions apply
          </span>
        </div>
      )}
    </div>
  )
}

interface DecisionDisplayProps {
  recommendation: string
  confidence: string
  summary: string
  keyFindings?: string[]
}

/**
 * Final decision display with contributing factors (T039)
 */
export function DecisionDisplay({ recommendation, confidence, summary, keyFindings }: DecisionDisplayProps) {
  const getDecisionConfig = (rec: string) => {
    switch (rec.toLowerCase()) {
      case "approve":
        return { 
          icon: IconCheck, 
          color: "text-green-600 dark:text-green-400", 
          bgColor: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          label: "Approved"
        }
      case "deny":
        return { 
          icon: IconX, 
          color: "text-red-600 dark:text-red-400", 
          bgColor: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
          label: "Denied"
        }
      case "investigate":
        return { 
          icon: IconSearch, 
          color: "text-yellow-600 dark:text-yellow-400", 
          bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
          label: "Further Investigation"
        }
      default:
        return { 
          icon: IconAlertTriangle, 
          color: "text-gray-600 dark:text-gray-400", 
          bgColor: "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800",
          label: recommendation
        }
    }
  }

  const config = getDecisionConfig(recommendation)
  const Icon = config.icon

  return (
    <Card className={cn("border-2", config.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={cn("h-8 w-8", config.color)} />
            <div>
              <CardTitle className={cn("text-xl", config.color)}>
                {config.label}
              </CardTitle>
              <CardDescription>
                Final decision from workflow
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{summary}</p>
        
        {keyFindings && keyFindings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Contributing Factors:</h4>
            <ul className="space-y-1">
              {keyFindings.map((finding, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface WorkflowSummaryProps {
  result: WorkflowResult
}

/**
 * Comprehensive workflow summary for viewers (T037-T039)
 */
export function WorkflowSummary({ result }: WorkflowSummaryProps) {
  const { agent_outputs } = result
  
  // Extract structured outputs
  const claimAssessment = agent_outputs?.claim_assessor?.structured_output
  const coverage = agent_outputs?.policy_checker?.structured_output
  const risk = agent_outputs?.risk_analyst?.structured_output
  const finalAssessment = agent_outputs?.synthesizer?.structured_output

  // Type guards
  const claimData = claimAssessment && isClaimAssessment(claimAssessment) ? claimAssessment as ClaimAssessment : null
  const coverageData = coverage && isCoverageVerification(coverage) ? coverage as CoverageVerification : null
  const riskData = risk && isRiskAssessment(risk) ? risk as RiskAssessment : null
  const finalData = finalAssessment && isFinalAssessment(finalAssessment) ? finalAssessment as FinalAssessment : null

  return (
    <div className="space-y-6">
      {/* Final Decision (T039) */}
      {finalData && (
        <DecisionDisplay
          recommendation={finalData.recommendation}
          confidence={finalData.confidence}
          summary={finalData.summary}
          keyFindings={finalData.key_findings}
        />
      )}

      {/* Key Metrics Grid (T038) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Estimated Damage */}
        {claimData?.estimated_repair_cost && (
          <KeyMetric
            label="Est. Damage"
            value={`$${claimData.estimated_repair_cost.toLocaleString()}`}
            status="neutral"
          />
        )}

        {/* Risk Score */}
        {riskData?.risk_score !== undefined && (
          <KeyMetric
            label="Risk Score"
            value={riskData.risk_score}
            status={riskData.risk_score <= 33 ? "success" : riskData.risk_score <= 66 ? "warning" : "error"}
            icon={<IconTrendingUp className="h-4 w-4" />}
          />
        )}

        {/* Coverage Status */}
        {coverageData && (
          <KeyMetric
            label="Coverage"
            value={coverageData.coverage_status === "covered" ? "Covered" : "Check Policy"}
            status={coverageData.coverage_status === "covered" ? "success" : "warning"}
            icon={<IconShield className="h-4 w-4" />}
          />
        )}

        {/* Damage Severity */}
        {claimData?.damage_severity && (
          <KeyMetric
            label="Severity"
            value={claimData.damage_severity}
            status={
              claimData.damage_severity.toLowerCase() === "minor" ? "success" :
              claimData.damage_severity.toLowerCase() === "moderate" ? "warning" : "error"
            }
          />
        )}
      </div>

      {/* Detailed Risk Score Display */}
      {riskData?.risk_score !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskScoreDisplay score={riskData.risk_score} />
            {riskData.risk_factors && riskData.risk_factors.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-muted-foreground">Risk factors:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {riskData.risk_factors.map((factor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coverage Details */}
      {coverageData && (
        <CoverageStatusDisplay
          hasCoverage={coverageData.coverage_status === "covered"}
          coverageDetails={coverageData.policy_details || coverageData.coverage_explanation}
          exclusions={coverageData.applicable_exclusions}
        />
      )}
    </div>
  )
}

export default WorkflowSummary
