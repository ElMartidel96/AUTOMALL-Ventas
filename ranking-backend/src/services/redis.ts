import Redis from 'ioredis'
import { appConfig } from '@/config'
import { CacheData, Ranking, SystemStats } from '@/types'
import logger from '@/utils/logger'
import { SafeJSON } from '../../../lib/utils/safe-json'

export class RedisService {
  private redis: Redis

  constructor() {
    this.redis = new Redis(appConfig.REDIS_URL, {
      password: appConfig.REDIS_PASSWORD,
      db: appConfig.REDIS_DB,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })

    this.redis.on('close', () => {
      logger.warn('Redis connection closed')
    })
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect()
      const pong = await this.redis.ping()
      if (pong !== 'PONG') {
        throw new Error('Redis ping failed')
      }
      logger.info('Redis initialized successfully')
    } catch (error) {
      logger.error('Redis initialization failed:', error)
      throw error
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data: value,
        timestamp: new Date(),
        ttl: ttl || 300
      }

      const serialized = SafeJSON.stringify(cacheData)
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error)
      throw error
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key)
      if (!cached) return null

      const cacheData: CacheData<T> = SafeJSON.parse(cached)
      
      const now = new Date()
      const cacheAge = now.getTime() - new Date(cacheData.timestamp).getTime()
      
      if (cacheAge > cacheData.ttl * 1000) {
        await this.redis.del(key)
        return null
      }

      return cacheData.data
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error)
      return null
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key)
      return exists === 1
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error)
      return false
    }
  }

  async cacheRankings(rankings: Ranking[], ttl = 60): Promise<void> {
    await this.set('rankings:all', rankings, ttl)
  }

  async getCachedRankings(): Promise<Ranking[] | null> {
    return await this.get<Ranking[]>('rankings:all')
  }

  async cacheSystemStats(stats: SystemStats, ttl = 30): Promise<void> {
    await this.set('system:stats', stats, ttl)
  }

  async getCachedSystemStats(): Promise<SystemStats | null> {
    return await this.get<SystemStats>('system:stats')
  }

  async incrementCounter(key: string, ttl?: number): Promise<number> {
    try {
      const count = await this.redis.incr(key)
      if (ttl && count === 1) {
        await this.redis.expire(key, ttl)
      }
      return count
    } catch (error) {
      logger.error(`Redis increment error for key ${key}:`, error)
      throw error
    }
  }

  async addToList(key: string, value: string, maxLength = 1000): Promise<void> {
    try {
      await this.redis.lpush(key, value)
      await this.redis.ltrim(key, 0, maxLength - 1)
    } catch (error) {
      logger.error(`Redis list add error for key ${key}:`, error)
      throw error
    }
  }

  async getList(key: string, start = 0, end = -1): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, end)
    } catch (error) {
      logger.error(`Redis list get error for key ${key}:`, error)
      return []
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.redis.publish(channel, SafeJSON.stringify(message))
    } catch (error) {
      logger.error(`Redis publish error for channel ${channel}:`, error)
      throw error
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const subscriber = new Redis(appConfig.REDIS_URL, {
        password: appConfig.REDIS_PASSWORD,
        db: appConfig.REDIS_DB
      })

      subscriber.subscribe(channel)
      subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message)
            callback(parsed)
          } catch (error) {
            logger.error(`Redis message parse error:`, error)
          }
        }
      })
    } catch (error) {
      logger.error(`Redis subscribe error for channel ${channel}:`, error)
      throw error
    }
  }

  async close(): Promise<void> {
    try {
      await this.redis.quit()
    } catch (error) {
      logger.error('Redis close error:', error)
    }
  }
}

export const redis = new RedisService()