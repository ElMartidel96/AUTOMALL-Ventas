/**
 * 🎁 Wallets Service Client
 *
 * API client for communicating with the Wallets service (gifts.mbxarts.com).
 * Provides typed methods for all wallet-related operations.
 *
 * USAGE:
 * ```typescript
 * import { walletsService } from '@/lib/integrations/wallets-service';
 *
 * // Get wallet info
 * const wallet = await walletsService.getWallet('0x...');
 *
 * // Create competition
 * const comp = await walletsService.createCompetition({ ... });
 * ```
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api-client';
import { buildApiUrl, SERVICES, TIMEOUTS } from './config';

// =============================================================================
// TYPES
// =============================================================================

// Wallet Types
export interface WalletInfo {
  address: string;
  type: 'EOA' | 'TBA' | 'AA';
  createdAt: string;
  nftTokenId?: string;
  recoveryEnabled?: boolean;
  sessionKeysEnabled?: boolean;
}

export interface WalletBalance {
  address: string;
  eth: string;
  cgc: string;
  tokens: Array<{
    address: string;
    symbol: string;
    balance: string;
    decimals: number;
  }>;
}

// Competition Types
export interface Competition {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'active' | 'resolving' | 'completed' | 'cancelled' | 'disputed';
  createdBy: string;
  createdAt: string;
  format: string;
  stakeAmount: string;
  currency: string;
  maxParticipants: number | 'unlimited';
  participantCount: number;
  participants: Array<{
    address: string;
    joinedAt: string;
    status: string;
  }>;
}

export interface CreateCompetitionParams {
  title: string;
  description?: string;
  format: string;
  entryType: string;
  maxParticipants: number | 'unlimited';
  stakeType: string;
  stakeAmount: string;
  currency: string;
  distribution: string;
  resolution: string;
  timing: string;
  matchType: string;
  deadline?: string;
  forSharing?: boolean;
}

// Escrow Types
export interface EscrowInfo {
  id: string;
  competitionId: string;
  totalStaked: string;
  participants: string[];
  status: 'active' | 'resolved' | 'refunded';
  winner?: string;
  resolvedAt?: string;
}

// Notification Types
export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

// User NFT Wallet Types (from cryptogift-wallets)
export interface UserNFTWallet {
  id: string;
  name: string;
  address: string;
  tbaAddress: string;
  nftContract: string;
  tokenId: string;
  image: string;
  balance: {
    eth: string;
    usdc: string;
    total: string;
  };
  isActive: boolean;
}

export interface UserNFTWalletsResponse {
  success: boolean;
  userAddress: string;
  walletsFound: number;
  wallets: UserNFTWallet[];
}

// =============================================================================
// INTERNAL API KEY
// =============================================================================

function getInternalApiKey(): string {
  const key = process.env.WALLETS_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY;
  if (!key) {
    console.warn('⚠️ WALLETS_INTERNAL_API_KEY not configured. Some features may be limited.');
  }
  return key || '';
}

// =============================================================================
// WALLETS SERVICE CLIENT
// =============================================================================

class WalletsServiceClient {
  private baseUrl: string;
  private internalApiKey: string;

  constructor() {
    this.baseUrl = SERVICES.WALLETS.internalUrl;
    this.internalApiKey = getInternalApiKey();
  }

  private buildUrl(path: string): string {
    return buildApiUrl('WALLETS', path, true);
  }

  private getAuthHeaders(walletAddress?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.internalApiKey) {
      headers['X-API-Key'] = this.internalApiKey;
    }
    if (walletAddress) {
      headers['X-Wallet-Address'] = walletAddress;
    }
    return headers;
  }

  // ===========================================================================
  // WALLET OPERATIONS
  // ===========================================================================

  /**
   * Get wallet information by address
   */
  async getWallet(address: string): Promise<ApiResponse<WalletInfo>> {
    return apiGet<WalletInfo>(
      this.buildUrl(`/wallets/${address}`),
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * Get wallet balance (ETH, CGC, and other tokens)
   */
  async getWalletBalance(address: string): Promise<ApiResponse<WalletBalance>> {
    return apiGet<WalletBalance>(
      this.buildUrl(`/wallets/${address}/balance`),
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * Create a new TBA wallet for user
   */
  async createTBAWallet(
    ownerAddress: string,
    nftTokenId: string
  ): Promise<ApiResponse<WalletInfo>> {
    return apiPost<WalletInfo>(
      this.buildUrl('/wallets/tba/create'),
      { ownerAddress, nftTokenId },
      {
        headers: this.getAuthHeaders(ownerAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  // ===========================================================================
  // COMPETITION OPERATIONS
  // ===========================================================================

  /**
   * Get competition by ID or code
   */
  async getCompetition(idOrCode: string): Promise<ApiResponse<Competition>> {
    return apiGet<Competition>(
      this.buildUrl(`/competitions/${idOrCode}`),
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * List competitions with optional filters
   */
  async listCompetitions(params?: {
    status?: Competition['status'];
    createdBy?: string;
    participant?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ competitions: Competition[]; total: number }>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.createdBy) searchParams.set('createdBy', params.createdBy);
    if (params?.participant) searchParams.set('participant', params.participant);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiGet<{ competitions: Competition[]; total: number }>(
      this.buildUrl(`/competitions${query ? `?${query}` : ''}`),
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * Create a new competition
   */
  async createCompetition(
    params: CreateCompetitionParams,
    creatorAddress: string
  ): Promise<ApiResponse<Competition>> {
    return apiPost<Competition>(
      this.buildUrl('/competitions'),
      { ...params, createdBy: creatorAddress },
      {
        headers: this.getAuthHeaders(creatorAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  /**
   * Join a competition
   */
  async joinCompetition(
    competitionId: string,
    participantAddress: string
  ): Promise<ApiResponse<Competition>> {
    return apiPost<Competition>(
      this.buildUrl(`/competitions/${competitionId}/join`),
      { participantAddress },
      {
        headers: this.getAuthHeaders(participantAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  /**
   * Leave a competition
   */
  async leaveCompetition(
    competitionId: string,
    participantAddress: string
  ): Promise<ApiResponse<Competition>> {
    return apiPost<Competition>(
      this.buildUrl(`/competitions/${competitionId}/leave`),
      { participantAddress },
      {
        headers: this.getAuthHeaders(participantAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  // ===========================================================================
  // ESCROW OPERATIONS
  // ===========================================================================

  /**
   * Get escrow info for a competition
   */
  async getEscrow(competitionId: string): Promise<ApiResponse<EscrowInfo>> {
    return apiGet<EscrowInfo>(
      this.buildUrl(`/escrow/${competitionId}`),
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * Deposit stake to escrow
   */
  async depositToEscrow(
    competitionId: string,
    participantAddress: string,
    amount: string
  ): Promise<ApiResponse<{ txHash: string; escrow: EscrowInfo }>> {
    return apiPost<{ txHash: string; escrow: EscrowInfo }>(
      this.buildUrl(`/escrow/${competitionId}/deposit`),
      { participantAddress, amount },
      {
        headers: this.getAuthHeaders(participantAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  // ===========================================================================
  // NOTIFICATION OPERATIONS
  // ===========================================================================

  /**
   * Subscribe user to push notifications
   */
  async subscribePush(
    walletAddress: string,
    subscription: PushSubscription
  ): Promise<ApiResponse<{ subscribed: boolean }>> {
    return apiPost<{ subscribed: boolean }>(
      this.buildUrl('/notifications/push/subscribe'),
      { walletAddress, subscription },
      {
        headers: this.getAuthHeaders(walletAddress),
        timeout: TIMEOUTS.default,
      }
    );
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(
    walletAddress: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<ApiResponse<{ sent: boolean }>> {
    return apiPost<{ sent: boolean }>(
      this.buildUrl('/notifications/push/send'),
      { walletAddress, notification },
      {
        headers: this.getAuthHeaders(),
        timeout: TIMEOUTS.default,
      }
    );
  }

  // ===========================================================================
  // USER NFT WALLETS (CROSS-PLATFORM INTEGRATION)
  // ===========================================================================

  /**
   * Get all NFT wallets owned by a user address
   * This calls the cryptogift-wallets /api/user/nft-wallets endpoint
   */
  async getUserNFTWallets(
    userAddress: string
  ): Promise<ApiResponse<UserNFTWalletsResponse>> {
    return apiGet<UserNFTWalletsResponse>(
      this.buildUrl(`/user/nft-wallets?address=${userAddress}`),
      {
        headers: this.getAuthHeaders(userAddress),
        timeout: TIMEOUTS.long,
      }
    );
  }

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  /**
   * Check if Wallets service is healthy
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiGet<{ status: string; timestamp: string }>(
      this.buildUrl('/health'),
      {
        timeout: TIMEOUTS.internal,
        noRetry: true,
      }
    );
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const walletsService = new WalletsServiceClient();

// Also export the class for testing
export { WalletsServiceClient };
