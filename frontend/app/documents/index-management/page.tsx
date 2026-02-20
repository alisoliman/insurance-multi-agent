'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  Database, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  FileText,
  Upload,
  Settings
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getApiUrl } from '@/lib/config'

interface IndexStatus {
  is_built: boolean
  last_rebuild?: string
  document_count: number
  original_policies_count: number
  uploaded_docs_count: number
  indexed_uploaded_count: number
  index_size_mb?: number
  status: string // building, ready, error, empty
}

interface IndexStatusResponse {
  status: IndexStatus
}

interface IndexRebuildResponse {
  success: boolean
  message: string
  status: IndexStatus
  task_id?: string
}

interface IndexResetResponse {
  success: boolean
  message: string
  status: IndexStatus
}

export default function IndexManagementPage() {
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Fetch index status
  const fetchIndexStatus = async () => {
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/index/status`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: IndexStatusResponse = await response.json()
      setIndexStatus(data.status)
    } catch (error) {
      console.error('Failed to fetch index status:', error)
      toast.error('Failed to load index status')
    } finally {
      setIsLoading(false)
    }
  }

  // Rebuild index
  const handleRebuildIndex = async (includeUploaded: boolean = true, force: boolean = false) => {
    setIsRebuilding(true)
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(
        `${apiUrl}/api/v1/index/rebuild?include_uploaded=${includeUploaded}&force=${force}`,
        {
          method: 'POST',
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: IndexRebuildResponse = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setIndexStatus(data.status)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Rebuild failed:', error)
      toast.error('Failed to rebuild index')
    } finally {
      setIsRebuilding(false)
    }
  }

  // Reset index to original policies
  const handleResetIndex = async () => {
    setIsResetting(true)
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/index/reset`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: IndexResetResponse = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setIndexStatus(data.status)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Reset failed:', error)
      toast.error('Failed to reset index')
    } finally {
      setIsResetting(false)
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case 'building':
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Building
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case 'empty':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Empty
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            Unknown
          </Badge>
        )
    }
  }

  useEffect(() => {
    fetchIndexStatus()
  }, [])

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
        <div className="flex-1 space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Index Management</h1>
              <p className="text-muted-foreground">
                Monitor and control the policy search index
              </p>
            </div>
            <Button onClick={fetchIndexStatus} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading index status…</p>
            </div>
          ) : !indexStatus ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">Failed to Load Status</h3>
              <p className="text-muted-foreground">Unable to retrieve index status</p>
            </div>
          ) : (
            <>
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Index Status
                  </CardTitle>
                  <CardDescription>
                    Current status and statistics of the policy search index
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      {getStatusBadge(indexStatus.status)}
                    </div>

                    {/* Document Count */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Documents</span>
                      </div>
                      <div className="text-2xl font-bold">{indexStatus.document_count}</div>
                      <div className="text-xs text-muted-foreground">
                        {indexStatus.original_policies_count} original + {indexStatus.indexed_uploaded_count} uploaded
                      </div>
                    </div>

                    {/* Index Size */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Index Size</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {indexStatus.index_size_mb ? `${indexStatus.index_size_mb} MB` : 'N/A'}
                      </div>
                    </div>

                    {/* Last Rebuild */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Last Rebuild</span>
                      </div>
                      <div className="text-sm">{formatDate(indexStatus.last_rebuild)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Breakdown</CardTitle>
                  <CardDescription>
                    Overview of documents available for indexing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Original Policies */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Original Policy Documents</div>
                          <div className="text-sm text-muted-foreground">
                            Built-in policy documents included with the system
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {indexStatus.original_policies_count} documents
                      </Badge>
                    </div>

                    {/* Uploaded Documents */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Uploaded Documents</div>
                          <div className="text-sm text-muted-foreground">
                            User-uploaded documents ({indexStatus.indexed_uploaded_count} indexed, {indexStatus.uploaded_docs_count - indexStatus.indexed_uploaded_count} pending)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {indexStatus.indexed_uploaded_count} indexed
                        </Badge>
                        {indexStatus.uploaded_docs_count - indexStatus.indexed_uploaded_count > 0 && (
                          <Badge variant="outline">
                            {indexStatus.uploaded_docs_count - indexStatus.indexed_uploaded_count} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Index Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Index Actions</CardTitle>
                  <CardDescription>
                    Manage the search index with rebuild and reset operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rebuild Index */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Rebuild Index</div>
                        <div className="text-sm text-muted-foreground">
                          Rebuild the search index with all available documents (original + uploaded)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleRebuildIndex(false, true)}
                        disabled={isRebuilding || isResetting}
                        variant="outline"
                        size="sm"
                      >
                        {isRebuilding ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Original Only
                      </Button>
                      <Button
                        onClick={() => handleRebuildIndex(true, true)}
                        disabled={isRebuilding || isResetting}
                        size="sm"
                      >
                        {isRebuilding ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Rebuild All
                      </Button>
                    </div>
                  </div>

                  {/* Reset Index */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">Reset to Original</div>
                        <div className="text-sm text-muted-foreground">
                          Reset the index to contain only original policy documents
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRebuilding || isResetting}
                        >
                          {isResetting ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          Reset Index
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Index to Original</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all uploaded documents from the search index and rebuild 
                            with only the original policy documents. The uploaded documents will remain 
                            stored but won&apos;t be searchable until the index is rebuilt to include them.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleResetIndex}
                            className="bg-orange-500 text-white hover:bg-orange-600"
                          >
                            Reset Index
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Status Messages */}
                  {indexStatus.status === 'error' && (
                    <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Index Error</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        The search index is in an error state. Try rebuilding the index to resolve the issue.
                      </p>
                    </div>
                  )}

                  {indexStatus.status === 'empty' && (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Index Empty</span>
                      </div>
                      <p className="text-sm text-yellow-600 mt-1">
                        The search index is empty or not built. Rebuild the index to enable policy search functionality.
                      </p>
                    </div>
                  )}

                  {indexStatus.uploaded_docs_count > indexStatus.indexed_uploaded_count && (
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium">Pending Documents</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        {indexStatus.uploaded_docs_count - indexStatus.indexed_uploaded_count} uploaded document(s) 
                        are not yet indexed. Rebuild the index to include them in search results.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 