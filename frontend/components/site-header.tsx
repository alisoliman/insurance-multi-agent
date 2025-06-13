"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
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

    const breadcrumbs = [
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
        case 'assessment':
          title = 'Assessment Agent'
          break
        case 'communication':
          title = 'Communication Agent'
          break
        case 'orchestrator':
          title = 'Orchestrator Agent'
          break
        case 'explainability':
          title = 'Explainability Demo'
          break
        case 'tasks':
          title = 'Tasks'
          break
        case 'feedback':
          title = 'Feedback System'
          break
        case 'demo':
          title = 'Workflow Demo'
          break
        default:
          title = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      breadcrumbs.push(
        <BreadcrumbSeparator key={`sep-${index}`} />,
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
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
