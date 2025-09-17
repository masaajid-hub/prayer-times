#!/usr/bin/env bun

/**
 * Fetch London 2025 prayer times from moonsighting.com API
 * Create test file from official moonsighting committee data
 */

import fs from "fs";

const OUTPUT_FILE = "./test-data/Moonsighting.json";
const RAW_OUTPUT_FILE = "./test-data/input/london-moonsighting.json";

// London coordinates provided by user
const LONDON_COORDS = {
  latitude: 51.509865,
  longitude: -0.118092,
  timezone: "Europe/London",
};

/**
 * Fetch prayer times from moonsighting.com API
 */
async function fetchMoonsightingData() {
  console.log(
    "🌙 Fetching London 2025 prayer times from moonsighting.com API...\n"
  );

  const apiUrl = `https://www.moonsighting.com/time_json.php?year=2025&tz=${LONDON_COORDS.timezone}&lat=${LONDON_COORDS.latitude}&lon=${LONDON_COORDS.longitude}&method=0&both=false&time=0`;

  console.log("📡 API URL:", apiUrl);
  console.log("🔍 Method: Hanafi general (method=0)");
  console.log("⏰ Time format: 24-hour (time=0)");
  console.log("📍 Location: London, UK");
  console.log(
    "🌐 Coordinates:",
    `${LONDON_COORDS.latitude}, ${LONDON_COORDS.longitude}`
  );
  console.log("");

  try {
    console.log("⏳ Fetching data from API...");

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData = await response.json();
    console.log("✅ Successfully fetched data from moonsighting.com API");

    // Save raw API response
    if (!fs.existsSync("./test-data/input")) {
      fs.mkdirSync("./test-data/input", { recursive: true });
    }
    fs.writeFileSync(RAW_OUTPUT_FILE, JSON.stringify(apiData, null, 2));
    console.log(`📄 Raw API data saved to: ${RAW_OUTPUT_FILE}`);

    return apiData;
  } catch (error) {
    console.error("❌ Failed to fetch from primary API:", error.message);
    console.log("\n🔄 Trying backup API...");

    // Try backup API
    const backupUrl = `https://moonsighting.ahmedbukhamsin.sa/time_json.php?year=2025&tz=${LONDON_COORDS.timezone}&lat=${LONDON_COORDS.latitude}&lon=${LONDON_COORDS.longitude}&method=0&both=false&time=0`;

    try {
      const backupResponse = await fetch(backupUrl);
      if (!backupResponse.ok) {
        throw new Error(`HTTP error! status: ${backupResponse.status}`);
      }

      const backupData = await backupResponse.json();
      console.log("✅ Successfully fetched from backup API");

      // Save raw API response
      fs.writeFileSync(RAW_OUTPUT_FILE, JSON.stringify(backupData, null, 2));
      console.log(`📄 Raw API data saved to: ${RAW_OUTPUT_FILE}`);

      return backupData;
    } catch (backupError) {
      console.error("❌ Backup API also failed:", backupError.message);
      throw new Error("Both primary and backup APIs failed");
    }
  }
}

/**
 * Convert API data to our test file format
 */
function convertToTestFormat(apiData) {
  console.log("\n🔄 Converting API data to test format...");

  if (!apiData || !apiData.times || !Array.isArray(apiData.times)) {
    throw new Error("Invalid API data format - expected times array");
  }

  const testCases = [];

  for (const dayEntry of apiData.times) {
    // Parse the day string "Jan 01 Wed" to create proper date
    const dayStr = dayEntry.day;
    const times = dayEntry.times;

    // Extract date from "Jan 01 Wed" format
    const [month, day, dayName] = dayStr.split(" ");
    const monthNum = getMonthNumber(month);
    const fullDate = `2025-${monthNum.toString().padStart(2, "0")}-${day.padStart(2, "0")}`;

    testCases.push({
      date: fullDate,
      day_name: dayName,
      input: {
        date: fullDate,
        coordinates: [LONDON_COORDS.latitude, LONDON_COORDS.longitude],
        method: "Moonsighting",
        timezone: LONDON_COORDS.timezone,
        asrSchool: "Hanafi", // moonsighting.com method 0 is Hanafi
        highLatitudeRule: "NightMiddle",
      },
      expected: {
        fajr: convertTimeToISO(fullDate, times.fajr),
        syuruk: convertTimeToISO(fullDate, times.sunrise),
        dhuhr: convertTimeToISO(fullDate, times.dhuhr),
        asr: convertTimeToISO(fullDate, times.asr), // Use regular asr, not asr_h or asr_s
        maghrib: convertTimeToISO(fullDate, times.maghrib),
        isha: convertTimeToISO(fullDate, times.isha),
      },
    });
  }

  const testFile = {
    metadata: {
      source: "London 2025 Moonsighting Committee Prayer Times",
      authority: "Moonsighting.com (UK Islamic Moonsighting Committee)",
      official_url: "https://www.moonsighting.com",
      fetched_date: new Date().toISOString().split("T")[0],
      tier: 1,
      quality: "official_committee",
      accuracy_target: "±1 minute",
      data_year: "2025",
      method: "Moonsighting",
      coordinates: {
        latitude: LONDON_COORDS.latitude,
        longitude: LONDON_COORDS.longitude,
      },
      timezone: LONDON_COORDS.timezone,
      location: "London, United Kingdom",
      asr_school: "Hanafi",
      data_count: testCases.length,
      api_method: "Hanafi general (method=0)",
      notes: "Fetched directly from moonsighting.com official API",
    },
    testCases,
  };

  return testFile;
}

/**
 * Convert month name to number
 */
function getMonthNumber(monthName) {
  const months = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  return months[monthName] || 1;
}

/**
 * Convert time string to ISO format in local timezone
 */
function convertTimeToISO(dateStr, timeStr) {
  if (!timeStr || timeStr === "") {
    return null;
  }

  try {
    // Handle different time formats from the API
    const cleanTime = timeStr.toString().trim();
    let hours, minutes;

    // If time includes colon, assume HH:MM format
    if (cleanTime.includes(":")) {
      [hours, minutes] = cleanTime.split(":").map(Number);
    }
    // If time is just numbers, assume HHMM format
    else if (/^\d{3,4}$/.test(cleanTime)) {
      const timeNum = parseInt(cleanTime);
      hours = Math.floor(timeNum / 100);
      minutes = timeNum % 100;
    } else {
      console.warn(`Unexpected time format: ${timeStr}`);
      return null;
    }

    // Create date in local London time with dynamic timezone detection
    const timeStr24 = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Use dynamic timezone offset detection for London
    const testDateTime = new Date(`${dateStr}T12:00:00+00:00`); // Use noon GMT as reference
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/London",
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(testDateTime);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    const dynamicOffset = offsetPart?.value.replace("GMT", "") || "+00:00";

    const localDateTime = dateStr + "T" + timeStr24 + ":00" + dynamicOffset;

    return localDateTime;
  } catch (error) {
    console.warn(
      `Failed to parse time: ${timeStr} for date ${dateStr}:`,
      error.message
    );
    return null;
  }
}

/**
 * Main function
 */
async function createLondonTestFile() {
  try {
    // Fetch data from API
    const apiData = await fetchMoonsightingData();
    console.log(
      `📊 Received ${Array.isArray(apiData) ? apiData.length : "unknown"} days of data`
    );

    // Convert to test format
    const testFile = convertToTestFormat(apiData);

    // Write test file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testFile, null, 2));

    console.log("\n✅ London test file created:");
    console.log(`   📁 File: ${OUTPUT_FILE}`);
    console.log(`   📊 Test cases: ${testFile.testCases.length}`);
    console.log(`   📅 Data year: 2025 (current)`);
    console.log(`   🏛️ Authority: UK Islamic Moonsighting Committee`);
    console.log(`   🎯 Accuracy: ±1 minute (Tier 1 official)`);
    console.log(`   📍 Location: London, United Kingdom`);
    console.log(`   🕌 Asr School: Hanafi`);
    console.log(`   🌙 Method: Moonsighting Committee calculations`);
  } catch (error) {
    console.error("\n❌ Failed to create London test file:", error.message);
    console.error(
      "💡 This might be due to API access issues or changes in API format"
    );
    process.exit(1);
  }
}

// Run the script
createLondonTestFile();
