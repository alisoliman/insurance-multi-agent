// Configuration that can be read at runtime
let cachedApiUrl: string | null = null

export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) {
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
  cachedApiUrl = fallback
  return fallback
} 