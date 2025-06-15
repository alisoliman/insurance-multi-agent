'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Download, 
  Car,
  Shield,
  Truck,
  Bike,
  Search
} from 'lucide-react'

interface PolicyDocument {
  name: string
  filename: string
  description: string
  type: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  size?: string
}

const policyDocuments: PolicyDocument[] = [
  {
    name: "Comprehensive Auto Policy",
    filename: "comprehensive_auto_policy.md",
    description: "Complete coverage for vehicles including collision, comprehensive, and liability protection",
    type: "Auto Insurance",
    icon: Car,
    size: "5.9KB"
  },
  {
    name: "Commercial Auto Policy", 
    filename: "commercial_auto_policy.md",
    description: "Business vehicle insurance covering commercial fleets and operations",
    type: "Commercial",
    icon: Truck,
    size: "8.0KB"
  },
  {
    name: "High Value Vehicle Policy",
    filename: "high_value_vehicle_policy.md", 
    description: "Premium coverage for luxury and high-value vehicles with enhanced benefits",
    type: "Premium Auto",
    icon: Shield,
    size: "9.4KB"
  },
  {
    name: "Liability Only Policy",
    filename: "liability_only_policy.md",
    description: "Basic liability coverage meeting minimum legal requirements",
    type: "Basic Auto",
    icon: Car,
    size: "6.3KB"
  },
  {
    name: "Motorcycle Policy",
    filename: "motorcycle_policy.md",
    description: "Specialized coverage for motorcycles, scooters, and recreational vehicles",
    type: "Motorcycle",
    icon: Bike,
    size: "9.4KB"
  }
]

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<PolicyDocument | null>(null)
  const [documentContent, setDocumentContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadDocument = async (doc: PolicyDocument) => {
    setIsLoading(true)
    setSelectedDocument(doc)
    
    try {
      const response = await fetch(`/policies/${doc.filename}`)
      if (response.ok) {
        const content = await response.text()
        setDocumentContent(content)
      } else {
        setDocumentContent('Error loading document')
      }
    } catch {
      setDocumentContent('Error loading document')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadDocument = (doc: PolicyDocument) => {
    const anchor = window.document.createElement('a')
    anchor.href = `/policies/${doc.filename}`
    anchor.download = doc.filename
    window.document.body.appendChild(anchor)
    anchor.click()
    window.document.body.removeChild(anchor)
  }

  const filteredDocuments = policyDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  )



  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 h-[calc(100vh-var(--header-height))] bg-muted/50">
          {/* Document List Sidebar */}
          <div className="w-1/3 bg-background border-r">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Policy Documents</h1>
          <p className="text-muted-foreground mt-1">Browse and view insurance policy documents</p>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No documents found matching your search</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
              <Card 
                key={doc.filename}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDocument?.filename === doc.filename 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => loadDocument(doc)}
              >
                <CardHeader className="pb-3">
                                      <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <doc.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {doc.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.type}
                          </Badge>
                          {doc.size && (
                            <span className="text-xs text-muted-foreground">{doc.size}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-2">
                    {doc.description}
                  </CardDescription>
                </CardHeader>
              </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            {/* Document Header */}
            <div className="bg-background border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <selectedDocument.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedDocument.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {selectedDocument.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadDocument(selectedDocument)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 bg-background">
              <ScrollArea className="h-full">
                <div className="p-8 max-w-4xl mx-auto">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Separator className="my-6" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                          p: ({children}) => <p className="mb-3">{children}</p>,
                          ul: ({children}) => <ul className="mb-4 space-y-1">{children}</ul>,
                          li: ({children}) => <li className="ml-4">• {children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          table: ({children}) => <table className="w-full border-collapse border mb-4">{children}</table>,
                          th: ({children}) => <th className="border px-4 py-2 bg-muted font-semibold text-left">{children}</th>,
                          td: ({children}) => <td className="border px-4 py-2">{children}</td>,
                        }}
                      >
                        {documentContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Select a Document
              </h3>
              <p className="text-muted-foreground">
                Choose a policy document from the sidebar to view its contents
              </p>
            </div>
          </div>
        )}
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 