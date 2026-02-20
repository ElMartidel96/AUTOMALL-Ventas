import express from 'express'
import { database } from '@/services/database'
import { redis } from '@/services/redis'
import { getWebSocketService } from '@/services/websocket'
import logger from '@/utils/logger'
import { z } from 'zod'
import { Address } from 'viem'

const router = express.Router()

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0)
})

router.get('/health', async (req, res) => {
  try {
    const websocket = getWebSocketService()
    const health = await websocket.getHealthStatus()
    
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'healthy',
        redis: health.redisConnected ? 'healthy' : 'unhealthy',
        websocket: health.status,
        blockchain: 'healthy'
      },
      metrics: {
        connectedClients: health.connectedClients,
        uptime: process.uptime()
      }
    }

    res.json(systemHealth)
  } catch (error) {
    logger.error('Health check error:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    })
  }
})

router.get('/rankings', async (req, res) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query)
    
    let rankings = await redis.getCachedRankings()
    
    if (!rankings) {
      rankings = await database.getRankings(limit + offset)
      await redis.cacheRankings(rankings, 60)
    }

    const paginatedRankings = rankings.slice(offset, offset + limit)

    res.json({
      rankings: paginatedRankings,
      pagination: {
        limit,
        offset,
        total: rankings.length,
        hasMore: offset + limit < rankings.length
      },
      lastUpdate: new Date()
    })
  } catch (error) {
    logger.error('Rankings API error:', error)
    res.status(500).json({
      error: 'Failed to fetch rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/collaborator/:address', async (req, res) => {
  try {
    const address = addressSchema.parse(req.params.address) as Address
    
    const collaborator = await database.getCollaborator(address)
    
    if (!collaborator) {
      return res.status(404).json({
        error: 'Collaborator not found'
      })
    }

    res.json(collaborator)
  } catch (error) {
    logger.error('Collaborator API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid address format',
        details: error.errors
      })
    }

    res.status(500).json({
      error: 'Failed to fetch collaborator',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/stats', async (req, res) => {
  try {
    let stats = await redis.getCachedSystemStats()
    
    if (!stats) {
      stats = await database.getSystemStats()
      await redis.cacheSystemStats(stats, 30)
    }

    res.json(stats)
  } catch (error) {
    logger.error('Stats API error:', error)
    res.status(500).json({
      error: 'Failed to fetch system stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/leaderboard', async (req, res) => {
  try {
    const { limit } = z.object({
      limit: z.coerce.number().min(1).max(100).default(10)
    }).parse(req.query)

    const rankings = await database.getRankings(limit)
    
    const leaderboard = rankings.map((ranking, index) => ({
      rank: index + 1,
      address: ranking.address,
      username: ranking.username || `User-${ranking.address.slice(-4)}`,
      score: ranking.score,
      totalEarned: ranking.totalEarned.toString(),
      completedTasks: ranking.completedTasks,
      successRate: ranking.successRate,
      badge: ranking.badge,
      trend: ranking.trend,
      trendChange: ranking.trendChange
    }))

    res.json({
      leaderboard,
      generatedAt: new Date(),
      totalParticipants: rankings.length
    })
  } catch (error) {
    logger.error('Leaderboard API error:', error)
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/recent-activity', async (req, res) => {
  try {
    const { limit } = z.object({
      limit: z.coerce.number().min(1).max(50).default(20)
    }).parse(req.query)

    const activities = await redis.getList('recent-activity', 0, limit - 1)
    const parsedActivities = activities.map(activity => {
      try {
        return JSON.parse(activity)
      } catch {
        return null
      }
    }).filter(Boolean)

    res.json({
      activities: parsedActivities,
      count: parsedActivities.length,
      lastUpdate: new Date()
    })
  } catch (error) {
    logger.error('Recent activity API error:', error)
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/websocket/stats', async (req, res) => {
  try {
    const websocket = getWebSocketService()
    const health = await websocket.getHealthStatus()

    res.json({
      connectedClients: health.connectedClients,
      clientsList: websocket.getClientsList(),
      status: health.status,
      lastActivity: health.lastActivity
    })
  } catch (error) {
    logger.error('WebSocket stats API error:', error)
    res.status(500).json({
      error: 'Failed to fetch WebSocket stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/broadcast', async (req, res) => {
  try {
    const { event, data, target } = z.object({
      event: z.string().min(1),
      data: z.any(),
      target: z.enum(['all', 'client']).default('all'),
      clientId: z.string().optional()
    }).parse(req.body)

    const websocket = getWebSocketService()

    if (target === 'all') {
      websocket.broadcastToAll(event, data)
      res.json({ 
        success: true, 
        message: 'Broadcast sent to all clients',
        recipients: websocket.getConnectedClientsCount()
      })
    } else if (target === 'client' && req.body.clientId) {
      websocket.sendToClient(req.body.clientId, event, data)
      res.json({ 
        success: true, 
        message: `Message sent to client ${req.body.clientId}`
      })
    } else {
      res.status(400).json({
        error: 'Invalid broadcast target or missing clientId'
      })
    }
  } catch (error) {
    logger.error('Broadcast API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid broadcast parameters',
        details: error.errors
      })
    }

    res.status(500).json({
      error: 'Failed to send broadcast',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/cache/status', async (req, res) => {
  try {
    const cacheKeys = [
      'rankings:all',
      'system:stats',
      'recent-activity',
      'websocket:connections'
    ]

    const status = {}
    for (const key of cacheKeys) {
      status[key] = await redis.exists(key)
    }

    res.json({
      cacheStatus: status,
      timestamp: new Date()
    })
  } catch (error) {
    logger.error('Cache status API error:', error)
    res.status(500).json({
      error: 'Failed to check cache status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = z.object({
      key: z.string().min(1)
    }).parse(req.params)

    await redis.del(key)

    res.json({
      success: true,
      message: `Cache key '${key}' cleared`,
      timestamp: new Date()
    })
  } catch (error) {
    logger.error('Cache clear API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid cache key',
        details: error.errors
      })
    }

    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router