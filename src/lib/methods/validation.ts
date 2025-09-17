/**
 * Parameter validation utilities
 * Comprehensive input validation with helpful error messages
 * Type-safe validation for all configuration parameters
 */

import type {
  PrayerTimeConfig,
  ValidationResult,
  ErrorCode,
  AsrSchool,
  HighLatitudeRule,
  TimeFormat,
  RoundingMethod,
  PrayerName,
  Coordinates,
} from "../../types";
import { validateCoordinates, parseCoordinates } from "../utils/coordinates";
import { isValidMethod } from "./methods";

/**
 * Validate complete prayer time configuration
 */
export function validateConfig(
  config: Partial<PrayerTimeConfig>
): ValidationResult {
  const errors: { field: string; message: string; code: ErrorCode }[] = [];

  // Required fields
  if (!config.method) {
    errors.push({
      field: "method",
      message: "Calculation method is required",
      code: "INVALID_METHOD",
    });
  } else if (!isValidMethod(config.method)) {
    errors.push({
      field: "method",
      message: `Invalid calculation method: ${String(config.method)}`,
      code: "INVALID_METHOD",
    });
  }

  if (!config.location) {
    errors.push({
      field: "location",
      message: "Location coordinates are required",
      code: "INVALID_COORDINATES",
    });
  } else {
    try {
      if (Array.isArray(config.location)) {
        validateCoordinates(config.location);
      } else {
        validateCoordinates([
          config.location.latitude,
          config.location.longitude,
        ]);
      }
    } catch (error) {
      errors.push({
        field: "location",
        message: error instanceof Error ? error.message : "Invalid coordinates",
        code: "INVALID_COORDINATES",
      });
    }
  }

  // Optional field validation
  if (config.timezone !== undefined) {
    const timezoneValidation = validateTimezone(config.timezone);
    if (!timezoneValidation.isValid) {
      errors.push({
        field: "timezone",
        message: timezoneValidation.error!,
        code: "INVALID_TIMEZONE",
      });
    }
  }

  if (config.date !== undefined) {
    const dateValidation = validateDate(config.date);
    if (!dateValidation.isValid) {
      errors.push({
        field: "date",
        message: dateValidation.error!,
        code: "INVALID_DATE",
      });
    }
  }

  if (config.asrSchool !== undefined) {
    const asrValidation = validateAsrSchool(config.asrSchool);
    if (!asrValidation.isValid) {
      errors.push({
        field: "asrSchool",
        message: asrValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  if (config.highLatitudeRule !== undefined) {
    const highLatValidation = validateHighLatitudeRule(config.highLatitudeRule);
    if (!highLatValidation.isValid) {
      errors.push({
        field: "highLatitudeRule",
        message: highLatValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  if (config.elevation !== undefined) {
    const elevationValidation = validateElevation(config.elevation);
    if (!elevationValidation.isValid) {
      errors.push({
        field: "elevation",
        message: elevationValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  if (config.adjustments !== undefined) {
    const adjustmentValidation = validateAdjustments(config.adjustments);
    if (!adjustmentValidation.isValid) {
      errors.push({
        field: "adjustments",
        message: adjustmentValidation.error!,
        code: "INVALID_ADJUSTMENT",
      });
    }
  }

  if (config.format !== undefined) {
    const formatValidation = validateTimeFormat(config.format);
    if (!formatValidation.isValid) {
      errors.push({
        field: "format",
        message: formatValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  if (config.rounding !== undefined) {
    const roundingValidation = validateRoundingMethod(config.rounding);
    if (!roundingValidation.isValid) {
      errors.push({
        field: "rounding",
        message: roundingValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  if (config.iterations !== undefined) {
    const iterationsValidation = validateIterations(config.iterations);
    if (!iterationsValidation.isValid) {
      errors.push({
        field: "iterations",
        message: iterationsValidation.error!,
        code: "VALIDATION_ERROR",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate timezone string
 */
export function validateTimezone(timezone: string): {
  isValid: boolean;
  error?: string;
} {
  if (typeof timezone !== "string") {
    return { isValid: false, error: "Timezone must be a string" };
  }

  if (timezone.trim().length === 0) {
    return { isValid: false, error: "Timezone cannot be empty" };
  }

  // Basic timezone format validation
  const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
  if (!timezonePattern.test(timezone) && timezone !== "UTC") {
    return {
      isValid: false,
      error:
        'Timezone must be in format "Region/City" (e.g., "America/New_York") or "UTC"',
    };
  }

  return { isValid: true };
}

/**
 * Validate date input
 */
export function validateDate(date: Date): { isValid: boolean; error?: string } {
  if (!(date instanceof Date)) {
    return { isValid: false, error: "Date must be a Date object" };
  }

  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Invalid date provided" };
  }

  // Check for reasonable date range
  const year = date.getFullYear();
  if (year < 1900 || year > 2200) {
    return {
      isValid: false,
      error: "Date must be between years 1900 and 2200",
    };
  }

  return { isValid: true };
}

/**
 * Validate Asr school
 */
export function validateAsrSchool(school: AsrSchool): {
  isValid: boolean;
  error?: string;
} {
  const validSchools: AsrSchool[] = ["Standard", "Hanafi"];

  if (!validSchools.includes(school)) {
    return {
      isValid: false,
      error: `Asr school must be one of: ${validSchools.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate high latitude rule
 */
export function validateHighLatitudeRule(rule: HighLatitudeRule): {
  isValid: boolean;
  error?: string;
} {
  const validRules: HighLatitudeRule[] = [
    "NightMiddle",
    "AngleBased",
    "OneSeventh",
    "None",
  ];

  if (!validRules.includes(rule)) {
    return {
      isValid: false,
      error: `High latitude rule must be one of: ${validRules.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate elevation
 */
export function validateElevation(elevation: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof elevation !== "number" || isNaN(elevation)) {
    return { isValid: false, error: "Elevation must be a number" };
  }

  if (elevation < -500 || elevation > 10000) {
    return {
      isValid: false,
      error: "Elevation must be between -500 and 10,000 meters",
    };
  }

  return { isValid: true };
}

/**
 * Validate time adjustments
 */
export function validateAdjustments(
  adjustments: Partial<Record<PrayerName, number>>
): { isValid: boolean; error?: string } {
  if (typeof adjustments !== "object" || adjustments === null) {
    return { isValid: false, error: "Adjustments must be an object" };
  }

  const validPrayerNames: PrayerName[] = [
    "fajr",
    "sunrise",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
  ];

  for (const [prayer, adjustment] of Object.entries(adjustments)) {
    if (!validPrayerNames.includes(prayer as PrayerName)) {
      return {
        isValid: false,
        error: `Invalid prayer name in adjustments: ${prayer}. Valid names are: ${validPrayerNames.join(", ")}`,
      };
    }

    if (typeof adjustment !== "number" || isNaN(adjustment)) {
      return {
        isValid: false,
        error: `Adjustment for ${prayer} must be a number`,
      };
    }

    if (Math.abs(adjustment) > 60) {
      return {
        isValid: false,
        error: `Adjustment for ${prayer} must be between -60 and +60 minutes`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate time format
 */
export function validateTimeFormat(format: TimeFormat): {
  isValid: boolean;
  error?: string;
} {
  const validFormats: TimeFormat[] = [
    "24h",
    "12h",
    "12hNS",
    "timestamp",
    "iso8601",
  ];

  if (!validFormats.includes(format)) {
    return {
      isValid: false,
      error: `Time format must be one of: ${validFormats.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate rounding method
 */
export function validateRoundingMethod(rounding: RoundingMethod): {
  isValid: boolean;
  error?: string;
} {
  const validMethods: RoundingMethod[] = ["nearest", "up", "down", "none"];

  if (!validMethods.includes(rounding)) {
    return {
      isValid: false,
      error: `Rounding method must be one of: ${validMethods.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate iterations count
 */
export function validateIterations(iterations: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof iterations !== "number" || isNaN(iterations)) {
    return { isValid: false, error: "Iterations must be a number" };
  }

  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 10) {
    return {
      isValid: false,
      error: "Iterations must be an integer between 1 and 10",
    };
  }

  return { isValid: true };
}

/**
 * Validate calculation method code
 */
export function validateMethodCode(method: string): {
  isValid: boolean;
  error?: string;
} {
  if (typeof method !== "string") {
    return { isValid: false, error: "Method must be a string" };
  }

  if (!isValidMethod(method)) {
    return {
      isValid: false,
      error: `Unknown calculation method: ${method}. Use a valid method code.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate coordinate input (supports multiple formats)
 */
export function validateCoordinateInput(input: unknown): {
  isValid: boolean;
  error?: string;
  coordinates?: { latitude: number; longitude: number };
} {
  try {
    const coordinates = parseCoordinates(
      input as string | [number, number] | Coordinates
    );
    return { isValid: true, coordinates };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Invalid coordinates format",
    };
  }
}

/**
 * Validate angle value
 */
export function validateAngle(
  angle: number,
  min = -180,
  max = 180
): { isValid: boolean; error?: string } {
  if (typeof angle !== "number" || isNaN(angle)) {
    return { isValid: false, error: "Angle must be a number" };
  }

  if (angle < min || angle > max) {
    return {
      isValid: false,
      error: `Angle must be between ${min} and ${max} degrees`,
    };
  }

  return { isValid: true };
}

/**
 * Create validation error with consistent format
 */
export function createValidationError(
  message: string,
  code: ErrorCode,
  field?: string
): { field?: string; message: string; code: ErrorCode } {
  return { field, message, code };
}

/**
 * Sanitize and normalize config values
 */
export function sanitizeConfig(
  config: Partial<PrayerTimeConfig>
): Partial<PrayerTimeConfig> {
  const sanitized: Partial<PrayerTimeConfig> = { ...config };

  // Keep method as-is (methods use mixed case conventions)
  // No normalization needed - method codes use both uppercase (ISNA, MWL, JAKIM)
  // and PascalCase (Singapore, Qatar, Dubai, etc.)

  // Normalize coordinates
  if (sanitized.location) {
    try {
      const coordinates = parseCoordinates(sanitized.location);
      sanitized.location = [coordinates.latitude, coordinates.longitude];
    } catch {
      // Keep original if parsing fails - will be caught in validation
    }
  }

  // Trim timezone
  if (sanitized.timezone && typeof sanitized.timezone === "string") {
    sanitized.timezone = sanitized.timezone.trim();
  }

  // Ensure elevation is number if provided
  if (
    sanitized.elevation !== undefined &&
    typeof sanitized.elevation === "string"
  ) {
    const parsed = parseFloat(sanitized.elevation);
    if (!isNaN(parsed)) {
      sanitized.elevation = parsed;
    }
  }

  // Round iterations to integer
  if (sanitized.iterations !== undefined) {
    sanitized.iterations = Math.round(sanitized.iterations);
  }

  return sanitized;
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return "Configuration is valid";
  }

  const errorCount = result.errors.length;
  const fieldList = [...new Set(result.errors.map((e) => e.field))].join(", ");

  return `${errorCount} validation error${errorCount > 1 ? "s" : ""} in fields: ${fieldList}`;
}
