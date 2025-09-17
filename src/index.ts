/**
 * Prayer Times Library - Main Export
 * TypeScript prayer times calculation library
 * Inspired by adhan.js with additional regional methods and object-based configuration
 */

// Main API exports
export {
  PrayerTimeCalculator,
  calculatePrayerTimesSimple as calculatePrayerTimes,
  suggestMethodForLocation,
  validatePrayerTimeConfig,
  formatPrayerTimesToString,
  createBulkCalculator,
  calculateSunnahTimesSimple as calculateSunnahTimes,
  PrayerTimeUtils,
  isPrayerTimes,
  isPrayerTimeConfig,
  PRAYER_NAMES,
  TIME_FORMATS,
  calculatePrecise,
  PrecisionUtils,
} from "./api/prayer-times";

// Re-export default calculator as Calculator
export { default as Calculator } from "./api/prayer-times";

// Type exports - comprehensive TypeScript support
export type {
  // Core configuration and results
  PrayerTimeConfig,
  PrayerTimes,
  PrayerTimesWithMeta,
  FormattedPrayerTimes,
  ExtendedPrayerTimes,

  // Bulk calculation types
  MonthlyPrayerTimes,
  PrayerTimesRange,
  DateRange,

  // Prayer information
  CurrentPrayerInfo,
  PrayerName,
  ExtendedPrayerName,

  // Method and calculation types
  MethodCode,
  MethodParams,
  MethodRegistry,
  RegionCode,
  MethodSuggestion,

  // Geographic and coordinate types
  Coordinates,
  CoordinateInput,
  GeographicBounds,

  // Time and formatting types
  TimeFormat,
  RoundingMethod,
  TimeComponents,
  DateInput,

  // Calculation parameters
  AsrSchool,
  MidnightMode,
  ShafaqType,
  HighLatitudeRule,

  // Validation and error handling
  ValidationResult,
  ErrorCode,
  PrayerTimeError,

  // Advanced calculation types
  SolarPosition,
  SolarTimes,
  SolarCoordinates,

  // Interface contracts
  IPrayerTimeCalculator,
  CalculatePrayerTimes,

  // Settings and configuration
  PrayerTimeSettings,
  NotificationConfig,

  // Performance and metrics
  CalculationMetrics,

  // Sunnah Times types
  SunnahTimes,
  SunnahPeriod,
} from "./types";

// Note: For qibla calculations, use the separate @masaajid/qibla library

// Core calculation functions
export {
  calculatePrayerTimes as calculateEngine,
  calculatePrayerTimesWithMeta,
  CalculatorUtils,
} from "./lib/engine/calculator";

// Method utilities
export {
  CALCULATION_METHODS,
  METHOD_NAMES,
  METHOD_DESCRIPTIONS,
  getMethodParams,
  getMethodName,
  getMethodDescription,
  isValidMethod,
  getAllMethods,
} from "./lib/methods/methods";

// Geographic utilities
export {
  suggestMethod,
  getRegionalMethods,
  isMethodSuitableForLocation,
} from "./lib/methods/geographic";

// Basic coordinate utilities (for qibla calculations, use @masaajid/qibla library)
export {
  getQiblaDirection, // @deprecated - use @masaajid/qibla library
  getDistanceToMecca, // Basic distance calculation
  MECCA_COORDINATES, // Kaaba coordinates for prayer time calculations
} from "./lib/utils/coordinates";

// Extensions
export {
  SunnahTimesCalculator,
  createSunnahCalculator,
} from "./extensions/sunnah-times";

// Version and metadata
export const VERSION = "1.0.0";
export const LIBRARY_NAME = "prayer-times";

// Library metadata
export const METADATA = {
  name: LIBRARY_NAME,
  version: VERSION,
  description: "TypeScript prayer times calculation library inspired by adhan.js",
  author: "Prayer Times Library Team",
  algorithms: "Astronomical calculations similar to adhan.js",
  precision: "Validated against reference implementations",
} as const;

// Default export for simple usage
import { PrayerTimeCalculator } from "./api/prayer-times";
export default PrayerTimeCalculator;
