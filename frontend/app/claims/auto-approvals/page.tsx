"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Claim, ClaimsFilter, DashboardMetrics, getClaims, getMetrics } from "@/lib/api/claims"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"
import { OnboardingCue } from "@/components/onboarding/onboarding-cue"

const SYSTEM_HANDLER_ID = "system"
const REFRESH_INTERVAL_MS = 15000

export default function AutoApprovalsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState<Claim[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ClaimsFilter>({})

  const loadClaims = useCallback(async () => {
    try {
      const [claimsData, metricsData] = await Promise.all([
        getClaims({ handler_id: SYSTEM_HANDLER_ID, ...filters, status: "approved" }),
        getMetrics(SYSTEM_HANDLER_ID)
      ])
      setClaims(claimsData)
      setMetrics(metricsData)
    } catch (error) {
      console.error("Failed to load auto-approved claims", error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadClaims()
    const intervalId = setInterval(loadClaims, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [loadClaims])

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-Approved Claims</h1>
          <p className="text-muted-foreground mt-2">
            Low-risk, low-value claims automatically approved by AI.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>Back to Dashboard</Button>
      </div>

      <OnboardingCue stepId="auto" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Auto-Approved Today</div>
          <div className="text-2xl font-bold">{metrics?.auto_approved_today ?? 0}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Auto-Approved Total</div>
          <div className="text-2xl font-bold">{metrics?.auto_approved_total ?? 0}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">System Handler</div>
          <div className="text-sm font-semibold">{SYSTEM_HANDLER_ID}</div>
          <div className="text-xs text-muted-foreground mt-2">Used for audit traceability</div>
        </div>
      </div>

      <ClaimsTable
        claims={claims}
        isLoading={isLoading}
        showAssessmentStatus={true}
        showAiSummary={true}
        showFilters={true}
        hideStatusFilter={true}
        filters={filters}
        onFiltersChange={setFilters}
        emptyMessage="No auto-approved claims yet."
      />
    </div>
  )
}
