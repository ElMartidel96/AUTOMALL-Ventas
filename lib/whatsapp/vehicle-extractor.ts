/**
 * Vehicle Extractor — GPT-4o Vision + Vercel AI SDK v5
 *
 * Analyzes vehicle photos + seller text messages to extract structured vehicle data.
 * Uses generateObject() with Zod schema for guaranteed structured output.
 *
 * Features:
 * - 90s timeout with AbortController
 * - Post-extraction validation (year/price/mileage/VIN sanity checks)
 * - Houston TX market-optimized system prompt
 * - Handles common seller text formats (emojis, abbreviations, comma-separated numbers)
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { ExtractedVehicle } from './types';

const EXTRACTION_TIMEOUT_MS = 90_000;

export const VehicleExtractionSchema = z.object({
  brand: z.string().nullable().describe('Vehicle manufacturer (e.g. Toyota, Ford, Chevrolet, Kia, Nissan, Honda)'),
  model: z.string().nullable().describe('Vehicle model (e.g. Camry, F-150, K4, Silverado, Civic)'),
  year: z.number().int().nullable().describe('Model year (e.g. 2025)'),
  price: z.number().nullable().describe('Asking price in USD. Parse from "$15,000", "15000", "P. INICIAL: $1300"'),
  mileage: z.number().int().nullable().describe('Odometer in miles. Parse from "85,000", "85k", "MILLAJE; 40,546"'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).nullable()
    .describe('Overall vehicle condition based on photos and description'),
  exterior_color: z.string().nullable().describe('Exterior paint color'),
  interior_color: z.string().nullable().describe('Interior color/material'),
  body_type: z.string().nullable().describe('Body style (sedan, SUV, truck, coupe, van, hatchback, wagon, convertible)'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).nullable(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).nullable(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).nullable(),
  engine: z.string().nullable().describe('Engine specs if visible (e.g. 2.5L 4-cylinder, 5.0L V8)'),
  trim: z.string().nullable().describe('Trim level from text or badge (e.g. LXS, LE, XLE, Limited, Lariat, SR5)'),
  doors: z.number().int().nullable().describe('Number of doors'),
  vin: z.string().nullable().describe('VIN if visible in any photo or mentioned in text (17 characters)'),
  features: z.array(z.string()).describe('Notable features visible in photos or mentioned'),
  description: z.string().nullable().describe('Generated bilingual description (English + Spanish), 2-3 sentences each'),
  confidence: z.record(z.string(), z.number()).describe('Confidence score 0-1 for each extracted field'),
});

const SYSTEM_PROMPT = `You are an expert vehicle identification specialist for Autos MALL, a car dealership platform in Houston, Texas.

Your job is to analyze vehicle photos and seller text messages to extract complete vehicle information for a listing.

## CRITICAL RULES

1. **Seller text ALWAYS overrides visual guesses.** If the seller says "2025 KIA K4 - LXS SEDAN 4D", trust that completely.
2. **Parse common seller text formats:**
   - Emojis as separators: "🚩2025 KIA K4 - LXS SEDAN 4D🚩" → brand=Kia, model=K4, year=2025, trim=LXS, body_type=sedan, doors=4
   - "MILLAJE; 40,546" or "MILEAGE: 40,546" or "85k miles" → mileage as integer (40546, 85000)
   - "P. INICIAL: $1,300" or "PRECIO: $15,000" or "$16,000" → price as number (1300, 15000, 16000)
   - Numbers with commas (e.g. "40,546") are thousands separators, NOT decimals
   - "SEDAN 4D" → body_type=sedan, doors=4
3. **Prices are in USD.** Mileage is in miles (Houston, TX market).
4. **For condition:** Assess from photos — scratches, dents, rust, tire wear, interior wear, cleanliness.
5. **VIN:** Check dashboard (through windshield), door jamb, or mentioned in text. Only return if all 17 characters are clearly readable.

## PHOTO ANALYSIS

Examine ALL photos systematically:
- **Exterior:** Badge/emblem, body style, color, wheels, condition, license plate state
- **Interior:** Dashboard, seats (leather/cloth), infotainment screen, steering wheel controls
- **Dashboard/Gauges:** Odometer reading, warning lights, display info
- **Engine bay:** Engine type/size if visible
- **Documents:** Window sticker, Carfax, title information

## MARKET CONTEXT (Houston, TX)

- Common brands: Toyota, Ford, Chevrolet, Nissan, Honda, Hyundai, Kia, GMC, Dodge, Jeep, RAM, BMW, Mercedes
- Typical used car price range: $3,000 - $80,000
- Average used car mileage: 20,000 - 150,000 miles
- If price is very low ($500-$2,000), it may be a starting bid or down payment — note in description
- If mileage > 200,000, vehicle is high-mileage — reflect in condition

## DESCRIPTION

Generate a bilingual description (English first, then Spanish separated by "---"):
- Highlight vehicle's best features and selling points
- Be professional and compelling
- Mention key specs (engine, transmission, drivetrain if known)
- Keep each paragraph 2-3 sentences

## CONFIDENCE SCORES

- 1.0 = Explicitly stated by seller in text
- 0.8-0.9 = Clearly visible in photos or strongly implied
- 0.5-0.7 = Educated guess from partial evidence
- 0.3-0.4 = Low confidence guess
- Set field to null if confidence would be below 0.3`;

export async function extractVehicleData(
  imageUrls: string[],
  textMessages: string[]
): Promise<ExtractedVehicle> {
  const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

  // Add all images
  for (const url of imageUrls) {
    content.push({ type: 'image', image: url });
  }

  // Add seller text messages
  if (textMessages.length > 0) {
    content.push({
      type: 'text',
      text: `Seller's messages:\n${textMessages.join('\n')}`,
    });
  }

  // Timeout with AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: VehicleExtractionSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      abortSignal: controller.signal,
    });

    return validateExtraction(object as ExtractedVehicle);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Post-processing validation to catch AI hallucinations and normalize data.
 */
function validateExtraction(vehicle: ExtractedVehicle): ExtractedVehicle {
  const v = { ...vehicle };

  // Year: must be between 1980 and next year
  const maxYear = new Date().getFullYear() + 2;
  if (v.year !== null && (v.year < 1980 || v.year > maxYear)) {
    v.year = null;
  }

  // Price: must be positive and reasonable
  if (v.price !== null && (v.price < 0 || v.price > 500000)) {
    v.price = null;
  }

  // Mileage: must be non-negative and reasonable
  if (v.mileage !== null && (v.mileage < 0 || v.mileage > 999999)) {
    v.mileage = null;
  }

  // VIN: must be exactly 17 alphanumeric characters (no I, O, Q)
  if (v.vin !== null) {
    const cleanVin = v.vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    v.vin = cleanVin.length === 17 ? cleanVin : null;
  }

  // Normalize brand capitalization
  if (v.brand) {
    const brandMap: Record<string, string> = {
      'bmw': 'BMW', 'gmc': 'GMC', 'ram': 'RAM',
    };
    const lower = v.brand.toLowerCase();
    v.brand = brandMap[lower] || v.brand.charAt(0).toUpperCase() + v.brand.slice(1).toLowerCase();
  }

  // Normalize trim to uppercase
  if (v.trim) {
    v.trim = v.trim.toUpperCase();
  }

  // Infer doors from body type if missing
  if (v.doors === null && v.body_type) {
    const bt = v.body_type.toLowerCase();
    if (['sedan', 'suv', 'hatchback', 'wagon'].includes(bt)) v.doors = 4;
    else if (['coupe', 'convertible'].includes(bt)) v.doors = 2;
  }

  return v;
}

// Required fields that the seller must provide if AI can't detect them
export const REQUIRED_FIELDS: (keyof ExtractedVehicle)[] = [
  'brand',
  'model',
  'year',
  'price',
  'mileage',
];

export function findMissingFields(vehicle: ExtractedVehicle): string[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = vehicle[field];
    return value === null || value === undefined;
  });
}

// ─────────────────────────────────────────────
// Smart Auto-Fill — Intelligent field estimation
// ─────────────────────────────────────────────

/**
 * Fills missing vehicle fields with intelligent estimates based on:
 * - Year → mileage (12-18k miles/year average)
 * - Model name → body type, fuel type
 * - Year → features (CarPlay, backup cam, safety tech)
 * - Year + mileage → condition estimate
 * - Market defaults → transmission (automatic), drivetrain
 *
 * Returns the filled vehicle + list of which fields were auto-estimated.
 */
export function smartAutoFill(
  extracted: ExtractedVehicle
): { filled: ExtractedVehicle; autoFilledFields: string[] } {
  const filled = { ...extracted, features: [...(extracted.features || [])] };
  const autoFilledFields: string[] = [];
  const currentYear = new Date().getFullYear();
  const model = (filled.model || '').toLowerCase();
  const brand = (filled.brand || '').toLowerCase();

  // --- Mileage: estimate from year (avg 12-15k miles/year in Houston) ---
  if (filled.mileage === null && filled.year) {
    const age = Math.max(0, currentYear - filled.year);
    if (age === 0) filled.mileage = 500;
    else if (age <= 2) filled.mileage = Math.round(age * 12000);
    else if (age <= 5) filled.mileage = Math.round(age * 13500);
    else filled.mileage = Math.round(age * 15000);
    autoFilledFields.push('mileage');
  }

  // --- Transmission: 95%+ of US market is automatic ---
  if (!filled.transmission) {
    filled.transmission = 'automatic';
    autoFilledFields.push('transmission');
  }

  // --- Fuel Type: gasoline unless known EV/hybrid ---
  if (!filled.fuel_type) {
    const evBrands = ['tesla'];
    const evModels = ['model 3', 'model y', 'model s', 'model x', 'bolt', 'bolt euv',
      'leaf', 'ioniq 5', 'ioniq 6', 'id.4', 'mach-e', 'ev6', 'ev9', 'ariya',
      'blazer ev', 'equinox ev', 'lyriq', 'hummer ev'];
    const hybridModels = ['prius', 'rav4 hybrid', 'camry hybrid', 'accord hybrid',
      'cr-v hybrid', 'tucson hybrid', 'santa fe hybrid', 'sorento hybrid', 'maverick hybrid'];

    if (evBrands.includes(brand) || evModels.some(m => model.includes(m))) {
      filled.fuel_type = 'electric';
    } else if (hybridModels.some(m => model.includes(m))) {
      filled.fuel_type = 'hybrid';
    } else {
      filled.fuel_type = 'gasoline';
    }
    autoFilledFields.push('fuel_type');
  }

  // --- Body Type: infer from model name ---
  if (!filled.body_type) {
    const trucks = ['f-150', 'f150', 'f-250', 'f250', 'silverado', 'sierra', 'ram',
      'tundra', 'tacoma', 'frontier', 'ranger', 'colorado', 'canyon', 'ridgeline',
      'maverick', 'titan', 'gladiator'];
    const suvs = ['rav4', 'cr-v', 'crv', 'escape', 'explorer', 'highlander', 'pathfinder',
      'pilot', 'tahoe', 'suburban', 'wrangler', 'cherokee', 'grand cherokee', 'tucson',
      'santa fe', 'sportage', 'seltos', 'sorento', 'telluride', '4runner', 'sequoia',
      'bronco', 'expedition', 'trailblazer', 'blazer', 'equinox', 'traverse', 'yukon',
      'terrain', 'acadia', 'cx-5', 'cx-50', 'cx-9', 'cx-90', 'rogue', 'murano', 'kicks',
      'outlander', 'eclipse cross', 'tiguan', 'atlas'];
    const sedans = ['camry', 'corolla', 'civic', 'accord', 'altima', 'sentra', 'elantra',
      'sonata', 'k4', 'k5', 'forte', 'jetta', 'passat', 'malibu', 'impala', 'maxima',
      'versa', 'rio', 'mazda3', 'mazda 3'];
    const coupes = ['mustang', 'camaro', 'challenger', 'supra', 'brz', 'gr86', 'miata', 'mx-5'];
    const vans = ['odyssey', 'sienna', 'pacifica', 'grand caravan', 'transit', 'sprinter'];

    if (trucks.some(k => model.includes(k))) filled.body_type = 'truck';
    else if (suvs.some(k => model.includes(k))) filled.body_type = 'SUV';
    else if (coupes.some(k => model.includes(k))) filled.body_type = 'coupe';
    else if (vans.some(k => model.includes(k))) filled.body_type = 'van';
    else if (sedans.some(k => model.includes(k))) filled.body_type = 'sedan';
    else if (model.includes('sedan') || model.includes('4d')) filled.body_type = 'sedan';
    else filled.body_type = 'sedan';
    autoFilledFields.push('body_type');
  }

  // --- Condition: estimate from year + mileage ---
  if (!filled.condition) {
    const age = filled.year ? Math.max(0, currentYear - filled.year) : 5;
    const miles = filled.mileage || 50000;
    if (age <= 1 && miles < 10000) filled.condition = 'like_new';
    else if (age <= 3 && miles < 45000) filled.condition = 'excellent';
    else if (age <= 6 && miles < 80000) filled.condition = 'good';
    else if (age <= 10 && miles < 130000) filled.condition = 'good';
    else filled.condition = 'fair';
    autoFilledFields.push('condition');
  }

  // --- Drivetrain: FWD default, RWD for trucks, AWD for Subaru ---
  if (!filled.drivetrain) {
    const bt = (filled.body_type || '').toLowerCase();
    if (bt === 'truck') filled.drivetrain = 'rwd';
    else if (brand === 'subaru') filled.drivetrain = 'awd';
    else filled.drivetrain = 'fwd';
    autoFilledFields.push('drivetrain');
  }

  // --- Doors: infer from body type ---
  if (filled.doors === null) {
    const bt = (filled.body_type || '').toLowerCase();
    if (['coupe', 'convertible'].includes(bt)) filled.doors = 2;
    else filled.doors = 4;
    autoFilledFields.push('doors');
  }

  // --- Features: infer from year (Houston TX market) ---
  if (filled.features.length === 0) {
    const year = filled.year || currentYear;
    const features: string[] = [];
    if (year >= 2012) features.push('Bluetooth');
    if (year >= 2014) features.push('USB Port');
    if (year >= 2018) features.push('Backup Camera');
    if (year >= 2019) features.push('Apple CarPlay', 'Android Auto');
    if (year >= 2020) features.push('Lane Departure Warning');
    if (year >= 2021) features.push('Forward Collision Warning');
    if (year >= 2022) features.push('Adaptive Cruise Control');
    if (year >= 2024) features.push('Wireless Apple CarPlay');
    filled.features = features;
    if (features.length > 0) autoFilledFields.push('features');
  }

  return { filled, autoFilledFields };
}
