"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, XAxis, YAxis } from "recharts"

import { Claim, DashboardMetrics } from "@/lib/api/claims"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"

interface QueueInsightsProps {
  reviewQueue: Claim[]
  processingQueue: Claim[]
  metrics: DashboardMetrics
}

const riskConfig: ChartConfig = {
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
  unknown: { label: "Unknown", color: "#94a3b8" }
}

const typeConfig: ChartConfig = {
  auto: { label: "Auto", color: "#0ea5e9" },
  property: { label: "Property", color: "#6366f1" },
  liability: { label: "Liability", color: "#f97316" },
  health: { label: "Health", color: "#14b8a6" },
  other: { label: "Other", color: "#64748b" }
}

const ageConfig: ChartConfig = {
  "0-1d": { label: "0-1d", color: "#22c55e" },
  "1-3d": { label: "1-3d", color: "#84cc16" },
  "3-7d": { label: "3-7d", color: "#f59e0b" },
  "7d+": { label: "7d+", color: "#ef4444" }
}

export function QueueInsights({ reviewQueue, processingQueue, metrics }: QueueInsightsProps) {
  const riskData = React.useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, unknown: 0 }
    reviewQueue.forEach((claim) => {
      switch (claim.ai_risk_level) {
        case "LOW_RISK":
          counts.low += 1
          break
        case "MEDIUM_RISK":
          counts.medium += 1
          break
        case "HIGH_RISK":
          counts.high += 1
          break
        default:
          counts.unknown += 1
      }
    })

    return Object.entries(counts)
      .map(([key, value]) => ({ key, label: riskConfig[key]?.label || key, value }))
      .filter((item) => item.value > 0)
  }, [reviewQueue])

  const typeData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    reviewQueue.forEach((claim) => {
      counts[claim.claim_type] = (counts[claim.claim_type] || 0) + 1
    })

    return Object.entries(counts)
      .map(([key, value]) => ({ key, label: typeConfig[key]?.label || key, value }))
      .sort((a, b) => b.value - a.value)
  }, [reviewQueue])

  const ageData = React.useMemo(() => {
    const now = Date.now()
    const buckets = {
      "0-1d": 0,
      "1-3d": 0,
      "3-7d": 0,
      "7d+": 0
    }

    reviewQueue.forEach((claim) => {
      const created = new Date(claim.created_at).getTime()
      const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24))
      if (ageDays <= 1) buckets["0-1d"] += 1
      else if (ageDays <= 3) buckets["1-3d"] += 1
      else if (ageDays <= 7) buckets["3-7d"] += 1
      else buckets["7d+"] += 1
    })

    return Object.entries(buckets).map(([key, value]) => ({ key, label: key, value }))
  }, [reviewQueue])

  const processingActive = processingQueue.filter((claim) => claim.latest_assessment_status === "processing").length
  const processingTotal = processingQueue.length
  const processingRate = processingTotal ? Math.round((processingActive / processingTotal) * 100) : 0

  const autoApprovedToday = metrics.auto_approved_today ?? 0
  const totalDecisions = metrics.processed_today + autoApprovedToday
  const autoApprovalRate = totalDecisions ? Math.round((autoApprovedToday / totalDecisions) * 100) : 0

  const oldestDays = reviewQueue.length
    ? Math.max(
        ...reviewQueue.map((claim) => Math.floor((Date.now() - new Date(claim.created_at).getTime()) / (1000 * 60 * 60 * 24)))
      )
    : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Review Queue</div>
                <div className="text-xl font-bold">{metrics.queue_depth}</div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">AI Processing</div>
                <div className="text-xl font-bold">{metrics.processing_queue_depth}</div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Oldest Review</div>
                <div className="text-xl font-bold">{oldestDays}d</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Active</span>
                <span className="font-medium">{processingActive}/{processingTotal}</span>
              </div>
              <Progress value={processingRate} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto-Approval Share</span>
                <span className="font-medium">{autoApprovalRate}%</span>
              </div>
              <Progress value={autoApprovalRate} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Mix (Review Queue)</CardTitle>
          </CardHeader>
          <CardContent>
            {riskData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No AI risk data yet.</div>
            ) : (
              <ChartContainer config={riskConfig} className="h-[220px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={riskData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80}>
                    {riskData.map((entry) => (
                      <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewQueue.length === 0 ? (
              <div className="text-sm text-muted-foreground">No claims in review queue.</div>
            ) : (
              <ChartContainer config={ageConfig} className="h-[220px]">
                <BarChart data={ageData} margin={{ left: 0, right: 0, top: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ageData.map((entry) => (
                      <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Type Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No claims in review queue.</div>
            ) : (
              <ChartContainer config={typeConfig} className="h-[220px]">
                <BarChart data={typeData} margin={{ left: 0, right: 0, top: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {typeData.map((entry) => (
                      <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
