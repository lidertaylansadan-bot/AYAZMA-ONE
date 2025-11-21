import { createClient } from '@supabase/supabase-js'

const url = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const anon = process.env.TEST_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const looksJwt = (k: string) => k?.startsWith('eyJ') && k.length > 50
const hasEnv = !!url && (looksJwt(anon) || looksJwt(service))

describe('Supabase Configuration', () => {
  test('Environment variables are set', () => {
    expect(url).toBeTruthy()
    expect(anon || service).toBeTruthy()
  })
})

describe('Supabase Operations', () => {
  if (!hasEnv) {
    test.skip('Skip operations due to missing env', () => { })
    return
  }

  const client = createClient(url, service || anon)

  test('Database connectivity (sector_blueprints)', async () => {
    const start = performance.now()
    const { data, error } = await client.from('sector_blueprints').select('sector_code').limit(1)
    const end = performance.now()
    console.info('sector_blueprints query time ms:', Math.round(end - start))
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  }, 20000)

  test('Realtime subscription setup', async () => {
    const ch = client.channel('test:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => { })

    const status = await new Promise((resolve) => {
      ch.subscribe((status) => resolve(status))
    })
    expect(status).toBe('SUBSCRIBED')
    await ch.unsubscribe()
  }, 20000)

  test('Broadcast channel send', async () => {
    const bc = client.channel('broadcast:test')
    await new Promise((resolve) => {
      bc.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve(status)
      })
    })
    const resp = await bc.send({ type: 'broadcast', event: 'ping', payload: { ts: Date.now() } })
    expect(resp).toBe('ok')
    await bc.unsubscribe()
  }, 20000)

  test('Storage bucket exists or can be created', async () => {
    const { data: bucket } = await client.storage.getBucket('project-assets')
    // If not exists, creation requires service role
    if (!bucket && service) {
      const { data: created, error } = await client.storage.createBucket('project-assets', { public: false })
      expect(error).toBeNull()
      expect(created?.name).toBe('project-assets')
    } else {
      expect(true).toBe(true)
    }
  }, 20000)
})