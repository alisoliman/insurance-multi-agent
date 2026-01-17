"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ToolCall } from "@/types/agent-outputs"
import { Wrench, ChevronDown, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

interface ToolCallCardProps {
  toolCall: ToolCall
  defaultExpanded?: boolean
  className?: string
}

// Format JSON for display
function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// Truncate long strings
function truncateResult(result: unknown, maxLength = 500): string {
  const str = formatJson(result)
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "\n... [truncated]"
  }
  return str
}

export function ToolCallCard({ toolCall, defaultExpanded = true, className }: ToolCallCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded)
  const hasError = !!toolCall.error
  const hasResult = toolCall.result !== undefined && toolCall.result !== null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-lg border bg-muted/30 overflow-hidden",
          hasError && "border-red-500/30",
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
              hasError && "bg-red-500/5"
            )}
          >
            <Wrench className={cn(
              "h-4 w-4 flex-shrink-0",
              hasError ? "text-red-500" : "text-blue-500"
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">
                  {toolCall.name}
                </span>
                {hasError ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                ) : hasResult ? (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : null}
              </div>
            </div>

            {toolCall.duration_ms && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {toolCall.duration_ms}ms
              </div>
            )}

            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            {/* Arguments */}
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Arguments
              </h5>
              <pre className="text-xs bg-background/60 rounded p-2 overflow-x-auto font-mono">
                {formatJson(toolCall.arguments)}
              </pre>
            </div>

            {/* Result or Error */}
            {hasError ? (
              <div>
                <h5 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5 uppercase tracking-wide">
                  Error
                </h5>
                <pre className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 rounded p-2 overflow-x-auto font-mono">
                  {toolCall.error}
                </pre>
              </div>
            ) : hasResult ? (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Result
                </h5>
                <pre className="text-xs bg-background/60 rounded p-2 overflow-x-auto font-mono max-h-48 overflow-y-auto">
                  {truncateResult(toolCall.result)}
                </pre>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default ToolCallCard
