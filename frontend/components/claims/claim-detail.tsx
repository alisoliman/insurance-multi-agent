"use client"

import * as React from "react"
import { format } from "date-fns"
import { Claim } from "@/lib/api/claims"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlayCircle } from "lucide-react"

interface ClaimDetailProps {
  claim: Claim
  onProcessAI?: () => void
  isProcessing?: boolean
}

export function ClaimDetail({ claim, onProcessAI, isProcessing }: ClaimDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Claim #{claim.id.substring(0, 8)}</h2>
          <div className="flex space-x-2">
            <Badge variant="outline">{claim.status.replace('_', ' ')}</Badge>
            <Badge variant={claim.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {claim.priority} priority
            </Badge>
          </div>
        </div>
        {onProcessAI && claim.status !== 'new' && (
          <Button onClick={onProcessAI} disabled={isProcessing}>
            <PlayCircle className="w-4 h-4 mr-2" />
            {isProcessing ? "Processing..." : "Run AI Analysis"}
          </Button>
        )}
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
    </div>
  )
}
