/**
 * 🪙 Total Supply API Endpoint
 *
 * CoinGecko-compliant endpoint for CGC token supply information
 * Returns max supply and circulating supply in CGC units (no decimals)
 *
 * Endpoint: GET /api/token/total-supply
 * Response: {
 *   "total_supply": "22000000",
 *   "circulating_supply": "2000000",
 *   "emission_model": "milestone-based"
 * }
 *
 * Contract: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 (Base Mainnet)
 *
 * Emission Model: Progressive Milestone-Based Minting
 * - Initial Supply: 2,000,000 CGC (in circulation)
 * - Max Supply: 22,000,000 CGC (theoretical maximum)
 * - New tokens are minted ONLY when DAO completes verified milestones
 * - MilestoneEscrow contract (0x8346...3f109) is authorized minter
 *
 * Made by mbxarts.com The Moon in a Box property
 */

import { NextResponse } from 'next/server';

// CGC Token Supply Configuration
const MAX_SUPPLY = '22000000';           // Theoretical maximum supply
const CIRCULATING_SUPPLY = '2000000';    // Current circulating supply
const EMISSION_MODEL = 'milestone-based'; // Progressive emission model

/**
 * GET handler for total supply endpoint
 * @returns {Promise<NextResponse>} JSON response with supply information
 */
export async function GET() {
  try {
    // Return comprehensive supply info in CoinGecko-compliant format
    return NextResponse.json(
      {
        total_supply: MAX_SUPPLY,                  // Max theoretical supply
        circulating_supply: CIRCULATING_SUPPLY,    // Current circulating supply
        emission_model: EMISSION_MODEL,            // Emission model type
        max_supply: MAX_SUPPLY,                    // Alias for total_supply
        notes: 'CGC uses milestone-based progressive emission. New tokens are minted only when DAO completes verified milestones.'
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Total Supply API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch supply information'
      },
      { status: 500 }
    );
  }
}
