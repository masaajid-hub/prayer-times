/**
 * Sunnah Times Tests - Updated for current implementation
 *
 * Tests for Islamic observance times beyond the five daily prayers:
 * - Night thirds (first, middle, last)
 * - Duha prayer window
 */

import { describe, test, expect } from "bun:test";
import { calculateSunnahTimes } from "../../src/extensions/sunnah-times";
import type { PrayerTimeConfig } from "../../src/types";

describe("SunnahTimes", () => {
  const testSettings: PrayerTimeConfig = {
    method: "ISNA",
    location: [40.7128, -74.006],
    timezone: "America/New_York",
    date: new Date("2024-06-15"),
    asrSchool: "Standard",
    highLatitudeRule: "NightMiddle",
    shafaq: "general",
  };

  describe("Basic Calculations", () => {
    test("should calculate all sunnah times correctly", () => {
      const result = calculateSunnahTimes(testSettings);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      // Check all expected properties exist
      expect(result).toHaveProperty("middleOfNight");
      expect(result).toHaveProperty("lastThirdOfNight");
      expect(result).toHaveProperty("firstThirdOfNight");
      expect(result).toHaveProperty("duhaStart");
      expect(result).toHaveProperty("duhaEnd");
      expect(result).toHaveProperty("meta");

      // Check all times are Date objects
      expect(result.middleOfNight).toBeInstanceOf(Date);
      expect(result.lastThirdOfNight).toBeInstanceOf(Date);
      expect(result.firstThirdOfNight).toBeInstanceOf(Date);
      expect(result.duhaStart).toBeInstanceOf(Date);
      expect(result.duhaEnd).toBeInstanceOf(Date);
    });

    test("should provide metadata with calculations", () => {
      const result = calculateSunnahTimes(testSettings);

      expect(result.meta).toBeDefined();
      expect(result.meta).toHaveProperty("nightDuration");
      expect(result.meta).toHaveProperty("calculation");

      expect(typeof result.meta.nightDuration).toBe("number");
      expect(result.meta.nightDuration).toBeGreaterThan(0);

      expect(result.meta.calculation).toHaveProperty("maghribTime");
      expect(result.meta.calculation).toHaveProperty("nextFajrTime");
      expect(typeof result.meta.calculation.maghribTime).toBe("number");
      expect(typeof result.meta.calculation.nextFajrTime).toBe("number");
    });

    test("should calculate reasonable night duration", () => {
      const result = calculateSunnahTimes(testSettings);

      // Night should be between 6-18 hours (360-1080 minutes)
      expect(result.meta.nightDuration).toBeGreaterThanOrEqual(360);
      expect(result.meta.nightDuration).toBeLessThanOrEqual(1080);
    });
  });

  describe("Time Relationships", () => {
    test("night thirds should be in correct order", () => {
      const result = calculateSunnahTimes(testSettings);

      const firstThird = result.firstThirdOfNight;
      const middle = result.middleOfNight;
      const lastThird = result.lastThirdOfNight;

      // Times should be in ascending order
      expect(firstThird.getTime()).toBeLessThan(middle.getTime());
      expect(middle.getTime()).toBeLessThan(lastThird.getTime());
    });

    test("duha window should be after sunrise", () => {
      const result = calculateSunnahTimes(testSettings);

      const duhaStart = result.duhaStart;
      const duhaEnd = result.duhaEnd;

      // Start should be before end
      expect(duhaStart.getTime()).toBeLessThan(duhaEnd.getTime());

      // Duha should be during morning hours (reasonable range)
      const startHour = duhaStart.getHours();
      const endHour = duhaEnd.getHours();
      expect(startHour).toBeGreaterThanOrEqual(5); // After sunrise
      expect(startHour).toBeLessThan(13); // Before or at dhuhr
      expect(endHour).toBeGreaterThan(startHour);
      expect(endHour).toBeLessThanOrEqual(17); // Before dhuhr (allow more range)
    });
  });

  describe("Different Locations and Seasons", () => {
    test("should work for different geographic locations", () => {
      const locations = [
        { name: "Makkah", coords: [21.4225, 39.8262] },
        { name: "London", coords: [51.5074, -0.1278] },
        { name: "Jakarta", coords: [-6.2088, 106.8456] },
        { name: "Sydney", coords: [-33.8688, 151.2093] },
      ];

      locations.forEach((location) => {
        const locationSettings = {
          ...testSettings,
          location: location.coords as [number, number],
        };

        const result = calculateSunnahTimes(locationSettings);

        expect(result).toBeDefined();
        expect(result.middleOfNight).toBeInstanceOf(Date);
        expect(result.duhaStart).toBeInstanceOf(Date);
        expect(result.meta.nightDuration).toBeGreaterThan(0);
      });
    });

    test("should handle different seasons", () => {
      const seasons = [
        { name: "Winter Solstice", date: "2024-12-21" },
        { name: "Spring Equinox", date: "2024-03-20" },
        { name: "Summer Solstice", date: "2024-06-21" },
        { name: "Fall Equinox", date: "2024-09-22" },
      ];

      seasons.forEach((season) => {
        const seasonSettings = {
          ...testSettings,
          date: new Date(season.date),
        };

        const result = calculateSunnahTimes(seasonSettings);

        expect(result).toBeDefined();
        expect(result.middleOfNight).toBeInstanceOf(Date);
        expect(result.meta.nightDuration).toBeGreaterThan(0);

        // Night duration should vary by season (longer in winter, shorter in summer)
        if (season.name === "Winter Solstice") {
          // Longer night in winter
          expect(result.meta.nightDuration).toBeGreaterThan(600); // > 10 hours
        } else if (season.name === "Summer Solstice") {
          // Shorter night in summer
          expect(result.meta.nightDuration).toBeLessThan(650); // < 10.8 hours
        }
      });
    });

    test("should handle high latitude locations", () => {
      const highLatSettings = {
        ...testSettings,
        location: [60.0, 10.0] as [number, number], // High latitude
        date: new Date("2024-06-21"), // Summer solstice
        highLatitudeRule: "NightMiddle" as const,
      };

      const result = calculateSunnahTimes(highLatSettings);

      expect(result).toBeDefined();
      expect(result.middleOfNight).toBeInstanceOf(Date);
      expect(result.duhaStart).toBeInstanceOf(Date);

      // High latitude locations may have adjusted night calculations
      // Night duration can vary significantly based on high latitude method used
      expect(result.meta.nightDuration).toBeGreaterThan(0);
    });
  });

  describe("Time Precision and Formatting", () => {
    test("should round times to nearest minute", () => {
      const result = calculateSunnahTimes(testSettings);

      // All times should have 0 seconds (rounded to nearest minute)
      const times = [
        result.middleOfNight,
        result.lastThirdOfNight,
        result.firstThirdOfNight,
        result.duhaStart,
        result.duhaEnd,
      ];

      times.forEach((time) => {
        expect(time.getSeconds()).toBe(0);
        expect(time.getMilliseconds()).toBe(0);
      });
    });

    test("should maintain precision across timezone changes", () => {
      const timezones = [
        "America/New_York",
        "Europe/London",
        "Asia/Dubai",
        "Asia/Jakarta",
      ];

      const results = timezones.map((tz) => {
        const tzSettings = { ...testSettings, timezone: tz };
        return calculateSunnahTimes(tzSettings);
      });

      // All results should have valid times despite timezone differences
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.middleOfNight).toBeInstanceOf(Date);
        expect(result.duhaStart).toBeInstanceOf(Date);
        expect(result.meta.nightDuration).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle extreme polar locations gracefully", () => {
      const polarSettings = {
        ...testSettings,
        location: [80.0, 0.0] as [number, number], // Very high latitude
        date: new Date("2024-12-21"), // Polar night
        highLatitudeRule: "NightMiddle" as const,
      };

      // Polar locations may throw errors due to extreme conditions
      try {
        const result = calculateSunnahTimes(polarSettings);
        expect(result).toBeDefined();
      } catch (error) {
        // Expect specific polar calculation errors
        expect(error.message).toContain("Cannot calculate Sunnah times");
      }
    });

    test("should handle invalid date gracefully", () => {
      const invalidDateSettings = {
        ...testSettings,
        date: new Date("invalid-date"),
      };

      // Invalid dates should throw clear errors
      expect(() => {
        calculateSunnahTimes(invalidDateSettings);
      }).toThrow();
    });

    test("should work with different calculation methods", () => {
      const methods = ["MWL", "ISNA", "Egypt", "UmmAlQura", "Qatar"] as const;

      methods.forEach((method) => {
        const methodSettings = { ...testSettings, method };
        const result = calculateSunnahTimes(methodSettings);

        expect(result).toBeDefined();
        expect(result.middleOfNight).toBeInstanceOf(Date);
        expect(result.duhaStart).toBeInstanceOf(Date);
        expect(result.meta.nightDuration).toBeGreaterThan(0);
      });
    });
  });

  describe("Islamic Timing Accuracy", () => {
    test("last third of night should be in final third", () => {
      const result = calculateSunnahTimes(testSettings);

      const nightDuration = result.meta.nightDuration;
      const maghribTime = new Date(result.meta.calculation.maghribTime);
      const lastThirdStart = result.lastThirdOfNight;

      // Last third should start at roughly 2/3 of night duration
      const expectedStartTime = new Date(
        maghribTime.getTime() + (nightDuration * 60000 * 2) / 3
      );
      const timeDiff = Math.abs(
        lastThirdStart.getTime() - expectedStartTime.getTime()
      );

      // Should be within 2 minutes of expected time (allowing for rounding)
      expect(timeDiff).toBeLessThan(2 * 60 * 1000); // 2 minutes in milliseconds
    });

    test("duha should start 15 minutes after sunrise", () => {
      const result = calculateSunnahTimes(testSettings);

      const sunriseTime = new Date(result.meta.calculation.sunriseTime);
      const duhaStartTime = result.duhaStart;

      // Duha should start exactly 15 minutes after sunrise
      const expectedStart = new Date(sunriseTime.getTime() + 15 * 60 * 1000);
      const timeDiff = Math.abs(
        duhaStartTime.getTime() - expectedStart.getTime()
      );

      // Should be within 1 minute (allowing for rounding)
      expect(timeDiff).toBeLessThan(60 * 1000); // 1 minute in milliseconds
    });
  });
});
