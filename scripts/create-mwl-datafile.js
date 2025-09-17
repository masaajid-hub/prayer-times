#!/usr/bin/env bun

/**
 * Create MWL (Muslim World League) test file using adhan-js reference implementation
 * This generates test data from pure adhan-js calculations to benchmark our library accuracy
 */

import fs from "fs";
import { PrayerTimes, CalculationMethod, Coordinates } from "adhan";

const OUTPUT_FILE = "./test-data/MWL.json";
const LOCATION = "Riyadh, Saudi Arabia"; // Major city suitable for MWL method
const COORDINATES = [24.7136, 46.6753]; // Riyadh coordinates
const TIMEZONE = "Asia/Riyadh";

/**
 * Create MWL test file using adhan-js calculations
 */
function createMWLTestFile() {
  console.log(
    "🌍 Creating MWL 2025 test file from adhan-js reference calculations...\n"
  );

  const testCases = [];

  // Generate test cases for September 1-30, 2025
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2025-09-${day.toString().padStart(2, "0")}`;
    const date = new Date(Date.UTC(2025, 8, day)); // Month is 0-indexed in JavaScript, use UTC

    // Create adhan-js objects
    const coordinates = new Coordinates(COORDINATES[0], COORDINATES[1]);
    const params = CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    // Convert times to local timezone format
    const formatTime = (time) => {
      return (
        time.toLocaleString("sv-SE", { timeZone: TIMEZONE }).replace(" ", "T") +
        "+03:00"
      );
    };

    const testCase = {
      date: dateStr,
      input: {
        date: dateStr,
        coordinates: COORDINATES,
        method: "MWL",
        timezone: TIMEZONE,
        asrSchool: "Standard",
        highLatitudeRule: "NightMiddle",
      },
      expected: {
        fajr: formatTime(prayerTimes.fajr),
        syuruk: formatTime(prayerTimes.sunrise),
        dhuhr: formatTime(prayerTimes.dhuhr),
        asr: formatTime(prayerTimes.asr),
        maghrib: formatTime(prayerTimes.maghrib),
        isha: formatTime(prayerTimes.isha),
      },
    };

    testCases.push(testCase);
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "adhan-js v4.4.3 Reference Implementation",
      authority: "Generated Reference Data (Not Official Authority)",
      official_url: "https://github.com/batoulapps/adhan-js",
      fetched_date: new Date().toISOString().split("T")[0],
      tier: 2,
      quality: "reference_validation",
      accuracy_target: "±0 minutes (exact match expected)",
      data_year: "2025",
      method: "MWL",
      coordinates: {
        latitude: COORDINATES[0],
        longitude: COORDINATES[1],
      },
      timezone: TIMEZONE,
      location: LOCATION,
      asr_school: "Standard",
      note: "Generated from adhan-js to benchmark our library against reference implementation",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ MWL test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data period: September 1-30, 2025`);
  console.log(`   🔗 Source: adhan-js v4.4.3 reference implementation`);
  console.log(`   🎯 Expected accuracy: ±0 minutes (exact match)`);
  console.log(`   📍 Location: ${LOCATION}`);
  console.log(`   🕌 Method: Muslim World League (MWL)`);
  console.log(`   ⭐ Purpose: Benchmark our library vs adhan-js gold standard`);

  // Show sample times
  const sampleCase = testCases[0];
  console.log(`\n📋 Sample (Sept 1):`);
  console.log(`   Fajr:    ${sampleCase.expected.fajr}`);
  console.log(`   Syuruk:  ${sampleCase.expected.syuruk}`);
  console.log(`   Dhuhr:   ${sampleCase.expected.dhuhr}`);
  console.log(`   Asr:     ${sampleCase.expected.asr}`);
  console.log(`   Maghrib: ${sampleCase.expected.maghrib}`);
  console.log(`   Isha:    ${sampleCase.expected.isha}`);
}

// Create the test file
createMWLTestFile();
