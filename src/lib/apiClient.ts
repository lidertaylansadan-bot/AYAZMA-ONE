type ApiError = { code: string; message: string; details?: any }

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  const token = localStorage.getItem('supabase-token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${base}${path}`, { ...options, headers })
  const body = await res.json().catch(() => ({}))
  return body
}