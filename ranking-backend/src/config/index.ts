import { config } from 'dotenv'
import { z } from 'zod'

config()

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('localhost'),
  
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  
  BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
  BASE_WS_URL: z.string().url().default('wss://mainnet.base.org'),
  CHAIN_ID: z.coerce.number().default(8453),
  
  CGC_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  MILESTONE_ESCROW_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  TASK_RULES_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  MASTER_CONTROLLER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().transform(origins => origins.split(',')),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/ranking.log'),
  
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100)
})

export type Config = z.infer<typeof configSchema>

let parsedConfig: Config

try {
  parsedConfig = configSchema.parse(process.env)
} catch (error) {
  console.error('❌ Invalid configuration:', error)
  process.exit(1)
}

export const appConfig = parsedConfig

export const isDevelopment = appConfig.NODE_ENV === 'development'
export const isProduction = appConfig.NODE_ENV === 'production'
export const isTest = appConfig.NODE_ENV === 'test'

export const contractAddresses = {
  CGC_TOKEN: appConfig.CGC_TOKEN_ADDRESS as `0x${string}`,
  MILESTONE_ESCROW: appConfig.MILESTONE_ESCROW_ADDRESS as `0x${string}`,
  TASK_RULES: appConfig.TASK_RULES_ADDRESS as `0x${string}`,
  MASTER_CONTROLLER: appConfig.MASTER_CONTROLLER_ADDRESS as `0x${string}`
} as const

export default appConfig