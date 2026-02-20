/**
 * 🤝 REFERRAL SERVICE - Enterprise-grade Multi-Level Referral System
 *
 * Core service for managing the CryptoGift DAO referral program.
 * Features:
 * - 3-level commission structure (10%, 5%, 2.5%)
 * - Milestone bonuses (5, 10, 25, 50, 100 referrals)
 * - Real-time tracking and analytics
 * - Fraud prevention
 * - Influencer network management
 *
 * @version 1.0.0
 * @author CryptoGift DAO
 */

import { getTypedClient, cachedQuery, clearCache } from '@/lib/supabase/client';
import type {
  ReferralCode,
  ReferralCodeInsert,
  Referral,
  ReferralInsert,
  ReferralReward,
  ReferralRewardInsert,
  ReferralClick,
  ReferralClickInsert,
  ReferralLevel,
  ReferralStatus,
  ReferralRewardType,
} from '@/lib/supabase/types';

// =====================================================
// 📊 CONSTANTS & CONFIGURATION
// =====================================================

/** Commission rates by level */
export const COMMISSION_RATES: Record<ReferralLevel, number> = {
  1: 0.10,  // 10% for direct referrals
  2: 0.05,  // 5% for level 2
  3: 0.025, // 2.5% for level 3
};

/** Milestone bonus structure */
export const MILESTONE_BONUSES: Record<number, number> = {
  5: 50,      // 50 CGC for 5 referrals
  10: 150,    // 150 CGC for 10 referrals
  25: 500,    // 500 CGC for 25 referrals
  50: 1500,   // 1500 CGC for 50 referrals
  100: 5000,  // 5000 CGC for 100 referrals
};

/** Activation bonus when a referral becomes active */
export const ACTIVATION_BONUS = 5; // 5 CGC

/** Minimum tasks completed to be considered "active" */
export const ACTIVATION_THRESHOLD = 1;

// =====================================================
// 🔧 UTILITY FUNCTIONS
// =====================================================

/**
 * Generate a unique referral code from wallet address
 * Format: CG-XXXXXX (6 chars from address)
 */
export function generateReferralCode(walletAddress: string): string {
  if (!walletAddress || walletAddress.length < 10) {
    throw new Error('Invalid wallet address');
  }
  // Use first 6 chars after '0x' and make uppercase
  const shortened = walletAddress.slice(2, 8).toUpperCase();
  return `CG-${shortened}`;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^CG-[A-F0-9]{6}$/i.test(code);
}

/**
 * Hash IP address for privacy-compliant tracking
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + process.env.REFERRAL_SALT || 'cgdao-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Shorten wallet address for display
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// =====================================================
// 📋 REFERRAL CODE OPERATIONS
// =====================================================

/**
 * Get or create a referral code for a wallet address
 */
export async function getOrCreateReferralCode(walletAddress: string): Promise<ReferralCode> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Check if code already exists
  const { data: existing, error: fetchError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (existing && !fetchError) {
    return existing;
  }

  // Create new referral code
  const code = generateReferralCode(walletAddress);

  const newCode: ReferralCodeInsert = {
    wallet_address: normalizedAddress,
    code,
    is_active: true,
    total_referrals: 0,
    total_earnings: 0,
    click_count: 0,
  };

  const { data: created, error: createError } = await supabase
    .from('referral_codes')
    .insert(newCode)
    .select()
    .single();

  if (createError) {
    // Handle race condition - code might already exist
    if (createError.code === '23505') { // Unique violation
      const { data: retry } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single();
      if (retry) return retry;
    }
    throw new Error(`Failed to create referral code: ${createError.message}`);
  }

  return created;
}

/**
 * Get referral code by code string
 */
export async function getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
  const supabase = getTypedClient();

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .or(`code.eq.${code},custom_code.eq.${code}`)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch referral code: ${error.message}`);
  }

  return data;
}

/**
 * Set custom referral code (for influencers/VIPs)
 */
export async function setCustomCode(
  walletAddress: string,
  customCode: string
): Promise<ReferralCode> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Validate custom code format (alphanumeric, 4-20 chars)
  if (!/^[A-Za-z0-9]{4,20}$/.test(customCode)) {
    throw new Error('Custom code must be 4-20 alphanumeric characters');
  }

  // Check if custom code is already taken
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('wallet_address')
    .eq('custom_code', customCode.toUpperCase())
    .single();

  if (existing && existing.wallet_address !== normalizedAddress) {
    throw new Error('Custom code is already taken');
  }

  const { data, error } = await supabase
    .from('referral_codes')
    .update({ custom_code: customCode.toUpperCase() })
    .eq('wallet_address', normalizedAddress)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set custom code: ${error.message}`);
  }

  clearCache('referral_code');
  return data;
}

// =====================================================
// 👥 REFERRAL RELATIONSHIP OPERATIONS
// =====================================================

/**
 * Register a new referral relationship
 * This is called when a new user signs up with a referral code
 */
export async function registerReferral(
  referredAddress: string,
  referralCode: string,
  source?: string,
  campaign?: string
): Promise<Referral | null> {
  const supabase = getTypedClient();
  const normalizedReferred = referredAddress.toLowerCase();

  // Get the referral code info
  const codeInfo = await getReferralCodeByCode(referralCode);
  if (!codeInfo || !codeInfo.is_active) {
    console.warn('Invalid or inactive referral code:', referralCode);
    return null;
  }

  // Prevent self-referral
  if (codeInfo.wallet_address === normalizedReferred) {
    console.warn('Self-referral attempted:', normalizedReferred);
    return null;
  }

  // Check if user is already referred
  const { data: existingRef } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_address', normalizedReferred)
    .single();

  if (existingRef) {
    console.warn('User already has a referrer:', normalizedReferred);
    return null;
  }

  // Create the referral relationship
  const newReferral: ReferralInsert = {
    referrer_address: codeInfo.wallet_address,
    referred_address: normalizedReferred,
    referral_code: codeInfo.code,
    level: 1,
    status: 'pending',
    source: source || 'direct',
    campaign: campaign || null,
    tasks_completed: 0,
    cgc_earned: 0,
    referrer_earnings: 0,
  };

  const { data: referral, error } = await supabase
    .from('referrals')
    .insert(newReferral)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already registered - return existing
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_address', normalizedReferred)
        .single();
      return existing;
    }
    throw new Error(`Failed to register referral: ${error.message}`);
  }

  // Create level 2 and 3 referrals (upline chain)
  await createUplineReferrals(codeInfo.wallet_address, normalizedReferred, referralCode);

  // Update referral code stats (handled by trigger, but let's be explicit)
  clearCache('referral_stats');
  clearCache('referral_code');

  return referral;
}

/**
 * Create upline referrals (levels 2 and 3)
 */
async function createUplineReferrals(
  level1Referrer: string,
  referredAddress: string,
  originalCode: string
): Promise<void> {
  const supabase = getTypedClient();

  // Find level 1 referrer's referrer (becomes level 2)
  const { data: level2Ref } = await supabase
    .from('referrals')
    .select('referrer_address, referral_code')
    .eq('referred_address', level1Referrer)
    .eq('level', 1)
    .single();

  if (level2Ref) {
    // Create level 2 relationship
    await supabase.from('referrals').insert({
      referrer_address: level2Ref.referrer_address,
      referred_address: referredAddress,
      referral_code: level2Ref.referral_code,
      level: 2,
      status: 'pending',
      tasks_completed: 0,
      cgc_earned: 0,
      referrer_earnings: 0,
    }).select();

    // Find level 2 referrer's referrer (becomes level 3)
    const { data: level3Ref } = await supabase
      .from('referrals')
      .select('referrer_address, referral_code')
      .eq('referred_address', level2Ref.referrer_address)
      .eq('level', 1)
      .single();

    if (level3Ref) {
      await supabase.from('referrals').insert({
        referrer_address: level3Ref.referrer_address,
        referred_address: referredAddress,
        referral_code: level3Ref.referral_code,
        level: 3,
        status: 'pending',
        tasks_completed: 0,
        cgc_earned: 0,
        referrer_earnings: 0,
      }).select();
    }
  }
}

/**
 * Activate a referral when they complete their first task
 */
export async function activateReferral(referredAddress: string): Promise<void> {
  const supabase = getTypedClient();
  const normalizedAddress = referredAddress.toLowerCase();

  // Update all referral relationships for this user to active
  const { data: referrals, error } = await supabase
    .from('referrals')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
    })
    .eq('referred_address', normalizedAddress)
    .eq('status', 'pending')
    .select();

  if (error) {
    console.error('Failed to activate referral:', error);
    return;
  }

  // Award activation bonus to level 1 referrer
  if (referrals && referrals.length > 0) {
    const level1Referral = referrals.find((r: Referral) => r.level === 1);
    if (level1Referral) {
      await createReward({
        referrer_address: level1Referral.referrer_address,
        referred_address: normalizedAddress,
        reward_type: 'activation_bonus',
        amount: ACTIVATION_BONUS,
        status: 'pending',
      });
    }
  }

  clearCache('referral_stats');
}

// =====================================================
// 💰 COMMISSION & REWARD OPERATIONS
// =====================================================

/**
 * Calculate and distribute commissions when a referral earns CGC
 * Called when a task is completed and paid
 */
export async function distributeCommissions(
  earnerAddress: string,
  cgcAmount: number,
  taskId: string
): Promise<ReferralReward[]> {
  const supabase = getTypedClient();
  const normalizedAddress = earnerAddress.toLowerCase();
  const rewards: ReferralReward[] = [];

  // Get all referrers for this user (up to 3 levels)
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_address', normalizedAddress)
    .eq('status', 'active')
    .order('level', { ascending: true });

  if (error || !referrals || referrals.length === 0) {
    return rewards;
  }

  // Calculate and create rewards for each level
  for (const referral of referrals) {
    const level = referral.level as ReferralLevel;
    const commissionRate = COMMISSION_RATES[level];
    const commission = cgcAmount * commissionRate;

    if (commission > 0) {
      const rewardType: ReferralRewardType =
        level === 1 ? 'direct_bonus' :
        level === 2 ? 'level2_bonus' : 'level3_bonus';

      const reward = await createReward({
        referrer_address: referral.referrer_address,
        referred_address: normalizedAddress,
        reward_type: rewardType,
        amount: commission,
        task_id: taskId,
        status: 'pending',
      });

      if (reward) {
        rewards.push(reward);

        // Update referral earnings
        await supabase
          .from('referrals')
          .update({
            referrer_earnings: (referral.referrer_earnings || 0) + commission,
            last_activity: new Date().toISOString(),
          })
          .eq('id', referral.id);
      }
    }
  }

  // Update referred user's stats
  const level1Referral = referrals.find((r: Referral) => r.level === 1);
  if (level1Referral) {
    await supabase
      .from('referrals')
      .update({
        tasks_completed: (level1Referral.tasks_completed || 0) + 1,
        cgc_earned: (level1Referral.cgc_earned || 0) + cgcAmount,
        last_activity: new Date().toISOString(),
      })
      .eq('referred_address', normalizedAddress)
      .eq('level', 1);
  }

  // Check for milestone bonuses
  for (const referral of referrals.filter((r: Referral) => r.level === 1)) {
    await checkAndAwardMilestone(referral.referrer_address);
  }

  clearCache('referral_stats');
  return rewards;
}

/**
 * Check and award milestone bonuses
 */
export async function checkAndAwardMilestone(walletAddress: string): Promise<ReferralReward | null> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Get current referral code info
  const { data: codeInfo } = await supabase
    .from('referral_codes')
    .select('total_referrals')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (!codeInfo) return null;

  const totalReferrals = codeInfo.total_referrals;

  // Check each milestone
  for (const [milestone, bonus] of Object.entries(MILESTONE_BONUSES)) {
    const milestoneNum = parseInt(milestone);

    if (totalReferrals >= milestoneNum) {
      const rewardType = `milestone_${milestone}` as ReferralRewardType;

      // Check if this milestone was already awarded
      const { data: existing } = await supabase
        .from('referral_rewards')
        .select('id')
        .eq('referrer_address', normalizedAddress)
        .eq('reward_type', rewardType)
        .in('status', ['pending', 'processing', 'paid'])
        .single();

      if (!existing) {
        // Award milestone bonus
        return await createReward({
          referrer_address: normalizedAddress,
          referred_address: normalizedAddress, // Self-reward for milestone
          reward_type: rewardType,
          amount: bonus,
          milestone_reached: milestoneNum,
          status: 'pending',
        });
      }
    }
  }

  return null;
}

/**
 * Create a reward record
 */
export async function createReward(
  rewardData: ReferralRewardInsert
): Promise<ReferralReward | null> {
  const supabase = getTypedClient();

  const { data, error } = await supabase
    .from('referral_rewards')
    .insert(rewardData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create reward:', error);
    return null;
  }

  // Update total earnings in referral_codes
  await supabase
    .from('referral_codes')
    .update({
      total_earnings: supabase.rpc('increment_earnings', {
        p_wallet: rewardData.referrer_address,
        p_amount: rewardData.amount,
      }),
    })
    .eq('wallet_address', rewardData.referrer_address);

  return data;
}

/**
 * Process pending rewards (mark as paid after blockchain confirmation)
 */
export async function processReward(
  rewardId: string,
  txHash: string,
  blockNumber: number
): Promise<ReferralReward | null> {
  const supabase = getTypedClient();

  const { data, error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'paid',
      tx_hash: txHash,
      block_number: blockNumber,
      paid_at: new Date().toISOString(),
    })
    .eq('id', rewardId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Failed to process reward:', error);
    return null;
  }

  clearCache('referral_rewards');
  return data;
}

// =====================================================
// 📊 ANALYTICS & TRACKING
// =====================================================

/**
 * Track a click on a referral link
 * Returns object with success status and any error message
 */
export async function trackClick(clickData: {
  referralCode: string;
  ipHash?: string;
  userAgent?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referer?: string;
  landingPage?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getTypedClient();

  try {
    // Validate referral code exists
    const codeExists = await getReferralCodeByCode(clickData.referralCode);
    if (!codeExists) {
      console.warn(`[ReferralService] Click tracked for non-existent code: ${clickData.referralCode}`);
      return { success: false, error: 'Invalid referral code' };
    }

    if (!codeExists.is_active) {
      console.warn(`[ReferralService] Click tracked for inactive code: ${clickData.referralCode}`);
      return { success: false, error: 'Referral code is inactive' };
    }

    const click: ReferralClickInsert = {
      referral_code: codeExists.code, // Use canonical code
      ip_hash: clickData.ipHash || null,
      user_agent: clickData.userAgent || null,
      device_type: clickData.deviceType || 'unknown',
      browser: clickData.browser || null,
      os: clickData.os || null,
      country: clickData.country || null,
      city: clickData.city || null,
      source: clickData.source || null,
      medium: clickData.medium || null,
      campaign: clickData.campaign || null,
      referer: clickData.referer || null,
      landing_page: clickData.landingPage || null,
      converted: false,
    };

    const { error: insertError } = await supabase.from('referral_clicks').insert(click);

    if (insertError) {
      console.error('[ReferralService] Failed to insert click:', insertError);
      return { success: false, error: insertError.message };
    }

    // Update click count atomically using RPC or increment
    const { error: updateError } = await supabase
      .from('referral_codes')
      .update({
        click_count: (codeExists.click_count || 0) + 1,
      })
      .eq('code', codeExists.code);

    if (updateError) {
      console.error('[ReferralService] Failed to update click count:', updateError);
      // Don't fail the whole operation, click was tracked
    }

    return { success: true };
  } catch (err) {
    console.error('[ReferralService] Error in trackClick:', err);
    return { success: false, error: 'Internal error tracking click' };
  }
}

/**
 * Mark a click as converted
 * Returns true if a click was marked, false if no matching click found
 */
export async function markClickConverted(
  ipHash: string,
  convertedAddress: string
): Promise<boolean> {
  const supabase = getTypedClient();

  try {
    const { data, error } = await supabase
      .from('referral_clicks')
      .update({
        converted: true,
        converted_address: convertedAddress.toLowerCase(),
        conversion_time: new Date().toISOString(),
      })
      .eq('ip_hash', ipHash)
      .eq('converted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) {
      console.error('[ReferralService] Failed to mark click converted:', error);
      return false;
    }

    // Log success for tracking
    if (data && data.length > 0) {
      console.log(`[ReferralService] Marked click as converted for ${convertedAddress.slice(0, 10)}...`);
      return true;
    }

    // No matching click found (user may have cleared cookies)
    return false;
  } catch (err) {
    console.error('[ReferralService] Error in markClickConverted:', err);
    return false;
  }

  // Note: Conversion rate calculation is done in daily job
}

// =====================================================
// 📈 STATISTICS & REPORTING
// =====================================================

/**
 * Get comprehensive stats for a wallet address
 */
export async function getReferralStats(walletAddress: string): Promise<{
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  totalEarned: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  clickCount: number;
  conversionRate: number;
  rank: number;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  return await cachedQuery(
    `referral_stats_${normalizedAddress}`,
    async () => {
      // Get referral code info
      const { data: codeInfo } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single();

      if (!codeInfo) {
        // Create code if doesn't exist
        const newCode = await getOrCreateReferralCode(walletAddress);
        return {
          code: newCode.code,
          totalReferrals: 0,
          activeReferrals: 0,
          pendingRewards: 0,
          totalEarned: 0,
          level1Count: 0,
          level2Count: 0,
          level3Count: 0,
          clickCount: 0,
          conversionRate: 0,
          rank: 0,
        };
      }

      // Get referral counts by level (REAL counts, not cached counters)
      const { data: referrals } = await supabase
        .from('referrals')
        .select('level, status, referrer_earnings')
        .eq('referrer_address', normalizedAddress);

      const level1 = referrals?.filter((r: { level: number }) => r.level === 1) || [];
      const level2 = referrals?.filter((r: { level: number }) => r.level === 2) || [];
      const level3 = referrals?.filter((r: { level: number }) => r.level === 3) || [];
      const active = referrals?.filter((r: { status: string }) => r.status === 'active') || [];

      // 🔧 FIX: Calculate total referrals from ACTUAL data (not broken counter)
      const totalReferralsActual = (referrals || []).length;

      // Get pending rewards
      const { data: pendingRewards } = await supabase
        .from('referral_rewards')
        .select('amount')
        .eq('referrer_address', normalizedAddress)
        .eq('status', 'pending');

      const pendingTotal = pendingRewards?.reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0) || 0;

      // 🔧 FIX: Calculate total earnings from referral_rewards (not broken counter)
      const { data: paidRewards } = await supabase
        .from('referral_rewards')
        .select('amount')
        .eq('referrer_address', normalizedAddress)
        .eq('status', 'paid');

      const totalEarnedActual = paidRewards?.reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0) || 0;

      // Get rank
      const { data: rankData } = await supabase
        .from('referral_leaderboard')
        .select('earnings_rank')
        .eq('wallet_address', normalizedAddress)
        .single();

      return {
        code: codeInfo.custom_code || codeInfo.code,
        // 🔧 FIX: Use ACTUAL count instead of potentially broken counter
        totalReferrals: totalReferralsActual,
        activeReferrals: active.length,
        pendingRewards: pendingTotal,
        // 🔧 FIX: Use ACTUAL earnings from referral_rewards table
        totalEarned: totalEarnedActual,
        level1Count: level1.length,
        level2Count: level2.length,
        level3Count: level3.length,
        clickCount: codeInfo.click_count || 0,
        conversionRate: Number(codeInfo.conversion_rate) || 0,
        rank: rankData?.earnings_rank || 0,
      };
    },
    30 // Cache for 30 seconds
  );
}

/**
 * Get referral network (tree) for a wallet
 * Includes profile data (username, avatar) for each referral
 */
export async function getReferralNetwork(
  walletAddress: string,
  options: {
    level?: number;
    status?: ReferralStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  referrals: Array<{
    id: string;
    address: string;
    level: number;
    status: string;
    tasksCompleted: number;
    cgcEarned: number;
    referrerEarnings: number;
    joinedAt: string;
    lastActivity: string | null;
    username?: string;
    displayName?: string;
    avatar?: string;
  }>;
  total: number;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // 🔧 FIX: Query 'referrals' table directly instead of 'referral_network' view
  // The view definition varies across migrations and may be missing 'referrer_address' column
  let query = supabase
    .from('referrals')
    .select('*', { count: 'exact' })
    .eq('referrer_address', normalizedAddress);

  if (options.level) {
    query = query.eq('level', options.level);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  query = query
    .order('joined_at', { ascending: false })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 50) - 1
    );

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get referral network: ${error.message}`);
  }

  // Get profile data for all referred addresses
  const referredAddresses = (data || []).map((r: Referral) => r.referred_address.toLowerCase());

  let profileMap: Map<string, { username?: string; display_name?: string; avatar_url?: string }> = new Map();

  if (referredAddresses.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('wallet_address, username, display_name, avatar_url')
      .in('wallet_address', referredAddresses);

    if (profiles) {
      profiles.forEach((p: { wallet_address: string; username?: string; display_name?: string; avatar_url?: string }) => {
        profileMap.set(p.wallet_address.toLowerCase(), {
          username: p.username || undefined,
          display_name: p.display_name || undefined,
          avatar_url: p.avatar_url || undefined,
        });
      });
    }
  }

  return {
    referrals: (data || []).map((r: Referral & { username?: string; avatar_url?: string }) => {
      const profile = profileMap.get(r.referred_address.toLowerCase());
      return {
        id: r.id,
        address: r.referred_address,
        level: r.level,
        status: r.status,
        tasksCompleted: r.tasks_completed,
        cgcEarned: Number(r.cgc_earned),
        referrerEarnings: Number(r.referrer_earnings),
        joinedAt: r.joined_at,
        lastActivity: r.last_activity,
        // Prefer profile data over VIEW data (profile data is more up-to-date)
        username: profile?.username || r.username || undefined,
        displayName: profile?.display_name || undefined,
        avatar: profile?.avatar_url || r.avatar_url || undefined,
      };
    }),
    total: count || 0,
  };
}

/**
 * Get reward history for a wallet
 */
export async function getRewardHistory(
  walletAddress: string,
  options: {
    status?: string;
    type?: ReferralRewardType;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  rewards: ReferralReward[];
  total: number;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  let query = supabase
    .from('referral_rewards')
    .select('*', { count: 'exact' })
    .eq('referrer_address', normalizedAddress);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.type) {
    query = query.eq('reward_type', options.type);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 50) - 1
    );

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get reward history: ${error.message}`);
  }

  return {
    rewards: data || [],
    total: count || 0,
  };
}

/**
 * Get global referral leaderboard
 */
export async function getLeaderboard(
  options: {
    sortBy?: 'earnings' | 'referrals';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  entries: Array<{
    rank: number;
    address: string;
    code: string;
    totalReferrals: number;
    totalEarnings: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  }>;
  total: number;
}> {
  const supabase = getTypedClient();

  const orderColumn = options.sortBy === 'referrals' ? 'referrals_rank' : 'earnings_rank';

  const { data, error, count } = await supabase
    .from('referral_leaderboard')
    .select('*', { count: 'exact' })
    .order(orderColumn, { ascending: true })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 50) - 1
    );

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  interface LeaderboardRow {
    earnings_rank: number;
    wallet_address: string;
    code: string;
    total_referrals: number;
    total_earnings: number;
    level1_count: number;
    level2_count: number;
    level3_count: number;
  }

  return {
    entries: (data || []).map((entry: LeaderboardRow) => ({
      rank: entry.earnings_rank,
      address: entry.wallet_address,
      code: entry.code,
      totalReferrals: entry.total_referrals,
      totalEarnings: Number(entry.total_earnings),
      level1Count: entry.level1_count,
      level2Count: entry.level2_count,
      level3Count: entry.level3_count,
    })),
    total: count || 0,
  };
}

/**
 * Get click analytics for a referral code
 */
export async function getClickAnalytics(
  walletAddress: string,
  options: {
    days?: number;
  } = {}
): Promise<{
  totalClicks: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
  bySource: Record<string, number>;
  byDevice: Record<string, number>;
  byCountry: Record<string, number>;
  dailyClicks: Array<{ date: string; clicks: number; conversions: number }>;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();
  const days = options.days || 30;

  // Get the user's referral code
  const { data: codeInfo } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (!codeInfo) {
    return {
      totalClicks: 0,
      uniqueVisitors: 0,
      conversions: 0,
      conversionRate: 0,
      bySource: {},
      byDevice: {},
      byCountry: {},
      dailyClicks: [],
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get clicks data
  const { data: clicks } = await supabase
    .from('referral_clicks')
    .select('*')
    .eq('referral_code', codeInfo.code)
    .gte('created_at', startDate.toISOString());

  if (!clicks || clicks.length === 0) {
    return {
      totalClicks: 0,
      uniqueVisitors: 0,
      conversions: 0,
      conversionRate: 0,
      bySource: {},
      byDevice: {},
      byCountry: {},
      dailyClicks: [],
    };
  }

  // Calculate metrics
  const uniqueIPs = new Set(clicks.map((c: ReferralClick) => c.ip_hash).filter(Boolean));
  const conversions = clicks.filter((c: ReferralClick) => c.converted).length;

  // Group by source
  const bySource: Record<string, number> = {};
  clicks.forEach((c: ReferralClick) => {
    const source = c.source || 'direct';
    bySource[source] = (bySource[source] || 0) + 1;
  });

  // Group by device
  const byDevice: Record<string, number> = {};
  clicks.forEach((c: ReferralClick) => {
    const device = c.device_type || 'unknown';
    byDevice[device] = (byDevice[device] || 0) + 1;
  });

  // Group by country
  const byCountry: Record<string, number> = {};
  clicks.forEach((c: ReferralClick) => {
    const country = c.country || 'Unknown';
    byCountry[country] = (byCountry[country] || 0) + 1;
  });

  // Daily aggregation
  const dailyMap = new Map<string, { clicks: number; conversions: number }>();
  clicks.forEach((c: ReferralClick) => {
    const date = new Date(c.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { clicks: 0, conversions: 0 };
    existing.clicks++;
    if (c.converted) existing.conversions++;
    dailyMap.set(date, existing);
  });

  const dailyClicks = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalClicks: clicks.length,
    uniqueVisitors: uniqueIPs.size,
    conversions,
    conversionRate: clicks.length > 0 ? (conversions / clicks.length) * 100 : 0,
    bySource,
    byDevice,
    byCountry,
    dailyClicks,
  };
}

// =====================================================
// 🔒 FRAUD PREVENTION
// =====================================================

/**
 * Check if a referral registration looks suspicious
 */
export async function checkFraudIndicators(
  referredAddress: string,
  ipHash?: string
): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  const supabase = getTypedClient();
  const reasons: string[] = [];

  // Check for multiple accounts from same IP in short time
  if (ipHash) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('converted', true)
      .gte('conversion_time', oneHourAgo);

    if (count && count > 3) {
      reasons.push('Multiple conversions from same IP in short time');
    }
  }

  // Check if address has been banned before
  const { data: bannedRef } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_address', referredAddress.toLowerCase())
    .eq('status', 'banned')
    .single();

  if (bannedRef) {
    reasons.push('Address was previously banned');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Ban a referral for fraud
 */
export async function banReferral(
  referredAddress: string,
  reason: string
): Promise<void> {
  const supabase = getTypedClient();

  await supabase
    .from('referrals')
    .update({
      status: 'banned',
      metadata: {
        ban_reason: reason,
        banned_at: new Date().toISOString(),
      },
    })
    .eq('referred_address', referredAddress.toLowerCase());

  // Cancel any pending rewards related to this referral
  await supabase
    .from('referral_rewards')
    .update({
      status: 'cancelled',
      notes: `Cancelled due to ban: ${reason}`,
    })
    .eq('referred_address', referredAddress.toLowerCase())
    .eq('status', 'pending');

  clearCache('referral_stats');
}

// =====================================================
// 🔧 ADMIN OPERATIONS
// =====================================================

/**
 * Get pending rewards for admin processing
 */
export async function getPendingRewards(
  options: { limit?: number; offset?: number } = {}
): Promise<{
  rewards: ReferralReward[];
  total: number;
  totalAmount: number;
}> {
  const supabase = getTypedClient();

  const { data, error, count } = await supabase
    .from('referral_rewards')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 100) - 1
    );

  if (error) {
    throw new Error(`Failed to get pending rewards: ${error.message}`);
  }

  const totalAmount = (data || []).reduce((sum: number, r: ReferralReward) => sum + Number(r.amount), 0);

  return {
    rewards: data || [],
    total: count || 0,
    totalAmount,
  };
}

/**
 * Batch process rewards
 */
export async function batchProcessRewards(
  rewardIds: string[],
  txHash: string,
  blockNumber: number
): Promise<number> {
  const supabase = getTypedClient();

  const { data, error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'paid',
      tx_hash: txHash,
      block_number: blockNumber,
      paid_at: new Date().toISOString(),
    })
    .in('id', rewardIds)
    .eq('status', 'pending')
    .select();

  if (error) {
    throw new Error(`Failed to batch process rewards: ${error.message}`);
  }

  clearCache('referral_rewards');
  return data?.length || 0;
}

// =====================================================
// 📤 EXPORTS
// =====================================================

export type {
  ReferralCode,
  Referral,
  ReferralReward,
  ReferralClick,
  ReferralLevel,
  ReferralStatus,
  ReferralRewardType,
};
