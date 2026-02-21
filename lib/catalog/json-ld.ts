/**
 * JSON-LD Schema.org/Car generator for vehicle detail pages.
 * Produces structured data for SEO and AI readability.
 */

import type { VehicleImage } from '@/lib/supabase/types';

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  trim?: string | null;
  body_type?: string | null;
  doors?: number | null;
  price: number;
  price_negotiable?: boolean;
  mileage: number;
  condition: string;
  exterior_color?: string | null;
  interior_color?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  drivetrain?: string | null;
  engine?: string | null;
  vin?: string | null;
  description?: string | null;
}

const FUEL_TYPE_MAP: Record<string, string> = {
  gasoline: 'https://schema.org/GasolineOrPetrol',
  diesel: 'https://schema.org/DieselFuel',
  electric: 'https://schema.org/Electricity',
  hybrid: 'https://schema.org/GasolineOrPetrol',
  plugin_hybrid: 'https://schema.org/Electricity',
};

const TRANSMISSION_MAP: Record<string, string> = {
  automatic: 'https://schema.org/AutomaticTransmission',
  manual: 'https://schema.org/ManualTransmission',
  cvt: 'https://schema.org/AutomaticTransmission',
};

const DRIVETRAIN_MAP: Record<string, string> = {
  fwd: 'https://schema.org/FrontWheelDriveConfiguration',
  rwd: 'https://schema.org/RearWheelDriveConfiguration',
  awd: 'https://schema.org/AllWheelDriveConfiguration',
  '4wd': 'https://schema.org/FourWheelDriveConfiguration',
};

export function generateVehicleJsonLd(
  vehicle: VehicleData,
  images: VehicleImage[]
): Record<string, unknown> {
  const name = [vehicle.year, vehicle.brand, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ');

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
  };

  if (vehicle.body_type) jsonLd.bodyType = vehicle.body_type;
  if (vehicle.doors) jsonLd.numberOfDoors = vehicle.doors;

  if (vehicle.fuel_type && FUEL_TYPE_MAP[vehicle.fuel_type]) {
    jsonLd.fuelType = FUEL_TYPE_MAP[vehicle.fuel_type];
  }

  if (vehicle.transmission && TRANSMISSION_MAP[vehicle.transmission]) {
    jsonLd.vehicleTransmission = TRANSMISSION_MAP[vehicle.transmission];
  }

  if (vehicle.drivetrain && DRIVETRAIN_MAP[vehicle.drivetrain]) {
    jsonLd.driveWheelConfiguration = DRIVETRAIN_MAP[vehicle.drivetrain];
  }

  if (vehicle.engine) {
    jsonLd.vehicleEngine = {
      '@type': 'EngineSpecification',
      name: vehicle.engine,
    };
  }

  jsonLd.mileageFromOdometer = {
    '@type': 'QuantitativeValue',
    value: vehicle.mileage,
    unitCode: 'SMI',
  };

  if (vehicle.vin) jsonLd.vehicleIdentificationNumber = vehicle.vin;
  if (vehicle.exterior_color) jsonLd.color = vehicle.exterior_color;
  if (vehicle.interior_color) jsonLd.vehicleInteriorColor = vehicle.interior_color;

  jsonLd.itemCondition = vehicle.condition === 'new'
    ? 'https://schema.org/NewCondition'
    : 'https://schema.org/UsedCondition';

  if (images.length > 0) {
    jsonLd.image = images.map(img => img.public_url);
  }

  jsonLd.offers = {
    '@type': 'Offer',
    price: vehicle.price,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  };

  jsonLd.seller = {
    '@type': 'AutoDealer',
    name: 'Autos MALL',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Houston',
      addressRegion: 'TX',
      addressCountry: 'US',
    },
  };

  if (vehicle.description) jsonLd.description = vehicle.description;

  return jsonLd;
}
