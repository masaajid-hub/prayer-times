#!/usr/bin/env bun

/**
 * Create Russia test file from Moscow official prayer times
 * Source: https://voshod-solnca.ru/prayer/москва
 * Method: Russia (Spiritual Administration of Muslims in Russia)
 */

import fs from "fs";

const INPUT_FILE = "./test-data/input/russia.txt";
const OUTPUT_FILE = "./test-data/Russia.json";
const LOCATION = "Moscow, Russia";
const COORDINATES = [55.752, 37.616]; // Moscow coordinates
const TIMEZONE = "Europe/Moscow";

/**
 * Parse Russia time data and create test file
 */
function createRussiaTestFile() {
  console.log(
    "🇷🇺 Creating Russia 2025 test file from Moscow official data...\n"
  );

  const fileContent = fs.readFileSync(INPUT_FILE, "utf-8");
  const lines = fileContent
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        !line.startsWith("---") &&
        !line.startsWith("Source:") &&
        !line.startsWith("Date") &&
        !line.startsWith("City:") &&
        !line.startsWith("Method:") &&
        !line.startsWith("latitude:") &&
        !line.startsWith("Longitude:")
    );

  const testCases = [];
  let processedCount = 0;

  // Skip header line and process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes("ax`x")) continue; // Skip corrupted lines

    const parts = line.split(",");
    if (parts.length < 10) continue; // Skip incomplete lines

    const dateStr = parts[0]; // 2025-09-15
    const fajrTime = parts[2]; // 3:49
    const sunriseTime = parts[3]; // 6:01
    const dhuhrTime = parts[4]; // 12:24
    const asrTime = parts[5]; // 15:48
    const maghribTime = parts[7]; // 18:46 (using maghrib, not sunset)
    const ishaTime = parts[8]; // 20:49

    // Convert times to ISO format with Moscow timezone
    // Moscow is UTC+3 year-round (no DST since 2014)
    const offset = "+03:00";

    const fajr = convertToISO(dateStr, fajrTime, offset);
    const sunrise = convertToISO(dateStr, sunriseTime, offset);
    const dhuhr = convertToISO(dateStr, dhuhrTime, offset);
    const asr = convertToISO(dateStr, asrTime, offset);
    const maghrib = convertToISO(dateStr, maghribTime, offset);
    const isha = convertToISO(dateStr, ishaTime, offset);

    const testCase = {
      date: dateStr,
      input: {
        date: dateStr,
        coordinates: COORDINATES,
        method: "Russia",
        timezone: TIMEZONE,
        asrSchool: "Standard",
        highLatitudeRule: "NightMiddle",
      },
      expected: {
        fajr,
        syuruk: sunrise,
        dhuhr,
        asr,
        maghrib,
        isha,
      },
    };

    testCases.push(testCase);
    processedCount++;

    console.log(`${dateStr}: Fajr ${fajrTime} | Isha ${ishaTime}`);
  }

  // Create the output structure
  const output = {
    metadata: {
      source: "russia_2025_moscow_official",
      authority: "Spiritual Administration of Muslims in Russia",
      official_url: "https://voshod-solnca.ru/prayer/москва",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_current",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Russia",
      coordinates: {
        latitude: COORDINATES[0],
        longitude: COORDINATES[1],
      },
      timezone: TIMEZONE,
      location: LOCATION,
      asr_school: "Standard",
      data_count: testCases.length,
      notes:
        "Official prayer times from Moscow Islamic authority with high latitude adjustments (16°/15° angles, +2/-2 min adjustments)",
    },
    testCases,
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n✅ Generated ${testCases.length} test cases`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log(`🎯 Method: Russia (High latitude method)`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log(`🗓️ Period: September-October 2025`);
  console.log(`🌍 Coordinates: [${COORDINATES[0]}, ${COORDINATES[1]}]`);
}

/**
 * Convert date and time to ISO string with timezone
 */
function convertToISO(dateStr, timeStr, offset) {
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Return local time with timezone offset (not UTC)
  const paddedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  return `${dateStr}T${paddedTime}${offset}`;
}

// Run the script
createRussiaTestFile();
