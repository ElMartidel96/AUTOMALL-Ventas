/**
 * 🔧 Admin Endpoint - Initialize All 33 DAO Tasks
 *
 * v3.1.0 RECOTIZACIÓN FINAL - Based on TASK_ALLOCATION_MASTER_PLAN.md
 * Total: 52,100 CGC (vs 17,150 anterior = +204% incremento)
 *
 * Only accessible with admin token for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/client'
import { authHelpers } from '@/lib/auth/middleware'
import { ethers } from 'ethers'
import type { Database } from '@/lib/supabase/types'

type Task = Database['public']['Tables']['tasks']['Insert']

// All 33 predefined tasks - v3.1.0 RECOTIZACIÓN FINAL
// Based on TASK_ALLOCATION_MASTER_PLAN.md v3.1.0 - VALORES CORREGIDOS EXACTOS
const PREDEFINED_TASKS: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = [
  // ══════════════════════════════════════════════════════════════════
  // NIVEL EPIC (7,500 CGC) - Complexity 10
  // ══════════════════════════════════════════════════════════════════
  {
    task_id: ethers.utils.id('rc-1155-tokenbone-protocol'),
    title: '🔗 RC-1155 Tokenbone Protocol & Reference',
    description: 'Complete protocol specification with registry (6551 style for 1155), accounts/proxies, ERC-1271/165 compatibility, events, tests and examples',
    complexity: 10,
    reward_cgc: 7500,
    estimated_days: 15,
    platform: 'github',
    category: 'blockchain',
    priority: 'critical',
    status: 'available',
    required_skills: ['solidity', 'erc-1155', 'erc-6551', 'protocol-design'],
    tags: ['tokenbone', 'protocol', 'erc-1155', 'registry'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('ui-ux-redesign'),
    title: '🎨 Complete UI/UX Dashboard Redesign',
    description: 'Redesign the entire DAO dashboard with modern glass-morphism design, improved user experience, and mobile responsiveness. Include Figma mockups.',
    complexity: 9,
    reward_cgc: 2000, // 40 days × 50 CGC
    estimated_days: 40,
    platform: 'github',
    category: 'frontend',
    priority: 'high',
    status: 'available',
    required_skills: ['figma', 'ui-design', 'ux-research'],
    tags: ['design', 'ui', 'ux', 'figma'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('backend-microservices'),
    title: '⚙️ Microservices Backend Architecture',
    description: 'Build scalable microservices architecture for task management, user authentication, and blockchain interactions using Node.js and Docker.',
    complexity: 9,
    reward_cgc: 2000, // 40 days × 50 CGC
    estimated_days: 40,
    platform: 'github',
    category: 'backend',
    priority: 'high',
    status: 'available',
    required_skills: ['nodejs', 'docker', 'microservices'],
    tags: ['backend', 'architecture', 'microservices'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('mobile-app-development'),
    title: '📱 React Native Mobile App',
    description: 'Develop iOS and Android mobile applications for DAO task management with wallet integration and push notifications.',
    complexity: 10,
    reward_cgc: 2250, // 45 days × 50 CGC
    estimated_days: 45,
    platform: 'github',
    category: 'mobile',
    priority: 'medium',
    status: 'available',
    required_skills: ['react-native', 'mobile-development', 'wallet-integration'],
    tags: ['mobile', 'react-native', 'ios', 'android'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('ai-task-matching'),
    title: '🤖 AI-Powered Task Matching System',
    description: 'Implement machine learning algorithm to match tasks with collaborators based on skills, availability, and past performance.',
    complexity: 8,
    reward_cgc: 1750, // 35 days × 50 CGC
    estimated_days: 35,
    platform: 'github',
    category: 'ai',
    priority: 'medium',
    status: 'available',
    required_skills: ['machine-learning', 'python', 'ai'],
    tags: ['ai', 'ml', 'matching', 'algorithm'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('defi-integration'),
    title: '💰 DeFi Yield Farming Integration',
    description: 'Integrate CGC token with major DeFi protocols (Uniswap, Aave, Compound) for yield farming and liquidity provision.',
    complexity: 8,
    reward_cgc: 1750, // 35 days × 50 CGC
    estimated_days: 35,
    platform: 'github',
    category: 'defi',
    priority: 'high',
    status: 'available',
    required_skills: ['defi', 'solidity', 'yield-farming'],
    tags: ['defi', 'yield', 'liquidity', 'uniswap'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('governance-voting'),
    title: '🗳️ Advanced Governance Voting System',
    description: 'Implement quadratic voting, delegation, and multi-choice proposals with gasless voting using EIP-712 signatures.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    estimated_days: 30,
    platform: 'github',
    category: 'governance',
    priority: 'high',
    status: 'available',
    required_skills: ['solidity', 'governance', 'eip-712'],
    tags: ['governance', 'voting', 'quadratic', 'delegation'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('analytics-dashboard'),
    title: '📊 Advanced Analytics Dashboard',
    description: 'Build comprehensive analytics dashboard with task completion rates, collaborator performance metrics, and DAO treasury insights.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    estimated_days: 25,
    platform: 'github',
    category: 'analytics',
    priority: 'medium',
    status: 'available',
    required_skills: ['data-visualization', 'react', 'analytics'],
    tags: ['analytics', 'dashboard', 'metrics', 'insights'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('api-documentation'),
    title: '📚 Comprehensive API Documentation',
    description: 'Create detailed API documentation using OpenAPI/Swagger with interactive examples and SDK generation for multiple languages.',
    complexity: 5,
    reward_cgc: 1000, // 20 days × 50 CGC
    estimated_days: 20,
    platform: 'github',
    category: 'documentation',
    priority: 'medium',
    status: 'available',
    required_skills: ['technical-writing', 'openapi', 'documentation'],
    tags: ['docs', 'api', 'swagger', 'sdk'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('cross-chain-bridge'),
    title: '🌉 Cross-Chain Bridge Implementation',
    description: 'Develop secure bridge for CGC token across Ethereum, Polygon, and Arbitrum with proper validation and monitoring.',
    complexity: 9,
    reward_cgc: 2000, // 40 days × 50 CGC
    estimated_days: 40,
    platform: 'github',
    category: 'blockchain',
    priority: 'medium',
    status: 'available',
    required_skills: ['solidity', 'cross-chain', 'bridge-development'],
    tags: ['bridge', 'cross-chain', 'ethereum', 'polygon'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('security-monitoring'),
    title: '🛡️ Real-time Security Monitoring',
    description: 'Implement comprehensive security monitoring system with anomaly detection, transaction analysis, and automated alerts.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    estimated_days: 30,
    platform: 'github',
    category: 'security',
    priority: 'high',
    status: 'available',
    required_skills: ['security', 'monitoring', 'anomaly-detection'],
    tags: ['security', 'monitoring', 'alerts', 'anomaly'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('nft-rewards-system'),
    title: '🎨 NFT Achievement System',
    description: 'Create dynamic NFT system that evolves based on contributor achievements, task completions, and DAO participation.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    estimated_days: 25,
    platform: 'github',
    category: 'nft',
    priority: 'low',
    status: 'available',
    required_skills: ['solidity', 'nft', 'metadata'],
    tags: ['nft', 'achievements', 'rewards', 'gamification'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('performance-optimization'),
    title: '⚡ Full-Stack Performance Optimization',
    description: 'Optimize application performance including database queries, API endpoints, frontend rendering, and blockchain interactions.',
    complexity: 5,
    reward_cgc: 1000, // 20 days × 50 CGC
    estimated_days: 20,
    platform: 'github',
    category: 'performance',
    priority: 'medium',
    status: 'available',
    required_skills: ['performance', 'optimization', 'profiling'],
    tags: ['performance', 'optimization', 'speed', 'efficiency'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('automated-testing'),
    title: '🧪 Comprehensive Test Suite',
    description: 'Develop end-to-end testing suite including unit tests, integration tests, and automated smart contract testing.',
    complexity: 4,
    reward_cgc: 750, // 15 days × 50 CGC
    estimated_days: 15,
    platform: 'github',
    category: 'testing',
    priority: 'high',
    status: 'available',
    required_skills: ['testing', 'jest', 'playwright'],
    tags: ['testing', 'automation', 'quality-assurance'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('localization-i18n'),
    title: '🌍 Internationalization & Localization',
    description: 'Implement multi-language support for the DAO platform supporting English, Spanish, Chinese, and French.',
    complexity: 4,
    reward_cgc: 750, // 15 days × 50 CGC
    estimated_days: 15,
    platform: 'github',
    category: 'localization',
    priority: 'low',
    status: 'available',
    required_skills: ['i18n', 'localization', 'translation'],
    tags: ['i18n', 'localization', 'multilingual'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('social-features'),
    title: '👥 Social Features & Community Building',
    description: 'Add social features including collaborator profiles, reputation system, mentorship matching, and team formation tools.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    estimated_days: 25,
    platform: 'github',
    category: 'social',
    priority: 'medium',
    status: 'available',
    required_skills: ['social-features', 'community', 'reputation'],
    tags: ['social', 'community', 'profiles', 'mentorship'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('notification-system'),
    title: '🔔 Multi-Channel Notification System',
    description: 'Build notification system supporting email, SMS, push notifications, Discord, and Slack with user preferences.',
    complexity: 5,
    reward_cgc: 1000, // 20 days × 50 CGC
    estimated_days: 20,
    platform: 'github',
    category: 'notifications',
    priority: 'medium',
    status: 'available',
    required_skills: ['notifications', 'integrations', 'messaging'],
    tags: ['notifications', 'email', 'push', 'discord'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('treasury-management'),
    title: '💎 Advanced Treasury Management',
    description: 'Implement sophisticated treasury management with multi-sig operations, automated diversification, and yield optimization.',
    complexity: 8,
    reward_cgc: 1750, // 35 days × 50 CGC
    estimated_days: 35,
    platform: 'github',
    category: 'treasury',
    priority: 'high',
    status: 'available',
    required_skills: ['defi', 'treasury', 'multi-sig'],
    tags: ['treasury', 'multi-sig', 'yield', 'management'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('dispute-resolution'),
    title: '⚖️ Decentralized Dispute Resolution',
    description: 'Create fair dispute resolution system for task conflicts using randomly selected jury panels and economic incentives.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    estimated_days: 30,
    platform: 'github',
    category: 'governance',
    priority: 'medium',
    status: 'available',
    required_skills: ['governance', 'dispute-resolution', 'economics'],
    tags: ['disputes', 'resolution', 'jury', 'governance'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('marketplace-integration'),
    title: '🛒 Freelance Marketplace Integration',
    description: 'Integrate with popular freelance marketplaces (Upwork, Fiverr) to automatically post available tasks and manage applicants.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    estimated_days: 25,
    platform: 'github',
    category: 'integration',
    priority: 'low',
    status: 'available',
    required_skills: ['api-integration', 'marketplace', 'automation'],
    tags: ['marketplace', 'freelance', 'integration', 'automation'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  // Continue with remaining tasks...
  {
    task_id: ethers.utils.id('code-review-automation'),
    title: '🔍 Automated Code Review System',
    description: 'Implement AI-powered code review system that automatically checks submissions for quality, security, and style compliance.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    estimated_days: 30,
    platform: 'github',
    category: 'automation',
    priority: 'medium',
    status: 'available',
    required_skills: ['ai', 'code-analysis', 'automation'],
    tags: ['code-review', 'ai', 'automation', 'quality'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('knowledge-base'),
    title: '📖 Interactive Knowledge Base',
    description: 'Build searchable knowledge base with tutorials, best practices, and troubleshooting guides for DAO contributors.',
    complexity: 4,
    reward_cgc: 750, // 15 days × 50 CGC
    estimated_days: 15,
    platform: 'github',
    category: 'documentation',
    priority: 'medium',
    status: 'available',
    required_skills: ['technical-writing', 'documentation', 'search'],
    tags: ['knowledge-base', 'docs', 'tutorials', 'search'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('reputation-algorithm'),
    title: '🏆 Advanced Reputation Algorithm',
    description: 'Design and implement sophisticated reputation system considering task difficulty, quality, timeliness, and peer reviews.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    estimated_days: 25,
    platform: 'github',
    category: 'algorithm',
    priority: 'medium',
    status: 'available',
    required_skills: ['algorithms', 'reputation', 'mathematics'],
    tags: ['reputation', 'algorithm', 'scoring', 'peer-review'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('compliance-reporting'),
    title: '📋 Regulatory Compliance System',
    description: 'Implement comprehensive compliance reporting for various jurisdictions including KYC/AML checks and tax reporting.',
    complexity: 8,
    reward_cgc: 1750, // 35 days × 50 CGC
    estimated_days: 35,
    platform: 'github',
    category: 'compliance',
    priority: 'high',
    status: 'available',
    required_skills: ['compliance', 'legal', 'reporting'],
    tags: ['compliance', 'kyc', 'aml', 'reporting'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('backup-recovery'),
    title: '💾 Disaster Recovery System',
    description: 'Implement comprehensive backup and disaster recovery system with automatic failover and data redundancy.',
    complexity: 5,
    reward_cgc: 1000, // 20 days × 50 CGC
    category: 'infrastructure',
    priority: 'high',
    status: 'available',
    estimated_days: 20,
    required_skills: ['devops', 'backup', 'disaster-recovery'],
    tags: ['backup', 'recovery', 'failover', 'redundancy'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('integration-testing'),
    title: '🔗 Third-party Integration Testing',
    description: 'Develop comprehensive testing framework for all external integrations including Discord, Zealy, and blockchain networks.',
    complexity: 4,
    reward_cgc: 750, // 15 days × 50 CGC
    category: 'testing',
    priority: 'medium',
    status: 'available',
    estimated_days: 15,
    required_skills: ['testing', 'integration', 'automation'],
    tags: ['integration', 'testing', 'third-party', 'automation'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('workflow-automation'),
    title: '🤖 Advanced Workflow Automation',
    description: 'Create sophisticated workflow automation system for task lifecycle management, approvals, and notifications.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    category: 'automation',
    priority: 'medium',
    status: 'available',
    estimated_days: 25,
    required_skills: ['workflow', 'automation', 'orchestration'],
    tags: ['workflow', 'automation', 'lifecycle', 'orchestration'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('smart-contract-upgrade'),
    title: '🔄 Upgradeable Smart Contract System',
    description: 'Implement secure upgradeable smart contract architecture using proxy patterns with proper governance controls.',
    complexity: 8,
    reward_cgc: 1750, // 35 days × 50 CGC
    category: 'blockchain',
    priority: 'medium',
    status: 'available',
    estimated_days: 35,
    required_skills: ['solidity', 'proxy-patterns', 'upgrades'],
    tags: ['smart-contracts', 'upgrades', 'proxy', 'governance'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('gamification-system'),
    title: '🎮 Advanced Gamification System',
    description: 'Design comprehensive gamification system with levels, badges, streaks, competitions, and seasonal challenges.',
    complexity: 5,
    reward_cgc: 1000, // 20 days × 50 CGC
    category: 'gamification',
    priority: 'low',
    status: 'available',
    estimated_days: 20,
    required_skills: ['gamification', 'game-design', 'psychology'],
    tags: ['gamification', 'badges', 'levels', 'competitions'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('advanced-search'),
    title: '🔍 AI-Powered Search Engine',
    description: 'Implement intelligent search system with natural language processing, semantic search, and personalized results.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    category: 'search',
    priority: 'low',
    status: 'available',
    estimated_days: 30,
    required_skills: ['nlp', 'search', 'elasticsearch'],
    tags: ['search', 'ai', 'nlp', 'semantic'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('blockchain-indexing'),
    title: '⛓️ Custom Blockchain Indexer',
    description: 'Build high-performance blockchain indexer for tracking all DAO-related transactions and events across multiple chains.',
    complexity: 7,
    reward_cgc: 1500, // 30 days × 50 CGC
    category: 'blockchain',
    priority: 'medium',
    status: 'available',
    estimated_days: 30,
    required_skills: ['blockchain', 'indexing', 'performance'],
    tags: ['blockchain', 'indexing', 'events', 'performance'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('bug-bounty-program'),
    title: '🐛 Automated Bug Bounty System',
    description: 'Create automated bug bounty program with smart contract escrow, severity assessment, and automatic payouts.',
    complexity: 6,
    reward_cgc: 1250, // 25 days × 50 CGC
    category: 'security',
    priority: 'medium',
    status: 'available',
    estimated_days: 25,
    required_skills: ['security', 'bug-bounty', 'smart-contracts'],
    tags: ['bug-bounty', 'security', 'automation', 'escrow'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  },
  {
    task_id: ethers.utils.id('component-library'),
    title: '🧩 Reusable Component Library',
    description: 'Build comprehensive React component library with Storybook documentation, TypeScript support, and NPM publishing.',
    complexity: 3,
    reward_cgc: 500, // 10 days × 50 CGC
    estimated_days: 10,
    platform: 'github',
    category: 'frontend',
    priority: 'low',
    status: 'available',
    required_skills: ['react', 'typescript', 'storybook'],
    tags: ['components', 'library', 'react', 'storybook'],
    assignee_address: null,
    assignee_discord_id: null,
    claimed_at: null,
    submitted_at: null,
    completed_at: null,
    evidence_url: null,
    pr_url: null,
    validation_hash: null,
    validators: null,
    metadata: null
  }
]

export const POST = authHelpers.admin(async (request: NextRequest) => {
  try {

    const supabase = await getServerClient()
    
    console.log('🚀 Initializing 34 DAO tasks...')
    
    // Check if tasks already exist
    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('task_id')
      .limit(5)
    
    if (checkError) {
      console.error('Error checking existing tasks:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database connection failed', details: checkError.message },
        { status: 500 }
      )
    }
    
    if (existingTasks && existingTasks.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tasks already initialized',
          message: `Found ${existingTasks.length} existing tasks. Use PATCH to update or DELETE to reset.`
        },
        { status: 409 }
      )
    }
    
    // Insert all tasks in batches to avoid timeouts
    const BATCH_SIZE = 5
    const results: any[] = []
    
    for (let i = 0; i < PREDEFINED_TASKS.length; i += BATCH_SIZE) {
      const batch = PREDEFINED_TASKS.slice(i, i + BATCH_SIZE)
      
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(PREDEFINED_TASKS.length / BATCH_SIZE)}...`)
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(batch as any)
        .select()
      
      if (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to insert tasks',
            details: error instanceof Error ? error.message : String(error),
            batch: Math.floor(i / BATCH_SIZE) + 1
          },
          { status: 500 }
        )
      }
      
      results.push(...(data || []))
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Successfully initialized ${results.length} tasks`)
    
    // Generate summary statistics
    const complexityStats = PREDEFINED_TASKS.reduce((acc, task) => {
      acc[task.complexity] = (acc[task.complexity] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const totalRewards = PREDEFINED_TASKS.reduce((sum, task) => sum + task.reward_cgc, 0)
    
    return NextResponse.json({
      success: true,
      message: 'All 34 DAO tasks initialized successfully',
      data: {
        tasksCreated: results.length,
        totalRewards: totalRewards,
        complexityDistribution: complexityStats,
        categories: Array.from(new Set(PREDEFINED_TASKS.map(t => t.category))),
        avgReward: Math.round(totalRewards / results.length),
        sample: results.slice(0, 3).map(t => ({
          title: t.title,
          complexity: t.complexity,
          reward_cgc: t.reward_cgc
        }))
      }
    })
    
  } catch (error) {
    console.error('Fatal error in task initialization:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

export const GET = authHelpers.admin(async (request: NextRequest) => {
  try {
    const supabase = await getServerClient()
    
    // Get task statistics
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, complexity, reward_cgc, category') as { data: any[] | null, error: any }
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch task statistics', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
    
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        initialized: false,
        message: 'No tasks found. Run POST to initialize all 34 tasks.'
      })
    }
    
    const stats = {
      total: tasks.length,
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byComplexity: tasks.reduce((acc, task) => {
        acc[task.complexity] = (acc[task.complexity] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      byCategory: tasks.reduce((acc, task) => {
        acc[task.category || 'uncategorized'] = (acc[task.category || 'uncategorized'] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      totalRewards: tasks.reduce((sum, task) => sum + (task.reward_cgc || 0), 0)
    }
    
    return NextResponse.json({
      success: true,
      initialized: true,
      expectedTotal: 34,
      actualTotal: tasks.length,
      stats
    })
    
  } catch (error) {
    console.error('Error checking initialization status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})