/**
 * Vehicle Extractor — GPT-5 Vision + Vercel AI SDK v5
 *
 * Analyzes vehicle photos + seller text messages to extract structured vehicle data.
 * Uses generateObject() with Zod schema for guaranteed structured output.
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { ExtractedVehicle } from './types';

export const VehicleExtractionSchema = z.object({
  brand: z.string().nullable().describe('Vehicle manufacturer (e.g. Toyota, Ford, Chevrolet)'),
  model: z.string().nullable().describe('Vehicle model (e.g. Camry, F-150, Silverado)'),
  year: z.number().int().nullable().describe('Model year (e.g. 2019)'),
  price: z.number().nullable().describe('Asking price in USD'),
  mileage: z.number().int().nullable().describe('Odometer reading in miles'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).nullable()
    .describe('Overall vehicle condition based on photos and description'),
  exterior_color: z.string().nullable().describe('Exterior paint color'),
  interior_color: z.string().nullable().describe('Interior color/material'),
  body_type: z.string().nullable().describe('Body style (sedan, SUV, truck, coupe, van, etc.)'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).nullable(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).nullable(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).nullable(),
  engine: z.string().nullable().describe('Engine specs if visible (e.g. 2.5L 4-cylinder)'),
  trim: z.string().nullable().describe('Trim level (e.g. LE, XLE, Limited, Lariat)'),
  doors: z.number().int().nullable().describe('Number of doors'),
  vin: z.string().nullable().describe('VIN if visible in any photo or mentioned in text'),
  features: z.array(z.string()).describe('Notable features visible in photos or mentioned (e.g. sunroof, leather seats, backup camera)'),
  description: z.string().nullable().describe('Generated vehicle description in English, 2-3 sentences highlighting key selling points'),
  confidence: z.record(z.string(), z.number()).describe('Confidence score 0-1 for each extracted field'),
});

const SYSTEM_PROMPT = `You are an expert vehicle identification specialist for a car dealership platform in Houston, Texas.

Your job is to analyze vehicle photos and seller text messages to extract complete vehicle information.

INSTRUCTIONS:
1. Carefully examine ALL provided photos for visual clues: badge/emblem, body style, interior, dashboard, odometer, VIN plate, license plate area
2. Read the seller's text messages for explicit information (price, mileage, year, etc.)
3. Cross-reference visual identification with text data
4. For fields you can confidently determine, provide the value
5. For fields you cannot determine, set to null
6. Provide confidence scores (0.0-1.0) for each field you extract

IMPORTANT:
- Text messages from the seller take priority over visual guesses
- If the seller says "Camry 2019" trust that over trying to identify from photos
- Prices are in USD
- Mileage is in miles (this is Houston, TX)
- For condition, assess from photo quality: scratches, dents, wear, cleanliness
- Look for VIN on dashboard (visible through windshield), door jamb, or mentioned in text
- Generate a compelling English description highlighting the vehicle's best features`;

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
  });

  return object as ExtractedVehicle;
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
