"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CustomerCommunication } from "@/types/agent-outputs"
import { Mail, ListChecks } from "lucide-react"

interface CustomerCommunicationCardProps {
  output: CustomerCommunication
  className?: string
}

export const CustomerCommunicationCard = React.memo(function CustomerCommunicationCard({ output, className }: CustomerCommunicationCardProps) {
  const hasRequestedItems = output.requested_items && output.requested_items.length > 0

  return (
    <Card className={cn("border-l-4 border-l-green-500", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-green-500" />
          Customer Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Preview Card */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          {/* Subject Line */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Subject
            </span>
            <p className="text-sm font-semibold mt-0.5">{output.subject}</p>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Email Body */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Message
            </span>
            <div className="mt-1.5 text-sm whitespace-pre-wrap leading-relaxed">
              {output.body}
            </div>
          </div>
        </div>

        {/* Requested Items */}
        {hasRequestedItems && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-green-500" />
              Requested Items
            </h4>
            <ul className="space-y-1.5">
              {output.requested_items.map((item, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="text-green-500 mt-0.5">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default CustomerCommunicationCard
