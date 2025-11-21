import { useState, useEffect } from 'react'

export function useApi() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('supabase-token')
    if (storedToken) {
      setToken(storedToken)
    }
    // Fallback to current supabase session
    (async () => {
      const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
      const t = session?.access_token || null
      if (t) setToken(t)
    })()
  }, [])

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  return { apiCall }
}