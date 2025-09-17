#!/usr/bin/env bun

/**
 * Create Kelantan 2025 test file from official JAKIM KN data
 */

import fs from "fs";

const KELANTAN_INPUT_FILE = "./test-data/input/kelantan_JAKIMKN.csv";
const OUTPUT_FILE = "./test-data/JAKIMKN.json";

/**
 * Parse Kelantan 2025 data and create test file
 */
function createKelantanTestFile() {
  console.log(
    "🇲🇾 Creating Kelantan 2025 test file from official JAKIM KN data...\n"
  );

  const data = fs.readFileSync(KELANTAN_INPUT_FILE, "utf8");
  const lines = data.split("\n").filter((line) => line.trim());

  const testCases = [];

  // Process CSV data lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line) {
      const parts = line.split(",");

      if (parts.length >= 10) {
        const tarikhMiladi = parts[0]; // DD-MMM-YYYY format
        const tarikhHijri = parts[1]; // Hijri date
        const hari = parts[2]; // Day name in Malay
        const imsak = parts[3]; // Imsak time
        const subuh = parts[4]; // Fajr time
        const syuruk = parts[5]; // Sunrise time
        const zohor = parts[6]; // Dhuhr time
        const asar = parts[7]; // Asr time
        const maghrib = parts[8]; // Maghrib time
        const isyak = parts[9]; // Isha time

        // Convert DD-MMM-YYYY to YYYY-MM-DD
        const fullDate = convertDateToISO(tarikhMiladi);

        if (fullDate) {
          testCases.push({
            date: fullDate,
            hijri_date: tarikhHijri,
            day_name: hari,
            input: {
              date: fullDate,
              coordinates: [6.0178669, 101.9659934], // Rantau Panjang, Kelantan coordinates
              method: "JAKIMKN",
              timezone: "Asia/Kuala_Lumpur",
              asrSchool: "Standard", // Malaysia typically uses Standard/Shafi
              highLatitudeRule: "NightMiddle",
            },
            expected: {
              fajr: convertTimeToISO(fullDate, subuh),
              syuruk: convertTimeToISO(fullDate, syuruk),
              dhuhr: convertTimeToISO(fullDate, zohor),
              asr: convertTimeToISO(fullDate, asar),
              maghrib: convertTimeToISO(fullDate, maghrib),
              isha: convertTimeToISO(fullDate, isyak),
            },
          });
        }
      }
    }
  }

  // Create test file structure
  const testFile = {
    metadata: {
      source: "Kelantan 2025 Official Prayer Times",
      authority: "Jabatan Kemajuan Islam Malaysia (JAKIM) - Kelantan",
      official_url: "https://www.jakim.gov.my/",
      fetched_date: "2025-09-15",
      tier: 1,
      quality: "official_government",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "JAKIMKN",
      coordinates: {
        latitude: 6.0178669,
        longitude: 101.9659934,
      },
      timezone: "Asia/Kuala_Lumpur",
      location: "Rantau Panjang, Kelantan, Malaysia",
      asr_school: "Standard",
      reference_coordinates: "6°01'04.3\" N, 101°57'57.6\" E",
      data_count: testCases.length,
    },
    testCases,
  };

  // Write test file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

  console.log("✅ Kelantan test file created:");
  console.log(`   📁 File: ${OUTPUT_FILE}`);
  console.log(`   📊 Test cases: ${testCases.length}`);
  console.log(`   📅 Data year: 2025 (current)`);
  console.log(`   🏛️ Authority: Jabatan Kemajuan Islam Malaysia (JAKIM) - Kelantan`);
  console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
  console.log(`   📍 Location: Rantau Panjang, Kelantan, Malaysia`);
  console.log(`   🕌 Asr School: Standard`);
  console.log(`   📐 Coordinates: 6°01'04.3\" N, 101°57'57.6\" E`);
}

/**
 * Convert date string from DD-MMM-YYYY to YYYY-MM-DD
 */
function convertDateToISO(dateStr) {
  try {
    // Handle format like "01-Sep-2025"
    const [day, month, year] = dateStr.split("-");

    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const monthNum = monthMap[month];
    if (!monthNum) {
      console.warn(`Unknown month: ${month}`);
      return null;
    }

    return `${year}-${monthNum}-${day.padStart(2, "0")}`;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`);
    return null;
  }
}

/**
 * Convert 12-hour time to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr) {
  try {
    const cleanTime = timeStr.trim();

    // Handle format like "5:53 am" or "1:21 pm"
    const [time, period] = cleanTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let adjustedHours = hours;
    if (period.toLowerCase() === "pm" && hours !== 12) {
      adjustedHours += 12;
    } else if (period.toLowerCase() === "am" && hours === 12) {
      adjustedHours = 0;
    }

    // Create date in local Malaysia time (keep as local timezone)
    const timeStr24 = `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const localDateTime = dateStr + "T" + timeStr24 + ":00+08:00";

    return localDateTime;
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr} for date ${dateStr}`);
    return null;
  }
}

// Create the test file
createKelantanTestFile();