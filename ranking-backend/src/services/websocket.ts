import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { appConfig } from '@/config'
import { WebSocketMessage, RankingUpdate, SystemStats } from '@/types'
import { redis } from './redis'
import { database } from './database'
import logger from '@/utils/logger'
import { SafeJSON } from '../../../lib/utils/safe-json'
import { validateBroadcastData, WebSocketMessageSchema, RankingsArraySchema, SystemStatsSchema, CollaboratorSchema } from '@/validation/schemas'

export class WebSocketService {
  private io: SocketIOServer
  private connectedClients = new Map<string, Socket>()

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: appConfig.CORS_ORIGINS,
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
    this.subscribeToRedisEvents()
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`)
      this.connectedClients.set(socket.id, socket)

      this.handleClientConnection(socket)

      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id} (${reason})`)
        this.connectedClients.delete(socket.id)
      })

      socket.on('error', (error) => {
        logger.error(`WebSocket error for client ${socket.id}:`, error)
      })

      socket.on('subscribe', async (channel: string) => {
        try {
          await socket.join(channel)
          logger.info(`Client ${socket.id} subscribed to ${channel}`)
          
          await this.sendInitialData(socket, channel)
        } catch (error) {
          logger.error(`Subscription error for ${socket.id}:`, error)
          socket.emit('error', { message: 'Subscription failed' })
        }
      })

      socket.on('unsubscribe', async (channel: string) => {
        try {
          await socket.leave(channel)
          logger.info(`Client ${socket.id} unsubscribed from ${channel}`)
        } catch (error) {
          logger.error(`Unsubscription error for ${socket.id}:`, error)
        }
      })

      socket.on('get-rankings', async (params: { limit?: number } = {}) => {
        try {
          const rankings = await this.getRankings(params.limit)
          try {
            const validatedRankings = RankingsArraySchema.parse(rankings)
            socket.emit('rankings-data', validatedRankings)
          } catch (validationError) {
            logger.error('Rankings validation failed:', validationError)
            socket.emit('error', { message: 'Invalid rankings data' })
          }
        } catch (error) {
          logger.error(`Rankings request error for ${socket.id}:`, error)
          socket.emit('error', { message: 'Failed to get rankings' })
        }
      })

      socket.on('get-stats', async () => {
        try {
          const stats = await this.getSystemStats()
          try {
            const validatedStats = SystemStatsSchema.parse(stats)
            socket.emit('stats-data', validatedStats)
          } catch (validationError) {
            logger.error('Stats validation failed:', validationError)
            socket.emit('error', { message: 'Invalid stats data' })
          }
        } catch (error) {
          logger.error(`Stats request error for ${socket.id}:`, error)
          socket.emit('error', { message: 'Failed to get stats' })
        }
      })

      socket.on('get-collaborator', async (address: string) => {
        try {
          const collaborator = await database.getCollaborator(address as `0x${string}`)
          try {
            const validatedCollaborator = CollaboratorSchema.parse(collaborator)
            socket.emit('collaborator-data', validatedCollaborator)
          } catch (validationError) {
            logger.error('Collaborator validation failed:', validationError)
            socket.emit('error', { message: 'Invalid collaborator data' })
          }
        } catch (error) {
          logger.error(`Collaborator request error for ${socket.id}:`, error)
          socket.emit('error', { message: 'Failed to get collaborator data' })
        }
      })
    })

    logger.info('WebSocket event handlers configured')
  }

  private async handleClientConnection(socket: Socket): Promise<void> {
    try {
      const clientInfo = {
        id: socket.id,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        connectedAt: new Date()
      }

      await redis.set(`client:${socket.id}`, clientInfo, 3600)

      const connectionCount = this.connectedClients.size
      await redis.set('websocket:connections', connectionCount, 60)

      socket.emit('connected', {
        clientId: socket.id,
        timestamp: new Date(),
        message: 'Connected to CryptoGift DAO Ranking System'
      })

      logger.info(`Client connection handled: ${socket.id}`, clientInfo)
    } catch (error) {
      logger.error(`Client connection handling error:`, error)
    }
  }

  private async sendInitialData(socket: Socket, channel: string): Promise<void> {
    try {
      switch (channel) {
        case 'rankings':
          const rankings = await this.getRankings(50)
          try {
            const validatedRankings = RankingsArraySchema.parse(rankings)
            socket.emit('rankings-data', validatedRankings)
          } catch (validationError) {
            logger.error('Rankings validation failed:', validationError)
            socket.emit('error', { message: 'Invalid rankings data' })
          }
          break

        case 'stats':
          const stats = await this.getSystemStats()
          try {
            const validatedStats = SystemStatsSchema.parse(stats)
            socket.emit('stats-data', validatedStats)
          } catch (validationError) {
            logger.error('Stats validation failed:', validationError)
            socket.emit('error', { message: 'Invalid stats data' })
          }
          break

        case 'live-updates':
          const recentActivity = await redis.getList('recent-activity', 0, 9)
          socket.emit('recent-activity', recentActivity)
          break

        default:
          logger.warn(`Unknown subscription channel: ${channel}`)
      }
    } catch (error) {
      logger.error(`Initial data send error for channel ${channel}:`, error)
    }
  }

  private async subscribeToRedisEvents(): Promise<void> {
    try {
      await redis.subscribe('ranking-events', (message: WebSocketMessage) => {
        this.broadcastToClients(message)
      })

      logger.info('WebSocket service subscribed to Redis events')
    } catch (error) {
      logger.error('Redis subscription error:', error)
      throw error
    }
  }

  private broadcastToClients(message: WebSocketMessage): void {
    try {
      // Validate the entire WebSocket message first
      const validatedMessage = WebSocketMessageSchema.parse(message);
      const { type, payload, timestamp } = validatedMessage;

      // Additional validation for payload based on type
      let validatedPayload: any;
      try {
        validatedPayload = validateBroadcastData(type, payload);
      } catch (validationError) {
        logger.error(`Payload validation failed for ${type}:`, validationError);
        return; // Don't broadcast invalid data
      }

      switch (type) {
        case 'RANKING_UPDATE':
          this.io.to('rankings').emit('ranking-update', {
            type: 'ranking-update',
            data: validatedPayload,
            timestamp
          })
          break

        case 'TASK_UPDATE':
          this.io.to('tasks').emit('task-update', {
            type: 'task-update',
            data: validatedPayload,
            timestamp
          })
          break

        case 'TRANSACTION_UPDATE':
          this.io.to('transactions').emit('transaction-update', {
            type: 'transaction-update',
            data: validatedPayload,
            timestamp
          })
          break

        case 'SYSTEM_STATS':
          this.io.to('stats').emit('stats-update', {
            type: 'stats-update',
            data: validatedPayload,
            timestamp
          })
          break

        case 'MILESTONE_UPDATE':
        case 'TOKEN_UPDATE':
          this.io.to('live-updates').emit('live-update', {
            type: 'live-update',
            data: validatedPayload,
            timestamp
          })
          
          this.addToRecentActivity({
            type: type.replace('_UPDATE', ''),
            data: validatedPayload,
            timestamp
          })
          break
      }

      logger.debug(`Broadcasted validated ${type} to clients`, { 
        connectedClients: this.connectedClients.size 
      })
    } catch (error) {
      logger.error('Broadcast validation/send error:', error)
    }
  }

  private async addToRecentActivity(activity: any): Promise<void> {
    try {
      const activityString = SafeJSON.stringify(activity)
      await redis.addToList('recent-activity', activityString, 100)
    } catch (error) {
      logger.error('Recent activity add error:', error)
    }
  }

  private async getRankings(limit = 100) {
    try {
      let rankings = await redis.getCachedRankings()
      
      if (!rankings) {
        rankings = await database.getRankings(limit)
        await redis.cacheRankings(rankings, 60)
      }

      return rankings.slice(0, limit)
    } catch (error) {
      logger.error('Get rankings error:', error)
      throw error
    }
  }

  private async getSystemStats(): Promise<SystemStats> {
    try {
      let stats = await redis.getCachedSystemStats()
      
      if (!stats) {
        stats = await database.getSystemStats()
        await redis.cacheSystemStats(stats, 30)
      }

      return stats
    } catch (error) {
      logger.error('Get system stats error:', error)
      throw error
    }
  }

  public sendToClient(clientId: string, event: string, data: any): void {
    try {
      const socket = this.connectedClients.get(clientId)
      if (socket) {
        socket.emit(event, data)
      }
    } catch (error) {
      logger.error(`Send to client error for ${clientId}:`, error)
    }
  }

  public broadcastToAll(event: string, data: any): void {
    try {
      this.io.emit(event, data)
    } catch (error) {
      logger.error('Broadcast to all error:', error)
    }
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  public getClientsList(): string[] {
    return Array.from(this.connectedClients.keys())
  }

  public async getHealthStatus() {
    return {
      connectedClients: this.connectedClients.size,
      redisConnected: await redis.exists('websocket:connections'),
      lastActivity: new Date(),
      status: 'healthy'
    }
  }
}

let websocketService: WebSocketService

export const initializeWebSocket = (httpServer: HttpServer): WebSocketService => {
  websocketService = new WebSocketService(httpServer)
  return websocketService
}

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized')
  }
  return websocketService
}