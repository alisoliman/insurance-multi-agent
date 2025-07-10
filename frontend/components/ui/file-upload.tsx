"use client"

import * as React from "react"
import Image from "next/image"
import { Upload, X, AlertCircle, CheckCircle, FileText, File, Eye, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  accept?: string
  maxFiles?: number
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
  value?: File[]
}

interface FileWithPreview extends File {
  preview?: string
}

export function FileUpload({
  onFilesChange,
  accept = "image/*",
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
  value = []
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>(value)
  const [dragActive, setDragActive] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [selectedImage, setSelectedImage] = React.useState<{ src: string; name: string } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Update files when value prop changes
  React.useEffect(() => {
    setFiles(value)
  }, [value])

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`
    }

    // Check file type - handle both MIME types and file extensions
    if (accept) {
      const mimeType = file.type.toLowerCase()
      
      // If accept contains file extensions (starts with .)
      if (accept.includes('.')) {
        const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
        const hasValidExtension = allowedExtensions.some(ext => {
          if (ext.startsWith('.')) {
            return file.name.toLowerCase().endsWith(ext)
          }
          return false
        })
        
        if (!hasValidExtension) {
          return `File "${file.name}" has an unsupported format. Supported formats: ${allowedExtensions.join(', ')}`
        }
      }
      // If accept contains MIME types
      else if (!mimeType.match(accept.replace(/\*/g, ".*"))) {
        return `File "${file.name}" has an unsupported format.`
      }
    }

    return null
  }

  const processFiles = (fileList: FileList | File[]) => {
    const newErrors: string[] = []
    const validFiles: FileWithPreview[] = []

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else if (files.length + validFiles.length < maxFiles) {
        const fileWithPreview = file as FileWithPreview
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file)
        }
        
        validFiles.push(fileWithPreview)
      } else {
        newErrors.push(`Maximum ${maxFiles} files allowed.`)
      }
    })

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    }

    setErrors(newErrors)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    
    // Revoke object URL to prevent memory leaks
    if (files[index].preview) {
      URL.revokeObjectURL(files[index].preview!)
    }
    
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files)
    }
  }

  const onButtonClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
          files.length > 0 ? "border-muted-foreground/25" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload files"
          title="Upload files"
        />

        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className={cn(
            "h-8 w-8",
            dragActive ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {dragActive ? "Drop files here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.includes('image') ? 'Images only' : 
               accept.includes('.pdf') ? 'PDF, Markdown, Text, and Word documents' : 'Files'} up to {Math.round(maxSize / (1024 * 1024))}MB each (max {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <div 
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage({ src: file.preview!, name: file.name })
                      }}
                    >
                      <Image
                        src={file.preview}
                        alt={file.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover rounded transition-transform hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 w-20 flex items-center justify-center">
                      {file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="h-12 w-12 text-red-500" />
                      ) : file.type.startsWith('text/') || file.name.toLowerCase().match(/\.(md|txt)$/) ? (
                        <FileText className="h-12 w-12 text-blue-500" />
                      ) : file.type.includes('word') || file.name.toLowerCase().match(/\.(doc|docx)$/) ? (
                        <FileText className="h-12 w-12 text-blue-600" />
                      ) : (
                        <File className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'PDF' :
                       file.name.toLowerCase().endsWith('.md') ? 'MARKDOWN' :
                       file.name.toLowerCase().endsWith('.txt') ? 'TEXT' :
                       file.name.toLowerCase().match(/\.(doc|docx)$/) ? 'WORD' :
                       file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedImage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedImage && (
              <div className="relative w-full h-[70vh] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 