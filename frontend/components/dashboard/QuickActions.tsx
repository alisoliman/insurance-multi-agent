"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconBrain,
  IconExternalLink,
  IconPlayerPlay,
  IconTestPipe,
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage
} from "@tabler/icons-react"

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

const quickActions: QuickAction[] = [
  {
    title: "Multi-Agent Workflow",
    description:
      "Experience how AI agents collaborate to process insurance claims in real-time",
    href: "/demo",
    icon: <IconTestPipe className="h-5 w-5" />,
    badge: "Full Demo",
    badgeVariant: "default",
  },
  {
    title: "Claim Assessor",
    description:
      "Analyzes claim details and determines initial assessment with risk scoring",
    href: "/agents/claim-assessor",
    icon: <IconFileText className="h-5 w-5" />,
    badge: "Assessment",
    badgeVariant: "secondary",
  },
  {
    title: "Policy Checker",
    description:
      "Validates policy coverage and verifies terms for claim eligibility",
    href: "/agents/policy-checker",
    icon: <IconShield className="h-5 w-5" />,
    badge: "Validation",
    badgeVariant: "secondary",
  },
  {
    title: "Risk Analyst",
    description:
      "Evaluates fraud indicators and calculates comprehensive risk factors",
    href: "/agents/risk-analyst",
    icon: <IconTrendingUp className="h-5 w-5" />,
    badge: "Risk Analysis",
    badgeVariant: "secondary",
  },
  {
    title: "Communication Agent",
    description:
      "Generates personalized customer communications and notifications",
    href: "/agents/communication-agent",
    icon: <IconMessage className="h-5 w-5" />,
    badge: "Communication",
    badgeVariant: "secondary",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconTestPipe className="h-5 w-5" />
          <CardTitle>AI Agent Demos</CardTitle>
        </div>
        <CardDescription>
          Experience our multi-agent insurance claim processing system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <div key={action.href} className="group relative">
              <Link href={action.href}>
                <div className="flex flex-col p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                    </div>
                    <IconExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 flex-1">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {action.badge && (
                      <Badge variant={action.badgeVariant} className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-auto h-7 px-2 text-xs"
                      asChild
                    >
                      <span className="flex items-center gap-1">
                        <IconPlayerPlay className="h-3 w-3" />
                        Test
                      </span>
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Each agent demo includes sample data and connects to the live backend API
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 