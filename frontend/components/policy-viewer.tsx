"use client"

import * as React from "react"
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
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {policyContent}
            </pre>
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