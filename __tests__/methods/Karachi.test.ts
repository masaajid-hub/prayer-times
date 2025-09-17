/**
 * Karachi method accuracy tests
 * Validates against Karachi calculation method using adhan.js reference
 */

import { test, expect } from "bun:test";
import { PrayerTimeCalculator } from "../../src/api/prayer-times";
import karachiTestData from "../../test-data/Karachi.json";

const ACCURACY_THRESHOLDS = {
  EXCELLENT: 1, // ±1 minute
  GOOD: 2, // ±2 minutes
  ACCEPTABLE: 5, // ±5 minutes
  POOR: 10, // ±10 minutes
};

// Reference Implementation - Exact Match Expected (±1min max) configuration
const TEST_CONFIG = {
  MAX_TOLERANCE: 1.1,
  TIER1_ACCURACY_TARGET: 0.95,
  TIER2_ACCURACY_TARGET: 0.98,
  TIER3_ACCURACY_TARGET: 0.99,
  STATISTICAL_ANALYSIS: false,
  AVG_THRESHOLD: 0.5,
  MAX_THRESHOLD: 1.1,
};

interface TestCase {
  date: string;
  input: {
    date: string;
    coordinates: number[] | [number, number];
    method: string;
    timezone: string;
    asrSchool?: string;
    highLatitudeRule?: string;
  };
  expected: {
    fajr: string;
    syuruk: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

function analyzeTimeDifference(
  expected: string,
  calculated: Date
): {
  differenceMinutes: number;
  status: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "FAIL";
} {
  const expectedDate = new Date(expected);
  const diffMs = Math.abs(calculated.getTime() - expectedDate.getTime());
  const diffMinutes = diffMs / (1000 * 60);

  let status: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "FAIL" = "FAIL";
  if (diffMinutes <= ACCURACY_THRESHOLDS.EXCELLENT) status = "EXCELLENT";
  else if (diffMinutes <= ACCURACY_THRESHOLDS.GOOD) status = "GOOD";
  else if (diffMinutes <= ACCURACY_THRESHOLDS.ACCEPTABLE) status = "ACCEPTABLE";
  else if (diffMinutes <= ACCURACY_THRESHOLDS.POOR) status = "POOR";

  return { differenceMinutes: Math.round(diffMinutes * 100) / 100, status };
}

test("Karachi method - metadata validation", () => {
  expect(karachiTestData.metadata.method).toBe("Karachi");
  expect(karachiTestData.testCases.length).toBeGreaterThan(0);

  console.log(
    `Karachi test data: ${karachiTestData.testCases.length} test cases (Reference Implementation - Exact Match Expected (±1min max))`
  );
});

test("Karachi method - sample accuracy validation", () => {
  const testCases = karachiTestData.testCases.slice(0, 10) as TestCase[];
  const results: {
    date: string;
    prayer: string;
    status: string;
    difference: number;
  }[] = [];

  for (const testCase of testCases) {
    const coordinates = Array.isArray(testCase.input.coordinates)
      ? ([testCase.input.coordinates[0], testCase.input.coordinates[1]] as [
          number,
          number,
        ])
      : testCase.input.coordinates;

    const config = {
      method: testCase.input.method as "Karachi",
      location: coordinates,
      timezone: testCase.input.timezone,
      asrSchool: (testCase.input.asrSchool ?? "Standard") as
        | "Standard"
        | "Hanafi",
    };

    const calculator = new PrayerTimeCalculator(config);
    const calculatedTimes = calculator.calculate(new Date(testCase.date));

    const prayers: {
      key: keyof typeof testCase.expected;
      calculated: Date;
    }[] = [
      { key: "fajr", calculated: calculatedTimes.fajr },
      { key: "syuruk", calculated: calculatedTimes.sunrise },
      { key: "dhuhr", calculated: calculatedTimes.dhuhr },
      { key: "asr", calculated: calculatedTimes.asr },
      { key: "maghrib", calculated: calculatedTimes.maghrib },
      { key: "isha", calculated: calculatedTimes.isha },
    ];

    for (const prayer of prayers) {
      const analysis = analyzeTimeDifference(
        testCase.expected[prayer.key],
        prayer.calculated
      );
      results.push({
        date: testCase.date,
        prayer: prayer.key,
        status: analysis.status,
        difference: analysis.differenceMinutes,
      });

      // Log failing cases for debugging
      if (analysis.status === "FAIL") {
        console.log(
          `❌ ${testCase.date} ${prayer.key}: ${analysis.differenceMinutes} minutes difference`
        );
      }

      expect(analysis.status).not.toBe("FAIL");
      expect(analysis.differenceMinutes).toBeLessThan(
        TEST_CONFIG.MAX_TOLERANCE
      );
    }
  }

  const excellentCount = results.filter((r) => r.status === "EXCELLENT").length;
  const goodCount = results.filter((r) => r.status === "GOOD").length;
  const acceptableCount = results.filter(
    (r) => r.status === "ACCEPTABLE"
  ).length;
  const totalTests = results.length;

  const tier1Accuracy = excellentCount / totalTests;
  const tier2Accuracy = (excellentCount + goodCount) / totalTests;
  const tier3Accuracy =
    (excellentCount + goodCount + acceptableCount) / totalTests;

  console.log(`Karachi Method Accuracy Analysis (${totalTests} tests):`);
  console.log(
    `  ±1 minute: ${excellentCount}/${totalTests} (${(tier1Accuracy * 100).toFixed(1)}%)`
  );
  console.log(
    `  ±2 minutes: ${excellentCount + goodCount}/${totalTests} (${(tier2Accuracy * 100).toFixed(1)}%)`
  );
  console.log(
    `  ±5 minutes: ${excellentCount + goodCount + acceptableCount}/${totalTests} (${(tier3Accuracy * 100).toFixed(1)}%)`
  );

  expect(tier1Accuracy).toBeGreaterThan(TEST_CONFIG.TIER1_ACCURACY_TARGET);
  expect(tier2Accuracy).toBeGreaterThan(TEST_CONFIG.TIER2_ACCURACY_TARGET);
  expect(tier3Accuracy).toBeGreaterThan(TEST_CONFIG.TIER3_ACCURACY_TARGET);
});

test("Karachi method - edge cases and seasonal variation", () => {
  const coords = karachiTestData.metadata.coordinates;
  const location: [number, number] = Array.isArray(coords)
    ? [coords[0], coords[1]]
    : [coords.latitude, coords.longitude];

  const config = {
    method: "Karachi" as const,
    location,
    timezone: karachiTestData.metadata.timezone,
  };

  const calculator = new PrayerTimeCalculator(config);

  const keyDates = [
    "2024-01-01", // New Year
    "2024-03-20", // Spring Equinox
    "2024-06-21", // Summer Solstice
    "2024-09-23", // Autumn Equinox
    "2024-12-21", // Winter Solstice
  ];

  for (const dateStr of keyDates) {
    const times = calculator.calculate(new Date(dateStr));

    expect(times.fajr).toBeInstanceOf(Date);
    expect(times.sunrise).toBeInstanceOf(Date);
    expect(times.dhuhr).toBeInstanceOf(Date);
    expect(times.asr).toBeInstanceOf(Date);
    expect(times.maghrib).toBeInstanceOf(Date);
    expect(times.isha).toBeInstanceOf(Date);

    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  }

  console.log(
    `✅ Karachi method passed edge case validation for ${keyDates.length} key dates`
  );
});
