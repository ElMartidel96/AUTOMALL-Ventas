/**
 * Deal Parser — Extract deal fields from free text
 *
 * Used by WhatsApp agent to parse deal info from a single message.
 * Supports bilingual EN/ES, common price/phone/VIN formats.
 */

import type { PaymentFrequency } from './types';

export interface ParsedDealFields {
  client_name?: string;
  client_phone?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_vin?: string;
  vehicle_mileage?: number;
  sale_price?: number;
  down_payment?: number;
  num_installments?: number;
  payment_frequency?: PaymentFrequency;
  finance_company?: string;
  referred_by?: string;
  notes?: string;
}

// Known car brands (matches public/brands/ directory + common)
const KNOWN_BRANDS = [
  'toyota', 'ford', 'chevrolet', 'chevy', 'nissan', 'gmc', 'dodge', 'jeep',
  'mazda', 'mercedes', 'honda', 'hyundai', 'kia', 'bmw', 'lexus', 'acura',
  'infiniti', 'subaru', 'volkswagen', 'vw', 'buick', 'cadillac', 'chrysler',
  'ram', 'lincoln', 'mitsubishi', 'audi', 'volvo', 'porsche', 'tesla',
  'mercedes-benz', 'land rover', 'range rover',
];

// Brand aliases
const BRAND_ALIASES: Record<string, string> = {
  'chevy': 'Chevrolet',
  'vw': 'Volkswagen',
  'mercedes-benz': 'Mercedes',
  'range rover': 'Land Rover',
};

// Colors (EN/ES)
const COLORS: Record<string, string> = {
  // Spanish
  'blanco': 'White', 'negro': 'Black', 'rojo': 'Red', 'azul': 'Blue',
  'gris': 'Gray', 'plata': 'Silver', 'plateado': 'Silver', 'verde': 'Green',
  'amarillo': 'Yellow', 'naranja': 'Orange', 'cafe': 'Brown', 'marron': 'Brown',
  'dorado': 'Gold', 'beige': 'Beige', 'vino': 'Burgundy',
  // English
  'white': 'White', 'black': 'Black', 'red': 'Red', 'blue': 'Blue',
  'gray': 'Gray', 'grey': 'Gray', 'silver': 'Silver', 'green': 'Green',
  'yellow': 'Yellow', 'orange': 'Orange', 'brown': 'Brown', 'gold': 'Gold',
  'burgundy': 'Burgundy',
};

// Payment frequency keywords
const FREQ_KEYWORDS: Record<string, PaymentFrequency> = {
  'semanal': 'weekly', 'weekly': 'weekly', 'semana': 'weekly',
  'quincenal': 'biweekly', 'biweekly': 'biweekly', 'quincena': 'biweekly',
  'mensual': 'monthly', 'monthly': 'monthly', 'mes': 'monthly',
};

export function parseDealFromText(text: string): ParsedDealFields {
  const result: ParsedDealFields = {};
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const original = text;

  // ── Prices ──
  // Match $18,500 or $18500 or $18.5k or 18500
  const priceRegex = /\$[\s]*([\d,]+(?:\.\d{1,2})?k?)\b/g;
  const prices: number[] = [];
  let m;
  while ((m = priceRegex.exec(original)) !== null) {
    let val = m[1].replace(/,/g, '');
    if (val.toLowerCase().endsWith('k')) {
      val = String(parseFloat(val) * 1000);
    }
    const num = parseFloat(val);
    if (num > 0) prices.push(num);
  }

  // Also match plain numbers that look like prices (>= 1000)
  if (prices.length === 0) {
    const plainNumRegex = /\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/g;
    while ((m = plainNumRegex.exec(original)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val >= 1000 && val <= 500000) prices.push(val);
    }
  }

  if (prices.length >= 2) {
    // Largest = sale_price, next = down_payment
    prices.sort((a, b) => b - a);
    result.sale_price = prices[0];
    result.down_payment = prices[1];
  } else if (prices.length === 1) {
    result.sale_price = prices[0];
  }

  // ── Down payment keywords ──
  const dpMatch = lower.match(/(?:enganche|down\s*payment|deposito|dp)\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?k?)/);
  if (dpMatch) {
    let val = dpMatch[1].replace(/,/g, '');
    if (val.endsWith('k')) val = String(parseFloat(val) * 1000);
    result.down_payment = parseFloat(val);
  }

  // ── Year + Brand + Model ──
  // Pattern: "2022 Toyota Camry" or "Toyota Camry 2022"
  const yearBrandModelRegex = /\b(20[0-2]\d|19[89]\d)\s+([a-z][\w-]*)\s+([a-z][\w-]*(?:\s+[a-z][\w-]*)?)/i;
  const brandModelYearRegex = /\b([a-z][\w-]*)\s+([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\s+(20[0-2]\d|19[89]\d)\b/i;

  let yearMatch = original.match(yearBrandModelRegex);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const possibleBrand = yearMatch[2].toLowerCase();
    const possibleModel = yearMatch[3];

    if (KNOWN_BRANDS.includes(possibleBrand)) {
      result.vehicle_year = year;
      result.vehicle_brand = BRAND_ALIASES[possibleBrand] || capitalize(possibleBrand);
      result.vehicle_model = capitalize(possibleModel);
    }
  }

  if (!result.vehicle_brand) {
    yearMatch = original.match(brandModelYearRegex);
    if (yearMatch) {
      const possibleBrand = yearMatch[1].toLowerCase();
      const possibleModel = yearMatch[2];
      const year = parseInt(yearMatch[3]);

      if (KNOWN_BRANDS.includes(possibleBrand)) {
        result.vehicle_brand = BRAND_ALIASES[possibleBrand] || capitalize(possibleBrand);
        result.vehicle_model = capitalize(possibleModel);
        result.vehicle_year = year;
      }
    }
  }

  // Fallback: just find year
  if (!result.vehicle_year) {
    const justYear = lower.match(/\b(20[0-2]\d|19[89]\d)\b/);
    if (justYear) result.vehicle_year = parseInt(justYear[1]);
  }

  // Fallback: just find brand
  if (!result.vehicle_brand) {
    for (const brand of KNOWN_BRANDS) {
      if (lower.includes(brand)) {
        result.vehicle_brand = BRAND_ALIASES[brand] || capitalize(brand);
        break;
      }
    }
  }

  // ── Phone ──
  const phoneRegex = /(?:\+?1?\s*)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;
  const phoneMatch = original.match(phoneRegex);
  if (phoneMatch) {
    result.client_phone = phoneMatch[0].replace(/[^\d+]/g, '');
  }

  // ── VIN (17 alphanumeric chars, no I/O/Q) ──
  const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
  const vinMatch = original.match(vinRegex);
  if (vinMatch) {
    result.vehicle_vin = vinMatch[0].toUpperCase();
  }

  // ── Color ──
  for (const [keyword, color] of Object.entries(COLORS)) {
    if (lower.includes(keyword)) {
      result.vehicle_color = color;
      break;
    }
  }

  // ── Mileage ──
  const mileageRegex = /\b([\d,]+)\s*(?:mi(?:les|llas)?|km|k\s*(?:mi|km)?)\b/i;
  const mileageMatch = original.match(mileageRegex);
  if (mileageMatch) {
    const val = parseInt(mileageMatch[1].replace(/,/g, ''));
    if (val > 0 && val < 999999) result.vehicle_mileage = val;
  }

  // ── Installments ──
  const installRegex = /\b(\d+)\s*(?:pagos|cuotas|payments|installments)\b/i;
  const installMatch = lower.match(installRegex);
  if (installMatch) {
    result.num_installments = parseInt(installMatch[1]);
  }

  // ── Payment frequency ──
  for (const [keyword, freq] of Object.entries(FREQ_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.payment_frequency = freq;
      break;
    }
  }

  // ── Finance company ──
  const financeRegex = /(?:financiera|finance company|financed by|financiado por)\s*[:=]?\s*(.+?)(?:\n|$)/i;
  const financeMatch = original.match(financeRegex);
  if (financeMatch) {
    result.finance_company = financeMatch[1].trim();
  }

  // ── Referred by ──
  const referredRegex = /(?:referido por|referred by|referral)\s*[:=]?\s*(.+?)(?:\n|$)/i;
  const referredMatch = original.match(referredRegex);
  if (referredMatch) {
    result.referred_by = referredMatch[1].trim();
  }

  // ── Client name ──
  // Try "Cliente: Name" or "Client: Name" or "Nombre: Name"
  const nameRegex = /(?:cliente|client|nombre|name|buyer|comprador)\s*[:=]\s*(.+?)(?:\n|$)/i;
  const nameMatch = original.match(nameRegex);
  if (nameMatch) {
    result.client_name = nameMatch[1].trim();
  }

  // If no explicit name, try first line that looks like a name
  if (!result.client_name) {
    const lines = original.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0];
      // If first line doesn't contain numbers or known keywords, treat as name
      if (!/\d/.test(firstLine) && firstLine.length > 2 && firstLine.length < 60) {
        const firstLineLower = firstLine.toLowerCase();
        const isKeyword = KNOWN_BRANDS.some(b => firstLineLower.includes(b))
          || ['precio', 'price', 'venta', 'sale', 'vehiculo', 'vehicle', 'auto', 'car'].some(k => firstLineLower.includes(k));
        if (!isKeyword) {
          result.client_name = firstLine;
        }
      }
    }
  }

  // ── Cash detection ──
  if (lower.includes('efectivo') || lower.includes('cash') || lower.includes('al contado')) {
    if (!result.down_payment && result.sale_price) {
      result.down_payment = result.sale_price;
      result.num_installments = 0;
    }
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Check which required fields are missing */
export function getMissingDealFields(parsed: ParsedDealFields): string[] {
  const missing: string[] = [];
  if (!parsed.client_name) missing.push('client_name');
  if (!parsed.vehicle_brand) missing.push('vehicle_brand');
  if (!parsed.vehicle_model) missing.push('vehicle_model');
  if (!parsed.vehicle_year) missing.push('vehicle_year');
  if (!parsed.sale_price) missing.push('sale_price');
  return missing;
}
