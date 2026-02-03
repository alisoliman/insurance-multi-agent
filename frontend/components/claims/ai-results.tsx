"use client"

import * as React from "react"
import { AIAssessment } from "@/lib/api/claims"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface AIResultsProps {
  assessment: AIAssessment | null
  isLoading?: boolean
}

export function AIResults({ assessment, isLoading }: AIResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Processing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Agents are analyzing the claim...</p>
        </CardContent>
      </Card>
    )
  }

  if (!assessment) {
    return null
  }

  if (assessment.status === 'pending' || assessment.status === 'processing') {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>AI Processing</CardTitle>
            <Badge variant="outline">{assessment.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Agents are analyzing the claim...</p>
        </CardContent>
      </Card>
    )
  }

  if (assessment.status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Processing Failed</AlertTitle>
        <AlertDescription>
          {assessment.error_message || "An unknown error occurred during AI processing."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Supervisor Recommendation</CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            {assessment.final_recommendation ? (
              <div className="whitespace-pre-wrap">{assessment.final_recommendation}</div>
            ) : (
              <p className="text-muted-foreground italic">No final recommendation available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agent Details</h3>
        <Accordion type="single" collapsible className="w-full">
          {assessment.agent_outputs && Object.entries(assessment.agent_outputs).map(([agentName, output]) => (
            <AccordionItem value={agentName} key={agentName}>
              <AccordionTrigger className="capitalize">
                {agentName.replace('_', ' ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
