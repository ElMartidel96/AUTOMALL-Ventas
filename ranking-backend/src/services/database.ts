import { createClient } from '@supabase/supabase-js'
import { appConfig } from '@/config'
import { Collaborator, Task, Transaction, Ranking } from '@/types'
import logger from '@/utils/logger'
import { Address } from 'viem'

export class DatabaseService {
  private supabase

  constructor() {
    this.supabase = createClient(
      appConfig.SUPABASE_URL,
      appConfig.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  async initialize(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('system_health')
        .select('*')
        .limit(1)

      if (error) {
        logger.error('Database connection test failed:', error)
        throw error
      }

      logger.info('Database connected successfully')
    } catch (error) {
      logger.error('Database initialization failed:', error)
      throw error
    }
  }

  async getCollaborator(address: Address): Promise<Collaborator | null> {
    try {
      const { data, error } = await this.supabase
        .from('collaborators')
        .select('*')
        .eq('address', address.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching collaborator:', error)
        throw error
      }

      return data as Collaborator | null
    } catch (error) {
      logger.error('Database error getting collaborator:', error)
      throw error
    }
  }

  async upsertCollaborator(collaborator: Partial<Collaborator>): Promise<Collaborator> {
    try {
      const { data, error } = await this.supabase
        .from('collaborators')
        .upsert({
          ...collaborator,
          address: collaborator.address?.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Error upserting collaborator:', error)
        throw error
      }

      return data as Collaborator
    } catch (error) {
      logger.error('Database error upserting collaborator:', error)
      throw error
    }
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          ...task,
          assignee: task.assignee.toLowerCase(),
          reward_amount: task.rewardAmount.toString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creating task:', error)
        throw error
      }

      return {
        ...data,
        rewardAmount: BigInt(data.reward_amount),
        assignee: data.assignee as Address
      } as Task
    } catch (error) {
      logger.error('Database error creating task:', error)
      throw error
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const updateData: any = { ...updates }
      
      if (updates.rewardAmount) {
        updateData.reward_amount = updates.rewardAmount.toString()
        delete updateData.rewardAmount
      }
      
      if (updates.assignee) {
        updateData.assignee = updates.assignee.toLowerCase()
      }

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('task_id', taskId)
        .select()
        .single()

      if (error) {
        logger.error('Error updating task:', error)
        throw error
      }

      return {
        ...data,
        rewardAmount: BigInt(data.reward_amount),
        assignee: data.assignee as Address
      } as Task
    } catch (error) {
      logger.error('Database error updating task:', error)
      throw error
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert({
          ...transaction,
          from: transaction.from.toLowerCase(),
          to: transaction.to.toLowerCase(),
          value: transaction.value.toString(),
          block_number: transaction.blockNumber.toString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creating transaction:', error)
        throw error
      }

      return {
        ...data,
        value: BigInt(data.value),
        blockNumber: BigInt(data.block_number),
        from: data.from as Address,
        to: data.to as Address
      } as Transaction
    } catch (error) {
      logger.error('Database error creating transaction:', error)
      throw error
    }
  }

  async getRankings(limit = 100): Promise<Ranking[]> {
    try {
      const { data, error } = await this.supabase
        .from('rankings_view')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Error fetching rankings:', error)
        throw error
      }

      return data.map(item => ({
        ...item,
        address: item.address as Address,
        totalEarned: BigInt(item.total_earned || 0)
      })) as Ranking[]
    } catch (error) {
      logger.error('Database error getting rankings:', error)
      throw error
    }
  }

  async updateRanking(address: Address, updates: Partial<Ranking>): Promise<void> {
    try {
      const updateData: any = { ...updates }
      
      if (updates.totalEarned) {
        updateData.total_earned = updates.totalEarned.toString()
        delete updateData.totalEarned
      }

      updateData.address = address.toLowerCase()
      updateData.updated_at = new Date().toISOString()

      const { error } = await this.supabase
        .from('collaborator_rankings')
        .upsert(updateData)

      if (error) {
        logger.error('Error updating ranking:', error)
        throw error
      }
    } catch (error) {
      logger.error('Database error updating ranking:', error)
      throw error
    }
  }

  async getSystemStats() {
    try {
      const { data, error } = await this.supabase
        .from('system_stats_view')
        .select('*')
        .single()

      if (error) {
        logger.error('Error fetching system stats:', error)
        throw error
      }

      return {
        ...data,
        totalDeposited: BigInt(data.total_deposited || 0),
        totalReleased: BigInt(data.total_released || 0),
        totalLocked: BigInt(data.total_locked || 0),
        totalDisputed: BigInt(data.total_disputed || 0),
        lastUpdate: new Date()
      }
    } catch (error) {
      logger.error('Database error getting system stats:', error)
      throw error
    }
  }
}

export const database = new DatabaseService()