/**
 * Main prayer time calculation orchestrator
 * Coordinates all calculation components for final results
 * Handles method-specific logic and adjustments
 */

import { getMethodParams } from "../methods/methods";
import { sanitizeConfig, validateConfig } from "../methods/validation";
import { parseCoordinates } from "../utils/coordinates";
import { getSafePrayerTimes, requiresPolarAdjustment } from "../utils/polar";
import { addMinutes, convertToTimezone } from "../utils/time";
import {
  calculatePrecisePrayerTimes,
  createCalculationContext,
  PrecisionUtils,
} from "./precision";
import { checkPolarConditions } from "./solar";
import { SolarTime } from "./solar-time";

import type {
  Coordinates,
  MethodCode,
  MethodParams,
  PrayerName,
  PrayerTimeConfig,
  PrayerTimes,
  PrayerTimesWithMeta,
  ValidationResult,
} from "../../types";

export interface CalculationOptions {
  validateInput?: boolean;
  applyAdjustments?: boolean;
  handlePolarRegions?: boolean;
  includeMetadata?: boolean;
  timezoneName?: string;
}

export interface CalculationResult {
  times: PrayerTimes;
  isValid: boolean;
  warnings: string[];
  metadata?: {
    method: MethodCode;
    coordinates: Coordinates;
    iterations: number;
    precision: number;
    calculationTime: number;
  };
}

const DEFAULT_OPTIONS: CalculationOptions = {
  validateInput: true,
  applyAdjustments: true,
  handlePolarRegions: true,
  includeMetadata: false,
};

/**
 * Main prayer time calculation function
 */
export function calculatePrayerTimes(
  config: PrayerTimeConfig,
  date?: Date,
  options: CalculationOptions = {}
): CalculationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const calculationDate = date ?? new Date();
  const warnings: string[] = [];

  try {
    // Input validation
    if (opts.validateInput) {
      const validation = validateConfig(config);
      if (!validation.isValid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.map((e) => e.message).join(", ")}`
        );
      }
    }

    // Sanitize and normalize configuration
    const sanitizedConfig = sanitizeConfig(config);
    const coordinates = parseCoordinates(sanitizedConfig.location!);

    // Get method parameters
    const baseMethodParams = getMethodParams(sanitizedConfig.method!);

    // Apply parameter overrides if provided
    const methodParams: MethodParams = applyParameterOverrides(
      baseMethodParams,
      sanitizedConfig
    );

    // Create calculation context
    const context = createCalculationContext(
      calculationDate,
      coordinates,
      methodParams,
      {
        methodCode: sanitizedConfig.method!,
        elevation: sanitizedConfig.elevation ?? 0,
        highLatitudeRule: sanitizedConfig.highLatitudeRule ?? "NightMiddle",
        iterations: sanitizedConfig.iterations ?? 1,
      }
    );

    // Check for polar conditions
    const polarConditions = checkPolarConditions(calculationDate, coordinates);
    if (polarConditions.isPolarDay || polarConditions.isPolarNight) {
      if (opts.handlePolarRegions) {
        warnings.push(`Polar region detected: ${polarConditions.reason}`);
      } else {
        throw new Error(
          `Cannot calculate prayer times in polar regions: ${polarConditions.reason}`
        );
      }
    }

    // Perform precision calculation
    const startTime = Date.now();
    const precisionResult = calculatePrecisePrayerTimes(context);

    if (!precisionResult.converged) {
      warnings.push(
        "Calculation did not fully converge, results may have reduced accuracy"
      );
    }

    let times = precisionResult.value;

    // Apply high latitude adjustments if needed
    if (
      opts.handlePolarRegions &&
      requiresPolarAdjustment(coordinates.latitude)
    ) {
      times = applyHighLatitudeAdjustments(
        times,
        context,
        sanitizedConfig as PrayerTimeConfig
      );
    }

    // Apply Asr school adjustments
    if (sanitizedConfig.asrSchool === "Hanafi") {
      times.asr = calculateHanafiAsr(
        times,
        coordinates,
        calculationDate,
        sanitizedConfig.elevation ?? 0
      );
    }

    // Apply user adjustments
    if (opts.applyAdjustments && sanitizedConfig.adjustments) {
      times = applyUserAdjustments(times, sanitizedConfig.adjustments);
    }

    // Apply timezone conversion if specified
    if (sanitizedConfig.timezone) {
      times = convertTimesToTimezone(times, sanitizedConfig.timezone);
    }

    // Validate final results
    const validation = PrecisionUtils.validateResults(times, context);
    if (!validation.isValid) {
      warnings.push(...validation.issues);
    }

    // Create result
    const result: CalculationResult = {
      times,
      isValid: validation.isValid,
      warnings,
    };

    // Add metadata if requested
    if (opts.includeMetadata) {
      const calculationTime = Date.now() - startTime;
      result.metadata = {
        method: sanitizedConfig.method!,
        coordinates,
        iterations: precisionResult.iterations,
        precision: precisionResult.error ?? 0,
        calculationTime,
      };
    }

    return result;
  } catch (error) {
    return {
      times: createFallbackTimes(calculationDate),
      isValid: false,
      warnings: [
        `Calculation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Calculate prayer times with metadata
 */
export function calculatePrayerTimesWithMeta(
  config: PrayerTimeConfig,
  date?: Date
): PrayerTimesWithMeta {
  const result = calculatePrayerTimes(config, date, { includeMetadata: true });

  return {
    ...result.times,
    meta: {
      method: config.method,
      methodParams: getMethodParams(config.method),
      coordinates: parseCoordinates(config.location),
      timezone: config.timezone,
      date: date ?? new Date(),
      julianDay: 0, // Will be calculated in solar engine
      highLatitudeAdjustment: config.highLatitudeRule,
      adjustments: config.adjustments,
    },
  };
}

/**
 * Apply high latitude adjustments using polar methods
 */
function applyHighLatitudeAdjustments(
  times: PrayerTimes,
  context: { coordinates: Coordinates; date: Date; methodParams: any },
  config: PrayerTimeConfig
): PrayerTimes {
  const { coordinates, date, methodParams } = context;
  const rule = config.highLatitudeRule ?? "NightMiddle";

  const safeTimes = getSafePrayerTimes(
    {
      fajr: times.fajr,
      sunrise: times.sunrise,
      sunset: times.sunset,
      isha: times.isha,
      maghrib: times.maghrib,
    },
    coordinates,
    date,
    {
      fajr: methodParams.fajr,
      isha:
        typeof methodParams.isha === "number" ? methodParams.isha : undefined,
      maghrib:
        typeof methodParams.maghrib === "number"
          ? methodParams.maghrib
          : undefined,
    },
    rule
  );

  return {
    ...times,
    fajr: safeTimes.fajr,
    isha: safeTimes.isha,
    maghrib: safeTimes.maghrib,
  };
}

/**
 * Calculate Hanafi Asr time (shadow length = 2 * object length)
 */
function calculateHanafiAsr(
  _times: PrayerTimes,
  coordinates: Coordinates,
  date: Date,
  _elevation: number
): Date {
  const solarTime = new SolarTime(date, coordinates);
  const hanafiAsrTime = solarTime.afternoon(2); // Hanafi school uses shadow length = 2

  // Create UTC date from decimal hours (following SolarTime pattern)
  const asrDate = new Date(date);
  const hours = Math.floor(hanafiAsrTime);
  const minutes = (hanafiAsrTime % 1) * 60;
  const seconds = (minutes % 1) * 60;

  asrDate.setUTCHours(hours, Math.floor(minutes), Math.floor(seconds), 0);
  return asrDate;
}

/**
 * Apply user-defined time adjustments
 */
function applyUserAdjustments(
  times: PrayerTimes,
  adjustments: Partial<Record<PrayerName, number>>
): PrayerTimes {
  const adjustedTimes = { ...times };

  for (const [prayer, adjustment] of Object.entries(adjustments)) {
    if (prayer in adjustedTimes && typeof adjustment === "number") {
      const prayerName = prayer as PrayerName;
      if (prayerName !== "sunrise") {
        // Sunrise is calculated, not adjusted
        (adjustedTimes as any)[prayerName] = addMinutes(
          adjustedTimes[prayerName],
          adjustment
        );
      }
    }
  }

  return adjustedTimes;
}

/**
 * Convert all prayer times to specified timezone
 */
function convertTimesToTimezone(
  times: PrayerTimes,
  timezoneName: string
): PrayerTimes {
  return {
    fajr: convertToTimezone(times.fajr, timezoneName),
    sunrise: convertToTimezone(times.sunrise, timezoneName),
    dhuhr: convertToTimezone(times.dhuhr, timezoneName),
    asr: convertToTimezone(times.asr, timezoneName),
    sunset: convertToTimezone(times.sunset, timezoneName),
    maghrib: convertToTimezone(times.maghrib, timezoneName),
    isha: convertToTimezone(times.isha, timezoneName),
  };
}

/**
 * Create fallback prayer times for error cases
 */
function createFallbackTimes(date: Date): PrayerTimes {
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  return {
    fajr: addMinutes(baseDate, 5 * 60), // 5:00 AM
    sunrise: addMinutes(baseDate, 6 * 60), // 6:00 AM
    dhuhr: addMinutes(baseDate, 12 * 60), // 12:00 PM
    asr: addMinutes(baseDate, 15 * 60), // 3:00 PM
    sunset: addMinutes(baseDate, 18 * 60), // 6:00 PM
    maghrib: addMinutes(baseDate, 18 * 60 + 5), // 6:05 PM
    isha: addMinutes(baseDate, 19 * 60 + 30), // 7:30 PM
  };
}

/**
 * Calculate prayer times for multiple dates
 */
export function calculateMonthlyPrayerTimes(
  config: PrayerTimeConfig,
  year: number,
  month: number
): { date: Date; times: PrayerTimes; isValid: boolean }[] {
  const results: { date: Date; times: PrayerTimes; isValid: boolean }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const result = calculatePrayerTimes(config, date);

    results.push({
      date,
      times: result.times,
      isValid: result.isValid,
    });
  }

  return results;
}

/**
 * Calculate prayer times for date range
 */
export function calculatePrayerTimesRange(
  config: PrayerTimeConfig,
  startDate: Date,
  endDate: Date
): { date: Date; times: PrayerTimes; isValid: boolean }[] {
  const results: { date: Date; times: PrayerTimes; isValid: boolean }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const result = calculatePrayerTimes(config, new Date(currentDate));

    results.push({
      date: new Date(currentDate),
      times: result.times,
      isValid: result.isValid,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}

/**
 * Get current prayer information
 */
export function getCurrentPrayerInfo(
  times: PrayerTimes,
  currentTime?: Date
): {
  current: PrayerName | null;
  next: PrayerName | null;
  timeUntilNext?: number;
} {
  const now = currentTime ?? new Date();
  const prayerOrder: PrayerName[] = [
    "fajr",
    "sunrise",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
  ];

  let current: PrayerName | null = null;
  let next: PrayerName | null = null;
  let timeUntilNext: number | undefined;

  // Find current and next prayer
  for (let i = 0; i < prayerOrder.length; i++) {
    const prayerName = prayerOrder[i];
    const prayerTime = times[prayerName];

    if (now < prayerTime) {
      next = prayerName;
      timeUntilNext = Math.round(
        (prayerTime.getTime() - now.getTime()) / (1000 * 60)
      );

      if (i > 0) {
        current = prayerOrder[i - 1];
      }
      break;
    }
  }

  // If no next prayer found today, next prayer is tomorrow's Fajr
  if (!next) {
    next = "fajr";
    current = "isha";
  }

  return { current, next, timeUntilNext };
}

/**
 * Validate calculation configuration
 */
export function validateCalculationConfig(
  config: PrayerTimeConfig
): ValidationResult {
  return validateConfig(config);
}

/**
 * Create optimized configuration for bulk calculations
 */
export function createBulkConfig(
  baseConfig: PrayerTimeConfig,
  optimizations?: {
    reducedPrecision?: boolean;
    skipValidation?: boolean;
    batchSize?: number;
  }
): PrayerTimeConfig {
  const opts = {
    reducedPrecision: false,
    skipValidation: false,
    batchSize: 30,
    ...optimizations,
  };

  return {
    ...baseConfig,
    iterations: opts.reducedPrecision ? 1 : (baseConfig.iterations ?? 3),
    // Additional bulk optimizations could be added here
  };
}

/**
 * Calculate prayer times with performance monitoring
 */
export function calculateWithPerfMetrics(
  config: PrayerTimeConfig,
  date?: Date
): CalculationResult & { perfMetrics: any } {
  const startTime = Date.now();
  const result = calculatePrayerTimes(config, date, { includeMetadata: true });
  const endTime = Date.now();

  const perfMetrics = {
    totalTime: endTime - startTime,
    ...result.metadata,
  };

  return {
    ...result,
    perfMetrics,
  };
}

/**
 * Apply parameter overrides from user configuration to method parameters
 */
function applyParameterOverrides(
  baseParams: MethodParams,
  config: Partial<PrayerTimeConfig>
): MethodParams {
  const overriddenParams: MethodParams = { ...baseParams };

  // Override method parameters if provided
  if (config.fajr !== undefined) {
    overriddenParams.fajr = config.fajr;
  }

  if (config.isha !== undefined) {
    overriddenParams.isha = config.isha;
  }

  if (config.maghrib !== undefined) {
    overriddenParams.maghrib = config.maghrib;
  }

  if (config.midnight !== undefined) {
    overriddenParams.midnight = config.midnight;
  }

  if (config.shafaq !== undefined) {
    overriddenParams.shafaq = config.shafaq;
  }

  return overriddenParams;
}

/**
 * Export calculator utilities
 */
export const CalculatorUtils = {
  validateConfig: validateCalculationConfig,
  createBulkConfig,
  getCurrentPrayer: getCurrentPrayerInfo,
  calculateMonthly: calculateMonthlyPrayerTimes,
  calculateRange: calculatePrayerTimesRange,
  withMetrics: calculateWithPerfMetrics,
};
