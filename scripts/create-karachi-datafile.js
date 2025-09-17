#!/usr/bin/env bun

/**
 * Generate Karachi method test data using adhan-js reference implementation
 * Karachi coordinates: 24.8607, 67.0011 (Karachi, Pakistan)
 */

import fs from "fs";
import adhan from "adhan";

const { CalculationMethod, PrayerTimes, Coordinates } = adhan;

console.log("🇵🇰 Creating Karachi 2025 test file from adhan-js reference...\n");

// Karachi coordinates
const coordinates = new Coordinates(24.8607, 67.0011);

// Karachi method from adhan-js
const karachiMethod = CalculationMethod.Karachi();

const testCases = [];

// Generate September 2025 data (30 days)
for (let day = 1; day <= 30; day++) {
  // Create date directly from ISO string to avoid timezone issues
  const dateStr = `2025-09-${day.toString().padStart(2, "0")}`;
  const date = new Date(dateStr + "T12:00:00.000Z"); // Use noon UTC to avoid timezone shifts

  const prayerTimes = new PrayerTimes(coordinates, date, karachiMethod);

  // Convert to Karachi timezone (Asia/Karachi, UTC+5)
  const timeZone = "Asia/Karachi";

  // Convert times to local timezone format
  const formatTime = (time) => {
    return (
      time.toLocaleString("sv-SE", { timeZone }).replace(" ", "T") + "+05:00"
    );
  };

  const testCase = {
    date: dateStr,
    input: {
      date: dateStr,
      method: "Karachi",
      coordinates: [24.8607, 67.0011],
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
  console.log(`${dateStr}: Fajr ${fajr} | Isha ${isha}`);
}

// Create test data structure
const testData = {
  metadata: {
    source: "Karachi Method Reference Implementation",
    authority: "Generated Reference Data (Not Official Authority)",
    official_url: "https://github.com/batoulapps/adhan-js",
    fetched_date: "2025-09-16",
    tier: 2,
    quality: "reference_validation",
    accuracy_target: "Reference implementation matching",
    data_year: "2025",
    method: "Karachi",
    coordinates: {
      latitude: 24.8607,
      longitude: 67.0011,
    },
    timezone: "Asia/Karachi",
    location: "Karachi, Pakistan",
    asr_school: "Standard",
    data_count: testCases.length,
    notes:
      "Generated using adhan-js Karachi method - University of Islamic Sciences, Karachi (18°/18°)",
  },
  testCases,
};

// Save to file
const outputPath = "./test-data/Karachi.json";
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`\n✅ Generated ${testCases.length} test cases`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`🎯 Method: Karachi (University of Islamic Sciences)`);
console.log(`📍 Location: Karachi, Pakistan`);
console.log(`🗓️ Period: September 2025`);
console.log(`🌍 Coordinates: [24.8607, 67.0011]`);
