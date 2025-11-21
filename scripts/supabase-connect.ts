import { createSupabaseClient } from '../shared/supabaseClientFactory'

const url = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const key = process.env.TEST_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

async function main() {
  if (!url || !key) {
    console.error('URL veya API key eksik. Env ayarlayın: TEST_SUPABASE_URL / TEST_SUPABASE_KEY')
    process.exit(1)
  }
  console.log('Supabase bağlanıyor:', url)
  const factory = createSupabaseClient(url, key)
  const protoOk = /^https:\/\//i.test(url)
  console.log('Protokol HTTPS:', protoOk)
  const headers = await factory.verifyHeaders()
  console.log('Header doğrulama:', headers)
  const conn = await factory.verifyConnection()
  console.log('Bağlantı testi:', conn)
  if (!conn.success) process.exit(2)
  console.log('CRUD list testi:')
  const res = await factory.crud('sector_blueprints').list()
  console.log('CRUD sonuç:', res.success, Array.isArray(res.data) ? res.data?.length : 0)
  if (!res.success) process.exit(3)
}

main().catch((e) => {
  console.error('Bağlantı testi hata:', e)
  process.exit(10)
})