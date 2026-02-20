/**
 * 🔗 MBXarts Integration Hub
 *
 * Central export point for all cross-service integrations.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

// Configuration
export * from './config';

// API Client
export * from './api-client';

// Middleware
export * from './middleware';

// Service Clients
export { walletsService, WalletsServiceClient } from './wallets-service';
export type {
  WalletInfo,
  WalletBalance,
  Competition,
  CreateCompetitionParams,
  EscrowInfo,
  PushSubscription,
} from './wallets-service';
