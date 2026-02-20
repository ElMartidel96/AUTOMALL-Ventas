/**
 * VIN Decoder field mapping
 *
 * Maps the decoded VIN API response to form field names.
 */

export interface DecodedVIN {
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  body_type: string | null;
  doors: number | null;
  transmission: 'automatic' | 'manual' | 'cvt' | null;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | null;
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd' | null;
  engine: string | null;
}

/**
 * VIN validation: 17 alphanumeric chars, no I/O/Q
 */
export function isValidVIN(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/**
 * Count how many fields were decoded from VIN
 */
export function countDecodedFields(decoded: DecodedVIN): number {
  return Object.values(decoded).filter((v) => v !== null && v !== '').length;
}

/**
 * List of popular car brands for manual selection
 */
export const POPULAR_BRANDS = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai',
  'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus',
  'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
] as const;

/**
 * Generate year options (current year + 1 down to 1990)
 */
export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear() + 1;
  const years: number[] = [];
  for (let y = currentYear; y >= 1990; y--) {
    years.push(y);
  }
  return years;
}

/**
 * Body type options
 */
export const BODY_TYPES = [
  'Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Wagon',
  'Van', 'Minivan', 'Convertible', 'Crossover',
] as const;

/**
 * Common exterior colors
 */
export const EXTERIOR_COLORS = [
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green',
  'Brown', 'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Burgundy',
] as const;

/**
 * Common interior colors
 */
export const INTERIOR_COLORS = [
  'Black', 'Gray', 'Beige', 'Tan', 'Brown', 'White', 'Red', 'Blue',
] as const;

/**
 * Common vehicle features for checkboxes
 */
export const VEHICLE_FEATURES = [
  'Air Conditioning', 'Backup Camera', 'Bluetooth', 'Cruise Control',
  'Heated Seats', 'Leather Seats', 'Navigation', 'Power Windows',
  'Remote Start', 'Sunroof', 'Apple CarPlay', 'Android Auto',
  'Blind Spot Monitor', 'Lane Assist', 'Parking Sensors',
  'Third Row Seating', 'Tow Package', 'All-Weather Mats',
  'Roof Rack', 'Premium Audio',
] as const;
