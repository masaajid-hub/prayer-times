#!/usr/bin/env bun

/**
 * Create Turkey 2025 test file from official Diyanet data
 */

import fs from "fs";

const TURKEY_INPUT_FILE = "./test-data/input/ankara-turkey.txt";
const OUTPUT_FILE = "./test-data/Turkey.json";

/**
 * Parse Turkey 2025 data and create test file
 */
function createTurkeyTestFile() {
  console.log(
    "🇹🇷 Creating Turkey 2025 test file from official Diyanet data...\n"
  );

  const data = fs.readFileSync(TURKEY_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines
  for (const line of lines) {
    // Look for lines with date format DD.MM.YYYY
    if (line.match(/\d{2}\.\d{2}\.\d{4}/)) {
      const parts = line.split("\t").map((p) => p.trim());

      if (parts.length >= 7) {
        const dateStr = parts[0]; // DD.MM.YYYY format
        const hijriDate = parts[1];
        const fajr = parts[2];
        const sunrise = parts[3]; // "Sun" column
        const dhuhr = parts[4];
        const asr = parts[5];
        const maghrib = parts[6];
        const isha = parts[7];

        // Convert DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split(".");
        const fullDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        testCases.push({
          date: fullDate,
          hijri_date: hijriDate,
          input: {
            date: fullDate,
            coordinates: [39.925533, 32.866287], // Ankara coordinates
            method: "Turkey",
            timezone: "Europe/Istanbul",
            asrSchool: "Standard", // Turkey uses Standard Asr (confirmed via diagnostic analysis)
            highLatitudeRule: "NightMiddle",
          },
          expected: {
            fajr: convertTimeToISO(fullDate, fajr),
            syuruk: convertTimeToISO(fullDate, sunrise),
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
      source: "Turkey 2025 Official Prayer Times",
      authority: "Diyanet İşleri Başkanlığı (Turkish Religious Affairs)",
      official_url: "https://namazvakitleri.diyanet.gov.tr/en-US",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_government",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Turkey",
      coordinates: {
        latitude: 39.925533,
        longitude: 32.866287,
      },
      timezone: "Europe/Istanbul",
      location: "Ankara, Turkey",
      asr_school: "Standard",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Turkey test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(`   🏛️ Authority: Turkish Religious Affairs (Diyanet)`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Ankara, Turkey`);
  console.log(`   🕌 Asr School: Standard`);
}

/**
 * Convert 24-hour time to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr) {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);

    // Create date in local Turkey time (keep as local timezone)
    const localDateTime =
      dateStr + "T" + timeStr.padStart(5, "0") + ":00+03:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createTurkeyTestFile();
