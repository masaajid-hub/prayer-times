#!/usr/bin/env bun

/**
 * Generate Tehran method test data using adhan-js reference implementation
 * Tehran coordinates: 35.6892, 51.3890 (Tehran, Iran)
 */

import fs from "fs";
import adhan from "adhan";

const { CalculationMethod, PrayerTimes, Coordinates } = adhan;

console.log("🇮🇷 Creating Tehran 2025 test file from adhan-js reference...\n");

// Tehran coordinates
const coordinates = new Coordinates(35.6892, 51.389);

// Tehran method using custom parameters
const tehranMethod = CalculationMethod.Other();
tehranMethod.fajrAngle = 17.7;
tehranMethod.ishaAngle = 14;
tehranMethod.maghribAngle = 4.5; // 4.5 degrees after sunset

const testCases = [];

// Generate September 2025 data (30 days)
for (let day = 1; day <= 30; day++) {
  // Create date directly from ISO string to avoid timezone issues
  const dateStr = `2025-09-${day.toString().padStart(2, "0")}`;
  const date = new Date(dateStr + "T12:00:00.000Z"); // Use noon UTC to avoid timezone shifts

  const prayerTimes = new PrayerTimes(coordinates, date, tehranMethod);

  // Convert to Tehran timezone (Asia/Tehran, UTC+3:30)
  const timeZone = "Asia/Tehran";

  // Convert times to local timezone format with dynamic offset detection
  const formatTime = (time) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(time);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    const offset = offsetPart?.value.replace("GMT", "") || "+03:30";

    return (
      time.toLocaleString("sv-SE", { timeZone }).replace(" ", "T") + offset
    );
  };

  const testCase = {
    date: dateStr,
    input: {
      date: dateStr,
      method: "Tehran",
      coordinates: [35.6892, 51.389],
      timezone: timeZone,
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
  const fajr = prayerTimes.fajr
    .toLocaleTimeString("en-GB", { timeZone, hour12: false })
    .slice(0, 5);
  const isha = prayerTimes.isha
    .toLocaleTimeString("en-GB", { timeZone, hour12: false })
    .slice(0, 5);
  console.log(`${testCase.date}: Fajr ${fajr} | Isha ${isha}`);
}

// Create test data structure with schema v1.1.0 compliance
const testData = {
  metadata: {
    source: "Tehran Method Reference Implementation",
    authority: "Generated Reference Data (Not Official Authority)",
    official_url: "https://github.com/batoulapps/adhan-js",
    fetched_date: "2025-09-16",
    tier: 2,
    quality: "reference_validation",
    accuracy_target: "Reference implementation matching",
    data_year: "2025",
    method: "Tehran",
    coordinates: {
      latitude: 35.6892,
      longitude: 51.389,
    },
    timezone: "Asia/Tehran",
    location: "Tehran, Iran",
    asr_school: "Standard",
    data_count: testCases.length,
    notes:
      "Generated using adhan-js Tehran method (17.7°/14°/4.5°) for validation purposes",
  },
  testCases,
};

// Save to file
const outputPath = "./test-data/Tehran.json";
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`\n✅ Generated ${testCases.length} test cases`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(
  `🎯 Method: Tehran (Institute of Geophysics, University of Tehran)`
);
console.log(`📍 Location: Tehran, Iran`);
console.log(`🗓️ Period: September 2025`);
console.log(`🌍 Coordinates: [35.6892, 51.3890]`);
