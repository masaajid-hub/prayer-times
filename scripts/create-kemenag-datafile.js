#!/usr/bin/env bun

/**
 * Create Kemenag method test file from Jakarta official data
 * Source: Kementerian Agama Indonesia (bimasislam.kemenag.go.id)
 */

import fs from "fs";

console.log(
  "🇮🇩 Creating Kemenag 2025 test file from Jakarta official data...\n"
);

// Read the Jakarta Kemenag data
const rawData = fs.readFileSync(
  "./test-data/input/jakarta-kemenag.txt",
  "utf8"
);
const lines = rawData.split("\n");

// Jakarta coordinates
const coordinates = [-6.2297209, 106.664705]; // Fixed longitude (was incorrect in source)

const testCases = [];

// Process each line (skip header and empty lines)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();

  if (
    line &&
    !line.startsWith("---") &&
    !line.startsWith("Source:") &&
    !line.startsWith("Date") &&
    !line.startsWith("City") &&
    !line.startsWith("Method") &&
    !line.startsWith("latitude")
  ) {
    // Parse the Indonesian format: NO TANGGAL IMSAK SUBUH TERBIT DUHA ZUHUR ASAR MAGRIB ISYA
    // Split by tab characters first
    const tabParts = line.split("\t");

    if (tabParts.length >= 8) {
      // Parse date from format like "Senin, 01/09/2025"
      const fullDateStr = tabParts[1].trim(); // Should be "Senin, 01/09/2025"
      const dateParts = fullDateStr.split(", ");
      if (dateParts.length >= 2) {
        const datePart = dateParts[1]; // Get "01/09/2025"
        const [day, month, year] = datePart.split("/");
        const date = `${year}-${month}-${day}`;

        // Prayer times in 24-hour format
        const subuh = tabParts[4]?.trim(); // Fajr (Subuh)
        const terbit = tabParts[5]?.trim(); // Sunrise (Terbit)
        const zuhur = tabParts[7]?.trim(); // Dhuhr (Zuhur)
        const asar = tabParts[8]?.trim(); // Asr
        const magrib = tabParts[9]?.trim(); // Maghrib
        const isya = tabParts[10]?.trim(); // Isha

        // Convert to ISO format with Jakarta timezone (UTC+7)
        const createDateTime = (timeStr) => {
          const [hours, minutes] = timeStr.split(":");
          const paddedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
          return `${date}T${paddedTime}+07:00`;
        };

        const testCase = {
          date,
          input: {
            date,
            method: "Kemenag",
            coordinates,
            timezone: "Asia/Jakarta",
            asrSchool: "Standard",
            highLatitudeRule: "NightMiddle",
          },
          expected: {
            fajr: createDateTime(subuh),
            syuruk: createDateTime(terbit),
            dhuhr: createDateTime(zuhur),
            asr: createDateTime(asar),
            maghrib: createDateTime(magrib),
            isha: createDateTime(isya),
          },
        };

        testCases.push(testCase);

        // Show progress
        console.log(`${date}: Fajr ${subuh} | Isha ${isya}`);
      }
    }
  }
}

// Create test data structure
const testData = {
  metadata: {
    source: "Indonesia 2025 Official Prayer Times",
    authority: "Kementerian Agama Republik Indonesia",
    official_url: "https://bimasislam.kemenag.go.id/web/jadwalshalat",
    fetched_date: "2025-09-15",
    tier: 1,
    quality: "official_government",
    accuracy_target: "±1 minute",
    data_year: "2025",
    method: "Kemenag",
    coordinates: {
      latitude: coordinates[0],
      longitude: coordinates[1],
    },
    timezone: "Asia/Jakarta",
    location: "Jakarta, Indonesia",
    asr_school: "Standard",
    data_count: testCases.length,
    notes: "Official Indonesian government Islamic authority data",
  },
  testCases,
};

// Save to file
const outputPath = "./test-data/Kemenag.json";
fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

console.log(`\n✅ Generated ${testCases.length} test cases`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`🎯 Method: Kemenag (Indonesian government method)`);
console.log(`📍 Location: Jakarta, Indonesia`);
console.log(`🗓️ Period: September 2025`);
console.log(`🌍 Coordinates: [${coordinates.join(", ")}]`);
