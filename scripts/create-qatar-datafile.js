#!/usr/bin/env bun

/**
 * Create Qatar 2025 test file from the official qatarch.com data
 */

import fs from "fs";

const QATAR_INPUT_FILE = "./test-data/input/doha-qatar.txt";
const OUTPUT_FILE = "./test-data/Qatar.json";

/**
 * Parse Qatar 2025 data and create test file
 */
function createQatarTestFile() {
  console.log("🇶🇦 Creating Qatar 2025 test file from official data...\n");

  const data = fs.readFileSync(QATAR_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines
  for (const line of lines) {
    if (line.includes("\t") && line.match(/\d{2}\/\d{2}/)) {
      const parts = line.split("\t").map((p) => p.trim());

      if (parts.length >= 8) {
        const dateStr = parts[2]; // MM/DD format
        const fajr = parts[3];
        const sunrise = parts[4];
        const dhuhr = parts[5];
        const asr = parts[6];
        const maghrib = parts[7];
        const isha = parts[8];

        // Convert MM/DD to full date (2025)
        const [month, day] = dateStr.split("/");
        const fullDate = `2025-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        testCases.push({
          date: fullDate,
          input: {
            date: fullDate,
            coordinates: [25.283897, 51.52877], // Doha coordinates
            method: "Qatar",
            timezone: "Asia/Qatar",
            asrSchool: "Standard",
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
      source: "Qatar 2025 Official Ramadan Calendar",
      authority: "Qatar Architecture & Heritage",
      official_url: "https://www.qatarch.com/ramadan",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_current",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Qatar",
      coordinates: {
        latitude: 25.283897,
        longitude: 51.52877,
      },
      timezone: "Asia/Qatar",
      location: "Doha, Qatar",
      asr_school: "Standard",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Qatar test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(`   🏛️ Authority: Qatar Architecture & Heritage`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Doha, Qatar`);
}

/**
 * Convert 24-hour time to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr) {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);

    // Create date in local Qatar time (keep as local timezone)
    const localDateTime =
      dateStr + "T" + timeStr.padStart(5, "0") + ":00+03:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createQatarTestFile();
