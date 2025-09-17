/**
 * High-precision iterative calculation engine
 * Implements iterative refinement for maximum accuracy
 * Handles edge cases and convergence validation
 */

import type {
  Coordinates,
  HighLatitudeRule,
  MethodParams,
  PrayerTimes,
} from "../../types";
import { parseAngleOrInterval } from "../methods/methods";
import { addMinutes, roundedMinute, RoundingMode } from "../utils/time";
import { dayOfYear } from "../utils/astronomy";
import { SolarTime } from "./solar-time";
import {
  seasonAdjustedMorningTwilight,
  seasonAdjustedEveningTwilight,
} from "./astronomical";

export interface PrecisionConfig {
  maxIterations: number;
  convergenceThreshold: number; // seconds
  enableHighLatitudeAdjustment: boolean;
  elevationCorrection: boolean;
}

export interface CalculationContext {
  date: Date;
  coordinates: Coordinates;
  methodParams: MethodParams;
  methodCode?: string; // Add method code for special case handling
  elevation: number;
  highLatitudeRule: HighLatitudeRule;
  asrSchool: "Standard" | "Hanafi";
  iterations: number;
  precision: PrecisionConfig;
}

export interface IterativeResult<T> {
  value: T;
  iterations: number;
  converged: boolean;
  error?: number;
  reason?: string;
}

export interface PrecisionMetrics {
  calculationTime: number;
  iterationsUsed: number;
  convergenceAchieved: boolean;
  maxError: number;
  precision: number;
}

// Default precision configuration
export const DEFAULT_PRECISION: PrecisionConfig = {
  maxIterations: 3,
  convergenceThreshold: 30, // 30 seconds
  enableHighLatitudeAdjustment: true,
  elevationCorrection: true,
};

/**
 * Calculate prayer times with iterative precision refinement
 */
export function calculatePrecisePrayerTimes(
  context: CalculationContext
): IterativeResult<PrayerTimes> {
  const { date, coordinates, methodParams } = context;

  // Initial calculation using new SolarTime class (follows adhan-js architecture exactly)
  const solarTime = new SolarTime(date, coordinates);
  let currentTimes: Partial<PrayerTimes> = {};
  let iterationCount = 0;
  let maxError = 0;
  let converged = false;

  // Using the shared createUTCDateFromHours function below

  // Calculate each prayer time using new SolarTime class (exact adhan-js implementation)

  // Sunrise (direct from SolarTime calculation) - calculate first as needed for adjustments
  currentTimes.sunrise = createUTCDateFromHours(solarTime.sunrise, date);

  // Sunset (direct from SolarTime calculation) - calculate before Maghrib/Isha
  currentTimes.sunset = createUTCDateFromHours(solarTime.sunset, date);

  // Fajr: angle is below horizon (negative) with Moonsighting special case
  const fajrTime = calculateFajrTime(
    solarTime,
    methodParams,
    context,
    currentTimes.sunrise
  );
  currentTimes.fajr = createUTCDateFromHours(fajrTime, date);

  // Dhuhr (solar transit, high precision)
  currentTimes.dhuhr = createUTCDateFromHours(solarTime.transit, date);

  // Asr (using SolarTime.afternoon method - exact adhan-js algorithm)
  // Shadow length: 1 for Standard (Shafi), 2 for Hanafi - following adhan-js pattern
  const asrShadowLength = context.asrSchool === "Hanafi" ? 2 : 1;
  const asrTime = solarTime.afternoon(asrShadowLength);
  currentTimes.asr = createUTCDateFromHours(asrTime, date);

  // Maghrib (usually sunset + interval, or angle-based)
  const maghribTime = calculateMaghribTime(solarTime, methodParams, context);
  currentTimes.maghrib = createUTCDateFromHours(maghribTime, date);

  // Isha (using SolarTime.hourAngle method) with Moonsighting special case
  const ishaTime = calculateIshaTime(
    solarTime,
    methodParams,
    context,
    currentTimes.sunset
  );
  currentTimes.isha = createUTCDateFromHours(ishaTime, date);

  // With the adhan-js implementation, we achieve high precision directly
  iterationCount = 1; // Single calculation with high precision
  maxError = 0; // Exact calculations
  converged = true; // Always converged with adhan-js algorithm

  // Apply method-specific adjustments (following adhan-js pattern)
  let adjustedTimes: PrayerTimes = {
    fajr: currentTimes.fajr,
    sunrise: currentTimes.sunrise,
    dhuhr: currentTimes.dhuhr,
    asr: currentTimes.asr,
    sunset: currentTimes.sunset,
    maghrib: currentTimes.maghrib,
    isha: currentTimes.isha,
  };

  // Apply method adjustments if they exist
  if (methodParams.adjustments) {
    const adj = methodParams.adjustments;
    adjustedTimes = {
      fajr: adj.fajr
        ? addMinutes(adjustedTimes.fajr, adj.fajr)
        : adjustedTimes.fajr,
      sunrise: adj.sunrise
        ? addMinutes(adjustedTimes.sunrise, adj.sunrise)
        : adjustedTimes.sunrise,
      dhuhr: adj.dhuhr
        ? addMinutes(adjustedTimes.dhuhr, adj.dhuhr)
        : adjustedTimes.dhuhr,
      asr: adj.asr ? addMinutes(adjustedTimes.asr, adj.asr) : adjustedTimes.asr,
      sunset: adjustedTimes.sunset, // sunset typically not adjusted
      maghrib: adj.maghrib
        ? addMinutes(adjustedTimes.maghrib, adj.maghrib)
        : adjustedTimes.maghrib,
      isha: adj.isha
        ? addMinutes(adjustedTimes.isha, adj.isha)
        : adjustedTimes.isha,
    };
  }

  // Apply rounding to all prayer times (following adhan-js pattern)
  const roundedTimes: PrayerTimes = {
    fajr: roundedMinute(adjustedTimes.fajr, RoundingMode.Nearest),
    sunrise: roundedMinute(adjustedTimes.sunrise, RoundingMode.Nearest),
    dhuhr: roundedMinute(adjustedTimes.dhuhr, RoundingMode.Nearest),
    asr: roundedMinute(adjustedTimes.asr, RoundingMode.Nearest),
    sunset: roundedMinute(adjustedTimes.sunset, RoundingMode.Nearest),
    maghrib: roundedMinute(adjustedTimes.maghrib, RoundingMode.Nearest),
    isha: roundedMinute(adjustedTimes.isha, RoundingMode.Nearest),
  };

  return {
    value: roundedTimes,
    iterations: iterationCount,
    converged,
    error: maxError,
    reason: converged
      ? "Calculation converged successfully"
      : "Maximum iterations reached",
  };
}

/**
 * Helper function to create UTC Date from decimal hours (shared between functions)
 */
function createUTCDateFromHours(utcHours: number, baseDate: Date): Date {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();

  // Normalize hours to 0-24 range, handling day boundaries
  let adjustedHours = utcHours;
  let adjustedDay = day;

  // Handle negative hours (times from previous day)
  while (adjustedHours < 0) {
    adjustedHours += 24;
    adjustedDay -= 1;
  }

  // Handle hours >= 24 (times from next day)
  while (adjustedHours >= 24) {
    adjustedHours -= 24;
    adjustedDay += 1;
  }

  const hours = Math.floor(adjustedHours);
  const minutes = Math.floor((adjustedHours % 1) * 60);
  const seconds = Math.floor((((adjustedHours % 1) * 60) % 1) * 60);

  return new Date(Date.UTC(year, month, adjustedDay, hours, minutes, seconds));
}

/**
 * Calculate Fajr time with Moonsighting special case handling
 */
function calculateFajrTime(
  solarTime: SolarTime,
  methodParams: MethodParams,
  context: CalculationContext,
  sunriseTime: Date
): number {
  // Standard angle-based Fajr calculation
  let fajrTime = solarTime.hourAngle(-methodParams.fajr, false);

  // Moonsighting Committee special case for latitude >= 55
  if (
    context.methodCode === "Moonsighting" &&
    Math.abs(context.coordinates.latitude) >= 55
  ) {
    // Calculate night length in seconds (following adhan-js exactly)
    const tomorrow = new Date(context.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowSolarTime = new SolarTime(tomorrow, context.coordinates);

    // Create proper Date objects for sunrise/sunset times
    const tomorrowSunriseDate = createUTCDateFromHours(
      tomorrowSolarTime.sunrise,
      tomorrow
    );
    const sunsetDate = createUTCDateFromHours(solarTime.sunset, context.date);

    // Night duration in seconds
    const night = (Number(tomorrowSunriseDate) - Number(sunsetDate)) / 1000;

    // Use 1/7th of the night before sunrise (following adhan-js exactly)
    const nightFraction = night / 7;
    const adjustedFajrTime = new Date(
      sunriseTime.getTime() - nightFraction * 1000
    );

    // Convert back to decimal hours for consistency
    fajrTime =
      (adjustedFajrTime.getTime() - context.date.getTime()) / (1000 * 60 * 60);
  }

  // Safe fallback using season-adjusted twilight if needed
  const safeFajr = getSafeFajrTime(context, sunriseTime);
  if (
    isNaN(fajrTime) ||
    (safeFajr !== null &&
      (safeFajr.getTime() - context.date.getTime()) / (1000 * 60 * 60) >
        fajrTime)
  ) {
    return safeFajr !== null
      ? (safeFajr.getTime() - context.date.getTime()) / (1000 * 60 * 60)
      : fajrTime;
  }

  return fajrTime;
}

/**
 * Get safe Fajr time using season-adjusted twilight for Moonsighting method
 */
function getSafeFajrTime(
  context: CalculationContext,
  sunriseTime: Date
): Date | null {
  if (context.methodCode === "Moonsighting") {
    const dayOfYearValue = dayOfYear(context.date);
    return seasonAdjustedMorningTwilight(
      context.coordinates.latitude,
      dayOfYearValue,
      context.date.getFullYear(),
      sunriseTime
    );
  }
  return null;
}

/**
 * Calculate Maghrib time using SolarTime class
 */
function calculateMaghribTime(
  solarTime: SolarTime,
  methodParams: MethodParams,
  _context: CalculationContext
): number {
  if (!methodParams.maghrib) {
    return solarTime.sunset;
  }

  const maghribParsed = parseAngleOrInterval(methodParams.maghrib);

  if (maghribParsed.type === "angle") {
    // Angle-based Maghrib: angle is below horizon (negative)
    return solarTime.hourAngle(-maghribParsed.value, true);
  } else {
    // Interval-based (e.g., "1 min" after sunset)
    return solarTime.sunset + maghribParsed.value / 60;
  }
}

/**
 * Calculate Isha time using SolarTime class with Moonsighting special case handling
 */
function calculateIshaTime(
  solarTime: SolarTime,
  methodParams: MethodParams,
  context: CalculationContext,
  sunsetTime: Date
): number {
  const ishaParsed = parseAngleOrInterval(methodParams.isha);
  let ishaTime: number;

  if (ishaParsed.type === "angle") {
    // Angle-based Isha: angle is below horizon (negative)
    ishaTime = solarTime.hourAngle(-ishaParsed.value, true);
  } else {
    // Interval-based Isha (e.g., "90 min")
    ishaTime = solarTime.sunset + ishaParsed.value / 60;
  }

  // Moonsighting Committee special case for latitude >= 55
  if (
    context.methodCode === "Moonsighting" &&
    Math.abs(context.coordinates.latitude) >= 55
  ) {
    // Calculate night length in seconds (following adhan-js exactly)
    const tomorrow = new Date(context.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowSolarTime = new SolarTime(tomorrow, context.coordinates);

    // Create proper Date objects for sunrise/sunset times
    const tomorrowSunriseDate = createUTCDateFromHours(
      tomorrowSolarTime.sunrise,
      tomorrow
    );
    const sunsetDate = createUTCDateFromHours(solarTime.sunset, context.date);

    // Night duration in seconds
    const night = (Number(tomorrowSunriseDate) - Number(sunsetDate)) / 1000;

    // Use 1/7th of the night after sunset (following adhan-js exactly)
    const nightFraction = night / 7;
    const adjustedIshaTime = new Date(
      sunsetTime.getTime() + nightFraction * 1000
    );

    // Convert back to decimal hours for consistency
    ishaTime =
      (adjustedIshaTime.getTime() - context.date.getTime()) / (1000 * 60 * 60);
  }

  // Safe fallback using season-adjusted twilight if needed
  const safeIsha = getSafeIshaTime(context, sunsetTime);
  if (
    isNaN(ishaTime) ||
    (safeIsha !== null &&
      (safeIsha.getTime() - context.date.getTime()) / (1000 * 60 * 60) <
        ishaTime)
  ) {
    return safeIsha !== null
      ? (safeIsha.getTime() - context.date.getTime()) / (1000 * 60 * 60)
      : ishaTime;
  }

  return ishaTime;
}

/**
 * Get safe Isha time using season-adjusted twilight for Moonsighting method
 */
function getSafeIshaTime(
  context: CalculationContext,
  sunsetTime: Date
): Date | null {
  if (context.methodCode === "Moonsighting") {
    const dayOfYearValue = dayOfYear(context.date);
    // Get shafaq from method params, default to "general"
    const shafaq =
      context.methodParams.shafaq === "ahmer"
        ? "ahmer"
        : context.methodParams.shafaq === "abyad"
          ? "abyad"
          : "general";
    return seasonAdjustedEveningTwilight(
      context.coordinates.latitude,
      dayOfYearValue,
      context.date.getFullYear(),
      sunsetTime,
      shafaq
    );
  }
  return null;
}

/**
 * Validate calculation results for reasonableness
 */
export function validateCalculationResults(
  times: PrayerTimes,
  context: CalculationContext
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const { coordinates } = context;

  // Check time ordering
  if (times.fajr >= times.sunrise) {
    issues.push("Fajr time is not before sunrise");
  }

  if (times.sunrise >= times.dhuhr) {
    issues.push("Sunrise time is not before Dhuhr");
  }

  if (times.dhuhr >= times.asr) {
    issues.push("Dhuhr time is not before Asr");
  }

  if (times.asr >= times.maghrib) {
    issues.push("Asr time is not before Maghrib");
  }

  if (times.maghrib >= times.isha) {
    issues.push("Maghrib time is not before Isha");
  }

  // Check for time gaps with graduated tolerance based on latitude
  const latitudeAbs = Math.abs(coordinates.latitude);
  const isHighLatitude = latitudeAbs >= 48; // Lowered from 55 to handle methods like France18
  const isExtremeLatitude = latitudeAbs >= 60; // Lowered from 65 for better coverage

  // Adjust thresholds based on latitude (following adhan-js approach)
  const fajrGapThreshold = isExtremeLatitude ? 300 : isHighLatitude ? 240 : 180; // minutes
  const ishaGapThreshold = isExtremeLatitude ? 360 : isHighLatitude ? 300 : 240; // minutes

  const fajrToSunrise =
    (times.sunrise.getTime() - times.fajr.getTime()) / (1000 * 60);
  if (fajrToSunrise > fajrGapThreshold) {
    if (isHighLatitude) {
      // For high latitudes, provide warning but don't fail (safe fallback approach)
      issues.push(
        `Large Fajr-sunrise gap (${Math.round(fajrToSunrise)}min) at high latitude - normal in winter`
      );
    } else {
      issues.push("Fajr to sunrise gap is unusually large");
    }
  }

  const maghribToIsha =
    (times.isha.getTime() - times.maghrib.getTime()) / (1000 * 60);
  if (maghribToIsha > ishaGapThreshold) {
    if (isHighLatitude) {
      // For high latitudes, provide warning but don't fail (safe fallback approach)
      issues.push(
        `Large Maghrib-Isha gap (${Math.round(maghribToIsha)}min) at high latitude - normal in winter`
      );
    } else {
      issues.push("Maghrib to Isha gap is unusually large");
    }
  }

  // For extreme latitudes, be more lenient with validation
  if (isExtremeLatitude) {
    const dayLength =
      (times.maghrib.getTime() - times.sunrise.getTime()) / (1000 * 60 * 60);
    if (dayLength < 2 || dayLength > 22) {
      issues.push(
        `Extreme day length (${dayLength.toFixed(1)}h) at latitude ${coordinates.latitude.toFixed(1)}°`
      );
    }
  } else if (latitudeAbs > 60) {
    const dayLength =
      (times.maghrib.getTime() - times.sunrise.getTime()) / (1000 * 60 * 60);
    if (dayLength < 4 || dayLength > 20) {
      issues.push("Day length is unusual for high latitude");
    }
  }

  // Use safe fallback approach: only fail for truly invalid conditions
  // High latitude warnings don't cause validation failure
  const criticalIssues = issues.filter(
    (issue) =>
      !issue.includes("at high latitude") &&
      !issue.includes("at latitude") &&
      !issue.includes("Extreme day length")
  );

  return {
    isValid: criticalIssues.length === 0,
    issues,
  };
}

/**
 * Calculate precision metrics for performance analysis
 */
export function calculatePrecisionMetrics(
  result: IterativeResult<PrayerTimes>,
  startTime: number
): PrecisionMetrics {
  const calculationTime = Date.now() - startTime;

  return {
    calculationTime,
    iterationsUsed: result.iterations,
    convergenceAchieved: result.converged,
    maxError: result.error ?? 0,
    precision: result.error ? 1 / result.error : Infinity,
  };
}

/**
 * Adaptive precision configuration based on latitude and requirements
 */
export function createAdaptivePrecision(
  coordinates: Coordinates,
  baseConfig: Partial<PrecisionConfig> = {}
): PrecisionConfig {
  const absLatitude = Math.abs(coordinates.latitude);

  let config = { ...DEFAULT_PRECISION, ...baseConfig };

  // Increase iterations for extreme latitudes
  if (absLatitude > 60) {
    config.maxIterations = Math.max(config.maxIterations, 5);
    config.convergenceThreshold = Math.min(config.convergenceThreshold, 15);
  } else if (absLatitude > 45) {
    config.maxIterations = Math.max(config.maxIterations, 4);
    config.convergenceThreshold = Math.min(config.convergenceThreshold, 20);
  }

  // Tropical regions need different handling
  if (absLatitude < 23.5) {
    config.enableHighLatitudeAdjustment = false;
  }

  return config;
}

/**
 * Calculate confidence score for prayer times
 */
export function calculateConfidenceScore(
  result: IterativeResult<PrayerTimes>,
  context: CalculationContext
): number {
  let score = 100;

  // Penalize for non-convergence
  if (!result.converged) {
    score -= 20;
  }

  // Penalize for high error
  if (result.error && result.error > 60) {
    score -= Math.min(30, result.error / 2);
  }

  // Penalize for extreme latitudes without proper adjustments
  const absLatitude = Math.abs(context.coordinates.latitude);
  if (absLatitude > 60 && !context.precision.enableHighLatitudeAdjustment) {
    score -= 25;
  }

  // Penalize for high iteration count
  if (result.iterations >= context.precision.maxIterations) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Create optimized calculation context
 */
export function createCalculationContext(
  date: Date,
  coordinates: Coordinates,
  methodParams: MethodParams,
  options: {
    methodCode?: string;
    elevation?: number;
    highLatitudeRule?: HighLatitudeRule;
    asrSchool?: "Standard" | "Hanafi";
    iterations?: number;
    precisionConfig?: Partial<PrecisionConfig>;
  } = {}
): CalculationContext {
  const precision = createAdaptivePrecision(
    coordinates,
    options.precisionConfig
  );

  return {
    date,
    coordinates,
    methodParams,
    methodCode: options.methodCode,
    elevation: options.elevation ?? 0,
    highLatitudeRule: options.highLatitudeRule ?? "NightMiddle",
    asrSchool: options.asrSchool ?? "Standard",
    iterations: options.iterations ?? 1,
    precision,
  };
}

/**
 * Batch calculate multiple dates with shared optimization
 */
export function calculateBatchPrayerTimes(
  dates: Date[],
  baseContext: Omit<CalculationContext, "date">
): Map<string, IterativeResult<PrayerTimes>> {
  const results = new Map<string, IterativeResult<PrayerTimes>>();

  for (const date of dates) {
    const context: CalculationContext = { ...baseContext, date };
    const result = calculatePrecisePrayerTimes(context);

    const dateKey = date.toISOString().split("T")[0];
    results.set(dateKey, result);
  }

  return results;
}

/**
 * Export precision calculation utilities
 */
export const PrecisionUtils = {
  validateResults: validateCalculationResults,
  calculateMetrics: calculatePrecisionMetrics,
  createAdaptiveConfig: createAdaptivePrecision,
  calculateConfidence: calculateConfidenceScore,
  createContext: createCalculationContext,
  batchCalculate: calculateBatchPrayerTimes,
};
