import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { RealtimeActivityFeed } from "@/components/realtime-activity-feed"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"

export default function Home() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6">
                <div className="lg:col-span-2">
                  <ChartAreaInteractive />
                </div>
                <div className="lg:col-span-1">
                  <RealtimeActivityFeed />
                </div>
              </div>
              <DataTable data={data} />
                              <div className="px-4 lg:px-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                      <div className="rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
                        <h3 className="text-lg font-semibold mb-2">Multi-Agent Workflow Demo</h3>
                        <p className="text-muted-foreground mb-4">
                          Experience how our AI agents collaborate to process insurance claims in real-time.
                          Select a sample claim and watch the agents work together to analyze, assess, and make decisions.
                        </p>
                        <a 
                          href="/demo" 
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                          Try Demo →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
