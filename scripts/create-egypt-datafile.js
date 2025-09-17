#!/usr/bin/env bun

/**
 * Create Egypt 2025 test file from official Egyptian General Authority of Survey data
 * Source: Egyptian Survey Authority - Cairo prayer times for September 2025
 */

import fs from "fs";

const EGYPT_INPUT_FILE = "./test-data/input/cairo-egypt.txt";
const OUTPUT_FILE = "./test-data/Egypt.json";

/**
 * Parse Egypt 2025 data and create test file
 */
function createEgyptTestFile() {
  console.log(
    "🇪🇬 Creating Egypt 2025 test file from official Egyptian General Authority of Survey data...\n"
  );

  const data = fs.readFileSync(EGYPT_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines (skip header and metadata)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip metadata lines
    if (
      line.startsWith("---") ||
      line.startsWith("Source:") ||
      line.startsWith("Date Fetch:") ||
      line.startsWith("City:") ||
      line.startsWith("Method:") ||
      line.startsWith("latitude:") ||
      line.startsWith("Longitude:")
    ) {
      continue;
    }

    const parts = line.split(",").map((p) => p.trim());

    if (parts.length >= 8) {
      const city = parts[0]; // Cairo
      const gregorianDate = parts[1]; // 2025-09-01
      const hijriDate = parts[2]; // 9 Rabi' al-awwal 1447
      const fajr = parts[3]; // 5:02 AM
      const sunrise = parts[4]; // 6:32 AM
      const dhuhr = parts[5]; // 12:55 PM
      const asr = parts[6]; // 4:29 PM
      const maghrib = parts[7]; // 7:17 PM
      const isha = parts[8]; // 8:37 PM

      testCases.push({
        date: gregorianDate,
        hijri_date: hijriDate,
        input: {
          date: gregorianDate,
          coordinates: [30.0312784, 31.2125945], // Cairo coordinates from source
          method: "Egypt",
          timezone: "Africa/Cairo", // Cairo timezone
          asrSchool: "Standard", // Egypt uses Standard Asr
          highLatitudeRule: "NightMiddle",
        },
        expected: {
          fajr: convertTimeToISO(gregorianDate, fajr, "Africa/Cairo"),
          syuruk: convertTimeToISO(gregorianDate, sunrise, "Africa/Cairo"),
          dhuhr: convertTimeToISO(gregorianDate, dhuhr, "Africa/Cairo"),
          asr: convertTimeToISO(gregorianDate, asr, "Africa/Cairo"),
          maghrib: convertTimeToISO(gregorianDate, maghrib, "Africa/Cairo"),
          isha: convertTimeToISO(gregorianDate, isha, "Africa/Cairo"),
        },
      });
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "Egyptian General Authority of Survey 2025",
      authority: "Egyptian General Authority of Survey (ESA)",
      official_url: "https://www.esa.gov.eg/monthlymwaket.aspx",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_current",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Egypt",
      coordinates: {
        latitude: 30.0312784,
        longitude: 31.2125945,
      },
      timezone: "Africa/Cairo",
      location: "Cairo, Egypt",
      asr_school: "Standard",
      notes: "Official prayer times from Egyptian Survey Authority for Cairo",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Egypt test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data period: September 1-30, 2025`);
  console.log(`   🏛️ Authority: Egyptian General Authority of Survey`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Cairo, Egypt`);
  console.log(`   🕌 Method: Egypt (Egyptian General Authority)`);
  console.log(`   🌍 Coverage: Africa/Middle East region`);

  // Show sample times
  const sampleCase = testCases[0];
  console.log(`\n📋 Sample (Sept 1):`);
  console.log(`   Hijri:   ${sampleCase.hijri_date}`);
  console.log(`   Fajr:    ${sampleCase.expected.fajr}`);
  console.log(`   Syuruk:  ${sampleCase.expected.syuruk}`);
  console.log(`   Dhuhr:   ${sampleCase.expected.dhuhr}`);
  console.log(`   Asr:     ${sampleCase.expected.asr}`);
  console.log(`   Maghrib: ${sampleCase.expected.maghrib}`);
  console.log(`   Isha:    ${sampleCase.expected.isha}`);
}

/**
 * Convert 12-hour time format to local timezone format with offset
 * Egypt times are provided in local time, need to determine correct offset for September 2025
 */
function convertTimeToISO(dateStr, timeStr, timezone) {
  try {
    // Parse 12-hour format (e.g., "5:02 AM", "4:29 PM")
    const [time, meridian] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format
    if (meridian === "AM") {
      if (hours === 12) hours = 0;
    } else if (meridian === "PM") {
      if (hours !== 12) hours += 12;
    }

    // Determine correct timezone offset for Cairo in September 2025
    // Cairo uses DST, so September should be UTC+3 (not UTC+2)
    const testDate = new Date(dateStr);
    const cairoTime = testDate.toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      timeZoneName: "longOffset",
    });

    // September 2025: Cairo is in daylight saving time (UTC+3)
    const offset = "+03:00";

    // Create local time with correct timezone offset
    const timeFormatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
    const localDateTime = `${dateStr}T${timeFormatted}${offset}`;

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createEgyptTestFile();
