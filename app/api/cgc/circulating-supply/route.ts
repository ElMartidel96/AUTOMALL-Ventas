import { NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED: This endpoint is deprecated in favor of /api/token/circulating-supply
 * Please use the new CoinGecko-compliant endpoint for accurate supply information.
 *
 * CGC Token Emission Model: Progressive Milestone-Based Minting
 * - Initial Supply: 2,000,000 CGC (current circulating)
 * - Max Supply: 22,000,000 CGC (theoretical maximum via milestone achievements)
 * - New tokens minted ONLY when DAO completes verified milestones
 * - Supply expands proportionally with platform value creation
 */

// CGC Token circulating supply calculation for CoinGecko
const CGC_CONFIG = {
  token_address: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175',
  chain_id: 8453,
  decimals: 18,
  total_supply: '2000000000000000000000000', // 2M CGC initial (22M max via milestones)
  
  // Excluded wallets (not counted as circulating)
  exclude_wallets: [
    '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31', // DAO Treasury (Aragon)
    '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6', // Deployer (Pre-distribution)
    '0x8346CFcaECc90d678d862319449E5a742c03f109', // MilestoneEscrow (Rewards)
    '0x0000000000000000000000000000000000000000', // Null address
    '0x000000000000000000000000000000000000dEaD', // Dead address
  ],
  
  // Current state (Pre-TGE): All tokens in deployer wallet
  // Post-TGE: 200k CGC will be in liquidity pools (10% of supply)
  circulating_supply_pre_tge: '0', // Pre-TGE: 0 in circulation
  circulating_supply_post_tge: '200000000000000000000000', // Post-TGE: 200k CGC (10% for liquidity)
};

export async function GET() {
  try {
    // Current status: Pre-TGE (all tokens in deployer wallet)
    // Formula: Circulating = Total - (Treasury + Locked/Vested + Burn + Deployer)
    
    const response = {
      token_address: CGC_CONFIG.token_address,
      chain_id: CGC_CONFIG.chain_id,
      decimals: CGC_CONFIG.decimals,
      circulating_supply: CGC_CONFIG.circulating_supply_pre_tge, // Pre-TGE: 0
      total_supply: CGC_CONFIG.total_supply,
      exclude_wallets: CGC_CONFIG.exclude_wallets,
      methodology: "Circulating = TotalSupply - (Treasury + Vested/Locked + Burn + Pre-distribution)",
      current_phase: "Pre-TGE",
      tge_date: "2025-01-31",
      post_tge_circulating: CGC_CONFIG.circulating_supply_post_tge,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30min cache
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in CGC circulating supply API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch CGC circulating supply data'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Handle OPTIONS for CORS
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