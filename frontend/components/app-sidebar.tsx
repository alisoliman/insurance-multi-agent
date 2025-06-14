"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconInnerShadowTop,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Live Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Agent Demos",
      url: "#",
      icon: IconUsers,
      items: [
        {
          title: "Claim Assessor",
          url: "/agents/claim-assessor",
        },
        {
          title: "Policy Checker",
          url: "/agents/policy-checker",
        },
        {
          title: "Risk Analyst",
          url: "/agents/risk-analyst",
        },
        {
          title: "Communication Agent",
          url: "/agents/communication-agent",
        },
        {
          title: "Explainability Demo",
          url: "/agents/explainability",
        },
      ],
    },
    {
      title: "Workflow Demo",
      url: "/demo",
      icon: IconFileAi,
    },
  ],
  navSecondary: [],
  documents: [
    {
      name: "Policy Documents",
      url: "/documents",
      icon: IconFileDescription,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Insurance AI Demo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
