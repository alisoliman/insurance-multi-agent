"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { MessageSquare, Copy, Download } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const communicationFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  claimId: z.string().min(1, "Claim ID is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  communicationType: z.string().min(1, "Communication type is required"),
  preferredLanguage: z.string().default("en").optional(),
  urgencyLevel: z.string().default("normal").optional(),
  specialInstructions: z.string().optional(),
})

type CommunicationFormData = z.infer<typeof communicationFormSchema>

interface CommunicationResult {
  communication_id: string
  communication_type: string
  subject: string
  content: string
  language: string
  tone: string
  personalization_score: number
  compliance_verified: boolean
  generated_at: string
  processing_time_seconds: number
  metadata?: {
    generation_method?: string
    error?: string
  }
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
]

const communicationTypes = [
  { value: "claim_status_update", label: "Claim Status Update" },
  { value: "approval_notification", label: "Approval Notification" },
  { value: "rejection_notification", label: "Rejection Notification" },
  { value: "information_request", label: "Information Request" },
  { value: "human_review_notification", label: "Human Review Notification" },
  { value: "investigation_update", label: "Investigation Update" },
  { value: "general_inquiry_response", label: "General Inquiry Response" },
]

const urgencyLevels = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const sampleScenarios = [
  {
    name: "Claim Approval",
    data: {
      customerName: "John Doe",
      claimId: "CLM-2024-001",
      policyNumber: "POL-123456",
      communicationType: "approval_notification",
      preferredLanguage: "en",
      urgencyLevel: "normal",
      specialInstructions: "Customer has been waiting for 2 weeks",
    }
  },
  {
    name: "Information Request",
    data: {
      customerName: "Jane Smith",
      claimId: "CLM-2024-002",
      policyNumber: "POL-789012",
      communicationType: "information_request",
      preferredLanguage: "en",
      urgencyLevel: "high",
      specialInstructions: "Need medical records and police report",
    }
  },
  {
    name: "Claim Rejection",
    data: {
      customerName: "Carlos Rodriguez",
      claimId: "CLM-2024-003",
      policyNumber: "POL-345678",
      communicationType: "rejection_notification",
      preferredLanguage: "es",
      urgencyLevel: "normal",
      specialInstructions: "Policy exclusion applies",
    }
  },
]

export default function CommunicationAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [communicationResult, setCommunicationResult] = useState<CommunicationResult | null>(null)

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      customerName: "",
      claimId: "",
      policyNumber: "",
      communicationType: "",
      preferredLanguage: "en",
      urgencyLevel: "normal",
      specialInstructions: "",
    },
  })

  const loadSampleScenario = (sampleData: CommunicationFormData) => {
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof CommunicationFormData, value)
    })
    toast.success("Sample scenario loaded!")
  }

  const handleGeneration = async (data: CommunicationFormData) => {
    const endpoint = "http://localhost:8000/api/agents/enhanced-communication/generate"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: data.customerName,
          claim_id: data.claimId,
          policy_number: data.policyNumber,
          communication_type: data.communicationType,
          preferred_language: data.preferredLanguage,
          urgency_level: data.urgencyLevel,
          special_instructions: data.specialInstructions,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.communication_result) {
        setCommunicationResult(result.communication_result)
        toast.success("Communication generated successfully!")
      } else {
        throw new Error(result.error || "Communication generation failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast.error("Communication generation failed: " + errorMessage)
    }
  }

  const onSubmit = async (data: CommunicationFormData) => {
    setIsLoading(true)
    setError(null)
    setCommunicationResult(null)

    try {
      await handleGeneration(data)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const downloadCommunication = () => {
    if (!communicationResult) return
    
    const content = `Subject: ${communicationResult.subject}\n\n${communicationResult.content}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `communication-${form.getValues('claimId')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Communication downloaded!")
  }

  const getLanguageDisplay = (code: string) => {
    const lang = languages.find(l => l.code === code)
    return lang ? `${lang.flag} ${lang.name}` : code
  }

  const getCommunicationTypeDisplay = (value: string) => {
    const type = communicationTypes.find(t => t.value === value)
    return type ? type.label : value
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Communication Generator</span>
            <Badge variant="secondary" className="ml-2">AutoGen</Badge>
          </CardTitle>
          <CardDescription>
            Generate personalized insurance communications using AutoGen framework with Azure OpenAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Scenarios */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Start Scenarios</Label>
            <div className="grid grid-cols-1 gap-2">
              {sampleScenarios.map((scenario) => (
                <Button
                  key={scenario.name}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleScenario(scenario.data)}
                  className="justify-start"
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="claimId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim ID</FormLabel>
                      <FormControl>
                        <Input placeholder="CLM-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="POL-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select communication type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {urgencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special instructions or context..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional instructions to customize the communication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Generating..." : "Generate Communication"}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Communication</span>
            {communicationResult && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(communicationResult.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCommunication}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            AI-generated communication using AutoGen framework with structured output
          </CardDescription>
        </CardHeader>
        <CardContent>
          {communicationResult ? (
            <div className="space-y-4">
              {/* Communication Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                  <div className="text-sm">{getCommunicationTypeDisplay(communicationResult.communication_type)}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Language</Label>
                  <div className="text-sm">{getLanguageDisplay(communicationResult.language)}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Tone</Label>
                  <div className="text-sm capitalize">{communicationResult.tone}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Processing Time</Label>
                  <div className="text-sm">{communicationResult.processing_time_seconds.toFixed(2)}s</div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Badge variant={communicationResult.personalization_score > 0.7 ? "default" : "secondary"}>
                    Personalization: {(communicationResult.personalization_score * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={communicationResult.compliance_verified ? "default" : "destructive"}>
                    {communicationResult.compliance_verified ? "✅ Compliant" : "❌ Non-compliant"}
                  </Badge>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">{communicationResult.subject}</div>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div className="mt-1 p-4 bg-muted rounded-md prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {communicationResult.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Communication ID */}
              <div className="text-xs text-muted-foreground">
                Communication ID: {communicationResult.communication_id}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No communication generated yet</p>
              <p className="text-sm">Fill out the form and click &quot;Generate Communication&quot; to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 