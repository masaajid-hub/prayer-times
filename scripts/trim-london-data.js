#!/usr/bin/env bun

/**
 * Trim London test data to one month (September 2025) to match other test files
 */

import fs from "fs";

const LONDON_FILE = "./test-data/Moonsighting.json";

function trimLondonData() {
  console.log("✂️ Trimming London data to one month...\n");

  // Read current London data
  const londonData = JSON.parse(fs.readFileSync(LONDON_FILE, "utf8"));
  console.log(`📊 Current test cases: ${londonData.testCases.length}`);

  // Keep only September 2025 data (to match current month)
  const septemberData = londonData.testCases.filter((testCase) => {
    return testCase.date.startsWith("2025-09");
  });

  // Update metadata
  londonData.metadata.data_count = septemberData.length;
  londonData.metadata.notes =
    "September 2025 data - one month sample from moonsighting.com API";
  londonData.testCases = septemberData;

  // Write updated file
  fs.writeFileSync(LONDON_FILE, JSON.stringify(londonData, null, 2));

  console.log("✅ London data trimmed successfully:");
  console.log(`   📊 New test cases: ${septemberData.length}`);
  console.log(`   📅 Period: September 2025`);
  console.log(`   📁 File: ${LONDON_FILE}`);
  console.log(`   🎯 Now consistent with other test file sizes`);
}

// Run the trim
trimLondonData();
