#!/usr/bin/env bun

/**
 * Create Singapore 2025 test file from official MUIS data
 */

import fs from "fs";

const SINGAPORE_INPUT_FILE = "./test-data/input/singapore.txt";
const OUTPUT_FILE = "./test-data/Singapore.json";

/**
 * Parse Singapore 2025 data and create test file
 */
function createSingaporeTestFile() {
  console.log(
    "🇸🇬 Creating Singapore 2025 test file from official MUIS data...\n"
  );

  const data = fs.readFileSync(SINGAPORE_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process prayer time data lines (skip header lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header and source lines
    if (
      line.includes("PRAYER TIMES") ||
      line.includes("YEAR") ||
      line.includes("SEPTEMBER") ||
      line.includes("Date Day") ||
      line.includes("source") ||
      !line
    ) {
      continue;
    }

    // Process data lines with date format D/M/YYYY
    if (line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
      const parts = line.split(/\s+/); // Split by whitespace

      if (parts.length >= 8) {
        const dateStr = parts[0]; // D/M/YYYY format
        const dayName = parts[1]; // Mon, Tues, etc.
        const subuh = parts[2] + " " + parts[3]; // "5 44"
        const syuruk = parts[4] + " " + parts[5]; // "7 01" (sunrise)
        const zohor = parts[6] + " " + parts[7]; // "1 07" or "12 59"
        const asar = parts[8] + " " + parts[9]; // "4 18"
        const maghrib = parts[10] + " " + parts[11]; // "7 10" (maghrib - NOT sunset)
        const isyak = parts[12] + " " + parts[13]; // "8 19"

        // Convert D/M/YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split("/");
        const fullDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        testCases.push({
          date: fullDate,
          day_name: dayName,
          input: {
            date: fullDate,
            coordinates: [1.3521, 103.8198], // Singapore coordinates
            method: "Singapore",
            timezone: "Asia/Singapore",
            asrSchool: "Standard", // Singapore typically uses Standard/Shafi
            highLatitudeRule: "NightMiddle",
          },
          expected: {
            fajr: convertTimeToISO(fullDate, subuh, "fajr"),
            syuruk: convertTimeToISO(fullDate, syuruk, "syuruk"),
            dhuhr: convertTimeToISO(fullDate, zohor, "dhuhr"),
            asr: convertTimeToISO(fullDate, asar, "asr"),
            maghrib: convertTimeToISO(fullDate, maghrib, "maghrib"),
            isha: convertTimeToISO(fullDate, isyak, "isha"),
          },
        });
      }
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "Singapore 2025 Official Prayer Times",
      authority: "Majlis Ugama Islam Singapura (MUIS)",
      official_url: "https://www.muis.gov.sg/",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_government",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Singapore",
      coordinates: {
        latitude: 1.3521,
        longitude: 103.8198,
      },
      timezone: "Asia/Singapore",
      location: "Singapore",
      asr_school: "Standard",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Singapore test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(`   🏛️ Authority: Majlis Ugama Islam Singapura (MUIS)`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Singapore`);
  console.log(`   🕌 Asr School: Standard`);
}

/**
 * Convert Singapore time format to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr, prayerType = "") {
  try {
    const parts = timeStr.trim().split(" ");
    let hours, minutes;

    if (parts.length === 2) {
      // Format: "5 44" or "12 59"
      hours = parseInt(parts[0]);
      minutes = parseInt(parts[1]);

      // Singapore data uses abbreviated format for some afternoon prayers
      if (prayerType === "dhuhr" && hours === 1) {
        // "1 07" means 13:07 (1:07 PM) - Zohor time
        hours = 13;
      } else if (prayerType === "asr" && hours >= 3 && hours <= 5) {
        // "3 59" or "4 18" means 15:59 or 16:18 (3:59 PM or 4:18 PM) - Asar time
        hours += 12;
      } else if (prayerType === "maghrib" && hours >= 6 && hours <= 8) {
        // "7 10" means 19:10 (7:10 PM) - Maghrib time
        hours += 12;
      } else if (prayerType === "isha" && hours >= 7 && hours < 12) {
        // "8 18" means 20:18 (8:18 PM) - Isha time
        hours += 12;
      } else if (prayerType === "isha" && hours === 12) {
        // "12 18" means 00:18 (12:18 AM next day) - Isha time
        hours = 0;
      }
      // Syuruk (sunrise) is already in correct AM format
    } else {
      console.warn(`Unexpected time format: ${timeStr}`);
      return null;
    }

    // Create date in local Singapore time (keep as local timezone)
    const timeStr24 = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const localDateTime = dateStr + "T" + timeStr24 + ":00+08:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createSingaporeTestFile();
