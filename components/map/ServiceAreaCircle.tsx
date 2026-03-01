'use client'

import React from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

interface ServiceAreaCircleProps {
  center: [number, number] // [longitude, latitude]
  radiusKm: number
  color?: string
  opacity?: number
}

/**
 * Renders a circle on the map representing a dealer's service area.
 * Uses GeoJSON circle approximation (64-point polygon).
 */
export function ServiceAreaCircle({
  center,
  radiusKm,
  color = '#E8832A', // am-orange
  opacity = 0.12,
}: ServiceAreaCircleProps) {
  const circleGeoJSON = createGeoJSONCircle(center, radiusKm)

  return (
    <Source type="geojson" data={circleGeoJSON}>
      <Layer
        id="service-area-fill"
        type="fill"
        paint={{
          'fill-color': color,
          'fill-opacity': opacity,
        }}
      />
      <Layer
        id="service-area-border"
        type="line"
        paint={{
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [4, 2],
        }}
      />
    </Source>
  )
}

/**
 * Create a GeoJSON polygon circle from center point and radius.
 * 64 points for smooth rendering.
 */
function createGeoJSONCircle(
  center: [number, number],
  radiusKm: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = []
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radiusKm / 110.574

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([center[0] + x, center[1] + y])
  }
  coords.push(coords[0]) // close the ring

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  }
}
