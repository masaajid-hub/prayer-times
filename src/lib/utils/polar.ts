/**
 * High latitude adjustment methods
 * Handling extreme latitude calculations where standard methods fail
 * Implements adhan-js precision for polar regions
 */

import { dayOfYear, daysSinceSolstice } from "./astronomy";
import { addSeconds } from "./time";

export type HighLatitudeRule =
  | "NightMiddle"
  | "AngleBased"
  | "OneSeventh"
  | "None";

export interface PolarAdjustmentParams {
  latitude: number;
  angle: number;
  night: number;
  direction?: number; // -1 for before transit, 1 for after
}

export interface SeasonAdjustmentParams {
  latitude: number;
  dayOfYear: number;
  year: number;
  baseTime: Date;
}

// Check if location requires polar adjustments (above 48°N/S)
export function requiresPolarAdjustment(
  latitude: number,
  threshold = 48
): boolean {
  return Math.abs(latitude) >= threshold;
}

// Apply high latitude adjustment to prayer time
export function adjustPrayerTime(
  time: number | Date,
  baseTime: Date,
  params: PolarAdjustmentParams,
  rule: HighLatitudeRule
): Date | null {
  if (rule === "None") {
    return time instanceof Date ? time : null;
  }

  const timeValue = time instanceof Date ? time : null;

  if (!timeValue || isNaN(timeValue.getTime())) {
    return applyHighLatitudeRule(baseTime, params, rule);
  }

  // Check if time is within reasonable bounds
  const timeDiff =
    Math.abs(timeValue.getTime() - baseTime.getTime()) / (1000 * 60 * 60); // hours
  const portion = getAdjustmentPortion(params.night, params.angle, rule);

  if (timeDiff > portion) {
    return applyHighLatitudeRule(baseTime, params, rule);
  }

  return timeValue;
}

// Get adjustment portion based on high latitude rule
function getAdjustmentPortion(
  night: number,
  angle: number,
  rule: HighLatitudeRule
): number {
  switch (rule) {
    case "NightMiddle":
      return night * 0.5; // Half of night

    case "OneSeventh":
      return night / 7; // One seventh of night

    case "AngleBased":
      return night * (angle / 60); // Angle-based portion

    default:
      return night * 0.5;
  }
}

// Apply specific high latitude rule
function applyHighLatitudeRule(
  baseTime: Date,
  params: PolarAdjustmentParams,
  rule: HighLatitudeRule
): Date {
  const portion = getAdjustmentPortion(params.night, params.angle, rule);
  const direction = params.direction ?? 1;
  const adjustment = portion * direction * 3600; // Convert to seconds

  return addSeconds(baseTime, adjustment);
}

// Seasonal adjustment for morning twilight (adhan-js algorithm)
export function seasonAdjustedMorningTwilight(
  params: SeasonAdjustmentParams
): Date {
  const { latitude, dayOfYear, year, baseTime } = params;

  const a = 75 + (28.65 / 55.0) * Math.abs(latitude);
  const b = 75 + (19.44 / 55.0) * Math.abs(latitude);
  const c = 75 + (32.74 / 55.0) * Math.abs(latitude);
  const d = 75 + (48.1 / 55.0) * Math.abs(latitude);

  const dyy = daysSinceSolstice(dayOfYear, year, latitude);
  let adjustment: number;

  if (dyy < 91) {
    adjustment = a + ((b - a) / 91.0) * dyy;
  } else if (dyy < 137) {
    adjustment = b + ((c - b) / 46.0) * (dyy - 91);
  } else if (dyy < 183) {
    adjustment = c + ((d - c) / 46.0) * (dyy - 137);
  } else if (dyy < 229) {
    adjustment = d + ((c - d) / 46.0) * (dyy - 183);
  } else if (dyy < 275) {
    adjustment = c + ((b - c) / 46.0) * (dyy - 229);
  } else {
    adjustment = b + ((a - b) / 91.0) * (dyy - 275);
  }

  return addSeconds(baseTime, Math.round(adjustment * -60.0));
}

// Seasonal adjustment for evening twilight (adhan-js algorithm)
export function seasonAdjustedEveningTwilight(
  params: SeasonAdjustmentParams,
  shafaq: "general" | "ahmer" | "abyad" = "general"
): Date {
  const { latitude, dayOfYear, year, baseTime } = params;

  let a: number, b: number, c: number, d: number;

  if (shafaq === "ahmer") {
    a = 62 + (17.4 / 55.0) * Math.abs(latitude);
    b = 62 - (7.16 / 55.0) * Math.abs(latitude);
    c = 62 + (5.12 / 55.0) * Math.abs(latitude);
    d = 62 + (19.44 / 55.0) * Math.abs(latitude);
  } else if (shafaq === "abyad") {
    a = 75 + (25.6 / 55.0) * Math.abs(latitude);
    b = 75 + (7.16 / 55.0) * Math.abs(latitude);
    c = 75 + (36.84 / 55.0) * Math.abs(latitude);
    d = 75 + (81.84 / 55.0) * Math.abs(latitude);
  } else {
    // General/default shafaq
    a = 75 + (25.6 / 55.0) * Math.abs(latitude);
    b = 75 + (2.05 / 55.0) * Math.abs(latitude);
    c = 75 - (9.21 / 55.0) * Math.abs(latitude);
    d = 75 + (6.14 / 55.0) * Math.abs(latitude);
  }

  const dyy = daysSinceSolstice(dayOfYear, year, latitude);
  let adjustment: number;

  if (dyy < 91) {
    adjustment = a + ((b - a) / 91.0) * dyy;
  } else if (dyy < 137) {
    adjustment = b + ((c - b) / 46.0) * (dyy - 91);
  } else if (dyy < 183) {
    adjustment = c + ((d - c) / 46.0) * (dyy - 137);
  } else if (dyy < 229) {
    adjustment = d + ((c - d) / 46.0) * (dyy - 183);
  } else if (dyy < 275) {
    adjustment = c + ((b - c) / 46.0) * (dyy - 229);
  } else {
    adjustment = b + ((a - b) / 91.0) * (dyy - 275);
  }

  return addSeconds(baseTime, Math.round(adjustment * 60.0));
}

// Calculate night length in hours
export function calculateNightLength(
  sunrise: Date,
  previousSunset: Date,
  nextSunrise?: Date
): number {
  if (nextSunrise) {
    return (
      (nextSunrise.getTime() - previousSunset.getTime()) / (1000 * 60 * 60)
    );
  }

  // If no next sunrise provided, calculate from previous day
  const nextDay = new Date(sunrise);
  nextDay.setDate(nextDay.getDate() + 1);
  return calculateNightLength(sunrise, previousSunset, nextDay);
}

// Get safe prayer times using high latitude adjustments
export function getSafePrayerTimes(
  calculatedTimes: {
    fajr?: Date | null;
    sunrise: Date;
    sunset: Date;
    isha?: Date | null;
    maghrib?: Date | null;
  },
  coordinates: { latitude: number; longitude: number },
  date: Date,
  angles: { fajr: number; isha?: number; maghrib?: number },
  rule: HighLatitudeRule = "NightMiddle"
): { fajr: Date; isha: Date; maghrib: Date } {
  const night = calculateNightLength(
    calculatedTimes.sunrise,
    calculatedTimes.sunset
  );
  const dayOfYearValue = dayOfYear(date);

  // Fajr adjustment
  let safeFajr = calculatedTimes.fajr;
  if (!safeFajr || isNaN(safeFajr.getTime())) {
    if (requiresPolarAdjustment(coordinates.latitude) && rule !== "None") {
      safeFajr = applyHighLatitudeRule(
        calculatedTimes.sunrise,
        {
          latitude: coordinates.latitude,
          angle: angles.fajr,
          night,
          direction: -1,
        },
        rule
      );
    } else {
      // Use seasonal adjustment for Moonsighting Committee method
      safeFajr = seasonAdjustedMorningTwilight({
        latitude: coordinates.latitude,
        dayOfYear: dayOfYearValue,
        year: date.getFullYear(),
        baseTime: calculatedTimes.sunrise,
      });
    }
  }

  // Isha adjustment
  let safeIsha = calculatedTimes.isha;
  if (!safeIsha || isNaN(safeIsha.getTime())) {
    if (
      requiresPolarAdjustment(coordinates.latitude) &&
      rule !== "None" &&
      angles.isha
    ) {
      safeIsha = applyHighLatitudeRule(
        calculatedTimes.sunset,
        {
          latitude: coordinates.latitude,
          angle: angles.isha,
          night,
          direction: 1,
        },
        rule
      );
    } else {
      // Use seasonal adjustment for Moonsighting Committee method
      safeIsha = seasonAdjustedEveningTwilight({
        latitude: coordinates.latitude,
        dayOfYear: dayOfYearValue,
        year: date.getFullYear(),
        baseTime: calculatedTimes.sunset,
      });
    }
  }

  // Maghrib is usually sunset, but can be adjusted
  let safeMaghrib = calculatedTimes.maghrib ?? calculatedTimes.sunset;

  return {
    fajr: safeFajr ?? calculatedTimes.sunrise,
    isha: safeIsha ?? calculatedTimes.sunset,
    maghrib: safeMaghrib,
  };
}

// Check if coordinates are in polar day/night conditions
export function isPolarDayNight(
  coordinates: { latitude: number; longitude: number },
  date: Date
): { isPolarDay: boolean; isPolarNight: boolean } {
  // Simplified check - in practice would need more sophisticated solar calculations
  const absLatitude = Math.abs(coordinates.latitude);

  if (absLatitude < 66.5) {
    return { isPolarDay: false, isPolarNight: false };
  }

  const dayOfYearValue = dayOfYear(date);
  const isNorthern = coordinates.latitude > 0;
  const isSummer = isNorthern
    ? dayOfYearValue > 80 && dayOfYearValue < 266
    : dayOfYearValue < 80 || dayOfYearValue > 266;

  const isPolarDay = absLatitude > 66.5 && isSummer;
  const isPolarNight = absLatitude > 66.5 && !isSummer;

  return { isPolarDay, isPolarNight };
}

// Get recommended high latitude rule for coordinates
export function getRecommendedHighLatitudeRule(coordinates: {
  latitude: number;
  longitude: number;
}): HighLatitudeRule {
  const absLatitude = Math.abs(coordinates.latitude);

  if (absLatitude < 48) {
    return "None";
  } else if (absLatitude < 55) {
    return "AngleBased";
  } else if (absLatitude < 66.5) {
    return "NightMiddle";
  } else {
    return "OneSeventh"; // Arctic/Antarctic circles
  }
}
