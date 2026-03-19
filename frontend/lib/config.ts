// Configuration that can be read at runtime
let cachedApiUrl: string | null = null

const normalizeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim()
  if (!trimmed) return trimmed

  // If missing scheme, assume https in production contexts.
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }

  // If page is https, never return http to avoid mixed content.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://')
  }

  return trimmed
}

export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) {
    // Ensure we never return http on an https page.
    if (typeof window !== 'undefined') {
      cachedApiUrl = normalizeUrl(cachedApiUrl)
    }
    return cachedApiUrl
  }

  // Try to determine the backend URL based on the current frontend URL
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname
    
    // If we're running on Azure Container Apps, construct the backend URL
    if (currentHost.includes('azurecontainerapps.io')) {
      // Replace 'frontend-' with 'backend-' in the hostname
      const backendHost = currentHost.replace(/^frontend-/, 'backend-')
      cachedApiUrl = `https://${backendHost}`
      return cachedApiUrl
    }

    // Custom domain (not localhost, not azurecontainerapps.io) — ask the server for the backend URL
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const { apiUrl } = await res.json()
          if (apiUrl) {
            cachedApiUrl = normalizeUrl(apiUrl)
            return cachedApiUrl
          }
        }
      } catch {
        // fall through to other detection methods
      }
    }
  }

  // Server-side: prefer the runtime API_URL env var set by Bicep deployment
  const apiUrlEnv = process.env.API_URL
  if (apiUrlEnv) {
    cachedApiUrl = normalizeUrl(apiUrlEnv)
    return cachedApiUrl
  }

  // Attempt to build backend URL from server-side env (Azure Container Apps passes WEBSITE_HOSTNAME)
  const siteHost = process.env.WEBSITE_HOSTNAME || process.env.NEXT_PUBLIC_SITE_HOST
  if (siteHost && siteHost.includes('azurecontainerapps.io') && siteHost.startsWith('frontend-')) {
    const backendHost = siteHost.replace(/^frontend-/, 'backend-')
    cachedApiUrl = `https://${backendHost}`
    return cachedApiUrl
  }

  // Fallback to predefined env var or localhost for development
  const fallback = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  cachedApiUrl = normalizeUrl(fallback)
  return cachedApiUrl
} 
