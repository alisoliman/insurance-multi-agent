import { AppSidebar } from "@/components/app-sidebar"

import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"

import { QuickActions } from "@/components/dashboard/QuickActions"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import policyData from "./policy-data.json"

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

              <DataTable data={policyData} />
              <div className="px-4 lg:px-6">
                <QuickActions />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
