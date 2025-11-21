import { describe, test, expect } from 'vitest'
import { createSupabaseClient } from '../shared/supabaseClientFactory'

const URL = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const KEY = process.env.TEST_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const looksJwt = (k: string) => k?.startsWith('eyJ') && k.length > 50
const hasCreds = !!URL && looksJwt(KEY)

describe('Supabase Client Factory', () => {
  test('HTTPS zorunluluğu doğrulanır', () => {
    expect(() => createSupabaseClient('http://example.com', 'x')).toThrow()
  })

  if (!hasCreds) {
    test.skip('Bağlantı ve CRUD testleri (env gerekli)', () => {})
    return
  }

  test('Bağlantı doğrulama', async () => {
    const factory = createSupabaseClient(URL, KEY)
    const ok = await factory.verifyConnection()
    expect(ok.success).toBe(true)
  }, 30000)

  test('CRUD: list', async () => {
    const { crud } = createSupabaseClient(URL, KEY)
    const res = await crud('sector_blueprints').list()
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  }, 30000)
})