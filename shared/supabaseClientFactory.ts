import { createClient, SupabaseClient } from '@supabase/supabase-js'

type CrudResult<T> = { success: boolean; data?: T; error?: string }

export function createSupabaseClient(url: string, apiKey: string) {
  if (!url || !apiKey) throw new Error('Supabase URL ve API key gerekli')
  if (!/^https:\/\//i.test(url)) throw new Error('HTTPS zorunludur')

  const client: SupabaseClient = createClient(url, apiKey, {
    auth: { persistSession: false },
  })

  const verifyHeaders = async (): Promise<CrudResult<boolean>> => {
    try {
      const res = await fetch(`${url}/rest/v1/sector_blueprints?select=sector_code&limit=1`, {
        headers: { apikey: apiKey },
      })
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true, data: true }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Bağlantı hatası' }
    }
  }

  const verifyConnection = async (): Promise<CrudResult<boolean>> => {
    try {
      const { error } = await client.from('sector_blueprints').select('sector_code').limit(1)
      if (error) return { success: false, error: error.message }
      const headers = await verifyHeaders()
      if (!headers.success) return headers
      return { success: true, data: true }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Bağlantı doğrulama hatası' }
    }
  }

  const crud = <T = any>(table: string) => ({
    list: async (filters: Record<string, any> = {}): Promise<CrudResult<T[]>> => {
      const query = client.from(table).select('*')
      Object.entries(filters).forEach(([k, v]) => query.eq(k, v))
      const { data, error } = await query
      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as T[]) || [] }
    },
    getById: async (id: string): Promise<CrudResult<T>> => {
      const { data, error } = await client.from(table).select('*').eq('id', id).single()
      if (error) return { success: false, error: error.message }
      return { success: true, data: data as T }
    },
    create: async (payload: Partial<T>): Promise<CrudResult<T>> => {
      const { data, error } = await client.from(table).insert(payload).select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, data: data as T }
    },
    update: async (id: string, payload: Partial<T>): Promise<CrudResult<T>> => {
      const { data, error } = await client.from(table).update(payload).eq('id', id).select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, data: data as T }
    },
    remove: async (id: string): Promise<CrudResult<null>> => {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) return { success: false, error: error.message }
      return { success: true, data: null }
    },
  })

  return { client, crud, verifyConnection, verifyHeaders }
}