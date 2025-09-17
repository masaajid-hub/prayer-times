# API Reference

> **Complete TypeScript API documentation for @masaajid/prayer-times**

## Table of Contents

- [Quick Start](#quick-start)
- [Core API](#core-api)
- [Configuration](#configuration)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

## Quick Start

### Basic Usage

```typescript
import { PrayerTimeCalculator } from "@masaajid/prayer-times";

// Create calculator with configuration object
const calculator = new PrayerTimeCalculator({
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
});

// Get today's prayer times
const times = calculator.calculate();
console.log(times);
// {
//   fajr: "05:30",
//   sunrise: "07:15",
//   dhuhr: "12:45",
//   asr: "15:30",
//   maghrib: "18:15",
//   isha: "19:45"
// }
```

### Static Function Alternative

```typescript
import { calculatePrayerTimes } from "@masaajid/prayer-times";

// Direct calculation without creating instance
const times = calculatePrayerTimes({
  method: "JAKIM",
  location: [3.139, 101.6869], // Kuala Lumpur
  timezone: "Asia/Kuala_Lumpur",
  date: "2024-06-15",
});
```

### Advanced Configuration

```typescript
// Complete configuration object
const calculator = new PrayerTimeCalculator({
  method: "MWL",
  location: [21.4225, 39.8262], // Makkah coordinates
  timezone: "Asia/Riyadh",
  elevation: 277, // Elevation in meters
  asrSchool: "Hanafi", // Hanafi juristic school
  highLatitudeRule: "AngleBased",
  adjustments: { fajr: 2, isha: -3 }, // Fine-tune specific prayers
});

const times = calculator.calculate("2024-06-15");
```

## Core API

### PrayerTimeCalculator Class

Main class for prayer time calculations with object-based configuration.

#### Constructor

```typescript
new PrayerTimeCalculator(config: PrayerTimeConfig)
```

**Parameters:**

- `config`: Configuration object containing method, location, timezone, and optional parameters

#### Instance Methods

```typescript
// Core calculations
calculator.calculate(date?: DateInput): PrayerTimes
calculator.calculateWithMeta(date?: DateInput): PrayerTimesWithMeta
calculator.calculateFormatted(date?: DateInput, format?: TimeFormat): FormattedPrayerTimes

// Bulk operations
calculator.calculateMonthly(year: number, month: number): MonthlyPrayerTimes
calculator.calculateRange(startDate: DateInput, endDate: DateInput): PrayerTimesRange

// Utilities
calculator.getCurrentPrayer(): CurrentPrayerInfo | null
calculator.calculateSunnah(date?: DateInput): SunnahTimes
calculator.getConfig(): PrayerTimeConfig
```

#### Static Methods

```typescript
// Quick calculations without creating instance
PrayerTimeCalculator.calculate(config: PrayerTimeConfig, date?: DateInput): PrayerTimes
PrayerTimeCalculator.calculateSunnah(config: PrayerTimeConfig, date?: DateInput): SunnahTimes
```

### Static Functions

#### Core Functions

```typescript
import {
  calculatePrayerTimes,
  calculateSunnahTimes,
  suggestMethodForLocation,
  validatePrayerTimeConfig
} from '@masaajid/prayer-times';

// Basic prayer time calculation
const times = calculatePrayerTimes(config: PrayerTimeConfig, date?: DateInput): PrayerTimes

// Sunnah times calculation
const sunnahTimes = calculateSunnahTimes(config: PrayerTimeConfig, date?: DateInput): SunnahTimes

// Geographic method suggestion
const method = suggestMethodForLocation(location: [number, number]): MethodSuggestion

// Configuration validation
const validation = validatePrayerTimeConfig(config: PrayerTimeConfig): ValidationResult
```

#### Bulk Operations

```typescript
import { createBulkCalculator } from '@masaajid/prayer-times';

// Create bulk calculator for repeated calculations
const bulk = createBulkCalculator(config: PrayerTimeConfig);

// Calculate multiple dates efficiently
const monthly = bulk.calculateMonthly(2024, 6);
const range = bulk.calculateRange('2024-06-01', '2024-06-30');
```

## Configuration

### PrayerTimeConfig Object

```typescript
interface PrayerTimeConfig {
  // Required
  method: MethodCode; // Calculation method
  location: CoordinateInput; // Geographic coordinates
  timezone: string; // IANA timezone

  // Method parameter overrides (optional)
  fajr?: number; // Override Fajr angle (e.g., 16, 18)
  isha?: number | string; // Override Isha (e.g., 17, "90 min")
  maghrib?: number | string; // Override Maghrib (e.g., 4, "2 min")
  midnight?: MidnightMode; // Override midnight calculation
  shafaq?: ShafaqType; // Override shafaq type

  // Optional
  date?: DateInput; // Target date
  elevation?: number; // Elevation in meters
  asrSchool?: AsrSchool; // Asr calculation school
  highLatitudeRule?: HighLatitudeRule; // High latitude adjustment
  adjustments?: Partial<PrayerAdjustments>; // Fine-tune times
  rounding?: RoundingMethod; // Time rounding behavior
}
```

### Method Codes

Supported Islamic calculation methods:

```typescript
type MethodCode =
  // International Methods
  | "MWL" // Muslim World League
  | "ISNA" // Islamic Society of North America
  | "Egypt" // Egyptian General Authority
  | "UmmAlQura" // Umm Al-Qura University
  | "Karachi" // University of Islamic Sciences
  | "Tehran" // Institute of Geophysics
  | "Jafari" // Shia Ithna-Ashari

  // Gulf Region
  | "Qatar" // Qatar Ministry of Awqaf
  | "Dubai" // UAE General Authority

  // Southeast Asia
  | "Singapore" // MUIS Singapore
  | "JAKIM" // Malaysia Department of Islamic Development
  | "Kemenag" // Indonesia Ministry of Religion

  // Europe & Russia
  | "Turkey" // Turkish Religious Affairs
  | "Russia" // Spiritual Administration of Muslims
  | "France12" // UOIF 12° method
  | "France15" // Moderate 15° method
  | "France18" // Grande Mosquée 18° method

  // Other Regional
  | "Moonsighting" // UK Moonsighting Committee
  | "Custom"; // Custom user-defined method
```

### Coordinate Formats

```typescript
type CoordinateInput =
  | [number, number] // [latitude, longitude]
  | [number, number, number] // [latitude, longitude, elevation]
  | {
      latitude: number;
      longitude: number;
      elevation?: number;
    };
```

### Date Formats

```typescript
type DateInput =
  | Date // JavaScript Date object
  | string // ISO date string "2024-06-15"
  | [number, number, number] // [year, month, day]
  | number; // Unix timestamp
```

### Asr Schools

```typescript
type AsrSchool =
  | "Standard" // Shafi, Maliki, Hanbali (shadow = object length)
  | "Hanafi"; // Hanafi (shadow = 2x object length)
```

### High Latitude Rules

```typescript
type HighLatitudeRule =
  | "AngleBased" // Angle-based method
  | "NightMiddle" // Middle of night
  | "OneSeventh" // 1/7th of night
  | "AqrabBalad" // Nearest latitude with valid times
  | "AqrabYaum" // Nearest day with valid times
  | "TwilightAngle"; // Twilight angle method
```

### Adjustments

```typescript
interface PrayerAdjustments {
  fajr: number; // Minutes to add/subtract
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  midnight: number;
}
```

### Parameter Override Values

When overriding method parameters, use these specific formats:

```typescript
// Fajr angle (degrees) - accepts decimals
fajr: 12 | 15 | 16 | 17.7 | 18 | 18.5 | 19.5 | 20;

// Isha angle (degrees) or interval (minutes after Maghrib) - accepts decimals
isha: 14 | 15 | 17 | 17.5 | 18 | 18.2 | "90 min" | "120 min";

// Maghrib angle (degrees below horizon) or interval (minutes after sunset) - accepts decimals
maghrib: 4 | 4.5 | 5 | "1 min" | "2 min" | "3 min" | "5 min";

// Midnight calculation method
midnight: "Standard" | "Jafari";

// Shafaq (evening twilight) type
shafaq: "general" | "ahmer" | "abyad";
```

**Note**: Other values may cause calculation errors or unexpected results.

## Utility Functions

### Geographic Method Suggestion

```typescript
import { suggestMethodForLocation } from "@masaajid/prayer-times";

const method = suggestMethodForLocation([40.7128, -74.006]);
// Returns: 'ISNA' for New York

const method2 = suggestMethodForLocation([25.2048, 55.2708]);
// Returns: 'Dubai' for UAE
```

### Method Information

```typescript
import {
  getMethodParams,
  getMethodName,
  getAllMethods,
} from "@masaajid/prayer-times";

// Get method parameters
const params = getMethodParams("JAKIM");
// { fajrAngle: 20, ishaAngle: 18, ... }

// Get human-readable name
const name = getMethodName("JAKIM");
// "Department of Islamic Development Malaysia"

// Get all available methods
const methods = getAllMethods();
// Array of all method codes with details
```

### Sunnah Times

```typescript
import { calculateSunnahTimes } from "@masaajid/prayer-times";

const sunnahTimes = calculateSunnahTimes({
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
  date: "2024-06-15",
});

console.log(sunnahTimes);
// {
//   middleOfNight: "01:15",      // Exact middle between Maghrib and Fajr
//   lastThirdOfNight: "03:45",   // Blessed time for Qiyam al-Layl
//   firstThirdOfNight: "22:45",  // Early night voluntary prayers
//   duhaStart: "08:15",          // Start of Duha prayer (15 min after sunrise)
//   duhaEnd: "11:30",            // End of Duha prayer (before Dhuhr)
//   meta: { nightDuration: 435 } // Night duration in minutes
// }
```

### Bulk Calculations

```typescript
import { createBulkCalculator } from "@masaajid/prayer-times";

const bulk = createBulkCalculator({
  method: "JAKIM",
  location: [3.139, 101.6869],
  timezone: "Asia/Kuala_Lumpur",
});

// Get entire month
const june2024 = bulk.calculateMonthly(2024, 6);

// Get date range
const ramadan = bulk.calculateRange("2024-03-11", "2024-04-09");
```

### Validation

```typescript
import { validatePrayerTimeConfig } from "@masaajid/prayer-times";

const validation = validatePrayerTimeConfig({
  method: "JAKIM",
  location: [3.139, 101.6869],
  timezone: "Asia/Kuala_Lumpur",
});

if (!validation.isValid) {
  console.error("Configuration errors:", validation.errors);
}
```

## Type Definitions

### Core Types

```typescript
interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight?: string;
}

interface PrayerTimesWithMeta {
  times: PrayerTimes;
  meta: {
    method: MethodInfo;
    location: Coordinates;
    date: string;
    timezone: string;
    calculation: CalculationData;
  };
}

interface MonthlyPrayerTimes {
  year: number;
  month: number;
  times: PrayerTimes[];
  meta: MonthlyMeta;
}

interface SunnahTimes {
  middleOfNight: string;
  lastThirdOfNight: string;
  firstThirdOfNight: string;
  duhaStart: string;
  duhaEnd: string;
  meta: {
    nightDuration: number;
    calculation: CalculationTimestamps;
  };
}
```

### Configuration Types

```typescript
interface PrayerTimeConfig {
  method: MethodCode;
  location: CoordinateInput;
  timezone: string;
  date?: DateInput;
  elevation?: number;
  asrSchool?: AsrSchool;
  highLatitudeRule?: HighLatitudeRule;
  adjustments?: Partial<PrayerAdjustments>;
  rounding?: RoundingMethod;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
}
```

## Error Handling

### Validation Errors

```typescript
try {
  const calculator = new PrayerTimeCalculator({
    method: "INVALID_METHOD", // Invalid method
    location: [91, 181], // Invalid coordinates
    timezone: "Invalid/Timezone",
  });
} catch (error) {
  console.error("Configuration error:", error.message);
}
```

### Calculation Errors

```typescript
try {
  const times = calculator.calculate("invalid-date");
} catch (error) {
  console.error("Calculation error:", error.message);
}
```

### Graceful Error Handling

```typescript
import { validatePrayerTimeConfig } from "@masaajid/prayer-times";

const config = {
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
};

const validation = validatePrayerTimeConfig(config);
if (validation.isValid) {
  const calculator = new PrayerTimeCalculator(config);
  const times = calculator.calculate();
} else {
  console.error("Invalid configuration:", validation.errors);
}
```

## Advanced Usage

### High Latitude Regions

```typescript
// For locations above 48° latitude
const calculator = new PrayerTimeCalculator({
  method: "Russia",
  location: [65.0, 18.0], // Northern Sweden
  timezone: "Europe/Stockholm",
  highLatitudeRule: "AngleBased",
});

const winterTimes = calculator.calculate("2024-12-21");
```

### Elevation Corrections

```typescript
// For elevated locations
const mountainCalculator = new PrayerTimeCalculator({
  method: "MWL",
  location: [27.9881, 86.925], // Mount Everest base
  timezone: "Asia/Kathmandu",
  elevation: 5364, // meters above sea level
});

const times = mountainCalculator.calculate();
```

### Performance Optimization

```typescript
// For repeated calculations, reuse calculator instance
const calculator = new PrayerTimeCalculator({
  method: "JAKIM",
  location: [3.139, 101.6869],
  timezone: "Asia/Kuala_Lumpur",
});

// Efficient for multiple dates
const times1 = calculator.calculate("2024-06-15");
const times2 = calculator.calculate("2024-06-16");
const times3 = calculator.calculate("2024-06-17");

// Or use bulk operations for even better performance
const monthly = calculator.calculateMonthly(2024, 6);
```
