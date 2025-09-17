#!/usr/bin/env bun

/**
 * Create France12 (UOIF 12°) test file using adhan-js custom method
 * This generates test data from adhan-js custom calculations to benchmark our library accuracy
 */

import fs from "fs";
import { PrayerTimes, CalculationMethod, Coordinates } from "adhan";

const OUTPUT_FILE = "./test-data/France15.json";
const LOCATION = "Paris, France"; // Major French city
const COORDINATES = [48.8566, 2.3522]; // Paris coordinates
const TIMEZONE = "Europe/Paris";

/**
 * Create France15 test file using adhan-js custom method calculations
 */
function createFrance15TestFile() {
  console.log(
    "🇫🇷 Creating France15 (UOIF 15°) 2025 test file from adhan-js custom method...\n"
  );

  const testCases = [];

  // Generate test cases for September 1-30, 2025
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2025-09-${day.toString().padStart(2, "0")}`;
    const date = new Date(Date.UTC(2025, 8, day)); // Month is 0-indexed in JavaScript, use UTC

    // Create adhan-js objects
    const coordinates = new Coordinates(COORDINATES[0], COORDINATES[1]);

    // Create custom France15 method (15° fajr, 15° isha, 1 min maghrib adjustment)
    const france15Method = CalculationMethod.Other();
    france15Method.fajrAngle = 15;
    france15Method.ishaAngle = 15;
    france15Method.adjustments.maghrib = 1;

    const prayerTimes = new PrayerTimes(coordinates, date, france15Method);

    // Convert times to local timezone format
    const formatTime = (time) => {
      return (
        time.toLocaleString("sv-SE", { timeZone: TIMEZONE }).replace(" ", "T") +
        "+02:00"
      );
    };

    const testCase = {
      date: dateStr,
      input: {
        date: dateStr,
        coordinates: COORDINATES,
        method: "France15",
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

    // Show progress
    const fajrTime = prayerTimes.fajr
      .toLocaleTimeString("en-GB", { timeZone: TIMEZONE, hour12: false })
      .slice(0, 5);
    const ishaTime = prayerTimes.isha
      .toLocaleTimeString("en-GB", { timeZone: TIMEZONE, hour12: false })
      .slice(0, 5);
    console.log(`${dateStr}: Fajr ${fajrTime} | Isha ${ishaTime}`);
  }

  // Create the output structure
  const output = {
    metadata: {
      source: "France15 Method Reference Implementation",
      authority: "Generated Reference Data (Not Official Authority)",
      official_url: "https://github.com/batoulapps/adhan-js",
      fetched_date: "2025-09-16",
      tier: 2,
      quality: "reference_validation",
      accuracy_target: "Reference implementation matching",
      data_year: "2025",
      method: "France15",
      coordinates: {
        latitude: COORDINATES[0],
        longitude: COORDINATES[1],
      },
      timezone: TIMEZONE,
      location: LOCATION,
      asr_school: "Standard",
      data_count: testCases.length,
      notes:
        "Generated using adhan-js UOIF method (15°/15°/+1min maghrib) for validation purposes",
    },
    testCases,
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n✅ Generated ${testCases.length} test cases`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log(`🎯 Method: France15 (UOIF 15°/15°)`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log(`🕐 Period: September 2025`);
}

/**
 * Format a Date object to ISO string with timezone offset
 */
function formatToISOWithTimezone(date, offset) {
  // Convert the local time to UTC by subtracting the timezone offset
  // adhan-js returns local times, but we need UTC for ISO format
  const offsetHours = parseInt(offset.substring(1, 3));
  const utcTime = new Date(date.getTime() - offsetHours * 60 * 60 * 1000);
  return utcTime.toISOString();
}

// Run the script
createFrance15TestFile();
