"use client"

import * as React from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { IconFileText, IconExternalLink } from "@tabler/icons-react"

interface PolicyViewerProps {
  policyName: string
  policyType: string
}

const policyFileMap: Record<string, string> = {
  "Comprehensive Auto Policy": "comprehensive_auto_policy.md",
  "Commercial Auto Policy": "commercial_auto_policy.md", 
  "High Value Vehicle Policy": "high_value_vehicle_policy.md",
  "Liability Only Policy": "liability_only_policy.md",
  "Motorcycle Policy": "motorcycle_policy.md"
}

export function PolicyViewer({ policyName, policyType }: PolicyViewerProps) {
  const [policyContent, setPolicyContent] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const isMobile = useIsMobile()

  const loadPolicyContent = async () => {
    const fileName = policyFileMap[policyName]
    if (!fileName) {
      setError("Policy document not found")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/policies/${fileName}`)
      if (!response.ok) {
        throw new Error("Failed to load policy document")
      }
      const content = await response.text()
      setPolicyContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policy")
    } finally {
      setLoading(false)
    }
  }

  const PolicyContent = () => (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading policy document...</div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}
      
      {policyContent && !loading && !error && (
        <ScrollArea className="h-[60vh] w-full">
          <div className="prose prose-sm max-w-none dark:prose-invert p-4">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-semibold mb-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-medium mb-2">{children}</h3>,
                p: ({children}) => <p className="mb-3 text-sm leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="mb-4 space-y-1 text-sm">{children}</ul>,
                li: ({children}) => <li className="ml-4">• {children}</li>,
                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                table: ({children}) => <table className="w-full border-collapse border mb-4 text-sm">{children}</table>,
                th: ({children}) => <th className="border px-3 py-2 bg-muted font-semibold text-left text-xs">{children}</th>,
                td: ({children}) => <td className="border px-3 py-2 text-xs">{children}</td>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground mb-4">{children}</blockquote>,
                code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                pre: ({children}) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4">{children}</pre>,
              }}
            >
              {policyContent}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button 
            variant="link" 
            className="text-foreground w-fit px-0 text-left h-auto"
            onClick={loadPolicyContent}
          >
            <div className="flex items-center gap-2">
              <IconFileText className="h-4 w-4" />
              {policyName}
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              {policyName}
            </DrawerTitle>
            <DrawerDescription>
              {policyType} • Policy Document
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <PolicyContent />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          className="text-foreground w-fit px-0 text-left h-auto"
          onClick={loadPolicyContent}
        >
          <div className="flex items-center gap-2">
            <IconFileText className="h-4 w-4" />
            {policyName}
            <IconExternalLink className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            {policyName}
          </DialogTitle>
          <DialogDescription>
            {policyType} • Policy Document
          </DialogDescription>
        </DialogHeader>
        <PolicyContent />
      </DialogContent>
    </Dialog>
  )
} 