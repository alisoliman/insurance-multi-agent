"use client"

import { useState, useRef } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle, FileQuestion } from "lucide-react"

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const getDecisionLabel = (type: string) => {
    switch (type) {
      case "approved": return "Approve"
      case "denied": return "Deny"
      case "request_info": return "Request More Information"
      default: return type
    }
  }

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case "approved": return <CheckCircle className="w-5 h-5 text-green-600" />
      case "denied": return <XCircle className="w-5 h-5 text-red-600" />
      case "request_info": return <FileQuestion className="w-5 h-5 text-amber-600" />
      default: return null
    }
  }

  const getDecisionColor = (type: string) => {
    switch (type) {
      case "approved": return "text-green-600"
      case "denied": return "text-red-600"
      case "request_info": return "text-amber-600"
      default: return ""
    }
  }

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!decisionType) {
      toast.error("Please select a decision type")
      return
    }

    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Please provide notes with at least 10 characters for the audit trail")
      notesRef.current?.focus()
      return
    }

    // Show confirmation dialog for approve/deny actions
    if (decisionType === "approved" || decisionType === "denied") {
      setShowConfirmDialog(true)
    } else {
      confirmSubmit()
    }
  }

  const confirmSubmit = async () => {
    setShowConfirmDialog(false)
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
      // Focus back on notes for correction
      notesRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Record Your Decision</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitClick} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="decision-type">Your Decision</Label>
            <Select onValueChange={setDecisionType} value={decisionType}>
              <SelectTrigger id="decision-type" aria-label="Select your decision">
                <SelectValue placeholder="Select your decision..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Approve Claim
                  </span>
                </SelectItem>
                <SelectItem value="denied">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Deny Claim
                  </span>
                </SelectItem>
                <SelectItem value="request_info">
                  <span className="flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-amber-600" />
                    Request More Information
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Rationale (Required for audit trail)</Label>
            <Textarea 
              ref={notesRef}
              id="notes" 
              placeholder="Explain your reasoning for this decision..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              aria-describedby="notes-help"
            />
            <p id="notes-help" className="text-xs text-muted-foreground flex justify-between">
              <span>Your notes will be attached to the claim record for compliance purposes.</span>
              <span className={notes.trim().length < 10 ? "text-amber-600" : "text-muted-foreground"}>
                {notes.trim().length}/10 min
              </span>
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !decisionType || !notes.trim() || notes.trim().length < 10} 
            className="w-full"
            variant={decisionType === "denied" ? "destructive" : "default"}
          >
            {isSubmitting ? "Recording..." : "Confirm Decision"}
          </Button>
        </form>
      </CardContent>
    </Card>

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getDecisionIcon(decisionType)}
            <span>Confirm {getDecisionLabel(decisionType)} Decision</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to <span className={`font-semibold ${getDecisionColor(decisionType)}`}>{getDecisionLabel(decisionType).toLowerCase()}</span> this claim. 
                This action will be recorded and cannot be easily undone.
              </p>
              {notes && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">Your notes:</p>
                  <p className="text-muted-foreground">{notes}</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmSubmit}
            className={decisionType === "denied" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            Yes, {getDecisionLabel(decisionType)} Claim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
