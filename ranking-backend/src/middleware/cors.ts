import cors from 'cors'
import { appConfig, isDevelopment } from '@/config'
import logger from '@/utils/logger'

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isDevelopment && !origin) {
      return callback(null, true)
    }

    if (origin && appConfig.CORS_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (isDevelopment) {
      logger.warn(`CORS: Origin not in whitelist: ${origin}`)
      return callback(null, true)
    }

    logger.error(`CORS: Origin blocked: ${origin}`)
    callback(new Error('Not allowed by CORS policy'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-RateLimit-Window'
  ],
  maxAge: 86400
}

export const corsMiddleware = cors(corsOptions)