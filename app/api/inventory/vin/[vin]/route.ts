/**
 * VIN Decoder API — Proxy to NHTSA free API
 *
 * GET /api/inventory/vin/[vin]
 * Returns decoded vehicle info from 17-char VIN
 */

import { NextRequest, NextResponse } from 'next/server';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues';

// In-memory cache (24h TTL)
const vinCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface NHTSAResult {
  Make: string;
  Model: string;
  ModelYear: string;
  Trim: string;
  BodyClass: string;
  DriveType: string;
  FuelTypePrimary: string;
  TransmissionStyle: string;
  EngineCylinders: string;
  DisplacementL: string;
  EngineModel: string;
  Doors: string;
  ErrorCode: string;
  ErrorText: string;
}

function parseNHTSA(result: NHTSAResult) {
  // Map NHTSA transmission values
  let transmission: string | null = null;
  const trans = (result.TransmissionStyle || '').toLowerCase();
  if (trans.includes('automatic') || trans.includes('auto')) transmission = 'automatic';
  else if (trans.includes('manual')) transmission = 'manual';
  else if (trans.includes('cvt')) transmission = 'cvt';

  // Map NHTSA fuel types
  let fuel_type: string | null = null;
  const fuel = (result.FuelTypePrimary || '').toLowerCase();
  if (fuel.includes('gasoline') || fuel.includes('gas')) fuel_type = 'gasoline';
  else if (fuel.includes('diesel')) fuel_type = 'diesel';
  else if (fuel.includes('electric')) fuel_type = 'electric';
  else if (fuel.includes('hybrid') && fuel.includes('plug')) fuel_type = 'plugin_hybrid';
  else if (fuel.includes('hybrid')) fuel_type = 'hybrid';

  // Map drivetrain
  let drivetrain: string | null = null;
  const drive = (result.DriveType || '').toLowerCase();
  if (drive.includes('front') || drive.includes('fwd')) drivetrain = 'fwd';
  else if (drive.includes('rear') || drive.includes('rwd')) drivetrain = 'rwd';
  else if (drive.includes('all') || drive.includes('awd')) drivetrain = 'awd';
  else if (drive.includes('4wd') || drive.includes('4x4') || drive.includes('four')) drivetrain = '4wd';

  // Build engine description
  const cylinders = result.EngineCylinders || '';
  const displacement = result.DisplacementL || '';
  let engine: string | null = null;
  if (displacement && cylinders) {
    engine = `${displacement}L ${cylinders}-Cylinder`;
  } else if (displacement) {
    engine = `${displacement}L`;
  } else if (cylinders) {
    engine = `${cylinders}-Cylinder`;
  }

  return {
    brand: result.Make || null,
    model: result.Model || null,
    year: result.ModelYear ? parseInt(result.ModelYear) : null,
    trim: result.Trim || null,
    body_type: result.BodyClass || null,
    doors: result.Doors ? parseInt(result.Doors) : null,
    transmission,
    fuel_type,
    drivetrain,
    engine,
  };
}

type RouteContext = { params: Promise<{ vin: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { vin } = await context.params;

    // Validate VIN format (17 alphanumeric, no I/O/Q)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. Must be 17 characters (A-Z, 0-9, excluding I, O, Q)', success: false },
        { status: 400 }
      );
    }

    const vinUpper = vin.toUpperCase();

    // Check cache
    const cached = vinCache.get(vinUpper);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    // Call NHTSA API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${NHTSA_BASE}/${vinUpper}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'NHTSA API unavailable', success: false },
        { status: 502 }
      );
    }

    const json = await response.json();
    const results = json.Results?.[0] as NHTSAResult | undefined;

    if (!results || results.ErrorCode === '1') {
      return NextResponse.json(
        { error: 'VIN not found in NHTSA database', success: false },
        { status: 404 }
      );
    }

    const decoded = parseNHTSA(results);

    // Cache result
    vinCache.set(vinUpper, { data: decoded, expires: Date.now() + CACHE_TTL });

    return NextResponse.json({ success: true, data: decoded });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'VIN decoder timeout', success: false },
        { status: 504 }
      );
    }
    console.error('[VIN] Decode error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
