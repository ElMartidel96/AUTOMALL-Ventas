import { 
  createPublicClient, 
  createWalletClient,
  http,
  webSocket,
  parseAbiItem,
  Address,
  Log,
  GetLogsReturnType
} from 'viem'
import { base } from 'viem/chains'
import { appConfig, contractAddresses } from '@/config'
import { BlockchainEvent, Task, Transaction } from '@/types'
import logger from '@/utils/logger'
import { database } from './database'
import { redis } from './redis'

export class BlockchainService {
  private publicClient
  private wsClient
  private isListening = false

  constructor() {
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(appConfig.BASE_RPC_URL)
    })

    this.wsClient = createPublicClient({
      chain: base,
      transport: webSocket(appConfig.BASE_WS_URL)
    })
  }

  async initialize(): Promise<void> {
    try {
      const blockNumber = await this.publicClient.getBlockNumber()
      logger.info(`Connected to Base blockchain at block ${blockNumber}`)
      
      await this.startEventListening()
      logger.info('Blockchain service initialized successfully')
    } catch (error) {
      logger.error('Blockchain initialization failed:', error)
      throw error
    }
  }

  async startEventListening(): Promise<void> {
    if (this.isListening) return

    try {
      logger.info('Starting blockchain event listening...')

      const milestoneEvents = [
        'BatchDeposited(bytes32,address,address,uint256,uint256)',
        'MilestoneCreated(bytes32,bytes32,address,uint256,uint256)',
        'FundsReleased(bytes32,address,uint256,bytes32)',
        'DisputeInitiated(bytes32,address,string)',
        'DisputeResolved(bytes32,uint8,address)'
      ]

      const taskEvents = [
        'TaskCreated(bytes32,address,uint256,uint256,address)',
        'TaskCompleted(bytes32,address,bytes32,uint256)',
        'RewardReleased(bytes32,address,uint256,uint256)'
      ]

      const tokenEvents = [
        'Transfer(address,address,uint256)',
        'BatchTransfer(address,address[],uint256[],uint256)',
        'HolderAdded(address,uint256)',
        'HolderRemoved(address)'
      ]

      milestoneEvents.forEach(event => {
        this.watchContractEvent(contractAddresses.MILESTONE_ESCROW, event, this.handleMilestoneEvent.bind(this))
      })

      taskEvents.forEach(event => {
        this.watchContractEvent(contractAddresses.TASK_RULES, event, this.handleTaskEvent.bind(this))
      })

      tokenEvents.forEach(event => {
        this.watchContractEvent(contractAddresses.CGC_TOKEN, event, this.handleTokenEvent.bind(this))
      })

      this.isListening = true
      logger.info('Blockchain event listening started')
    } catch (error) {
      logger.error('Failed to start blockchain event listening:', error)
      throw error
    }
  }

  private async watchContractEvent(
    contractAddress: Address,
    eventSignature: string,
    handler: (event: BlockchainEvent) => Promise<void>
  ): Promise<void> {
    try {
      const unwatch = this.wsClient.watchContractEvent({
        address: contractAddress,
        event: parseAbiItem(`event ${eventSignature}`),
        onLogs: async (logs: Log[]) => {
          for (const log of logs) {
            try {
              const event: BlockchainEvent = {
                eventName: eventSignature.split('(')[0]!,
                contractAddress: log.address,
                blockNumber: log.blockNumber!,
                transactionHash: log.transactionHash!,
                logIndex: log.logIndex!,
                args: log.args as Record<string, any>,
                timestamp: new Date()
              }

              await handler(event)
            } catch (error) {
              logger.error('Error processing blockchain event:', error)
            }
          }
        }
      })

      logger.info(`Watching ${eventSignature} on ${contractAddress}`)
    } catch (error) {
      logger.error(`Failed to watch event ${eventSignature}:`, error)
    }
  }

  private async handleMilestoneEvent(event: BlockchainEvent): Promise<void> {
    try {
      logger.info(`Processing milestone event: ${event.eventName}`, {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber.toString()
      })

      switch (event.eventName) {
        case 'BatchDeposited':
          await this.processBatchDeposited(event)
          break
        case 'MilestoneCreated':
          await this.processMilestoneCreated(event)
          break
        case 'FundsReleased':
          await this.processFundsReleased(event)
          break
        case 'DisputeInitiated':
          await this.processDisputeInitiated(event)
          break
        case 'DisputeResolved':
          await this.processDisputeResolved(event)
          break
      }

      await this.broadcastEvent('MILESTONE_UPDATE', event)
    } catch (error) {
      logger.error('Error handling milestone event:', error)
    }
  }

  private async handleTaskEvent(event: BlockchainEvent): Promise<void> {
    try {
      logger.info(`Processing task event: ${event.eventName}`, {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber.toString()
      })

      switch (event.eventName) {
        case 'TaskCreated':
          await this.processTaskCreated(event)
          break
        case 'TaskCompleted':
          await this.processTaskCompleted(event)
          break
        case 'RewardReleased':
          await this.processRewardReleased(event)
          break
      }

      await this.broadcastEvent('TASK_UPDATE', event)
    } catch (error) {
      logger.error('Error handling task event:', error)
    }
  }

  private async handleTokenEvent(event: BlockchainEvent): Promise<void> {
    try {
      logger.info(`Processing token event: ${event.eventName}`, {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber.toString()
      })

      switch (event.eventName) {
        case 'Transfer':
          await this.processTransfer(event)
          break
        case 'BatchTransfer':
          await this.processBatchTransfer(event)
          break
        case 'HolderAdded':
          await this.processHolderAdded(event)
          break
        case 'HolderRemoved':
          await this.processHolderRemoved(event)
          break
      }

      await this.broadcastEvent('TOKEN_UPDATE', event)
    } catch (error) {
      logger.error('Error handling token event:', error)
    }
  }

  private async processBatchDeposited(event: BlockchainEvent): Promise<void> {
    const { batchId, depositor, eip712Contract, amount } = event.args as {
      batchId: string
      depositor: Address
      eip712Contract: Address
      amount: bigint
    }

    await database.createTransaction({
      hash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: event.timestamp,
      from: depositor,
      to: contractAddresses.MILESTONE_ESCROW,
      value: amount,
      type: 'deposit',
      batchId,
      status: 'confirmed'
    })

    await this.updateSystemStats()
  }

  private async processMilestoneCreated(event: BlockchainEvent): Promise<void> {
    const { milestoneId, batchId, collaborator, amount, deadline } = event.args as {
      milestoneId: string
      batchId: string
      collaborator: Address
      amount: bigint
      deadline: bigint
    }

    await database.createTask({
      taskId: milestoneId,
      platform: 'milestone',
      assignee: collaborator,
      complexity: 3,
      rewardAmount: amount,
      deadline: new Date(Number(deadline) * 1000),
      status: 'pending',
      createdAt: event.timestamp,
      batchId,
      milestoneId
    })

    await database.upsertCollaborator({
      address: collaborator,
      isActive: true,
      pendingTasks: await this.getCollaboratorPendingTasks(collaborator)
    })
  }

  private async processFundsReleased(event: BlockchainEvent): Promise<void> {
    const { milestoneId, recipient, amount } = event.args as {
      milestoneId: string
      recipient: Address
      amount: bigint
    }

    await database.updateTask(milestoneId, {
      status: 'released',
      completedAt: event.timestamp,
      txHash: event.transactionHash
    })

    await database.createTransaction({
      hash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: event.timestamp,
      from: contractAddresses.MILESTONE_ESCROW,
      to: recipient,
      value: amount,
      type: 'release',
      milestoneId,
      status: 'confirmed'
    })

    const collaborator = await database.getCollaborator(recipient)
    if (collaborator) {
      await database.upsertCollaborator({
        ...collaborator,
        totalEarned: collaborator.totalEarned + amount,
        completedTasks: collaborator.completedTasks + 1
      })
    }

    await this.updateRankings()
    await this.updateSystemStats()
  }

  private async processTaskCreated(event: BlockchainEvent): Promise<void> {
    const { taskId, assignee, rewardAmount, deadline } = event.args as {
      taskId: string
      assignee: Address
      rewardAmount: bigint
      deadline: bigint
    }

    await database.createTask({
      taskId,
      platform: 'task-rules',
      assignee,
      complexity: 3,
      rewardAmount,
      deadline: new Date(Number(deadline) * 1000),
      status: 'pending',
      createdAt: event.timestamp
    })
  }

  private async processTaskCompleted(event: BlockchainEvent): Promise<void> {
    const { taskId, completer, proofHash } = event.args as {
      taskId: string
      completer: Address
      proofHash: string
    }

    await database.updateTask(taskId, {
      status: 'submitted',
      completedAt: event.timestamp,
      proofHash
    })
  }

  private async processRewardReleased(event: BlockchainEvent): Promise<void> {
    const { taskId, recipient, amount } = event.args as {
      taskId: string
      recipient: Address
      amount: bigint
    }

    await database.updateTask(taskId, {
      status: 'released',
      txHash: event.transactionHash
    })

    await database.createTransaction({
      hash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: event.timestamp,
      from: contractAddresses.TASK_RULES,
      to: recipient,
      value: amount,
      type: 'release',
      taskId,
      status: 'confirmed'
    })

    await this.updateRankings()
  }

  private async processTransfer(event: BlockchainEvent): Promise<void> {
    const { from, to, value } = event.args as {
      from: Address
      to: Address
      value: bigint
    }

    if (value > 0n && from !== '0x0000000000000000000000000000000000000000') {
      await database.createTransaction({
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
        from,
        to,
        value,
        type: 'transfer',
        status: 'confirmed'
      })
    }
  }

  private async processBatchTransfer(event: BlockchainEvent): Promise<void> {
    const { from, recipients, amounts, totalAmount } = event.args as {
      from: Address
      recipients: Address[]
      amounts: bigint[]
      totalAmount: bigint
    }

    for (let i = 0; i < recipients.length; i++) {
      await database.createTransaction({
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
        from,
        to: recipients[i]!,
        value: amounts[i]!,
        type: 'transfer',
        status: 'confirmed'
      })
    }
  }

  private async processHolderAdded(event: BlockchainEvent): Promise<void> {
    const { holder, balance } = event.args as {
      holder: Address
      balance: bigint
    }

    await database.upsertCollaborator({
      address: holder,
      isActive: true,
      totalEarned: balance
    })
  }

  private async processHolderRemoved(event: BlockchainEvent): Promise<void> {
    const { holder } = event.args as { holder: Address }

    await database.upsertCollaborator({
      address: holder,
      isActive: false
    })
  }

  private async processDisputeInitiated(event: BlockchainEvent): Promise<void> {
    const { milestoneId } = event.args as { milestoneId: string }
    
    await database.updateTask(milestoneId, {
      status: 'disputed'
    })
  }

  private async processDisputeResolved(event: BlockchainEvent): Promise<void> {
    const { milestoneId } = event.args as { milestoneId: string }
    
    await database.updateTask(milestoneId, {
      status: 'verified'
    })
  }

  private async getCollaboratorPendingTasks(address: Address): Promise<number> {
    return 0
  }

  private async updateRankings(): Promise<void> {
    const rankings = await database.getRankings()
    await redis.cacheRankings(rankings, 60)
    await this.broadcastEvent('RANKING_UPDATE', { rankings })
  }

  private async updateSystemStats(): Promise<void> {
    const stats = await database.getSystemStats()
    await redis.cacheSystemStats(stats, 30)
    await this.broadcastEvent('SYSTEM_STATS', stats)
  }

  private async broadcastEvent(type: string, data: any): Promise<void> {
    try {
      await redis.publish('ranking-events', {
        type,
        payload: data,
        timestamp: new Date(),
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
    } catch (error) {
      logger.error('Failed to broadcast event:', error)
    }
  }
}

export const blockchain = new BlockchainService()