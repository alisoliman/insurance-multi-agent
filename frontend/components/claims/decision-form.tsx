"use client"

import { useState } from "react"
import { recordDecision } from "@/lib/api/claims"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DecisionFormProps {
  claimId: string
  handlerId: string
  aiAssessmentId?: string
  onDecisionRecorded?: () => void
}

export function DecisionForm({ 
  claimId, 
  handlerId, 
  aiAssessmentId,
  onDecisionRecorded 
}: DecisionFormProps) {
  const [decisionType, setDecisionType] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!decisionType) {
      toast.error("Please select a decision type")
      return
    }

    setIsSubmitting(true)
    try {
      await recordDecision(claimId, {
        handler_id: handlerId,
        decision_type: decisionType as "approved" | "denied" | "request_info",
        notes: notes,
        ai_assessment_id: aiAssessmentId
      })
      
      toast.success("Decision recorded successfully")
      if (onDecisionRecorded) {
        onDecisionRecorded()
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to record decision")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Final Decision</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="decision-type">Decision</Label>
            <Select onValueChange={setDecisionType} value={decisionType}>
              <SelectTrigger id="decision-type">
                <SelectValue placeholder="Select decision..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve Claim</SelectItem>
                <SelectItem value="denied">Deny Claim</SelectItem>
                <SelectItem value="request_info">Request More Information</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Rationale</Label>
            <Textarea 
              id="notes" 
              placeholder="Enter your reasoning here..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Recording..." : "Confirm Decision"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
