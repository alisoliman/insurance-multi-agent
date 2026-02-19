"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sparkles, RotateCcw } from "lucide-react"
import { useOnboarding } from "@/components/onboarding/onboarding-provider"
import { useHandler } from "@/components/handler-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export function SiteHeader() {
  const pathname = usePathname()
  const { open, reset } = useOnboarding()
  const { handler, handlers, setHandlerId } = useHandler()

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (pathname === '/') {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )
    }

    // Skip Dashboard breadcrumb for Agent Demos pages
    const breadcrumbs = pathname.startsWith('/agents') ? [] : [
      <BreadcrumbItem key="home">
        <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
      </BreadcrumbItem>
    ]

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const isLast = index === segments.length - 1
      
      let title = segment
      
      // Convert segment to readable title
      switch (segment) {
        case 'agents':
          title = 'Agent Demos'
          break
        case 'claim-assessor':
          title = 'Claim Assessor'
          break
        case 'policy-checker':
          title = 'Policy Checker'
          break
        case 'risk-analyst':
          title = 'Risk Analyst'
          break
        case 'communication-agent':
          title = 'Communication Agent'
          break
        case 'demo':
          title = 'Workflow Demo'
          break
        case 'claims':
          title = 'Claims'
          break
        case 'queue':
          title = 'Review Queue'
          break
        case 'processing-queue':
          title = 'Processing Queue'
          break
        case 'auto-approvals':
          title = 'Auto-Approvals'
          break
        case 'documents':
          title = 'Documents'
          break
        case 'manage':
          title = 'Manage'
          break
        case 'index-management':
          title = 'Index Management'
          break
        default:
          // For UUID-like segments (claim IDs), show truncated version
          if (segment.length > 12 && segment.includes('-')) {
            title = `Claim ${segment.substring(0, 8)}…`
          } else {
            title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
          }
      }

      // Only add separator if there are already items in breadcrumbs
      if (breadcrumbs.length > 0) {
        breadcrumbs.push(<BreadcrumbSeparator key={`sep-${index}`} />)
      }
      
      breadcrumbs.push(
        <BreadcrumbItem key={segment}>
          {isLast ? (
            <BreadcrumbPage>{title}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
      )
    })

    return <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          {getBreadcrumbs()}
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Select value={handler.id} onValueChange={setHandlerId}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {handlers.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-[10px] font-semibold">{h.avatar}</span>
                    <span>{h.name}</span>
                    <span className="text-muted-foreground">· {h.role}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => open()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Demo Guide
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart Tour
          </Button>
        </div>
      </div>
    </header>
  )
}
