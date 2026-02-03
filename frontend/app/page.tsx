"use client"

import { useEffect, useState } from "react"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { DashboardMetrics, getMetrics } from "@/lib/api/claims"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Claim, getClaims } from "@/lib/api/claims"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const CURRENT_HANDLER_ID = "handler-001"

export default function WorkbenchHome() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    assigned_count: 0,
    queue_depth: 0,
    processed_today: 0
  })
  const [recentClaims, setRecentClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [metricsData, claimsData] = await Promise.all([
          getMetrics(CURRENT_HANDLER_ID),
          getClaims({ handler_id: CURRENT_HANDLER_ID, limit: 5 })
        ])
        setMetrics(metricsData)
        setRecentClaims(claimsData)
      } catch (error) {
        console.error("Failed to load dashboard", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard()
  }, [])

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workbench Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your claims and daily activity.
            </p>
          </div>

          <MetricsCards metrics={metrics} isLoading={isLoading} />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Recent Claims</h2>
              <Button variant="outline" onClick={() => router.push("/claims")}>
                View All
              </Button>
            </div>
            <ClaimsTable claims={recentClaims} isLoading={isLoading} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
