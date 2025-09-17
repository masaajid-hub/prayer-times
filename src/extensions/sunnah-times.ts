/**
 * Sunnah Times Calculator
 * Calculates additional Islamic prayer times beyond the five daily prayers
 * Conservative approach focusing on well-established calculations
 */

import type { PrayerTimeConfig } from "../types";
import { calculatePrayerTimes } from "../lib/engine/calculator";

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

/**
 * Calculate Sunnah times for a given date and location
 */
export function calculateSunnahTimes(
  config: PrayerTimeConfig,
  date: Date = new Date()
): SunnahTimes {
  // Get today's prayer times
  const todayResult = calculatePrayerTimes(config, date);
  if (!todayResult.isValid) {
    throw new Error(
      `Cannot calculate Sunnah times: ${todayResult.warnings.join(", ")}`
    );
  }

  const todayTimes = todayResult.times;

  // Get tomorrow's Fajr time
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowResult = calculatePrayerTimes(config, tomorrow);
  if (!tomorrowResult.isValid) {
    throw new Error(
      `Cannot calculate tomorrow's Fajr: ${tomorrowResult.warnings.join(", ")}`
    );
  }

  const tomorrowFajr = tomorrowResult.times.fajr;

  // Calculate night duration (from Maghrib to next Fajr)
  const nightDurationMs = tomorrowFajr.getTime() - todayTimes.maghrib.getTime();
  const nightDurationMinutes = nightDurationMs / (1000 * 60);

  // Night thirds calculations
  const firstThirdDuration = nightDurationMs / 3;
  const middlePointDuration = nightDurationMs / 2;
  const lastThirdStart = nightDurationMs * (2 / 3);

  const firstThirdOfNight = new Date(
    todayTimes.maghrib.getTime() + firstThirdDuration
  );
  const middleOfNight = new Date(
    todayTimes.maghrib.getTime() + middlePointDuration
  );
  const lastThirdOfNight = new Date(
    todayTimes.maghrib.getTime() + lastThirdStart
  );

  // Duha prayer times
  // Start: 15 minutes after sunrise (when sun is well-risen)
  const duhaStart = new Date(todayTimes.sunrise.getTime() + 15 * 60 * 1000);

  // End: Before Dhuhr prayer (traditionally 15-30 minutes before)
  const duhaEnd = new Date(todayTimes.dhuhr.getTime() - 15 * 60 * 1000);

  return {
    middleOfNight: roundToNearestMinute(middleOfNight),
    lastThirdOfNight: roundToNearestMinute(lastThirdOfNight),
    firstThirdOfNight: roundToNearestMinute(firstThirdOfNight),
    duhaStart: roundToNearestMinute(duhaStart),
    duhaEnd: roundToNearestMinute(duhaEnd),
    meta: {
      nightDuration: Math.round(nightDurationMinutes),
      calculation: {
        maghribTime: todayTimes.maghrib.getTime(),
        nextFajrTime: tomorrowFajr.getTime(),
        sunriseTime: todayTimes.sunrise.getTime(),
        dhuhrTime: todayTimes.dhuhr.getTime(),
      },
    },
  };
}

/**
 * Round time to nearest minute for cleaner display
 */
function roundToNearestMinute(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);

  // Round to nearest minute
  if (date.getSeconds() >= 30) {
    rounded.setMinutes(rounded.getMinutes() + 1);
  }

  return rounded;
}

/**
 * Utility class for working with Sunnah times
 */
export class SunnahTimesCalculator {
  private config: PrayerTimeConfig;

  constructor(config: PrayerTimeConfig) {
    this.config = config;
  }

  /**
   * Calculate Sunnah times for a specific date
   */
  calculate(date: Date = new Date()): SunnahTimes {
    return calculateSunnahTimes(this.config, date);
  }

  /**
   * Get just the night thirds (commonly requested)
   */
  getNightThirds(date: Date = new Date()): {
    first: Date;
    middle: Date;
    last: Date;
    nightDuration: number;
  } {
    const sunnah = this.calculate(date);
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
  getDuhaWindow(date: Date = new Date()): {
    start: Date;
    end: Date;
    duration: number;
  } {
    const sunnah = this.calculate(date);
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
  isCurrentlyInPeriod(
    period: "duha" | "lastThird" | "firstThird" | "middleNight",
    date: Date = new Date()
  ): boolean {
    const sunnah = this.calculate(date);
    const now = new Date();

    switch (period) {
      case "duha":
        return now >= sunnah.duhaStart && now <= sunnah.duhaEnd;
      case "lastThird":
        // Last third extends until Fajr (next day)
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowResult = calculatePrayerTimes(this.config, tomorrow);
        if (!tomorrowResult.isValid) return false;

        return (
          now >= sunnah.lastThirdOfNight && now <= tomorrowResult.times.fajr
        );
      case "firstThird":
        return now >= sunnah.firstThirdOfNight && now <= sunnah.middleOfNight;
      case "middleNight":
        // Middle of night is a point in time, check if within ±30 minutes
        const thirtyMinutes = 30 * 60 * 1000;
        return (
          Math.abs(now.getTime() - sunnah.middleOfNight.getTime()) <=
          thirtyMinutes
        );
      default:
        return false;
    }
  }
}

// Export factory function for convenience
export function createSunnahCalculator(
  config: PrayerTimeConfig
): SunnahTimesCalculator {
  return new SunnahTimesCalculator(config);
}
