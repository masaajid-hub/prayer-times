/**
 * Comprehensive type definitions for prayer times library
 * 100% TypeScript coverage with no any types in public API
 */

import type { HighLatitudeRule } from "../lib/utils/polar";
import type { TimeFormat, RoundingMethod } from "../lib/utils/time";
import type { Coordinates } from "../lib/utils/coordinates";

// Prayer names
export type PrayerName =
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

// Extended prayer names including midnight and other times
export type ExtendedPrayerName = PrayerName | "sunset" | "midnight";

// Sunnah time periods for additional Islamic observances
export type SunnahPeriod = "duha" | "lastThird" | "firstThird" | "middleNight";

// Asr calculation schools
export type AsrSchool = "Standard" | "Hanafi";

// Midnight calculation modes
export type MidnightMode =
  | "Standard" // From sunset to sunrise (Sunni tradition)
  | "Jafari"; // From Maghrib to Fajr (Shia tradition)

// Shafaq types for evening twilight
export type ShafaqType =
  | "general" // General twilight (default for most methods)
  | "ahmer" // Red shafaq (reddish twilight)
  | "abyad"; // White shafaq (whitish twilight)

// Main calculation method codes
export type MethodCode =
  | "ISNA" // Islamic Society of North America
  | "MWL" // Muslim World League
  | "Egypt" // Egyptian General Authority of Survey
  | "UmmAlQura" // Umm Al-Qura University, Saudi Arabia
  | "Qatar" // Qatar
  | "Dubai" // Dubai
  | "JAKIM" // Jabatan Kemajuan Islam Malaysia
  | "JAKIMKN" // Jabatan Kemajuan Islam Malaysia - Kelantan
  | "Kemenag" // Kementerian Agama, Indonesia
  | "Singapore" // Singapore
  | "France12" // France (UOIF 12°)
  | "France15" // France (Moderate 15°)
  | "France18" // France (Grande Mosquée 18°)
  | "Turkey" // Turkey
  | "Russia" // Russia
  | "Moonsighting" // Moonsighting Committee Worldwide
  | "Tehran" // Institute of Geophysics, University of Tehran
  | "Jafari" // Jafari (Shia) method
  | "Karachi" // University of Islamic Sciences, Karachi
  | "Custom"; // Custom method

// Region codes for geographic method suggestion
export type RegionCode =
  | "north_america"
  | "europe"
  | "middle_east"
  | "southeast_asia"
  | "africa"
  | "south_asia"
  | "unknown";

// Method parameter definitions
export interface MethodParams {
  fajr: number; // Fajr angle in degrees (typical: 12-20°)
  isha: number | string; // Isha: angle in degrees (typical: 14-18°) or interval ("90 min", "120 min")
  maghrib?: number | string; // Maghrib: angle in degrees (typical: 4°) or interval ("1 min", "3 min", "5 min")
  midnight?: MidnightMode; // Midnight calculation: "Standard" (from sunset to sunrise) | "Jafari" (from Maghrib to Fajr)
  shafaq?: ShafaqType; // Evening twilight type: "general" (default) | "ahmer" (red) | "abyad" (white)
  adjustments?: Partial<Record<PrayerName, number>>; // Method-specific minute adjustments (following adhan-js)
}

// Main configuration interface for prayer time calculations
export interface PrayerTimeConfig {
  method: MethodCode; // Calculation method
  location: [number, number] | Coordinates; // [latitude, longitude] or coordinates object
  timezone?: string; // Timezone (e.g., "America/New_York")
  date?: Date; // Date for calculation (defaults to current date)

  // Method parameter overrides (optional - use method defaults if not specified)
  fajr?: number; // Override Fajr angle in degrees (e.g., 15, 18, 20)
  isha?: number | string; // Override Isha: angle in degrees (e.g., 17) or interval (e.g., "90 min", "120 min")
  maghrib?: number | string; // Override Maghrib: angle in degrees (e.g., 4) or interval (e.g., "1 min", "3 min", "5 min")
  midnight?: MidnightMode; // Override midnight calculation: "Standard" | "Jafari"
  shafaq?: ShafaqType; // Override shafaq type: "general" | "ahmer" | "abyad"

  // Optional parameters with sensible defaults
  asrSchool?: AsrSchool; // Asr calculation school (default: Standard)
  highLatitudeRule?: HighLatitudeRule; // High latitude adjustment (default: NightMiddle)

  // Future extensibility
  elevation?: number; // Observer elevation in meters

  // Fine-tuning adjustments
  adjustments?: Partial<Record<PrayerName, number>>; // Time adjustments in minutes

  // Output formatting
  format?: TimeFormat; // Output time format (default: 24h)
  rounding?: RoundingMethod; // Time rounding method (default: nearest)

  // Advanced options
  iterations?: number; // Calculation iterations for precision (default: 1)
}

// Prayer times result interface
export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  sunset: Date;
  maghrib: Date;
  isha: Date;
}

// Extended prayer times with additional times
export interface ExtendedPrayerTimes extends PrayerTimes {
  midnight: Date;
  lastThirdOfNight: Date;
  firstThirdOfNight: Date;
}

// Prayer times with metadata
export interface PrayerTimesWithMeta extends PrayerTimes {
  meta: {
    method: MethodCode;
    methodParams: MethodParams;
    coordinates: Coordinates;
    timezone?: string;
    date: Date;
    julianDay: number;
    highLatitudeAdjustment?: HighLatitudeRule;
    adjustments?: Partial<Record<PrayerName, number>>;
  };
}

// Formatted prayer times (string format)
export interface FormattedPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  sunset: string;
  maghrib: string;
  isha: string;
}

// Bulk calculation interfaces
export interface MonthlyPrayerTimes {
  year: number;
  month: number; // 1-12
  times: PrayerTimes[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PrayerTimesRange {
  range: DateRange;
  times: PrayerTimes[];
}

// Current/next prayer information
export interface CurrentPrayerInfo {
  current: PrayerName | null;
  next: PrayerName | null;
  timeUntilNext?: number; // minutes until next prayer
  progress?: number; // progress through current prayer period (0-1)
}

// Geographic bounds for regions
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Method suggestion result
export interface MethodSuggestion {
  recommended: MethodCode;
  region: RegionCode;
  alternatives: MethodCode[];
  reason: string;
}

// Validation error interface
export class PrayerTimeError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public field?: string
  ) {
    super(message);
    this.name = "PrayerTimeError";
  }
}

// Error codes
export type ErrorCode =
  | "INVALID_METHOD"
  | "INVALID_COORDINATES"
  | "INVALID_DATE"
  | "INVALID_TIMEZONE"
  | "INVALID_ADJUSTMENT"
  | "INVALID_ANGLE"
  | "CALCULATION_ERROR"
  | "POLAR_REGION"
  | "VALIDATION_ERROR";

// Internal calculation interfaces
export interface SolarTime {
  transit: number; // Solar transit (Dhuhr) in decimal hours
  sunrise: number; // Sunrise time in decimal hours
  sunset: number; // Sunset time in decimal hours
  afternoon: (shadowLength: number) => number; // Asr time calculation function
  hourAngle: (angle: number, afterTransit: boolean) => number; // Hour angle calculation
}

export interface SolarPosition {
  declination: number; // Solar declination in degrees
  rightAscension: number; // Right ascension in degrees
  equationOfTime: number; // Equation of time in minutes
  julianDay: number; // Julian day number
}

export interface SolarTimes {
  transit: number; // Solar transit (Dhuhr) in decimal hours
  sunrise: number; // Sunrise in decimal hours
  sunset: number; // Sunset in decimal hours
  afternoon: (shadowLength: number) => number; // Asr calculation function
  hourAngle: (angle: number, afterTransit: boolean) => number;
}

export interface SolarCoordinates {
  declination: number; // Solar declination in degrees
  rightAscension: number; // Right ascension in degrees
  apparentSiderealTime: number; // Apparent sidereal time in degrees
}

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
}

// Calculation method registry
export type MethodRegistry = Record<string, MethodParams>;

// Configuration validation result
export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    code: ErrorCode;
  }[];
}

// Utility function type definitions
export type CoordinateInput = [number, number] | Coordinates | string;

export type DateInput = Date | string | number;

// Re-export utility types
export type { TimeFormat, RoundingMethod, HighLatitudeRule, Coordinates };

// Prayer time calculation function signature
export type CalculatePrayerTimes = (
  config: PrayerTimeConfig,
  date?: Date
) => PrayerTimes;

// Prayer time calculator class interface
export interface IPrayerTimeCalculator {
  calculate(config: PrayerTimeConfig, date?: Date): PrayerTimes;
  calculateForMonth(
    config: PrayerTimeConfig,
    year: number,
    month: number
  ): MonthlyPrayerTimes;
  calculateForRange(
    config: PrayerTimeConfig,
    range: DateRange
  ): PrayerTimesRange;
  getCurrentPrayer(times: PrayerTimes, currentTime?: Date): CurrentPrayerInfo;
  getNextPrayer(times: PrayerTimes, currentTime?: Date): PrayerName | null;
  suggestMethod(coordinates: CoordinateInput): MethodSuggestion;
  validateConfig(config: Partial<PrayerTimeConfig>): ValidationResult;
}

// Event types for potential future event system
export interface PrayerTimeEvent {
  type: "prayer_time" | "before_prayer" | "after_prayer";
  prayer: PrayerName;
  time: Date;
  location: Coordinates;
}

// Notification configuration
export interface NotificationConfig {
  enabled: boolean;
  prayers: PrayerName[];
  reminderMinutes?: number; // Minutes before prayer time
}

// Settings interface for persistent configuration
export interface PrayerTimeSettings extends PrayerTimeConfig {
  notifications?: NotificationConfig;
  favoriteLocations?: {
    name: string;
    coordinates: Coordinates;
  }[];
}

// Performance metrics interface
export interface CalculationMetrics {
  calculationTime: number; // Time taken in milliseconds
  iterationsUsed: number; // Number of iterations used
  precision: number; // Achieved precision level
  cacheHit?: boolean; // Whether result was from cache
}

// Sunnah Times interface for additional Islamic observance times
export interface SunnahTimes {
  /** Middle of the night (exact midpoint between Maghrib and next Fajr) */
  middleOfNight: Date;

  /** Last third of night (blessed time for night prayers/Qiyam) */
  lastThirdOfNight: Date;

  /** First third of night (early night period) */
  firstThirdOfNight: Date;

  /** Start time for Duha prayer (15 minutes after sunrise) */
  duhaStart: Date;

  /** End time for Duha prayer (before Dhuhr) */
  duhaEnd: Date;

  /** Metadata about the calculations */
  meta: {
    /** Total night duration in minutes */
    nightDuration: number;
    /** Calculation timestamps for debugging */
    calculation: {
      maghribTime: number;
      nextFajrTime: number;
      sunriseTime: number;
      dhuhrTime: number;
    };
  };
}
