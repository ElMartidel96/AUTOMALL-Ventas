/**
 * Facebook Marketing API — Geo Targeting Builder
 *
 * Builds targeting objects for Facebook AdSets.
 * Focused on Texas cities for Houston-area car dealers.
 */

export interface FBTargeting {
  geo_locations: {
    cities: Array<{
      key: string;
      radius: number;
      distance_unit: 'mile';
    }>;
  };
  age_min: number;
  age_max: number;
}

// Facebook city keys for major TX cities
const TX_CITY_KEYS: Record<string, string> = {
  houston: '2496388',
  dallas: '2418676',
  'san antonio': '2508498',
  austin: '2383660',
  'fort worth': '2454530',
  'el paso': '2444210',
  arlington: '2381005',
  'corpus christi': '2411160',
  plano: '2493700',
  laredo: '2470110',
  lubbock: '2474200',
  irving: '2460330',
  garland: '2450640',
  amarillo: '2379760',
  'grand prairie': '2458780',
  brownsville: '2401550',
  mckinney: '2478490',
  frisco: '2449240',
  pasadena: '2493094',
  killeen: '2465810',
  mcallen: '2478380',
  mesquite: '2479270',
  midland: '2480260',
  beaumont: '2391460',
  'round rock': '2504458',
  pearland: '2493300',
  'sugar land': '2514990',
  katy: '2464410',
  'league city': '2471028',
  'spring': '2513070',
  'the woodlands': '2520032',
  conroe: '2410400',
  baytown: '2391200',
};

const DEFAULT_CITY_KEY = '2496388'; // Houston
const MAX_RADIUS_MILES = 80;
const DEFAULT_RADIUS_MILES = 50;
const MIN_AGE = 21;
const MAX_AGE = 65;
export function buildTargeting(
  city: string | null,
  state: string | null,
  radiusMiles?: number
): FBTargeting {
  const normalizedCity = (city || '').toLowerCase().trim();
  let cityKey = TX_CITY_KEYS[normalizedCity];

  if (!cityKey) {
    if (normalizedCity) {
      console.warn(`[Targeting] City "${city}" not in TX_CITY_KEYS, falling back to Houston`);
    }
    cityKey = DEFAULT_CITY_KEY;
  }

  const radius = Math.min(radiusMiles || DEFAULT_RADIUS_MILES, MAX_RADIUS_MILES);

  return {
    geo_locations: {
      cities: [
        {
          key: cityKey,
          radius,
          distance_unit: 'mile',
        },
      ],
    },
    age_min: MIN_AGE,
    age_max: MAX_AGE,
  };
}
