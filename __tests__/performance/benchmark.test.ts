/**
 * Performance benchmark tests for prayer times calculation
 * Validates speed and memory efficiency across methods and locations
 */

import { test, expect } from "bun:test";
import { PrayerTimeCalculator } from "../../src/api/prayer-times";
import type { PrayerTimeConfig } from "../../src/types";

// Performance benchmarks
const PERFORMANCE_TARGETS = {
  SINGLE_CALCULATION: 1, // milliseconds
  BULK_CALCULATION_100: 50, // milliseconds for 100 days
  BULK_CALCULATION_365: 200, // milliseconds for 365 days
};

// Test configurations for different methods
const TEST_CONFIGS: { config: PrayerTimeConfig; name: string }[] = [
  {
    config: {
      method: "Qatar",
      location: [25.2854, 51.531],
      timezone: "Asia/Qatar",
    },
    name: "Qatar (Official)",
  },
  {
    config: {
      method: "ISNA",
      location: [40.7589, -73.9851],
      timezone: "America/New_York",
    },
    name: "ISNA (North America)",
  },
  {
    config: {
      method: "JAKIM",
      location: [3.139, 101.6869],
      timezone: "Asia/Kuala_Lumpur",
    },
    name: "JAKIM (Malaysia)",
  },
  {
    config: {
      method: "Egypt",
      location: [30.0444, 31.2357],
      timezone: "Africa/Cairo",
    },
    name: "Egypt (Official)",
  },
  {
    config: {
      method: "Dubai",
      location: [25.2048, 55.2708],
      timezone: "Asia/Dubai",
    },
    name: "Dubai (UAE)",
  },
];

const TEST_DATES = [
  new Date(2024, 0, 1), // New Year
  new Date(2024, 2, 21), // Equinox
  new Date(2024, 5, 21), // Solstice
  new Date(2024, 8, 23), // Autumn Equinox
  new Date(2024, 11, 21), // Winter Solstice
];

test("Single calculation performance", () => {
  const config = TEST_CONFIGS[0].config; // Qatar
  const calculator = new PrayerTimeCalculator(config);
  const testDate = new Date("2024-09-16");

  // Warm up
  calculator.calculate(testDate);

  // Measure performance
  const start = performance.now();
  const result = calculator.calculate(testDate);
  const duration = performance.now() - start;

  // Verify result is valid
  expect(result.fajr).toBeInstanceOf(Date);
  expect(result.sunrise).toBeInstanceOf(Date);
  expect(result.dhuhr).toBeInstanceOf(Date);
  expect(result.asr).toBeInstanceOf(Date);
  expect(result.maghrib).toBeInstanceOf(Date);
  expect(result.isha).toBeInstanceOf(Date);

  // Performance assertion
  expect(duration).toBeLessThan(PERFORMANCE_TARGETS.SINGLE_CALCULATION);
  console.log(
    `✅ Single calculation: ${duration.toFixed(3)}ms (target: <${PERFORMANCE_TARGETS.SINGLE_CALCULATION}ms)`
  );
});

test("Bulk calculation performance - 100 days", () => {
  const config = TEST_CONFIGS[1].config; // ISNA
  const calculator = new PrayerTimeCalculator(config);
  const startDate = new Date("2024-01-01");

  // Warm up
  calculator.calculate(startDate);

  // Measure 100 day calculation
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    const testDate = new Date(startDate);
    testDate.setDate(startDate.getDate() + i);
    calculator.calculate(testDate);
  }
  const duration = performance.now() - start;

  // Performance assertion
  expect(duration).toBeLessThan(PERFORMANCE_TARGETS.BULK_CALCULATION_100);
  console.log(
    `✅ 100-day calculation: ${duration.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.BULK_CALCULATION_100}ms)`
  );
  console.log(`   Average per day: ${(duration / 100).toFixed(3)}ms`);
});

test("Bulk calculation performance - 365 days", () => {
  const config = TEST_CONFIGS[2].config; // JAKIM
  const calculator = new PrayerTimeCalculator(config);
  const startDate = new Date("2024-01-01");

  // Warm up
  calculator.calculate(startDate);

  // Measure full year calculation
  const start = performance.now();
  for (let i = 0; i < 365; i++) {
    const testDate = new Date(startDate);
    testDate.setDate(startDate.getDate() + i);
    calculator.calculate(testDate);
  }
  const duration = performance.now() - start;

  // Performance assertion
  expect(duration).toBeLessThan(PERFORMANCE_TARGETS.BULK_CALCULATION_365);
  console.log(
    `✅ 365-day calculation: ${duration.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.BULK_CALCULATION_365}ms)`
  );
  console.log(`   Average per day: ${(duration / 365).toFixed(3)}ms`);
});

test("Monthly calculation performance", () => {
  const config = TEST_CONFIGS[0].config; // Qatar
  const calculator = new PrayerTimeCalculator(config);

  // Warm up
  calculator.calculateForMonth(2024, 1);

  // Measure full year of monthly calculations
  const start = performance.now();
  for (let month = 1; month <= 12; month++) {
    calculator.calculateForMonth(2024, month);
  }
  const duration = performance.now() - start;

  // Should handle monthly calculations efficiently
  expect(duration).toBeLessThan(500);
  console.log(
    `✅ Monthly calculations for full year: ${duration.toFixed(2)}ms (target: <500ms)`
  );
});

test("Cross-method performance comparison", () => {
  const testDate = new Date("2024-09-16");
  const results: { method: string; duration: number }[] = [];

  for (const testConfig of TEST_CONFIGS) {
    const calculator = new PrayerTimeCalculator(testConfig.config);

    // Warm up
    calculator.calculate(testDate);

    // Measure
    const start = performance.now();
    calculator.calculate(testDate);
    const duration = performance.now() - start;

    results.push({ method: testConfig.name, duration });
  }

  // All methods should be fast
  for (const result of results) {
    expect(result.duration).toBeLessThan(
      PERFORMANCE_TARGETS.SINGLE_CALCULATION
    );
    console.log(`✅ ${result.method}: ${result.duration.toFixed(3)}ms`);
  }

  // Performance consistency - no method should be more than 10x slower than fastest
  const fastest = Math.min(...results.map((r) => r.duration));
  const slowest = Math.max(...results.map((r) => r.duration));
  const ratio = slowest / fastest;

  expect(ratio).toBeLessThan(10);
  console.log(
    `✅ Performance consistency: ${ratio.toFixed(1)}x variation (fastest: ${fastest.toFixed(3)}ms, slowest: ${slowest.toFixed(3)}ms)`
  );
});

test("Memory efficiency - no memory leaks", () => {
  const config = TEST_CONFIGS[0].config;
  const calculator = new PrayerTimeCalculator(config);
  const testDate = new Date("2024-09-16");

  // Initial memory measurement
  const initialMemory = process.memoryUsage();

  // Perform many calculations
  for (let i = 0; i < 1000; i++) {
    calculator.calculate(testDate);
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Final memory measurement
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

  // Memory should not increase significantly (allow for some variance)
  expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
  console.log(
    `✅ Memory efficiency: ${(memoryIncrease / 1024).toFixed(2)}KB increase after 1000 calculations`
  );
});

test("High latitude performance", () => {
  const highLatConfig: PrayerTimeConfig = {
    method: "ISNA",
    location: [68.7719, -108.2062], // Yellowknife, NWT
    timezone: "America/Yellowknife",
    highLatitudeRule: "NightMiddle",
  };

  const calculator = new PrayerTimeCalculator(highLatConfig);
  const summerSolstice = new Date("2024-06-21");

  // Warm up
  calculator.calculate(summerSolstice);

  // Measure high latitude calculation
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    calculator.calculate(summerSolstice);
  }
  const duration = performance.now() - start;
  const avgTime = duration / 100;

  // High latitude adjustments should not significantly impact performance
  expect(avgTime).toBeLessThan(5); // Less than 5ms per calculation
  console.log(
    `✅ High latitude calculation: ${avgTime.toFixed(3)}ms average (target: <5ms)`
  );
});

test("Sunnah times performance", () => {
  const config = TEST_CONFIGS[0].config;
  const calculator = new PrayerTimeCalculator(config);
  const testDate = new Date("2024-09-16");

  // Warm up
  calculator.getSunnahTimes(testDate);

  // Measure Sunnah times calculation
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    calculator.getSunnahTimes(testDate);
  }
  const duration = performance.now() - start;
  const avgTime = duration / 100;

  // Sunnah times should be efficient
  expect(avgTime).toBeLessThan(2); // Less than 2ms per calculation
  console.log(
    `✅ Sunnah times calculation: ${avgTime.toFixed(3)}ms average (target: <2ms)`
  );
});
