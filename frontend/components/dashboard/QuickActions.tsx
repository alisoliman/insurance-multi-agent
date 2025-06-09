"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconBrain, 
  IconMessageCircle, 
  IconGitBranch, 
  IconExternalLink,
  IconPlayerPlay,
  IconTestPipe
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
    title: "Assessment Agent",
    description: "Test AI-powered claim assessment with real-time analysis and decision-making",
    href: "/agents/assessment",
    icon: <IconBrain className="h-5 w-5" />,
    badge: "AI Analysis",
    badgeVariant: "default"
  },
  {
    title: "Communication Agent", 
    description: "Generate personalized customer communications in multiple languages",
    href: "/agents/communication",
    icon: <IconMessageCircle className="h-5 w-5" />,
    badge: "Multi-language",
    badgeVariant: "secondary"
  },
  {
    title: "Orchestrator Agent",
    description: "Manage complex workflows and coordinate multiple agents",
    href: "/agents/orchestrator", 
    icon: <IconGitBranch className="h-5 w-5" />,
    badge: "Workflow",
    badgeVariant: "outline"
  },
  {
    title: "Explainability Demo",
    description: "Comprehensive AI decision transparency and human oversight interface",
    href: "/agents/explainability",
    icon: <IconBrain className="h-5 w-5" />,
    badge: "Transparency",
    badgeVariant: "secondary"
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconTestPipe className="h-5 w-5" />
          <CardTitle>Agent Testing</CardTitle>
        </div>
        <CardDescription>
          Test individual agents with sample data and real-time processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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