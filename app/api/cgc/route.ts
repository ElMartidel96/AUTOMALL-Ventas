import { NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED: This endpoint is deprecated in favor of /api/token/total-supply
 * Please use the new CoinGecko-compliant endpoint for accurate supply information.
 *
 * CGC uses milestone-based progressive emission:
 * Initial: 2M CGC → Max: 22M CGC (via verified milestone achievements)
 */

// Simple CGC Token API for CoinGecko
export async function GET() {
  try {
    const response = {
      token_address: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175',
      chain_id: 8453,
      decimals: 18,
      total_supply: '2000000000000000000000000',
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}