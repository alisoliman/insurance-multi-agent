"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, MessageSquare, Globe, Copy, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const communicationFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  claimId: z.string().min(1, "Claim ID is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  communicationType: z.string().min(1, "Communication type is required"),
  preferredLanguage: z.string().min(1, "Language is required"),
  urgencyLevel: z.string().min(1, "Urgency level is required"),
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
  
    error?: string
  }
}

const sampleScenarios = [
  {
    name: "Claim Approval",
    data: {
      customerName: "Sarah Johnson",
      claimId: "CLM-2024-001",
      policyNumber: "HOME-2024-002",
      communicationType: "approval_notification",
      preferredLanguage: "en",
      urgencyLevel: "normal",
      specialInstructions: "Customer prefers email communication and has expressed concern about timeline."
    }
  },
  {
    name: "Claim Rejection",
    data: {
      customerName: "Mike Wilson",
      claimId: "CLM-2024-003",
      policyNumber: "AUTO-2024-003",
      communicationType: "rejection_notification",
      preferredLanguage: "en",
      urgencyLevel: "high",
      specialInstructions: "Sensitive case - customer has been with company for 15 years."
    }
  },
  {
    name: "Spanish Information Request",
    data: {
      customerName: "Carlos Rodriguez",
      claimId: "CLM-2024-004",
      policyNumber: "AUTO-2024-004",
      communicationType: "information_request",
      preferredLanguage: "es",
      urgencyLevel: "normal",
      specialInstructions: "Customer needs additional documentation explained in Spanish."
    }
  },
  {
    name: "Investigation Notice",
    data: {
      customerName: "Jennifer Chen",
      claimId: "CLM-2024-005",
      policyNumber: "HOME-2024-005",
      communicationType: "investigation_update",
      preferredLanguage: "en",
      urgencyLevel: "high",
      specialInstructions: "Requires careful explanation of investigation process to maintain customer relationship."
    }
  }
]

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
]

const communicationTypes = [
  { value: "claim_status_update", label: "Claim Status Update", description: "Provide claim processing update" },
  { value: "approval_notification", label: "Approval Notification", description: "Notify customer of approved claim" },
  { value: "rejection_notification", label: "Rejection Notification", description: "Explain claim denial with reasons" },
  { value: "information_request", label: "Information Request", description: "Request additional documentation" },
  { value: "human_review_notification", label: "Human Review Notification", description: "Escalation to human reviewer" },
  { value: "investigation_update", label: "Investigation Update", description: "Inform about claim investigation" },
  { value: "general_inquiry_response", label: "General Inquiry Response", description: "Response to customer questions" },
]

export default function CommunicationAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [communicationResult, setCommunicationResult] = useState<CommunicationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    form.reset(sampleData)
    setCommunicationResult(null)
    setError(null)
  }

  const onSubmit = async (data: CommunicationFormData) => {
    setIsLoading(true)
    setError(null)
    setCommunicationResult(null)

    try {
      const response = await fetch("http://localhost:8000/api/agents/enhanced-communication/generate", {
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
          </CardTitle>
          <CardDescription>
            Configure communication parameters or use sample scenarios to test the agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Scenarios */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Test with Sample Scenarios:</h4>
            <div className="grid grid-cols-2 gap-2">
              {sampleScenarios.map((sample, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleScenario(sample.data)}
                  className="text-xs justify-start"
                >
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

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
                      <Input placeholder="POL-2024-001" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select communication type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
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
                      <FormLabel className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>Language</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
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
                        placeholder="Any special considerations for this communication..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional context to personalize the communication.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Communication...
                  </>
                ) : (
                  "Generate Communication"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Communication</CardTitle>
          <CardDescription>
            AI-generated, personalized customer communication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating personalized communication...</span>
              </div>
            </div>
          )}

          {communicationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {getLanguageDisplay(form.getValues('preferredLanguage'))}
                  </Badge>
                  <Badge variant="outline">
                    {getCommunicationTypeDisplay(form.getValues('communicationType'))}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${communicationResult.subject}\n\n${communicationResult.content}`)}
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
              </div>

              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Subject Line</h4>
                    <div className="bg-muted p-3 rounded text-sm font-medium">
                      {communicationResult.subject}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Message Content</h4>
                    <div className="bg-muted p-4 rounded text-sm whitespace-pre-wrap">
                      {communicationResult.content}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Tone</h4>
                      <Badge variant="outline">{communicationResult.tone}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Reading Time</h4>
                      <span className="text-sm text-muted-foreground">
                        {communicationResult.estimatedReadingTime}
                      </span>
                    </div>
                  </div>
                  
                  {communicationResult.personalizedElements && communicationResult.personalizedElements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Personalized Elements</h4>
                      <div className="space-y-1">
                        {communicationResult.personalizedElements.map((element, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>{element}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="compliance" className="space-y-4">
                  {communicationResult.complianceNotes && communicationResult.complianceNotes.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Compliance Notes</h4>
                      <div className="space-y-2">
                        {communicationResult.complianceNotes.map((note, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No specific compliance notes for this communication type.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!communicationResult && !isLoading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Configure and generate a communication to see the results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 