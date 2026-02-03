"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CreateClaimPayload = {
  claimant_name: string
  policy_number: string
  claim_type: string
  description: string
  incident_date: string
  estimated_damage?: number
  location?: string
  priority?: "low" | "medium" | "high" | "urgent"
}

interface CreateClaimFormProps {
  onSubmit: (payload: CreateClaimPayload) => Promise<void> | void
}

export function CreateClaimForm({ onSubmit }: CreateClaimFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    claimant_name: "",
    policy_number: "",
    claim_type: "auto",
    description: "",
    incident_date: "",
    estimated_damage: "",
    location: "",
    priority: "medium",
  })

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const incidentDate = form.incident_date
        ? new Date(`${form.incident_date}T00:00:00`).toISOString()
        : new Date().toISOString()

      const payload: CreateClaimPayload = {
        claimant_name: form.claimant_name.trim(),
        policy_number: form.policy_number.trim(),
        claim_type: form.claim_type,
        description: form.description.trim(),
        incident_date: incidentDate,
        location: form.location.trim() || undefined,
        priority: form.priority as "low" | "medium" | "high" | "urgent",
      }

      if (form.estimated_damage) {
        payload.estimated_damage = Number(form.estimated_damage)
      }

      await onSubmit(payload)
      setForm({
        claimant_name: "",
        policy_number: "",
        claim_type: "auto",
        description: "",
        incident_date: "",
        estimated_damage: "",
        location: "",
        priority: "medium",
      })
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Claim</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Claim</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claimant_name">Claimant Name</Label>
            <Input
              id="claimant_name"
              value={form.claimant_name}
              onChange={(e) => updateField("claimant_name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy_number">Policy Number</Label>
            <Input
              id="policy_number"
              value={form.policy_number}
              onChange={(e) => updateField("policy_number", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Claim Type</Label>
              <Select value={form.claim_type} onValueChange={(v) => updateField("claim_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => updateField("priority", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incident_date">Incident Date</Label>
              <Input
                id="incident_date"
                type="date"
                value={form.incident_date}
                onChange={(e) => updateField("incident_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_damage">Estimated Damage</Label>
              <Input
                id="estimated_damage"
                type="number"
                min="0"
                step="0.01"
                value={form.estimated_damage}
                onChange={(e) => updateField("estimated_damage", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Claim"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
