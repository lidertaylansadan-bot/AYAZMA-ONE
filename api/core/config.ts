import dotenv from 'dotenv'
import { z } from 'zod'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve('.env') })
dotenv.config({ path: path.join(__dirname, '../.env') })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  LOG_LEVEL: z.string().default('info'),
  AI_OPENAI_API_KEY: z.string().optional(),
  AI_GOOGLE_API_KEY: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.string().default('google'),
  DEFAULT_AI_MODEL: z.string().default('gemini-1.5-flash'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid configuration: ${JSON.stringify(parsed.error.flatten())}`)
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  logLevel: parsed.data.LOG_LEVEL,
  aiOpenaiKey: parsed.data.AI_OPENAI_API_KEY,
  aiGoogleKey: parsed.data.AI_GOOGLE_API_KEY,
  defaultAiProvider: parsed.data.DEFAULT_AI_PROVIDER,
  defaultAiModel: parsed.data.DEFAULT_AI_MODEL,
}