# Islamic Calculation Methods

> **Guide to Islamic prayer time calculation methods supported by @masaajid/prayer-times**

## Overview

This library supports calculation methods from various Islamic authorities worldwide. **Any location can use any method** - the choice is yours. Each method represents different approaches to calculating prayer times, developed by Islamic authorities, institutions, or communities.

## Method Usage

To calculate Prayer Times, a configuration object is required. Instead of manually setting calculation parameters, it's recommended to use one of the pre-defined methods. You can then further customize the calculation if needed.

```typescript
// Basic usage
const calculator = new PrayerTimeCalculator({
  method: "MWL",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
});

// With customizations
const calculator = new PrayerTimeCalculator({
  method: "Turkey",
  location: [39.9334, 32.8597],
  timezone: "Europe/Istanbul",
  asrSchool: "Hanafi",
  adjustments: { fajr: 2, isha: -1 },
});
```

## Calculation Methods

| Method           | Description                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MWL**          | Muslim World League. Standard Fajr time with an angle of 18°. Earlier Isha time with an angle of 17°. Widely accepted international standard that can be used globally.                                                                                                                                  |
| **ISNA**         | Islamic Society of North America. Uses symmetric angles of 15° for both Fajr and Isha. Popular in North America and suitable for higher latitude regions. Includes community-based adjustments developed for North American Muslim communities.                                                          |
| **Egypt**        | Egyptian General Authority of Survey. Early Fajr time using an angle of 19.5° and earlier Isha time using an angle of 17.5°. Used by the Egyptian government and some surrounding regions.                                                                                                               |
| **UmmAlQura**    | Umm al-Qura University, Makkah. Uses a fixed interval of 90 minutes from Maghrib to calculate Isha. Slightly earlier Fajr time with an angle of 18.5°. Used throughout Saudi Arabia. _Note: you should add a +30 minute custom adjustment for Isha during Ramadan._                                      |
| **Qatar**        | Same Isha interval as UmmAlQura (90 minutes after Maghrib) but with standard Fajr time using an angle of 18°. Used by Qatar's Ministry of Awqaf and Islamic Affairs.                                                                                                                                     |
| **Dubai**        | Used by the UAE General Authority of Islamic Affairs & Endowments. Uses angles of 18.2° for both Fajr and Isha in addition to time adjustments for sunrise, Dhuhr, Asr, and Maghrib. This method accounts for the UAE's specific geographic and observational conditions.                                |
| **JAKIM**        | Jabatan Kemajuan Islam Malaysia (Department of Islamic Development Malaysia). Uses standard angles of 18° for both Fajr and Isha. This is the method used by the Malaysian government for prayer times throughout Malaysia.                                                                              |
| **Singapore**    | Used by Majlis Ugama Islam Singapura (MUIS). Early Fajr time with an angle of 20° and standard Isha time with an angle of 18°. Adapted for equatorial tropical regions.                                                                                                                                  |
| **Kemenag**      | Kementerian Agama Indonesia (Ministry of Religion). Uses early Fajr time with an angle of 20° and standard Isha time with an angle of 18°. This is the method used by the Indonesian government, adapted for the archipelago's tropical conditions.                                                      |
| **Turkey**       | An approximation of the Diyanet İşleri Başkanlığı (Turkish Religious Affairs) method. Uses standard Fajr angle of 18° and Isha angle of 17°. Traditionally used with Hanafi jurisprudence for Asr calculation. This method is optimized for Turkey's geographic conditions.                              |
| **Russia**       | Spiritual Administration of Muslims in Russia. Uses lower angles adapted for very high latitudes: 16° for Fajr and 15° for Isha. Traditionally used with Hanafi jurisprudence. This method helps provide reasonable prayer times in northern regions where standard methods may produce difficult times. |
| **France12**     | UOIF (Union des Organisations Islamiques de France) method. Uses very conservative angles of 12° for both Fajr and Isha. This method is designed for high latitude locations where standard angles might not work throughout the year.                                                                   |
| **France15**     | Moderate French method. Uses 15° angles for both Fajr and Isha. This provides a middle ground between the very conservative 12° method and standard 18° methods for French communities.                                                                                                                  |
| **France18**     | Grande Mosquée de Paris method. Uses standard international angles of 18° for both Fajr and Isha. This method follows standard international parameters but may require high latitude adjustments during extreme seasons.                                                                                |
| **Moonsighting** | Method developed by Khalid Shaukat, founder of Moonsighting Committee Worldwide. Uses standard 18° angles for Fajr and Isha in addition to seasonal adjustment values. This method automatically applies high latitude rules for locations above 55° latitude. Recommended for North America and the UK. |
| **Tehran**       | Institute of Geophysics, University of Tehran. Early Isha time with an angle of 14°. Slightly later Fajr time with an angle of 17.7°. Calculates Maghrib based on the sun reaching an angle of 4.5° below the horizon. Uses Jafari midnight calculation. This is a Shia method used in Iran.             |
| **Jafari**       | Traditional Shia Ithna-Ashari jurisprudence method. Uses 16° for Fajr and 14° for Isha. Calculates Maghrib based on the sun reaching an angle of 4° below the horizon. Uses Jafari midnight calculation which differs from standard Sunni methods.                                                       |
| **Karachi**      | University of Islamic Sciences, Karachi. A generally applicable method that uses standard Fajr and Isha angles of 18°. This method provides a balanced approach suitable for diverse geographic locations and is traditionally used with Hanafi jurisprudence.                                           |

## Method Selection Guidance

### Geographic Considerations

**High Latitudes (above 48°)**
For locations with extreme seasonal variations, consider methods that work better at high latitudes:

- `Russia` - Specifically designed for northern regions
- `France12` - Very conservative angles for extreme latitudes
- `ISNA` - Symmetric 15° angles work well at higher latitudes
- `Moonsighting` - Includes automatic high latitude adjustments

**Tropical Regions**
For equatorial and tropical locations:

- `Singapore` - Designed for equatorial regions
- `JAKIM` - Optimized for Malaysian tropical conditions
- `Kemenag` - Adapted for Indonesian archipelago conditions

**Temperate Regions**
For most temperate locations worldwide:

- `MWL` - International standard, widely applicable
- `ISNA` - North American standard, good for temperate zones
- `Egypt` - Works well for Mediterranean and similar climates

### Community and Authority Considerations

**Following Local Authorities**
If there's an established Islamic authority in your region, you may prefer to use their method regardless of your location.

**Community Practices**
Consider what method your local mosque or community uses for consistency in community prayers and events.

**Jurisprudence Schools**
Some methods are traditionally associated with specific schools:

- Hanafi: Often used with `Turkey`, `Russia`, `Karachi`
- Shafi: Standard for most other methods
- Jafari: Shia methods like `Tehran` and `Jafari`

## Technical Parameters

Each method defines specific parameters for calculation:

| Parameter    | Description                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| fajrAngle    | Angle of the sun below horizon used to calculate Fajr                                      |
| ishaAngle    | Angle of the sun below horizon used to calculate Isha                                      |
| ishaInterval | Minutes after Maghrib (used by UmmAlQura and Qatar methods)                                |
| madhab       | Jurisprudence school for Asr calculation (Standard/Shafi or Hanafi)                        |
| adjustments  | **Additive** fine-tuning adjustments in minutes - your values are added to method defaults |

### User Adjustments

**Adjustments**: Time adjustments in minutes that are **added** to the method's calculations

```typescript
// This adds +2 minutes to JAKIM's calculated Fajr time
const calculator = new PrayerTimeCalculator({
  method: "JAKIM",
  location: [3.139, 101.6869],
  timezone: "Asia/Kuala_Lumpur",
  adjustments: { fajr: 2 }, // Additive to method defaults
});

// You can adjust multiple prayer times
const calculator2 = new PrayerTimeCalculator({
  method: "ISNA",
  location: [40.7128, -74.006],
  timezone: "America/New_York",
  adjustments: {
    fajr: 1, // +1 minute
    isha: -2, // -2 minutes
  },
});
```

## Usage Examples

### Basic Method Selection

```typescript
import { PrayerTimeCalculator } from "@masaajid/prayer-times";

// Using international standard
const calculator = new PrayerTimeCalculator({
  method: "MWL",
  location: [40.7128, -74.006], // New York
  timezone: "America/New_York",
});

const times = calculator.calculate();
```

### High Latitude Location

```typescript
// For northern locations
const calculator = new PrayerTimeCalculator({
  method: "Russia",
  location: [60.1695, 24.9354], // Helsinki
  timezone: "Europe/Helsinki",
  asrSchool: "Hanafi",
  highLatitudeRule: "AngleBased",
});
```

### Following Local Authority

```typescript
// Using Malaysian government method anywhere
const calculator = new PrayerTimeCalculator({
  method: "JAKIM",
  location: [1.3521, 103.8198], // Singapore using Malaysian method
  timezone: "Asia/Singapore",
});
```

### Custom Adjustments

```typescript
// Optional fine-tuning (additive to method defaults)
const calculator = new PrayerTimeCalculator({
  method: "JAKIM",
  location: [3.139, 101.6869], // Kuala Lumpur
  timezone: "Asia/Kuala_Lumpur",
  adjustments: {
    fajr: 2, // Add 2 minutes to calculated Fajr time
    isha: -1, // Subtract 1 minute from calculated Isha time
  },
});

// Methods work accurately as-is without adjustments.
// If you observe consistent time differences with local practice,
// you can provide adjustments (e.g., +1, -2 minutes) for fine-tuning.
```

## Geographic Suggestion Helper

The library includes a helper function to suggest commonly-used methods for specific locations, but you're free to choose any method:

```typescript
import { suggestMethodForLocation } from "@masaajid/prayer-times";

const suggestion = suggestMethodForLocation([40.7128, -74.006]);
console.log(suggestion); // 'ISNA' - commonly used in New York

// You can still choose any method you prefer
const calculator = new PrayerTimeCalculator({
  method: "MWL", // Using international standard instead
  location: [40.7128, -74.006],
  timezone: "America/New_York",
});
```

---

**Remember**: Method selection is a matter of personal choice, community practice, and geographic suitability. This library provides accurate calculations for all methods - choose the one that fits your needs and circumstances.
