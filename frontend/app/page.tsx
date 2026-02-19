"use client"

import { useEffect, useState, useCallback } from "react"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { Claim, DashboardMetrics, getClaims, getMetrics, getProcessingQueue, getReviewQueue, seedClaims, createClaim } from "@/lib/api/claims"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { QueueInsights } from "@/components/dashboard/queue-insights"
import { OnboardingCue } from "@/components/onboarding/onboarding-cue"
import { CreateClaimForm } from "@/components/claims/create-claim-form"
import { toast } from "sonner"
import { useHandler } from "@/components/handler-context"

const POLLING_INTERVAL_MS = 15000

export default function WorkbenchHome() {
  const router = useRouter()
  const { handler } = useHandler()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    my_caseload: 0,
    queue_depth: 0,
    processing_queue_depth: 0,
    processed_today: 0,
    avg_processing_time_minutes: 0,
    auto_approved_today: 0,
    auto_approved_total: 0,
    status_new: 0,
    status_assigned: 0,
    status_in_progress: 0,
    status_awaiting_info: 0,
    status_approved: 0,
    status_denied: 0
  })
  const [recentClaims, setRecentClaims] = useState<Claim[]>([])
  const [processingQueue, setProcessingQueue] = useState<Claim[]>([])
  const [reviewQueue, setReviewQueue] = useState<Claim[]>([])
  const [autoApprovedClaims, setAutoApprovedClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
        const [metricsData, claimsData, processingData, reviewData, autoApprovedData] = await Promise.all([
          getMetrics(handler.id),
          getClaims({ handler_id: handler.id, limit: 5 }),
          getProcessingQueue({ limit: 5 }),
          getReviewQueue({ limit: 100 }),
          getClaims({ handler_id: "system", status: "approved", limit: 5 })
        ])
      setMetrics(metricsData)
      setRecentClaims(claimsData)
      setProcessingQueue(processingData)
      setReviewQueue(reviewData)
      setAutoApprovedClaims(autoApprovedData)
    } catch (error) {
      console.error("Failed to load dashboard", error)
      if (!showLoading) {
        // Only show toast for background polling errors, not initial load
        toast.error("Failed to refresh dashboard data")
      }
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [handler.id])

  useEffect(() => {
    loadDashboard(true)
    const intervalId = setInterval(() => loadDashboard(false), POLLING_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [loadDashboard])

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const result = await seedClaims(5)
      toast.success(`Created ${result.claims_created} sample claims`)
      loadDashboard(false)
    } catch (error) {
      console.error("Failed to seed claims", error)
      toast.error("Failed to create sample claims")
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCreateClaim = async (payload: Parameters<typeof createClaim>[0]) => {
    try {
      await createClaim(payload)
      toast.success("Claim created and queued for AI processing")
      loadDashboard(false)
    } catch (error) {
      console.error("Failed to create claim", error)
      toast.error("Failed to create claim")
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 58)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-6 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Claims Workbench</h1>
              <p className="text-muted-foreground mt-2">
                Overview of your claims and daily activity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? "Seeding..." : "Seed Sample Claims"}
              </Button>
              <CreateClaimForm onSubmit={handleCreateClaim} />
            </div>
          </div>

          <OnboardingCue stepId="seed" />

          <MetricsCards metrics={metrics} isLoading={isLoading} />

          <QueueInsights metrics={metrics} reviewQueue={reviewQueue} processingQueue={processingQueue} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border p-4">
              <h2 className="text-lg font-semibold mb-2">Workflow Pipeline</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">New</div>
                  <div className="text-xl font-bold">{metrics.status_new ?? 0}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Assigned</div>
                  <div className="text-xl font-bold">{metrics.status_assigned ?? 0}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">In Progress</div>
                  <div className="text-xl font-bold">{metrics.status_in_progress ?? 0}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Awaiting Info</div>
                  <div className="text-xl font-bold">{metrics.status_awaiting_info ?? 0}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Approved</div>
                  <div className="text-xl font-bold">{metrics.status_approved ?? 0}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Denied</div>
                  <div className="text-xl font-bold">{metrics.status_denied ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="rounded-md border p-4">
              <h2 className="text-lg font-semibold mb-2">Auto-Approvals</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-semibold">{metrics.auto_approved_today ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{metrics.auto_approved_total ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Processing Queue</h2>
              <Button variant="outline" onClick={() => router.push("/claims/processing-queue")}>
                View All
              </Button>
            </div>
            <ClaimsTable claims={processingQueue} isLoading={isLoading} showAssessmentStatus={true} showAiSummary={true} fromPage="dashboard" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Auto-Approved (AI)</h2>
              <Button variant="outline" onClick={() => router.push("/claims/auto-approvals")}>
                View All
              </Button>
            </div>
            <ClaimsTable claims={autoApprovedClaims} isLoading={isLoading} showAssessmentStatus={true} showAiSummary={true} fromPage="dashboard" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Recent Claims</h2>
              <Button variant="outline" onClick={() => router.push("/claims")}>
                View All
              </Button>
            </div>
            <ClaimsTable claims={recentClaims} isLoading={isLoading} fromPage="dashboard" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
