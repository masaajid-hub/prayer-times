#!/usr/bin/env bun

/**
 * Create UAE 2025 test file from official General Authority of Islamic Affairs & Endowments data
 */

import fs from "fs";

const UAE_INPUT_FILE = "./test-data/input/dubai-uae.txt";
const OUTPUT_FILE = "./test-data/Dubai.json";

/**
 * Parse UAE 2025 data and create test file
 */
function createUAETestFile() {
  console.log("🇦🇪 Creating UAE 2025 test file from official Awqaf data...\n");

  const data = fs.readFileSync(UAE_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines (skip header line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip non-data lines
    if (
      line.includes("Gen.Authority") ||
      line.includes("United Arab") ||
      line.includes("PrayerListing")
    ) {
      continue;
    }

    // Look for lines with date format M/D/YYYY
    if (line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
      const parts = line.split(/\s+/); // Split by whitespace

      if (parts.length >= 8) {
        const dayName = parts[0]; // Monday, Tuesday, etc.
        const dateStr = parts[1]; // M/D/YYYY format
        const hijriDate = parts[2]; // Hijri date
        const fajr = parts[3] + " " + parts[4]; // "04:40 AM"
        const shurooq = parts[5] + " " + parts[6]; // "05:56 AM" (sunrise)
        const dhuhr = parts[7] + " " + parts[8]; // "12:22 PM"
        const asr = parts[9] + " " + parts[10]; // "03:49 PM"
        const maghrib = parts[11] + " " + parts[12]; // "06:41 PM"
        const isha = parts[13] + " " + parts[14]; // "07:57 PM"

        // Convert M/D/YYYY to YYYY-MM-DD
        const [month, day, year] = dateStr.split("/");
        const fullDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        testCases.push({
          date: fullDate,
          day_name: dayName,
          hijri_date: hijriDate,
          input: {
            date: fullDate,
            coordinates: [25.276987, 55.296249], // Dubai coordinates
            method: "Dubai",
            timezone: "Asia/Dubai",
            asrSchool: "Standard", // UAE typically uses Standard/Shafi
            highLatitudeRule: "NightMiddle",
          },
          expected: {
            fajr: convertTimeToISO(fullDate, fajr),
            syuruk: convertTimeToISO(fullDate, shurooq),
            dhuhr: convertTimeToISO(fullDate, dhuhr),
            asr: convertTimeToISO(fullDate, asr),
            maghrib: convertTimeToISO(fullDate, maghrib),
            isha: convertTimeToISO(fullDate, isha),
          },
        });
      }
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "UAE 2025 Official Prayer Times",
      authority: "General Authority of Islamic Affairs & Endowments, UAE",
      official_url: "https://www.awqaf.gov.ae/prayer-times",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_government",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Dubai",
      coordinates: {
        latitude: 25.276987,
        longitude: 55.296249,
      },
      timezone: "Asia/Dubai",
      location: "Dubai, UAE",
      asr_school: "Standard",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ UAE test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(
    `   🏛️ Authority: General Authority of Islamic Affairs & Endowments`
  );
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Dubai, UAE`);
  console.log(`   🕌 Asr School: Standard`);
}

/**
 * Convert 12-hour time to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr) {
  try {
    const [time, period] = timeStr.trim().split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let adjustedHours = hours;
    if (period === "PM" && hours !== 12) {
      adjustedHours += 12;
    } else if (period === "AM" && hours === 12) {
      adjustedHours = 0;
    }

    // Create date in local UAE time (keep as local timezone)
    const timeStr24 = `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const localDateTime = dateStr + "T" + timeStr24 + ":00+04:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createUAETestFile();
