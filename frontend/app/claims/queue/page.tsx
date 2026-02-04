"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Claim, getReviewQueue, assignClaim, seedClaims, createClaim, ClaimsFilter } from "@/lib/api/claims"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CreateClaimForm } from "@/components/claims/create-claim-form"
import { OnboardingCue } from "@/components/onboarding/onboarding-cue"

// Hardcoded for demo - Phase 3/4
const CURRENT_HANDLER_ID = "handler-001"
const POLLING_INTERVAL_MS = 15000 // 15 seconds

export default function ReviewQueuePage() {
  const router = useRouter()
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [filters, setFilters] = useState<ClaimsFilter>({})
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const loadClaims = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await getReviewQueue(filters)
      setClaims(data)
    } catch (error) {
      console.error("Failed to load review queue", error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    // Initial load
    loadClaims(true)

    // Setup polling
    pollingRef.current = setInterval(() => {
      loadClaims(false)
    }, POLLING_INTERVAL_MS)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadClaims])

  const handleAssign = async (claimId: string) => {
    try {
      const assigned = await assignClaim(claimId, CURRENT_HANDLER_ID)
      toast.success("Claim assigned successfully")
      // Remove from list immediately for better UX
      setClaims(prev => prev.filter(c => c.id !== claimId))
      router.push(`/claims/${assigned.id}`)
    } catch {
      toast.error("Failed to assign claim. It may have been picked up by someone else.")
      loadClaims(false) // Reload to get fresh state
    }
  }

  const handleCreateClaim = async (payload: Parameters<typeof createClaim>[0]) => {
    try {
      await createClaim(payload)
      toast.success("Claim created and queued for AI processing")
      loadClaims(false)
    } catch (error) {
      console.error("Failed to create claim", error)
      toast.error("Failed to create claim")
    }
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const result = await seedClaims(5)
      toast.success(`Created ${result.claims_created} sample claims`)
      loadClaims(false)
    } catch (error) {
      console.error("Failed to seed claims", error)
      toast.error("Failed to create sample claims")
    } finally {
      setIsSeeding(false)
    }
  }

  const totalClaims = claims.length
  const highRisk = claims.filter(c => c.ai_risk_level === "HIGH_RISK").length
  const lowRisk = claims.filter(c => c.ai_risk_level === "LOW_RISK").length
  const oldestDays = totalClaims
    ? Math.max(
        ...claims.map(c => Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)))
      )
    : 0

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground mt-2">
            Claims with completed AI analysis, ready for human review.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleSeed}
            disabled={isSeeding}
          >
            {isSeeding ? "Creating..." : "Seed Sample Claims"}
          </Button>
          <CreateClaimForm onSubmit={handleCreateClaim} />
          <Button variant="outline" onClick={() => router.push("/claims")}>
            Back to My Claims
          </Button>
        </div>
      </div>

      <OnboardingCue stepId="review" />

      {claims.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Total in Review</div>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">High Risk</div>
            <div className="text-2xl font-bold">{highRisk}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Low Risk</div>
            <div className="text-2xl font-bold">{lowRisk}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Oldest (days)</div>
            <div className="text-2xl font-bold">{oldestDays}</div>
          </div>
        </div>
      )}

      {claims.length === 0 && !isLoading ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No claims ready for review. Seed or create a claim to start AI processing.
          </p>
          <Button onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? "Creating..." : "Create Sample Claims"}
          </Button>
        </div>
      ) : (
        <ClaimsTable 
          claims={claims} 
          isLoading={isLoading} 
          showAssignAction={true}
          onAssign={handleAssign}
          showAssessmentStatus={true}
          showAiSummary={true}
          showFilters={true}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
    </div>
  )
}
