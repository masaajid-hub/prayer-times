#!/usr/bin/env bun

/**
 * Create ISNA 2025 test file from official ISNA Canada data
 * Includes DST transition testing (March 9, 2025)
 */

import fs from "fs";

const ISNA_INPUT_FILE = "./test-data/input/mississauga-isna.txt";
const OUTPUT_FILE = "./test-data/ISNA.json";

/**
 * Parse ISNA 2025 data and create test file with DST handling
 */
function createISNATestFile() {
  console.log(
    "🇨🇦 Creating ISNA 2025 test file from official ISNA Canada data...\n"
  );

  const data = fs.readFileSync(ISNA_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and source info
    if (
      !line.includes(",") ||
      line.startsWith("Source:") ||
      line.startsWith("location:") ||
      line.startsWith("Note:")
    ) {
      continue;
    }

    const parts = line.split(",").map((p) => p.trim());

    if (parts.length >= 9) {
      const ramadanDay = parts[0];
      const dayName = parts[1];
      const dateStr = parts[2]; // "MAR 1" format
      const fajr = parts[3];
      const syuruq = parts[4]; // sunrise
      const dhuhr = parts[5];
      const asr = parts[6];
      const maghrib = parts[7];
      const isha = parts[8];

      // Convert "MAR 1" to "2025-03-01"
      const [monthStr, day] = dateStr.split(" ");
      const month = monthStr === "MAR" ? "03" : "03"; // All data is March
      const fullDate = `2025-${month}-${day.padStart(2, "0")}`;

      // Determine if this is before or after DST change
      const dayNum = parseInt(day);
      const isDST = dayNum >= 9; // DST starts March 9, 2025

      testCases.push({
        date: fullDate,
        ramadan_day: parseInt(ramadanDay),
        day_name: dayName,
        dst_active: isDST,
        input: {
          date: fullDate,
          coordinates: [43.5890432, -79.6441198], // Mississauga coordinates
          method: "ISNA",
          timezone: "America/Toronto", // Handles EST/EDT automatically
          asrSchool: "Standard", // ISNA uses Standard Asr
          highLatitudeRule: "NightMiddle",
        },
        expected: {
          fajr: convertTimeToISO(fullDate, fajr, isDST, "fajr"),
          syuruk: convertTimeToISO(fullDate, syuruq, isDST, "syuruk"),
          dhuhr: convertTimeToISO(fullDate, dhuhr, isDST, "dhuhr"),
          asr: convertTimeToISO(fullDate, asr, isDST, "asr"),
          maghrib: convertTimeToISO(fullDate, maghrib, isDST, "maghrib"),
          isha: convertTimeToISO(fullDate, isha, isDST, "isha"),
        },
      });
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "ISNA Canada 2025 Ramadan Prayer Times",
      authority: "Islamic Society of North America (ISNA)",
      official_url: "https://www.isnacanada.com/ramadhan",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_current",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "ISNA",
      coordinates: {
        latitude: 43.5890432,
        longitude: -79.6441198,
      },
      timezone: "America/Toronto",
      location: "Mississauga, Canada",
      asr_school: "Standard",
      dst_info: {
        dst_start: "2025-03-09",
        note: "Daylight Saving Time starts March 9, 2025 - perfect for testing timezone conversion",
      },
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ ISNA test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (Ramadan March)`);
  console.log(`   🏛️ Authority: ISNA Canada`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Mississauga, Canada`);
  console.log(`   🕌 Asr School: Standard`);
  console.log(`   ⏰ DST Feature: March 9 transition included`);

  // Show DST transition example
  const preDST = testCases.find((tc) => tc.date === "2025-03-08");
  const postDST = testCases.find((tc) => tc.date === "2025-03-09");

  console.log(`\n🔄 DST Transition Example:`);
  console.log(
    `   Mar 8 (EST): Fajr ${preDST?.expected.fajr} | Dhuhr ${preDST?.expected.dhuhr}`
  );
  console.log(
    `   Mar 9 (EDT): Fajr ${postDST?.expected.fajr} | Dhuhr ${postDST?.expected.dhuhr}`
  );
}

/**
 * Convert ISNA time format to ISO format with proper DST timezone offset
 * ISNA uses 12-hour format without AM/PM indicators:
 * - Fajr, Syuruq: AM (5:22, 6:55)
 * - Dhuhr: PM (12:36)
 * - Asr, Maghrib, Isha: PM (3:36, 6:11, 7:29)
 */
function convertTimeToISO(dateStr, timeStr, isDST, prayerType) {
  try {
    let [hours, minutes] = timeStr.split(":").map(Number);

    // Convert to 24-hour based on prayer type
    if (prayerType === "fajr" || prayerType === "syuruk") {
      // Early morning prayers: keep as AM
    } else if (prayerType === "dhuhr") {
      // Noon prayer: convert to PM (1:34 -> 13:34)
      if (hours !== 12) {
        hours += 12;
      }
    } else if (
      prayerType === "asr" ||
      prayerType === "maghrib" ||
      prayerType === "isha"
    ) {
      // Afternoon/evening prayers: convert to PM
      if (hours !== 12) {
        hours += 12;
      }
    }

    // Ensure 24-hour format
    const timeFormatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;

    // Create ISO string with dynamic timezone offset detection
    // Use a specific date/time in Toronto timezone to get the correct DST offset
    const testDateTime = new Date(`${dateStr}T12:00:00-05:00`); // Use noon EST as reference
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(testDateTime);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    const dynamicOffset =
      offsetPart?.value.replace("GMT", "") || (isDST ? "-04:00" : "-05:00");

    const localDateTime = `${dateStr}T${timeFormatted}${dynamicOffset}`;

    return localDateTime;
  } catch (error) {
    console.warn(
      `Failed to parse time: ${timeStr} for date ${dateStr} (${prayerType})`
    );
    return null;
  }
}

// Create the test file
createISNATestFile();
