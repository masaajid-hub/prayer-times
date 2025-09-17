/**
 * Main API class for prayer times calculation
 * Developer-friendly interface with method chaining and utilities
 * Object-based configuration for optimal performance
 */

import {
  calculateMonthlyPrayerTimes,
  calculatePrayerTimes,
  calculatePrayerTimesRange,
  calculatePrayerTimesWithMeta,
  CalculatorUtils,
  getCurrentPrayerInfo,
} from "../lib/engine/calculator";

import {
  calculateSunnahTimes,
  SunnahTimesCalculator,
} from "../extensions/sunnah-times";
import {
  getRegionalMethods,
  isMethodSuitableForLocation,
  suggestMethod,
} from "../lib/methods/geographic";
import { validateConfig } from "../lib/methods/validation";
import { formatPrayerTimes } from "../lib/utils/time";

import type {
  CoordinateInput,
  CurrentPrayerInfo,
  DateInput,
  DateRange,
  FormattedPrayerTimes,
  MethodCode,
  MethodSuggestion,
  MonthlyPrayerTimes,
  PrayerTimeConfig,
  PrayerTimes,
  PrayerTimesRange,
  PrayerTimesWithMeta,
  SunnahPeriod,
  SunnahTimes,
  TimeFormat,
  ValidationResult,
} from "../types";

import { parseCoordinates } from "../lib/utils/coordinates";

export class PrayerTimeCalculator {
  private config: PrayerTimeConfig;

  constructor(config: PrayerTimeConfig) {
    // Validate configuration with enhanced error handling
    const validation = validateConfig(config);
    if (!validation.isValid) {
      const errorDetails = validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("\n  ");

      throw new Error(
        `Prayer time configuration validation failed:\n  ${errorDetails}\n\n` +
          `Please check your configuration and ensure all required fields are properly set.`
      );
    }

    this.config = { ...config };
  }

  // Static utility methods for convenience

  /**
   * Calculate prayer times with simple config (static version)
   */
  static calculate(config: PrayerTimeConfig, date?: DateInput): PrayerTimes {
    return calculatePrayerTimesSimple(config, date);
  }

  /**
   * Calculate Sunnah times with simple config (static version)
   */
  static calculateSunnah(
    config: PrayerTimeConfig,
    date?: DateInput
  ): SunnahTimes {
    return calculateSunnahTimesSimple(config, date);
  }

  /**
   * Calculate prayer times for specific date
   */
  calculate(date?: DateInput): PrayerTimes {
    try {
      const calculationDate = this.parseDate(date);
      const result = calculatePrayerTimes(this.config, calculationDate);

      if (!result.isValid) {
        const errorMessage = result.warnings.join("; ");
        throw new Error(
          `Prayer time calculation failed: ${errorMessage}\n\n` +
            `This may occur due to:\n` +
            `  • Extreme latitude locations during certain seasons\n` +
            `  • Invalid date or timezone\n` +
            `  • Calculation method incompatible with location\n\n` +
            `Try using a different high latitude rule or adjust your location/method.`
        );
      }

      return result.times;
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw with context if it's already a detailed error
        if (error.message.includes("Prayer time calculation failed")) {
          throw error;
        }

        // Wrap other errors with helpful context
        throw new Error(
          `Failed to calculate prayer times: ${error.message}\n\n` +
            `Please verify your configuration and try again.`
        );
      }

      // Handle unexpected errors
      throw new Error(
        `An unexpected error occurred during prayer time calculation. ` +
          `Please check your input parameters and try again.`
      );
    }
  }

  /**
   * Calculate prayer times with metadata
   */
  calculateWithMeta(date?: DateInput): PrayerTimesWithMeta {
    const calculationDate = this.parseDate(date);
    return calculatePrayerTimesWithMeta(this.config, calculationDate);
  }

  /**
   * Calculate formatted prayer times
   */
  calculateFormatted(
    date?: DateInput,
    format: TimeFormat = "24h"
  ): FormattedPrayerTimes {
    const times = this.calculate(date);
    return formatPrayerTimes(
      times,
      format,
      this.config.rounding
    ) as FormattedPrayerTimes;
  }

  /**
   * Calculate prayer times for entire month
   */
  calculateForMonth(year: number, month: number): MonthlyPrayerTimes {
    const results = calculateMonthlyPrayerTimes(this.config, year, month);

    return {
      year,
      month,
      times: results.map((r) => r.times),
    };
  }

  /**
   * Calculate prayer times for date range
   */
  calculateForRange(range: DateRange): PrayerTimesRange {
    const results = calculatePrayerTimesRange(
      this.config,
      range.start,
      range.end
    );

    return {
      range,
      times: results.map((r) => r.times),
    };
  }

  /**
   * Get current prayer information
   */
  getCurrentPrayer(currentTime?: DateInput): CurrentPrayerInfo {
    const now = this.parseDate(currentTime);
    const times = this.calculate(now);

    return getCurrentPrayerInfo(times, now);
  }

  /**
   * Get next prayer information
   */
  getNextPrayer(currentTime?: DateInput): {
    prayer: string;
    time: Date;
    minutesUntil: number;
  } | null {
    const current = this.getCurrentPrayer(currentTime);

    if (!current.next || current.timeUntilNext === undefined) {
      return null;
    }

    const now = this.parseDate(currentTime);
    const times = this.calculate(now);
    const nextTime = times[current.next];

    return {
      prayer: current.next,
      time: nextTime,
      minutesUntil: current.timeUntilNext,
    };
  }

  /**
   * Update calculator configuration
   */
  updateConfig(updates: Partial<PrayerTimeConfig>): void {
    const newConfig = { ...this.config, ...updates };

    const validation = validateConfig(newConfig);
    if (!validation.isValid) {
      throw new Error(
        `Invalid configuration update: ${validation.errors.map((e) => e.message).join(", ")}`
      );
    }

    this.config = newConfig;
  }

  /**
   * Get current configuration
   */
  getConfig(): PrayerTimeConfig {
    return { ...this.config };
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): ValidationResult {
    return validateConfig(this.config);
  }

  /**
   * Check if current method is suitable for location
   */
  isMethodSuitable(): { suitable: boolean; reason?: string } {
    const coordinates = parseCoordinates(this.config.location);
    return isMethodSuitableForLocation(this.config.method, coordinates);
  }

  /**
   * Get alternative methods for current location
   */
  getAlternativeMethods(): MethodCode[] {
    const coordinates = parseCoordinates(this.config.location);
    return getRegionalMethods(coordinates);
  }

  /**
   * Calculate Sunnah times for Islamic observances
   */
  getSunnahTimes(date?: DateInput): SunnahTimes {
    try {
      const calculationDate = this.parseDate(date);
      return calculateSunnahTimes(this.config, calculationDate);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to calculate Sunnah times: ${error.message}\n\n` +
            `Sunnah times calculation requires valid prayer times for the current and next day. ` +
            `Please ensure your location and method configuration is correct.`
        );
      }

      throw new Error(
        `An unexpected error occurred while calculating Sunnah times. ` +
          `Please verify your configuration and try again.`
      );
    }
  }

  /**
   * Get night thirds for night prayers
   */
  getNightThirds(date?: DateInput): {
    first: Date;
    middle: Date;
    last: Date;
    nightDuration: number;
  } {
    const sunnah = this.getSunnahTimes(date);
    return {
      first: sunnah.firstThirdOfNight,
      middle: sunnah.middleOfNight,
      last: sunnah.lastThirdOfNight,
      nightDuration: sunnah.meta.nightDuration,
    };
  }

  /**
   * Get Duha prayer window
   */
  getDuhaWindow(date?: DateInput): {
    start: Date;
    end: Date;
    duration: number;
  } {
    const sunnah = this.getSunnahTimes(date);
    const durationMs = sunnah.duhaEnd.getTime() - sunnah.duhaStart.getTime();
    return {
      start: sunnah.duhaStart,
      end: sunnah.duhaEnd,
      duration: Math.round(durationMs / (1000 * 60)), // duration in minutes
    };
  }

  /**
   * Check if current time is within a specific Sunnah time period
   */
  isCurrentlyInSunnahPeriod(period: SunnahPeriod, date?: DateInput): boolean {
    const calculator = new SunnahTimesCalculator(this.config);
    const calculationDate = this.parseDate(date);
    return calculator.isCurrentlyInPeriod(period, calculationDate);
  }

  // Private helper methods
  private parseDate(date?: DateInput): Date {
    if (!date) return new Date();

    if (date instanceof Date) {
      // Validate the date object
      if (isNaN(date.getTime())) {
        throw new Error(
          `Invalid Date object provided. ` +
            `Please ensure the date is properly constructed.`
        );
      }
      return date;
    }

    if (typeof date === "string") {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(
          `Invalid date string: "${date}". ` +
            `Please use a valid date format like "2024-01-15" or "2024-01-15T12:00:00Z".`
        );
      }
      return parsed;
    }

    if (typeof date === "number") {
      // Validate reasonable timestamp range (not too far in past/future)
      const year = new Date(date).getFullYear();
      if (year < 1900 || year > 2200) {
        throw new Error(
          `Date timestamp appears to be invalid (year: ${year}). ` +
            `Please provide a timestamp in milliseconds since Unix epoch.`
        );
      }

      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(
          `Invalid timestamp: ${date}. ` +
            `Please provide a valid timestamp in milliseconds.`
        );
      }
      return parsed;
    }

    throw new Error(
      `Invalid date input type. Expected Date object, string, number, or undefined. ` +
        `Received: ${typeof date}`
    );
  }
}

// Static factory functions for convenience

/**
 * Calculate prayer times with simple object configuration
 */
export function calculatePrayerTimesSimple(
  config: PrayerTimeConfig,
  date?: DateInput
): PrayerTimes {
  const calculator = new PrayerTimeCalculator(config);
  return calculator.calculate(date);
}

/**
 * Get method suggestion for coordinates
 */
export function suggestMethodForLocation(
  location: CoordinateInput
): MethodSuggestion {
  const coordinates = parseCoordinates(location);
  return suggestMethod(coordinates);
}

/**
 * Calculate Sunnah times for a specific configuration and date
 */
export function calculateSunnahTimesSimple(
  config: PrayerTimeConfig,
  date?: DateInput
): SunnahTimes {
  const calculationDate = date
    ? date instanceof Date
      ? date
      : new Date(date)
    : new Date();
  return calculateSunnahTimes(config, calculationDate);
}

/**
 * Validate prayer time configuration
 */
export function validatePrayerTimeConfig(
  config: Partial<PrayerTimeConfig>
): ValidationResult {
  return validateConfig(config);
}

/**
 * Format prayer times to string representation
 */
export function formatPrayerTimesToString(
  times: PrayerTimes,
  format: TimeFormat = "24h"
): FormattedPrayerTimes {
  return formatPrayerTimes(times, format) as FormattedPrayerTimes;
}

/**
 * Create optimized calculator for bulk operations
 */
export function createBulkCalculator(
  config: PrayerTimeConfig,
  options?: {
    reducedPrecision?: boolean;
    skipValidation?: boolean;
  }
): PrayerTimeCalculator {
  const bulkConfig = CalculatorUtils.createBulkConfig(config, options);
  return new PrayerTimeCalculator(bulkConfig);
}

// Export main calculator class and utility functions
export default PrayerTimeCalculator;

// Export convenient aliases
export const Calculator = PrayerTimeCalculator;

// Utility object for static functions
export const PrayerTimeUtils = {
  calculate: calculatePrayerTimesSimple,
  suggestMethod: suggestMethodForLocation,
  validate: validatePrayerTimeConfig,
  format: formatPrayerTimesToString,
  createBulkCalculator,
  calculateSunnah: calculateSunnahTimesSimple,
};

// Type guards for runtime type checking
export function isPrayerTimes(obj: unknown): obj is PrayerTimes {
  if (!obj || typeof obj !== "object" || obj === null) {
    return false;
  }

  const candidate = obj as any;
  return (
    "fajr" in candidate &&
    candidate.fajr instanceof Date &&
    "sunrise" in candidate &&
    candidate.sunrise instanceof Date &&
    "dhuhr" in candidate &&
    candidate.dhuhr instanceof Date &&
    "asr" in candidate &&
    candidate.asr instanceof Date &&
    "sunset" in candidate &&
    candidate.sunset instanceof Date &&
    "maghrib" in candidate &&
    candidate.maghrib instanceof Date &&
    "isha" in candidate &&
    candidate.isha instanceof Date
  );
}

export function isPrayerTimeConfig(obj: unknown): obj is PrayerTimeConfig {
  if (!obj || typeof obj !== "object" || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  // Check for required method property
  if (!("method" in candidate) || typeof candidate.method !== "string") {
    return false;
  }

  // Check for required location property
  if (!("location" in candidate)) {
    return false;
  }

  // Location can be array or object with latitude
  if (Array.isArray(candidate.location)) {
    return true;
  }

  if (
    candidate.location &&
    typeof candidate.location === "object" &&
    candidate.location !== null &&
    "latitude" in candidate.location &&
    typeof (candidate.location as Record<string, unknown>).latitude === "number"
  ) {
    return true;
  }

  return false;
}

// Constants for easy access
export const PRAYER_NAMES = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "sunset",
  "maghrib",
  "isha",
] as const;
export const TIME_FORMATS = [
  "24h",
  "12h",
  "12hNS",
  "timestamp",
  "iso8601",
] as const;

// Export calculation engine functions for advanced usage
export { calculatePrayerTimes as calculatePrecise } from "../lib/engine/calculator";
export { PrecisionUtils } from "../lib/engine/precision";
