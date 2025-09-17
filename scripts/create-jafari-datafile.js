#!/usr/bin/env bun

/**
 * Generate Jafari method test data using adhan-js reference implementation
 * Najaf coordinates: 32.0000, 44.3500 (Najaf, Iraq - traditional Shia scholarship center)
 */

import fs from "fs";
import adhan from "adhan";

const { CalculationMethod, PrayerTimes, Coordinates } = adhan;

console.log("🇮🇶 Creating Jafari 2025 test file from adhan-js reference...\n");

// Najaf coordinates (center of Shia scholarship)
const coordinates = new Coordinates(32.0, 44.35);

// Create custom Jafari method using adhan-js
const jafariMethod = CalculationMethod.Other();
jafariMethod.fajrAngle = 16;
jafariMethod.ishaAngle = 14;
jafariMethod.maghribAngle = 4; // 4 degrees after sunset (not fixed time)

const testCases = [];

// Generate September 2025 data (30 days)
for (let day = 1; day <= 30; day++) {
  // Create date directly from ISO string to avoid timezone issues
  const dateStr = `2025-09-${day.toString().padStart(2, "0")}`;
  const date = new Date(dateStr + "T12:00:00.000Z"); // Use noon UTC to avoid timezone shifts

  const prayerTimes = new PrayerTimes(coordinates, date, jafariMethod);

  // Convert to Iraq timezone (Asia/Baghdad, UTC+3)
  const timeZone = "Asia/Baghdad";

  // Convert times to local timezone format with dynamic offset detection
  const formatTime = (time) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(time);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    const offset = offsetPart?.value.replace("GMT", "") || "+03:00";

    return (
      time.toLocaleString("sv-SE", { timeZone }).replace(" ", "T") + offset
    );
  };

  const testCase = {
    date: dateStr,
    input: {
      date: dateStr,
      method: "Jafari",
      coordinates: [32.0, 44.35],
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
    source: "Jafari Method Reference Implementation",
    authority: "Generated Reference Data (Not Official Authority)",
    official_url: "https://github.com/batoulapps/adhan-js",
    fetched_date: "2025-09-16",
    tier: 2,
    quality: "reference_validation",
    accuracy_target: "Reference implementation matching",
    data_year: "2025",
    method: "Jafari",
    coordinates: {
      latitude: 32.0,
      longitude: 44.35,
    },
    timezone: "Asia/Baghdad",
    location: "Najaf, Iraq",
    asr_school: "Standard",
    data_count: testCases.length,
    notes:
      "Generated using adhan-js custom Jafari method (16°/14°/4°) for validation purposes",
  },
  testCases,
};

// Save to file
const outputPath = "./test-data/Jafari.json";
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`\n✅ Generated ${testCases.length} test cases`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`🎯 Method: Jafari (Traditional Shia jurisprudence)`);
console.log(`📍 Location: Najaf, Iraq`);
console.log(`🗓️ Period: September 2025`);
console.log(`🌍 Coordinates: [32.0000, 44.3500]`);
