import express from 'express'
import { createServer } from 'http'
import { appConfig } from '@/config'
import { database } from '@/services/database'
import { redis } from '@/services/redis'
import { blockchain } from '@/services/blockchain'
import { initializeWebSocket } from '@/services/websocket'
import apiRoutes from '@/routes/api'
import { corsMiddleware } from '@/middleware/cors'
import { apiRateLimit } from '@/middleware/rateLimit'
import { errorHandler, notFoundHandler } from '@/middleware/error'
import logger from '@/utils/logger'

async function startServer() {
  try {
    logger.info('🚀 Starting CryptoGift DAO Ranking Backend...')

    const app = express()
    const httpServer = createServer(app)

    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    app.use(corsMiddleware)

    app.use('/api', apiRateLimit)
    app.use('/api', apiRoutes)

    app.get('/', (req, res) => {
      res.json({
        name: 'CryptoGift DAO Ranking Backend',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date(),
        endpoints: {
          api: '/api',
          health: '/api/health',
          rankings: '/api/rankings',
          stats: '/api/stats',
          websocket: 'ws://localhost:3001'
        }
      })
    })

    app.use(notFoundHandler)
    app.use(errorHandler)

    logger.info('📦 Initializing services...')

    logger.info('🔗 Connecting to database...')
    await database.initialize()

    logger.info('🔴 Connecting to Redis...')
    await redis.initialize()

    logger.info('⛓️ Connecting to blockchain...')
    await blockchain.initialize()

    logger.info('🔌 Initializing WebSocket service...')
    initializeWebSocket(httpServer)

    httpServer.listen(appConfig.PORT, appConfig.HOST, () => {
      logger.info(`🎯 Server running on http://${appConfig.HOST}:${appConfig.PORT}`)
      logger.info(`🔗 WebSocket server ready for connections`)
      logger.info(`🌍 Environment: ${appConfig.NODE_ENV}`)
      logger.info(`⛓️ Chain ID: ${appConfig.CHAIN_ID}`)
      logger.info(`📊 Ranking system active and monitoring blockchain events`)
    })

    const gracefulShutdown = async (signal: string) => {
      logger.info(`📤 Received ${signal}. Starting graceful shutdown...`)

      httpServer.close(async () => {
        try {
          await redis.close()
          logger.info('✅ Server shut down gracefully')
          process.exit(0)
        } catch (error) {
          logger.error('❌ Error during shutdown:', error)
          process.exit(1)
        }
      })

      setTimeout(() => {
        logger.error('❌ Forced shutdown due to timeout')
        process.exit(1)
      }, 30000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })

  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

export { startServer }