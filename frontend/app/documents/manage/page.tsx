'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { FileUpload } from '@/components/ui/file-upload'
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Search,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface DocumentMetadata {
  id: string
  filename: string
  original_filename: string
  category: string
  size: number
  content_type: string
  upload_date: string
  indexed: boolean
  metadata: Record<string, unknown>
}

interface DocumentListResponse {
  documents: DocumentMetadata[]
  total: number
}

interface DocumentUploadResponse {
  success: boolean
  documents: DocumentMetadata[]
  message: string
}

export default function DocumentManagePage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [indexedFilter, setIndexedFilter] = useState<string>('all')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadCategory, setUploadCategory] = useState<string>('policy')

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const apiUrl = await getApiUrl()
      const params = new URLSearchParams()
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      
      if (indexedFilter === 'indexed') {
        params.append('indexed_only', 'true')
      }
      
      const response = await fetch(`${apiUrl}/api/v1/documents?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: DocumentListResponse = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, indexedFilter])

  // Upload documents
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    try {
      const apiUrl = await getApiUrl()
      const formData = new FormData()
      
      uploadFiles.forEach(file => {
        formData.append('files', file)
      })
      
      const response = await fetch(
        `${apiUrl}/api/v1/documents/upload?category=${uploadCategory}&auto_index=true`,
        {
          method: 'POST',
          body: formData,
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: DocumentUploadResponse = await response.json()
      toast.success(data.message)
      setUploadFiles([])
      fetchDocuments() // Refresh the list
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload documents')
    } finally {
      setIsUploading(false)
    }
  }

  // Delete document
  const handleDelete = async (documentId: string, filename: string) => {
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/documents/${documentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      toast.success(`Document ${filename} deleted successfully`)
      fetchDocuments() // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete document')
    }
  }

  // Download document
  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/documents/${documentId}/download`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download document')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    
    const matchesIndexed = indexedFilter === 'all' || 
                          (indexedFilter === 'indexed' && doc.indexed) ||
                          (indexedFilter === 'not-indexed' && !doc.indexed)
    
    return matchesSearch && matchesCategory && matchesIndexed
  })

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

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
              <h1 className="text-3xl font-bold">Document Management</h1>
              <p className="text-muted-foreground">
                Upload, organize, and manage documents for policy search indexing
              </p>
            </div>
            <Button onClick={fetchDocuments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Upload policy documents, regulations, or reference materials to be indexed for search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Document Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy Documents</SelectItem>
                      <SelectItem value="regulation">Regulations</SelectItem>
                      <SelectItem value="reference">Reference Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <FileUpload
                onFilesChange={setUploadFiles}
                value={uploadFiles}
                accept=".md,.txt,.pdf,.doc,.docx"
                maxFiles={10}
                maxSize={50 * 1024 * 1024} // 50MB
              />
              
              {uploadFiles.length > 0 && (
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {uploadFiles.length} Document{uploadFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Library ({filteredDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search documents…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="policy">Policy Documents</SelectItem>
                    <SelectItem value="regulation">Regulations</SelectItem>
                    <SelectItem value="reference">Reference Materials</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={indexedFilter} onValueChange={setIndexedFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="indexed">Indexed Only</SelectItem>
                    <SelectItem value="not-indexed">Not Indexed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document List */}
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading documents…</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground">
                    {documents.length === 0 
                      ? "Upload some documents to get started"
                      : "Try adjusting your search or filters"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{doc.original_filename}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {doc.category}
                            </Badge>
                            {doc.indexed ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Indexed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Not Indexed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(doc.size)}</span>
                            <span>{formatDate(doc.upload_date)}</span>
                            <span className="capitalize">{doc.content_type.split('/')[1]}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                                              Are you sure you want to delete &quot;{doc.original_filename}&quot;? 
                              This action cannot be undone and will remove the document from the search index.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id, doc.original_filename)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 