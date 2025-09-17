/**
 * Coordinate handling utilities
 * Simple validation, parsing, and geographic calculations
 * Extensibility ready for Qibla direction calculations
 */

import { dtr, rtd } from "./math";
// Qibla calculations moved to separate @masaajid/qibla library
// Users should import directly from @masaajid/qibla for qibla functionality

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Mecca coordinates (Kaaba) for prayer time calculations
export const MECCA_COORDINATES: Coordinates = {
  latitude: 21.422487,
  longitude: 39.826206,
};

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

// Validate coordinate ranges
export function isValidLatitude(lat: number): boolean {
  return typeof lat === "number" && lat >= -90 && lat <= 90 && !isNaN(lat);
}

export function isValidLongitude(lng: number): boolean {
  return typeof lng === "number" && lng >= -180 && lng <= 180 && !isNaN(lng);
}

// Validate coordinates array or object
export function validateCoordinates(
  coords: [number, number] | Coordinates
): Coordinates {
  let latitude: number, longitude: number;

  if (Array.isArray(coords)) {
    if (coords.length !== 2) {
      throw new Error(
        "Coordinates array must contain exactly 2 elements [latitude, longitude]"
      );
    }
    [latitude, longitude] = coords;
  } else if (typeof coords === "object" && coords !== null) {
    latitude = coords.latitude;
    longitude = coords.longitude;
  } else {
    throw new Error(
      "Coordinates must be an array [lat, lng] or object {latitude, longitude}"
    );
  }

  if (!isValidLatitude(latitude)) {
    throw new Error(
      `Invalid latitude: ${latitude}. Must be between -90 and 90 degrees`
    );
  }

  if (!isValidLongitude(longitude)) {
    throw new Error(
      `Invalid longitude: ${longitude}. Must be between -180 and 180 degrees`
    );
  }

  return { latitude, longitude };
}

// Parse various coordinate formats
export function parseCoordinates(
  input: string | [number, number] | Coordinates
): Coordinates {
  if (typeof input === "string") {
    return parseCoordinatesFromString(input);
  }

  return validateCoordinates(input);
}

// Parse coordinates from string formats
function parseCoordinatesFromString(coordString: string): Coordinates {
  // Remove extra whitespace and normalize
  const cleaned = coordString.trim().replace(/\s+/g, " ");

  // Try different formats
  const formats = [
    // "40.7589, -73.9851"
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
    // "40.7589 N, 73.9851 W"
    /^(\d+\.?\d*)\s*([NS]),\s*(\d+\.?\d*)\s*([EW])$/i,
    // "40°45'32" N, 73°59'8" W"
    /^(\d+)°(\d+)'(\d+)"?\s*([NS]),\s*(\d+)°(\d+)'(\d+)"?\s*([EW])$/i,
    // "40°45.533' N, 73°59.133' W"
    /^(\d+)°(\d+\.?\d*)'?\s*([NS]),\s*(\d+)°(\d+\.?\d*)'?\s*([EW])$/i,
  ];

  // Simple decimal format
  const match1 = formats[0].exec(cleaned);
  if (match1) {
    return validateCoordinates([parseFloat(match1[1]), parseFloat(match1[2])]);
  }

  // Decimal with N/S/E/W
  const match2 = formats[1].exec(cleaned);
  if (match2) {
    let lat = parseFloat(match2[1]);
    let lng = parseFloat(match2[3]);

    if (match2[2].toUpperCase() === "S") lat = -lat;
    if (match2[4].toUpperCase() === "W") lng = -lng;

    return validateCoordinates([lat, lng]);
  }

  // DMS format (degrees, minutes, seconds)
  const match3 = formats[2].exec(cleaned);
  if (match3) {
    const lat =
      parseInt(match3[1]) +
      parseInt(match3[2]) / 60 +
      parseInt(match3[3]) / 3600;
    const lng =
      parseInt(match3[5]) +
      parseInt(match3[6]) / 60 +
      parseInt(match3[7]) / 3600;

    const finalLat = match3[4].toUpperCase() === "S" ? -lat : lat;
    const finalLng = match3[8].toUpperCase() === "W" ? -lng : lng;

    return validateCoordinates([finalLat, finalLng]);
  }

  // DM format (degrees, decimal minutes)
  const match4 = formats[3].exec(cleaned);
  if (match4) {
    const lat = parseInt(match4[1]) + parseFloat(match4[2]) / 60;
    const lng = parseInt(match4[4]) + parseFloat(match4[5]) / 60;

    const finalLat = match4[3].toUpperCase() === "S" ? -lat : lat;
    const finalLng = match4[6].toUpperCase() === "W" ? -lng : lng;

    return validateCoordinates([finalLat, finalLng]);
  }

  throw new Error(`Unable to parse coordinates: ${coordString}`);
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const lat1Rad = dtr(coord1.latitude);
  const lat2Rad = dtr(coord2.latitude);
  const deltaLatRad = dtr(coord2.latitude - coord1.latitude);
  const deltaLngRad = dtr(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Calculate distance to Mecca from coordinates
export function distanceToMecca(coordinates: Coordinates): number {
  return calculateDistance(coordinates, MECCA_COORDINATES);
}

// Calculate Qibla direction (bearing to Mecca)
// @deprecated Use @masaajid/qibla library for accurate qibla calculations
export function calculateQiblaDirection(coordinates: Coordinates): number {
  const lat1 = dtr(coordinates.latitude);
  const lat2 = dtr(MECCA_COORDINATES.latitude);
  const deltaLng = dtr(MECCA_COORDINATES.longitude - coordinates.longitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = rtd(Math.atan2(y, x));

  // Normalize to 0-360 degrees
  return (bearing + 360) % 360;
}

// Get cardinal direction from bearing
export function getCardinalDirection(bearing: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// Check if coordinates are in polar regions (high latitude)
export function isInPolarRegion(
  coordinates: Coordinates,
  threshold = 48
): boolean {
  return Math.abs(coordinates.latitude) >= threshold;
}

// Check if coordinates are in specific regions for method suggestion
export function getRegion(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;

  // North America
  if (
    latitude >= 25 &&
    latitude <= 72 &&
    longitude >= -168 &&
    longitude <= -52
  ) {
    return "north_america";
  }

  // Europe
  if (latitude >= 35 && latitude <= 72 && longitude >= -10 && longitude <= 40) {
    return "europe";
  }

  // Middle East / Gulf
  if (latitude >= 12 && latitude <= 42 && longitude >= 34 && longitude <= 60) {
    return "middle_east";
  }

  // Southeast Asia
  if (
    latitude >= -11 &&
    latitude <= 28 &&
    longitude >= 95 &&
    longitude <= 141
  ) {
    return "southeast_asia";
  }

  // Africa
  if (
    latitude >= -35 &&
    latitude <= 37 &&
    longitude >= -18 &&
    longitude <= 51
  ) {
    return "africa";
  }

  // South Asia
  if (latitude >= 5 && latitude <= 37 && longitude >= 60 && longitude <= 97) {
    return "south_asia";
  }

  // Default to unknown
  return "unknown";
}

// Format coordinates for display
export function formatCoordinates(
  coordinates: Coordinates,
  format: "decimal" | "dms" | "dm" = "decimal",
  precision = 4
): string {
  const { latitude, longitude } = coordinates;

  if (format === "decimal") {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  if (format === "dms") {
    return `${formatDMS(latitude, true)}, ${formatDMS(longitude, false)}`;
  }

  if (format === "dm") {
    return `${formatDM(latitude, true)}, ${formatDM(longitude, false)}`;
  }

  return formatCoordinates(coordinates, "decimal", precision);
}

// Format single coordinate to DMS (degrees, minutes, seconds)
function formatDMS(coord: number, isLatitude: boolean): string {
  const abs = Math.abs(coord);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = Math.round(((abs - degrees) * 60 - minutes) * 60);

  const direction = isLatitude
    ? coord >= 0
      ? "N"
      : "S"
    : coord >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

// Format single coordinate to DM (degrees, decimal minutes)
function formatDM(coord: number, isLatitude: boolean): string {
  const abs = Math.abs(coord);
  const degrees = Math.floor(abs);
  const minutes = ((abs - degrees) * 60).toFixed(3);

  const direction = isLatitude
    ? coord >= 0
      ? "N"
      : "S"
    : coord >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}' ${direction}`;
}

// Get coordinate bounds for a region
export interface CoordinateBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function isWithinBounds(
  coordinates: Coordinates,
  bounds: CoordinateBounds
): boolean {
  const { latitude, longitude } = coordinates;
  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

// Check if coordinates are approximately equal
export function coordinatesEqual(
  coord1: Coordinates,
  coord2: Coordinates,
  precision = 6
): boolean {
  const factor = Math.pow(10, precision);
  return (
    Math.round(coord1.latitude * factor) ===
      Math.round(coord2.latitude * factor) &&
    Math.round(coord1.longitude * factor) ===
      Math.round(coord2.longitude * factor)
  );
}

// Aliases for compatibility
export const getDistanceToMecca = distanceToMecca;
export const getQiblaDirection = calculateQiblaDirection;
