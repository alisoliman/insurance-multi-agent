"use client"

import * as React from "react"
import { format } from "date-fns"
import { Claim } from "@/lib/api/claims"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlayCircle } from "lucide-react"

interface ClaimDetailProps {
  claim: Claim
  onProcessAI?: () => void
  isProcessing?: boolean
  aiStatus?: string
}

export function ClaimDetail({ claim, onProcessAI, isProcessing, aiStatus }: ClaimDetailProps) {
  const formatRecommendation = (value?: string | null) => {
    if (!value) return "Pending"
    const cleaned = value.replace("Recommendation.", "").toUpperCase()
    return cleaned
  }

  const formatMoney = (value?: number) => {
    if (value === undefined || value === null) return "N/A"
    return `$${value.toLocaleString()}`
  }

  const riskScore = claim.ai_risk_score ?? null
  const riskProgress = riskScore !== null ? Math.min(Math.max(riskScore, 0), 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Claim #{claim.id.substring(0, 8)}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{claim.status.replace('_', ' ')}</Badge>
            {aiStatus && (
              <Badge variant="outline">AI: {aiStatus}</Badge>
            )}
            {claim.assigned_handler_id && (
              <Badge variant="outline">
                Assigned: {claim.assigned_handler_id === "system" ? "AI Auto-Approved" : claim.assigned_handler_id}
              </Badge>
            )}
            <Badge variant={claim.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {claim.priority} priority
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-md border px-4 py-2">
            <div className="text-xs text-muted-foreground">Est. Damage</div>
            <div className="text-2xl font-semibold">{formatMoney(claim.estimated_damage)}</div>
          </div>
          {onProcessAI && (
            <Button onClick={onProcessAI} disabled={isProcessing}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing..." : "Re-run AI Analysis"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Claim Type</div>
          <div className="text-lg font-semibold capitalize">{claim.claim_type}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Incident Date</div>
          <div className="text-lg font-semibold">{format(new Date(claim.incident_date), 'PPP')}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Submitted</div>
          <div className="text-lg font-semibold">{format(new Date(claim.created_at), 'PPP p')}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Location</div>
          <div className="text-lg font-semibold">{claim.location || "N/A"}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Claimant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold">Name</div>
              <div className="col-span-2">{claim.claimant_name}</div>
              
              <div className="font-semibold">Policy #</div>
              <div className="col-span-2">{claim.policy_number}</div>
              
              <div className="font-semibold">Submitted</div>
              <div className="col-span-2">{format(new Date(claim.created_at), 'PPP p')}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold">Type</div>
              <div className="col-span-2 capitalize">{claim.claim_type}</div>
              
              <div className="font-semibold">Date</div>
              <div className="col-span-2">{format(new Date(claim.incident_date), 'PPP')}</div>
              
              <div className="font-semibold">Location</div>
              <div className="col-span-2">{claim.location || "N/A"}</div>
              
              <div className="font-semibold">Est. Damage</div>
              <div className="col-span-2">
                {claim.estimated_damage ? `$${claim.estimated_damage.toLocaleString()}` : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{claim.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Recommendation</div>
            <div className="mt-2">
              <Badge variant="outline">{formatRecommendation(claim.ai_recommendation)}</Badge>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Risk Level</div>
            <div className="mt-2 font-semibold">{claim.ai_risk_level || "Unknown"}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Risk Score</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold">{riskScore !== null ? riskScore : "N/A"}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2">
              <Progress value={riskProgress} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
