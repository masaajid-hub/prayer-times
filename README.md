# Prayer Times - TypeScript Library

TypeScript library for Islamic prayer time calculations. Supports 18 calculation methods from various Islamic authorities with object-based configuration.

This library provides an alternative implementation to [adhan.js](https://github.com/batoulapps/adhan) with object-based configuration and additional regional methods.

[![npm version](https://badge.fury.io/js/@masaajid%2Fprayer-times.svg)](https://badge.fury.io/js/@masaajid%2Fprayer-times)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Object-based configuration
- Multiple Islamic calculation methods
- Multiple coordinate and date formats
- High latitude adjustments and elevation corrections
- Sunnah times calculation
- TypeScript support
- Tested against official sources when available, adhan.js for reference methods

> **Note**: For Qibla direction calculations, use the separate [@masaajid/qibla](https://github.com/masaajid-hub/qibla) library.

## Quick Start

### Installation

```bash
# Using Bun (recommended)
bun add @masaajid/prayer-times

# Using npm
npm install @masaajid/prayer-times

# Using yarn
yarn add @masaajid/prayer-times
```

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

## Supported Methods

### International Methods

- **MWL** - Muslim World League
- **ISNA** - Islamic Society of North America
- **Egypt** - Egyptian General Authority
- **UmmAlQura** - Umm Al-Qura University
- **Karachi** - University of Islamic Sciences
- **Tehran** - Institute of Geophysics
- **Jafari** - Shia Ithna-Ashari

### Regional Methods

- **Qatar** - Qatar Ministry of Awqaf
- **Dubai** - UAE General Authority
- **Singapore** - MUIS Singapore
- **JAKIM** - Malaysia Department of Islamic Development
- **Kemenag** - Indonesia Ministry of Religion
- **Turkey** - Turkish Religious Affairs
- **Russia** - Spiritual Administration of Muslims
- **France12/15/18** - French Islamic communities
- **Moonsighting** - UK Moonsighting Committee

[View complete list of methods](docs/methods.md)

## Configuration Options

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
  midnight?: "Standard" | "Jafari"; // Override midnight calculation
  shafaq?: "general" | "ahmer" | "abyad"; // Override shafaq type

  // Optional
  date?: DateInput; // Target date
  elevation?: number; // Elevation in meters
  asrSchool?: "Standard" | "Hanafi"; // Asr calculation school
  highLatitudeRule?: HighLatitudeRule; // High latitude adjustment
  adjustments?: PrayerAdjustments; // Fine-tune times (minutes)
}
```

### Parameter Overrides

Methods serve as templates/defaults. You can override any calculation parameter:

```typescript
const calculator = new PrayerTimeCalculator({
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
  fajr: 16,
  isha: "90 min",
  maghrib: "2 min",
});
```

## API Methods

```typescript
const calculator = new PrayerTimeCalculator(config);

// Core calculations
calculator.calculate(date?: DateInput): PrayerTimes
calculator.calculateWithMeta(date?: DateInput): PrayerTimesWithMeta
calculator.calculateSunnah(date?: DateInput): SunnahTimes

// Bulk operations
calculator.calculateMonthly(year: number, month: number): MonthlyPrayerTimes
calculator.calculateRange(startDate: DateInput, endDate: DateInput): PrayerTimesRange

// Utilities
calculator.getCurrentPrayer(): CurrentPrayerInfo | null
calculator.getConfig(): PrayerTimeConfig
```

## Sunnah Times

```typescript
import { calculateSunnahTimes } from "@masaajid/prayer-times";

const sunnahTimes = calculateSunnahTimes({
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
});

console.log(sunnahTimes);
// {
//   middleOfNight: "01:15",      // Exact middle between Maghrib and Fajr
//   lastThirdOfNight: "03:45",   // Blessed time for Qiyam al-Layl
//   firstThirdOfNight: "22:45",  // Early night voluntary prayers
//   duhaStart: "08:15",          // Start of Duha prayer
//   duhaEnd: "11:30"             // End of Duha prayer
// }
```

## High Latitude Support

```typescript
// For locations above 48° latitude
const calculator = new PrayerTimeCalculator({
  method: "Russia",
  location: [65.0, 18.0], // Northern Sweden
  timezone: "Europe/Stockholm",
  highLatitudeRule: "AngleBased",
});
```

## Documentation

- [API Reference](docs/api-reference.md) - Complete TypeScript API documentation
- [Calculation Methods](docs/methods.md) - Islamic calculation methods
- [Migration Guide](docs/migration.md) - Migration from other libraries
- [Contributing](docs/contributing.md) - Development guidelines

## Accuracy

- **Official methods**: Tested against official Islamic authority data (<1 minute average)
- **Reference methods**: Validated against [adhan.js](https://github.com/batoulapps/adhan) reference implementation (<1 minute average)
- **Astronomical calculations**: Similar approach to adhan.js with different implementation focus

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [@masaajid/qibla](https://github.com/masaajid-hub/qibla) - Qibla direction calculations
- [Masaajid Platform](https://github.com/masaajid-hub) - Mosque management platform

## Acknowledgments

This library is inspired by [adhan.js](https://github.com/batoulapps/adhan) by Batoul Apps. We expanded the implementation with additional calculation methods and fine-tuning to suit our specific requirements. Our calculations are validated against adhan.js as a reference implementation.

**We recommend using adhan.js if you prefer the original implementation**. This library serves as an alternative with:

- Object-based configuration approach
- Additional regional calculation methods
- Extended Sunnah time calculations
- Different API design patterns
