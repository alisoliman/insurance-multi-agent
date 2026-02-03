"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Claim, getClaims, assignClaim, seedClaims } from "@/lib/api/claims"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Hardcoded for demo - Phase 3/4
const CURRENT_HANDLER_ID = "handler-001"
const POLLING_INTERVAL_MS = 10000 // 10 seconds

export default function IncomingQueuePage() {
  const router = useRouter()
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const loadClaims = async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await getClaims({ status: 'new' })
      setClaims(data)
    } catch (error) {
      console.error("Failed to load queue", error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

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
  }, [])

  const handleAssign = async (claimId: string) => {
    try {
      await assignClaim(claimId, CURRENT_HANDLER_ID)
      toast.success("Claim assigned successfully")
      // Remove from list immediately for better UX
      setClaims(prev => prev.filter(c => c.id !== claimId))
    } catch {
      toast.error("Failed to assign claim. It may have been picked up by someone else.")
      loadClaims(false) // Reload to get fresh state
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

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incoming Claims Queue</h1>
          <p className="text-muted-foreground mt-2">
            Pick up new claims to add to your caseload. List updates automatically.
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
          <Button variant="outline" onClick={() => router.push("/claims")}>
            Back to My Claims
          </Button>
        </div>
      </div>

      {claims.length === 0 && !isLoading ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No claims in the queue. Create sample claims to test the workflow.
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
        />
      )}
    </div>
  )
}
