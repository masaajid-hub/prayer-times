#!/usr/bin/env bun

/**
 * Create Saudi Arabia 2025 test file from official Umm Al-Qura data
 */

import fs from "fs";

const SAUDI_INPUT_FILE = "./test-data/input/riyadh-ummAlQura.txt";
const OUTPUT_FILE = "./test-data/UmmAlQura.json";

/**
 * Parse Saudi Arabia 2025 data and create test file
 */
function createSaudiTestFile() {
  console.log(
    "🇸🇦 Creating Saudi Arabia 2025 test file from official Umm Al-Qura data...\n"
  );

  const data = fs.readFileSync(SAUDI_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];
  let currentMonth = "08"; // Start with August

  // Process prayer time data lines (skip header lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header and empty lines
    if (
      line.includes("الهجري") ||
      line.includes("https://") ||
      line.includes("أوقات") ||
      line.includes("ربيع") ||
      !line
    ) {
      continue;
    }

    // Process data lines with tab separation
    const parts = line.split("\t").map((p) => p.trim());

    if (parts.length >= 7) {
      const hijriDay = parts[0]; // Hijri day number
      const gregorianDate = parts[1]; // e.g., "24 أغسطس", "1 سبتمبر"
      const fajr = parts[2];
      const sunrise = parts[3];
      const dhuhr = parts[4];
      const asr = parts[5];
      const maghrib = parts[6];
      const isha = parts[7];

      // Convert Arabic date to proper date format
      const dateResult = convertArabicDateToISO(gregorianDate, currentMonth);

      if (dateResult) {
        const fullDate = dateResult.date;
        currentMonth = dateResult.month; // Update current month for next iteration

        testCases.push({
          date: fullDate,
          hijri_day: hijriDay,
          gregorian_display: gregorianDate,
          input: {
            date: fullDate,
            coordinates: [24.7136, 46.6753], // Riyadh coordinates
            method: "UmmAlQura",
            timezone: "Asia/Riyadh",
            asrSchool: "Standard", // Saudi uses Standard/Shafi
            highLatitudeRule: "NightMiddle",
          },
          expected: {
            fajr: convertTimeToISO(fullDate, fajr, "fajr"),
            syuruk: convertTimeToISO(fullDate, sunrise, "sunrise"),
            dhuhr: convertTimeToISO(fullDate, dhuhr, "dhuhr"),
            asr: convertTimeToISO(fullDate, asr, "asr"),
            maghrib: convertTimeToISO(fullDate, maghrib, "maghrib"),
            isha: convertTimeToISO(fullDate, isha, "isha"),
          },
        });
      }
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "Saudi Arabia 2025 Official Prayer Times",
      authority: "Umm Al-Qura University, Saudi Arabia",
      official_url: "https://www.ummulqura.org.sa/index.aspx",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_current",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "UmmAlQura",
      coordinates: {
        latitude: 24.7136,
        longitude: 46.6753,
      },
      timezone: "Asia/Riyadh",
      location: "Riyadh, Saudi Arabia",
      asr_school: "Standard",
      hijri_month: "Rabi' al-Awwal 1447",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Saudi Arabia test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(`   🏛️ Authority: Umm Al-Qura University`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Riyadh, Saudi Arabia`);
  console.log(`   🕌 Asr School: Standard`);
  console.log(`   🌙 Hijri Month: Rabi' al-Awwal 1447`);
}

/**
 * Convert Arabic date to ISO format
 */
function convertArabicDateToISO(arabicDate, currentMonth = "08") {
  try {
    // Handle formats like "24 أغسطس", "1 سبتمبر", or just "25", "26"
    const arabicMonths = {
      أغسطس: "08", // August
      سبتمبر: "09", // September
      أكتوبر: "10", // October
      نوفمبر: "11", // November
      ديسمبر: "12", // December
      يناير: "01", // January
      فبراير: "02", // February
      مارس: "03", // March
      أبريل: "04", // April
      مايو: "05", // May
      يونيو: "06", // June
      يوليو: "07", // July
    };

    // Extract day and month
    const parts = arabicDate.split(" ");

    if (parts.length >= 2) {
      // Full format: "24 أغسطس"
      const day = parts[0];
      const monthArabic = parts[1];

      if (arabicMonths[monthArabic]) {
        const month = arabicMonths[monthArabic];
        const fullDate = `2025-${month}-${day.padStart(2, "0")}`;
        currentMonth = month; // Update current month for subsequent entries
        return { date: fullDate, month };
      }
    } else if (parts.length === 1 && /^\d+$/.test(parts[0])) {
      // Just day number: "25", "26", etc.
      const day = parts[0];

      // If day > 31 and current month is August, switch to September
      // August has 31 days, so days 29-31 are still August
      if (parseInt(day) > 31 && currentMonth === "08") {
        currentMonth = "09"; // Switch from August to September
      }

      const fullDate = `2025-${currentMonth}-${day.padStart(2, "0")}`;
      return { date: fullDate, month: currentMonth };
    }

    console.warn(`Could not parse Arabic date: ${arabicDate}`);
    return null;
  } catch (error) {
    console.warn(`Error parsing Arabic date: ${arabicDate}:`, error.message);
    return null;
  }
}

/**
 * Convert 24-hour time to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr, prayerType = "") {
  try {
    let [hours, minutes] = timeStr.split(":").map(Number);

    // Saudi data has afternoon/evening times in 12-hour format without PM indicator
    // Convert Asr, Maghrib, and Isha from 12-hour to 24-hour format
    if (
      (prayerType === "asr" ||
        prayerType === "maghrib" ||
        prayerType === "isha") &&
      hours < 12
    ) {
      hours += 12;
    }

    // Create date in local Riyadh time (keep as local timezone)
    const timeStr24 = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const localDateTime = dateStr + "T" + timeStr24 + ":00+03:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createSaudiTestFile();
