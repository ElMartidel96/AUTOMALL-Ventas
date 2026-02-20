import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

// In-memory cache to prevent RPC rate limiting
interface CachedStats {
  data: any;
  timestamp: number;
}
let cachedStats: CachedStats | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

// Contract addresses
const CONTRACTS = {
  cgcToken: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175' as const,
  milestoneEscrow: '0x8346CFcaECc90d678d862319449E5a742c03f109' as const,
  aragonDAO: '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31' as const,
  deployer: '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6' as const,
};

// Addresses to exclude from holder count (not real holders)
const EXCLUDED_ADDRESSES = [
  CONTRACTS.milestoneEscrow,
  CONTRACTS.aragonDAO,
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dEaD',
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Create public client for Base
const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

/**
 * Fetch token holders count from BaseScan API
 */
async function fetchHoldersCount(): Promise<number> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY;
    if (!apiKey) {
      console.warn('BASESCAN_API_KEY not set, using fallback holder count');
      return 5; // Fallback
    }

    // Use token holder list endpoint
    const response = await fetch(
      `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${CONTRACTS.cgcToken}&page=1&offset=100&apikey=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    const data = await response.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      // Filter out excluded addresses
      const realHolders = data.result.filter(
        (holder: { TokenHolderAddress: string }) =>
          !EXCLUDED_ADDRESSES.includes(holder.TokenHolderAddress.toLowerCase() as any)
      );
      return realHolders.length;
    }

    // If API fails, try alternative method
    return await fetchHoldersCountAlternative();
  } catch (error) {
    console.error('Error fetching holders from BaseScan:', error);
    return await fetchHoldersCountAlternative();
  }
}

/**
 * Alternative method: count holders from transfer events
 */
async function fetchHoldersCountAlternative(): Promise<number> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY;
    if (!apiKey) return 5;

    // Get token transfers to find unique addresses
    const response = await fetch(
      `https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${CONTRACTS.cgcToken}&page=1&offset=1000&sort=desc&apikey=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    const data = await response.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      // Collect unique addresses
      const addresses = new Set<string>();
      data.result.forEach((tx: { to: string; from: string }) => {
        if (tx.to) addresses.add(tx.to.toLowerCase());
        if (tx.from) addresses.add(tx.from.toLowerCase());
      });

      // Filter out excluded and count
      const realHolders = Array.from(addresses).filter(
        addr => !EXCLUDED_ADDRESSES.some(ex => ex.toLowerCase() === addr)
      );

      return realHolders.length;
    }

    return 5; // Fallback
  } catch (error) {
    console.error('Error in alternative holders count:', error);
    return 5;
  }
}

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL_MS) {
      console.log('[CGC Stats] Returning cached data (age:', Math.round((now - cachedStats.timestamp) / 1000), 's)');
      return NextResponse.json(cachedStats.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        },
      });
    }

    console.log('[CGC Stats] Fetching fresh data from blockchain...');

    // Fetch all data from blockchain in parallel
    const [totalSupplyRaw, treasuryBalanceRaw, escrowBalanceRaw, holdersCount] = await Promise.all([
      client.readContract({
        address: CONTRACTS.cgcToken,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
      client.readContract({
        address: CONTRACTS.cgcToken,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [CONTRACTS.aragonDAO],
      }),
      client.readContract({
        address: CONTRACTS.cgcToken,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [CONTRACTS.milestoneEscrow],
      }),
      fetchHoldersCount(),
    ]);

    // Format values
    const totalSupply = formatUnits(totalSupplyRaw, 18);
    const treasuryBalance = formatUnits(treasuryBalanceRaw, 18);
    const escrowBalance = formatUnits(escrowBalanceRaw, 18);

    // Calculate circulating supply (Total - Treasury - Escrow)
    const circulatingSupply = (
      parseFloat(totalSupply) -
      parseFloat(treasuryBalance) -
      parseFloat(escrowBalance)
    ).toFixed(2);

    const response = {
      success: true,
      data: {
        totalSupply,
        totalSupplyFormatted: `${(parseFloat(totalSupply) / 1000000).toFixed(2)}M CGC`,
        circulatingSupply,
        circulatingSupplyFormatted: `${(parseFloat(circulatingSupply) / 1000).toFixed(0)}K CGC`,
        treasuryBalance,
        treasuryBalanceFormatted: `${(parseFloat(treasuryBalance) / 1000).toFixed(0)}K CGC`,
        escrowBalance,
        escrowBalanceFormatted: `${(parseFloat(escrowBalance) / 1000).toFixed(0)}K CGC`,
        holdersCount,
        holdersCountExcluding: EXCLUDED_ADDRESSES.length,
      },
      contracts: CONTRACTS,
      excludedFromCirculating: [
        { address: CONTRACTS.aragonDAO, name: 'DAO Treasury' },
        { address: CONTRACTS.milestoneEscrow, name: 'Milestone Escrow' },
      ],
      methodology: 'Circulating = TotalSupply - Treasury - Escrow. Holders excludes Treasury, Escrow, null and dead addresses.',
      chainId: 8453,
      updatedAt: new Date().toISOString(),
    };

    // Store in cache
    cachedStats = { data: response, timestamp: now };
    console.log('[CGC Stats] Data cached successfully');

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching CGC stats:', error);

    // Return cached data if available, even if stale
    if (cachedStats) {
      console.log('[CGC Stats] RPC error, returning stale cached data');
      return NextResponse.json(cachedStats.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'STALE',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blockchain data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
