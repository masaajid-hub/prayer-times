#!/usr/bin/env bun

/**
 * Automated Method Test File Generator
 *
 * Generates standardized test files for all prayer time calculation methods
 * based on their corresponding test data files and method tier classifications.
 *
 * Usage: bun run scripts/generate-method-tests.js [method-name]
 */

import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

// Method tier classifications based on data source analysis
const METHOD_TIERS = {
  // Tier 1: Official Authority Data (high accuracy expectations)
  TIER_1: {
    methods: ["Qatar", "ISNA", "JAKIM"],
    tolerance: 5, // Strict: max 5 minutes for official data
    tier1Target: 0.5,
    tier2Target: 0.8,
    tier3Target: 0.95,
    statisticalAnalysis: true,
    avgThreshold: 2,
    maxThreshold: 5,
    sampleSize: 10,
    logFailures: true,
  },

  // Tier 1b: Official Authority Data (slightly relaxed)
  TIER_1B: {
    methods: ["Egypt", "Singapore", "Turkey", "Dubai", "Russia", "Kemenag"],
    tolerance: 5, // Strict: max 5 minutes for official data
    tier1Target: 0.4,
    tier2Target: 0.7,
    tier3Target: 0.9,
    statisticalAnalysis: true,
    avgThreshold: 2,
    maxThreshold: 5,
    sampleSize: 10,
    logFailures: true,
  },

  // Tier 1c: Official Authority Data (special cases)
  TIER_1C: {
    methods: ["UmmAlQura"],
    tolerance: 5, // Strict: max 5 minutes for official data
    tier1Target: 0.3,
    tier2Target: 0.6,
    tier3Target: 0.85,
    statisticalAnalysis: true,
    avgThreshold: 2,
    maxThreshold: 5,
    sampleSize: 10,
    logFailures: true,
  },

  // Tier 2: Reference Implementation Data - EXACT MATCH EXPECTED
  TIER_2: {
    methods: [
      "Karachi",
      "MWL",
      "Tehran",
      "Jafari",
      "France12",
      "France15",
      "France18",
    ],
    tolerance: 1.1, // VERY STRICT: max ~1 minute for generated adhan.js data (slight buffer for rounding)
    tier1Target: 0.95, // 95%+ should be exact (±1 min)
    tier2Target: 0.98, // 98%+ within ±2 minutes
    tier3Target: 0.99, // 99%+ within ±5 minutes (avoid exact 1.0 comparison issues)
    statisticalAnalysis: false,
    avgThreshold: 0.5, // Average should be under 0.5 minutes
    maxThreshold: 1.1, // Max ~1 minute difference (slight buffer)
    sampleSize: 10,
    logFailures: true,
  },

  // Tier 3: Special Official Cases (Moonsighting - known to have larger variations)
  TIER_3: {
    methods: ["Moonsighting"],
    tolerance: 5, // Still max 5 minutes even for special cases
    tier1Target: 0.2,
    tier2Target: 0.4,
    tier3Target: 0.7,
    statisticalAnalysis: false,
    avgThreshold: 3,
    maxThreshold: 5,
    sampleSize: 10,
    logFailures: true,
  },
};

const METHOD_METADATA = {
  Qatar: {
    name: "Qatar",
    description: "Validates against official Qatar calculation authority data",
    authority: "Qatar Architecture & Heritage",
    location: "Doha, Qatar",
    hasAuthority: true,
    hasLocation: true,
  },
  Egypt: {
    name: "Egypt",
    description: "Validates against Egyptian General Authority of Survey data",
    authority: "Egyptian General Authority of Survey (ESA)",
    location: "Cairo, Egypt",
    hasAuthority: true,
    hasLocation: true,
  },
  JAKIM: {
    name: "JAKIM",
    description:
      "Validates against official Malaysian government calculation authority data",
    authority: "Jabatan Kemajuan Islam Malaysia (JAKIM)",
    location: "Kuala Perlis, Malaysia",
    hasAuthority: true,
    hasLocation: true,
  },
  Singapore: {
    name: "Singapore",
    description: "Validates against MUIS Singapore official calculation data",
    authority: "Majlis Ugama Islam Singapura (MUIS)",
    location: "Singapore",
    hasAuthority: true,
    hasLocation: true,
  },
  Turkey: {
    name: "Turkey",
    description: "Validates against Turkey Diyanet official calculation data",
    authority: "Diyanet İşleri Başkanlığı (Turkish Religious Affairs)",
    location: "Ankara, Turkey",
    hasAuthority: true,
    hasLocation: true,
  },
  Dubai: {
    name: "Dubai",
    description:
      "Validates against UAE General Authority of Islamic Affairs data",
    authority: "General Authority of Islamic Affairs & Endowments, UAE",
    location: "Dubai, UAE",
    hasAuthority: true,
    hasLocation: true,
  },
  UmmAlQura: {
    name: "UmmAlQura",
    description:
      "Validates against Saudi Umm Al-Qura University calculation data",
    authority: "Umm Al-Qura University, Saudi Arabia",
    location: "Riyadh, Saudi Arabia",
    hasAuthority: true,
    hasLocation: true,
  },
  Russia: {
    name: "Russia",
    description:
      "Validates against Spiritual Administration of Muslims in Russia calculation data",
    authority: "Spiritual Administration of Muslims in Russia",
    location: "Moscow, Russia",
    hasAuthority: true,
    hasLocation: true,
  },
  Kemenag: {
    name: "Kemenag",
    description:
      "Validates against Indonesian Ministry of Religious Affairs data",
    authority: "Kementerian Agama Republik Indonesia",
    location: "Jakarta, Indonesia",
    hasAuthority: true,
    hasLocation: true,
  },
  ISNA: {
    name: "ISNA",
    description: "Validates against official ISNA calculation authority data",
    authority: "Islamic Society of North America (ISNA)",
    location: "Mississauga, Canada",
    hasAuthority: true,
    hasLocation: true,
  },
  Moonsighting: {
    name: "Moonsighting",
    description:
      "Validates against Moonsighting.com UK Islamic Committee calculation data",
    authority: "Moonsighting.com (UK Islamic Moonsighting Committee)",
    location: "London, United Kingdom",
    hasAuthority: true,
    hasLocation: true,
  },
  Karachi: {
    name: "Karachi",
    description:
      "Validates against Karachi calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  Tehran: {
    name: "Tehran",
    description:
      "Validates against Tehran calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  Jafari: {
    name: "Jafari",
    description:
      "Validates against Jafari (Shia) calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  MWL: {
    name: "MWL",
    description:
      "Validates against Muslim World League calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  France12: {
    name: "France12",
    description:
      "Validates against France UOIF 12° calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  France15: {
    name: "France15",
    description:
      "Validates against France Moderate 15° calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
  France18: {
    name: "France18",
    description:
      "Validates against France Grande Mosquée 18° calculation method using adhan.js reference",
    authority: null,
    location: null,
    hasAuthority: false,
    hasLocation: false,
  },
};

function getMethodTier(method) {
  for (const [tierName, tierConfig] of Object.entries(METHOD_TIERS)) {
    if (tierConfig.methods.includes(method)) {
      return { name: tierName, config: tierConfig };
    }
  }
  throw new Error(`Unknown method: ${method}`);
}

function getTierDescription(tierName) {
  const descriptions = {
    TIER_1: "Official Authority Data - High Quality (±5min max)",
    TIER_1B: "Official Authority Data - Standard Quality (±5min max)",
    TIER_1C: "Official Authority Data - Special Case (±5min max)",
    TIER_2: "Reference Implementation - Exact Match Expected (±1min max)",
    TIER_3: "Special Official Data - Moonsighting (±5min max)",
  };
  return descriptions[tierName] || "Unknown Tier";
}

function getTestFileName(method) {
  // Use exact method name as file name
  return method;
}

function getDataFileName(method) {
  if (method === "UmmAlQura") return "UmmAlQura";
  if (method === "JAKIM") return "JAKIM";
  if (method === "ISNA") return "ISNA";
  if (method === "MWL") return "MWL";
  return method;
}

function getImportName(method) {
  return `${method.toLowerCase()}TestData`;
}

function generateTestFile(method, testDataPath) {
  const tier = getMethodTier(method);
  const metadata = METHOD_METADATA[method];

  if (!metadata) {
    throw new Error(`No metadata found for method: ${method}`);
  }

  return `/**
 * ${metadata.name} method accuracy tests
 * ${metadata.description}
 */

import { test, expect } from "bun:test";
import { PrayerTimeCalculator } from "../../src/api/prayer-times";
import ${getImportName(method)} from "../../test-data/${getDataFileName(method)}.json";

const ACCURACY_THRESHOLDS = {
  EXCELLENT: 1, // ±1 minute
  GOOD: 2,      // ±2 minutes
  ACCEPTABLE: 5, // ±5 minutes
  POOR: 10      // ±10 minutes
};

// ${getTierDescription(tier.name)} configuration
const TEST_CONFIG = {
  MAX_TOLERANCE: ${tier.config.tolerance},
  TIER1_ACCURACY_TARGET: ${tier.config.tier1Target},
  TIER2_ACCURACY_TARGET: ${tier.config.tier2Target},
  TIER3_ACCURACY_TARGET: ${tier.config.tier3Target},
  STATISTICAL_ANALYSIS: ${tier.config.statisticalAnalysis},
  AVG_THRESHOLD: ${tier.config.avgThreshold},
  MAX_THRESHOLD: ${tier.config.maxThreshold}
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

function analyzeTimeDifference(expected: string, calculated: Date): {
  differenceMinutes: number;
  status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'FAIL';
} {
  const expectedDate = new Date(expected);
  const diffMs = Math.abs(calculated.getTime() - expectedDate.getTime());
  const diffMinutes = diffMs / (1000 * 60);

  let status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'FAIL' = 'FAIL';
  if (diffMinutes <= ACCURACY_THRESHOLDS.EXCELLENT) status = 'EXCELLENT';
  else if (diffMinutes <= ACCURACY_THRESHOLDS.GOOD) status = 'GOOD';
  else if (diffMinutes <= ACCURACY_THRESHOLDS.ACCEPTABLE) status = 'ACCEPTABLE';
  else if (diffMinutes <= ACCURACY_THRESHOLDS.POOR) status = 'POOR';

  return { differenceMinutes: Math.round(diffMinutes * 100) / 100, status };
}

test("${metadata.name} method - metadata validation", () => {${
    metadata.hasAuthority
      ? `\n  expect(${getImportName(method)}.metadata.authority).toBe("${metadata.authority}");`
      : ""
  }
  expect(${getImportName(method)}.metadata.method).toBe("${method}");${
    metadata.hasLocation
      ? `\n  expect(${getImportName(method)}.metadata.location).toBe("${metadata.location}");`
      : ""
  }
  expect(${getImportName(method)}.testCases.length).toBeGreaterThan(0);

  console.log(\`${metadata.name} test data: \${${getImportName(method)}.testCases.length} test cases (${getTierDescription(tier.name)})\`);
});

test("${metadata.name} method - sample accuracy validation", () => {
  const testCases = ${getImportName(method)}.testCases.slice(0, ${tier.config.sampleSize}) as TestCase[];
  const results: { date: string; prayer: string; status: string; difference: number }[] = [];

  for (const testCase of testCases) {
    const coordinates = Array.isArray(testCase.input.coordinates)
      ? [testCase.input.coordinates[0], testCase.input.coordinates[1]] as [number, number]
      : testCase.input.coordinates;

    const config = {
      method: testCase.input.method as "${method}",
      location: coordinates,
      timezone: testCase.input.timezone,
      asrSchool: (testCase.input.asrSchool ?? "Standard") as "Standard" | "Hanafi"
    };

    const calculator = new PrayerTimeCalculator(config);
    const calculatedTimes = calculator.calculate(new Date(testCase.date));

    const prayers: { key: keyof typeof testCase.expected; calculated: Date }[] = [
      { key: 'fajr', calculated: calculatedTimes.fajr },
      { key: 'syuruk', calculated: calculatedTimes.sunrise },
      { key: 'dhuhr', calculated: calculatedTimes.dhuhr },
      { key: 'asr', calculated: calculatedTimes.asr },
      { key: 'maghrib', calculated: calculatedTimes.maghrib },
      { key: 'isha', calculated: calculatedTimes.isha }
    ];

    for (const prayer of prayers) {
      const analysis = analyzeTimeDifference(testCase.expected[prayer.key], prayer.calculated);
      results.push({
        date: testCase.date,
        prayer: prayer.key,
        status: analysis.status,
        difference: analysis.differenceMinutes
      });

${
  tier.config.logFailures
    ? `      // Log failing cases for debugging
      if (analysis.status === 'FAIL') {
        console.log(\`❌ \${testCase.date} \${prayer.key}: \${analysis.differenceMinutes} minutes difference\`);
      }`
    : ""
}

      expect(analysis.status).not.toBe('FAIL');
      expect(analysis.differenceMinutes).toBeLessThan(TEST_CONFIG.MAX_TOLERANCE);
    }
  }

  const excellentCount = results.filter(r => r.status === 'EXCELLENT').length;
  const goodCount = results.filter(r => r.status === 'GOOD').length;
  const acceptableCount = results.filter(r => r.status === 'ACCEPTABLE').length;
  const totalTests = results.length;

  const tier1Accuracy = excellentCount / totalTests;
  const tier2Accuracy = (excellentCount + goodCount) / totalTests;
  const tier3Accuracy = (excellentCount + goodCount + acceptableCount) / totalTests;

  console.log(\`${metadata.name} Method Accuracy Analysis (\${totalTests} tests):\`);
  console.log(\`  ±1 minute: \${excellentCount}/\${totalTests} (\${(tier1Accuracy * 100).toFixed(1)}%)\`);
  console.log(\`  ±2 minutes: \${excellentCount + goodCount}/\${totalTests} (\${(tier2Accuracy * 100).toFixed(1)}%)\`);
  console.log(\`  ±5 minutes: \${excellentCount + goodCount + acceptableCount}/\${totalTests} (\${(tier3Accuracy * 100).toFixed(1)}%)\`);

  expect(tier1Accuracy).toBeGreaterThan(TEST_CONFIG.TIER1_ACCURACY_TARGET);
  expect(tier2Accuracy).toBeGreaterThan(TEST_CONFIG.TIER2_ACCURACY_TARGET);
  expect(tier3Accuracy).toBeGreaterThan(TEST_CONFIG.TIER3_ACCURACY_TARGET);
});

${
  tier.config.statisticalAnalysis
    ? `test("${metadata.name} method - full dataset statistical analysis", () => {
  const testCases = ${getImportName(method)}.testCases as TestCase[];
  let totalDifference = 0;
  let maxDifference = 0;
  let testCount = 0;

  const coords = ${getImportName(method)}.metadata.coordinates;
  const location: [number, number] = Array.isArray(coords)
    ? [coords[0], coords[1]]
    : [coords.latitude, coords.longitude];

  const config = {
    method: "${method}" as const,
    location,
    timezone: ${getImportName(method)}.metadata.timezone
  };

  const calculator = new PrayerTimeCalculator(config);

  for (let i = 0; i < testCases.length; i += 10) {
    const testCase = testCases[i];
    const calculatedTimes = calculator.calculate(new Date(testCase.date));

    const prayers = [
      { expected: testCase.expected.fajr, calculated: calculatedTimes.fajr },
      { expected: testCase.expected.syuruk, calculated: calculatedTimes.sunrise },
      { expected: testCase.expected.dhuhr, calculated: calculatedTimes.dhuhr },
      { expected: testCase.expected.asr, calculated: calculatedTimes.asr },
      { expected: testCase.expected.maghrib, calculated: calculatedTimes.maghrib },
      { expected: testCase.expected.isha, calculated: calculatedTimes.isha }
    ];

    for (const prayer of prayers) {
      const analysis = analyzeTimeDifference(prayer.expected, prayer.calculated);
      totalDifference += analysis.differenceMinutes;
      maxDifference = Math.max(maxDifference, analysis.differenceMinutes);
      testCount++;
    }
  }

  const avgDifference = totalDifference / testCount;

  console.log(\`${metadata.name} Statistical Analysis (\${testCount} prayer times):\`);
  console.log(\`  Average difference: \${avgDifference.toFixed(2)} minutes\`);
  console.log(\`  Maximum difference: \${maxDifference.toFixed(2)} minutes\`);

  expect(avgDifference).toBeLessThan(TEST_CONFIG.AVG_THRESHOLD);
  expect(maxDifference).toBeLessThan(TEST_CONFIG.MAX_THRESHOLD);
});`
    : ""
}

test("${metadata.name} method - edge cases and seasonal variation", () => {
  const coords = ${getImportName(method)}.metadata.coordinates;
  const location: [number, number] = Array.isArray(coords)
    ? [coords[0], coords[1]]
    : [coords.latitude, coords.longitude];

  const config = {
    method: "${method}" as const,
    location,
    timezone: ${getImportName(method)}.metadata.timezone,
    highLatitudeRule: "NightMiddle" as const
  };

  const calculator = new PrayerTimeCalculator(config);

  const keyDates = [
    "2024-01-01", // New Year
    "2024-03-20", // Spring Equinox
    "2024-06-21", // Summer Solstice
    "2024-09-23", // Autumn Equinox
    "2024-12-21"  // Winter Solstice
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

  console.log(\`✅ ${metadata.name} method passed edge case validation for \${keyDates.length} key dates\`);
});`;
}

function getAllTestDataFiles() {
  const testDataDir = join(process.cwd(), "test-data");
  const files = readdirSync(testDataDir);
  return files
    .filter(
      (file) => file.endsWith(".json") && file !== "standardized-schema.json"
    )
    .map((file) => file.replace(".json", ""));
}

function getMethodFromDataFile(dataFileName) {
  const mapping = {
    UmmAlQura: "UmmAlQura",
    JAKIM: "JAKIM",
    ISNA: "ISNA",
    MWL: "MWL",
  };
  return mapping[dataFileName] || dataFileName;
}

async function main() {
  const targetMethod = process.argv[2];

  if (targetMethod) {
    console.log(`Generating test file for method: ${targetMethod}`);

    const testDataFile = getDataFileName(targetMethod);
    const testDataPath = join(
      process.cwd(),
      "test-data",
      `${testDataFile}.json`
    );

    if (!existsSync(testDataPath)) {
      console.error(`❌ Test data file not found: ${testDataPath}`);
      process.exit(1);
    }

    try {
      const testContent = generateTestFile(targetMethod, testDataPath);
      const outputFileName = getTestFileName(targetMethod) + ".test.ts";
      const outputPath = join(
        process.cwd(),
        "__tests__",
        "methods",
        outputFileName
      );

      writeFileSync(outputPath, testContent);
      console.log(`✅ Generated: ${outputPath}`);
    } catch (error) {
      console.error(
        `❌ Error generating test for ${targetMethod}:`,
        error.message
      );
      process.exit(1);
    }
  } else {
    console.log("Generating all method test files...");

    const testDataFiles = getAllTestDataFiles();
    console.log(`Found ${testDataFiles.length} test data files`);

    let successCount = 0;
    let errorCount = 0;

    for (const dataFileName of testDataFiles) {
      const method = getMethodFromDataFile(dataFileName);

      if (!METHOD_METADATA[method]) {
        console.log(`⚠️  Skipping ${method}: No metadata available`);
        continue;
      }

      try {
        const testDataPath = join(
          process.cwd(),
          "test-data",
          `${dataFileName}.json`
        );
        const testContent = generateTestFile(method, testDataPath);

        const outputFileName = getTestFileName(method) + ".test.ts";
        const outputPath = join(
          process.cwd(),
          "__tests__",
          "methods",
          outputFileName
        );

        writeFileSync(outputPath, testContent);
        console.log(`✅ Generated: ${outputFileName}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating test for ${method}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Successfully generated: ${successCount} tests`);
    console.log(`  ❌ Errors: ${errorCount} tests`);

    if (errorCount > 0) {
      process.exit(1);
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
