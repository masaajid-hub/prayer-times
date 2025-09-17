#!/usr/bin/env bun

/**
 * Master script to regenerate all test data files
 * Runs all creation scripts in the correct order
 */

import { spawn } from "bun";
import fs from "fs";

console.log("🚀 MASTER TEST DATA REGENERATION SCRIPT");
console.log("=====================================\n");

// Define all scripts to run
const scripts = [
  // Official Authority Scripts (Tier 1)
  {
    name: "Egypt",
    script: "./scripts/create-egypt-datafile.js",
    description: "Egyptian General Authority of Survey",
  },
  {
    name: "Qatar",
    script: "./scripts/create-qatar-datafile.js",
    description: "Qatar Ministry of Awqaf",
  },
  {
    name: "JAKIM",
    script: "./scripts/create-malaysia-datafile.js",
    description: "Department of Islamic Development Malaysia",
  },
  {
    name: "Singapore",
    script: "./scripts/create-singapore-datafile.js",
    description: "MUIS Singapore",
  },
  {
    name: "Turkey",
    script: "./scripts/create-turkey-datafile.js",
    description: "Turkey Diyanet",
  },
  {
    name: "Dubai",
    script: "./scripts/create-uae-datafile.js",
    description: "UAE General Authority of Islamic Affairs",
  },
  {
    name: "UmmAlQura",
    script: "./scripts/create-saudi-datafile.js",
    description: "Saudi Arabia Umm Al-Qura Calendar",
  },
  {
    name: "Russia",
    script: "./scripts/create-russia-datafile.js",
    description: "Council of Muftis of Russia",
  },
  {
    name: "Kemenag",
    script: "./scripts/create-kemenag-datafile.js",
    description: "Indonesian Ministry of Religious Affairs",
  },
  {
    name: "ISNA",
    script: "./scripts/create-isna-datafile.js",
    description: "Islamic Society of North America",
  },

  // Reference Implementation Scripts (Tier 2)
  {
    name: "Karachi",
    script: "./scripts/create-karachi-datafile.js",
    description: "adhan-js Karachi method",
  },
  {
    name: "Tehran",
    script: "./scripts/create-tehran-datafile.js",
    description: "adhan-js Tehran method",
  },
  {
    name: "Jafari",
    script: "./scripts/create-jafari-datafile.js",
    description: "adhan-js Jafari method",
  },
  {
    name: "MWL",
    script: "./scripts/create-mwl-datafile.js",
    description: "adhan-js Muslim World League",
  },
  {
    name: "France12",
    script: "./scripts/create-france12-datafile.js",
    description: "adhan-js France 12° method",
  },
  {
    name: "France15",
    script: "./scripts/create-france15-datafile.js",
    description: "adhan-js France 15° method",
  },
  {
    name: "France18",
    script: "./scripts/create-france18-datafile.js",
    description: "adhan-js France 18° method",
  },
];

let successCount = 0;
let failureCount = 0;
const results = [];

console.log(`📋 Found ${scripts.length} scripts to execute\n`);

// Function to run a single script
async function runScript(scriptInfo) {
  const { name, script, description } = scriptInfo;

  console.log(`🔄 [${name}] Running: ${description}`);
  console.log(`   Script: ${script}`);

  try {
    // Check if script file exists
    if (!fs.existsSync(script)) {
      throw new Error(`Script file not found: ${script}`);
    }

    // Run the script
    const proc = spawn(["bun", "run", script], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const result = await proc.exited;

    if (result === 0) {
      console.log(`   ✅ [${name}] SUCCESS\n`);
      successCount++;
      results.push({ name, status: "SUCCESS", error: null });
    } else {
      throw new Error(`Script exited with code ${result}`);
    }
  } catch (error) {
    console.log(`   ❌ [${name}] FAILED: ${error.message}\n`);
    failureCount++;
    results.push({ name, status: "FAILED", error: error.message });
  }
}

// Run all scripts sequentially
for (const script of scripts) {
  await runScript(script);
}

// Print final summary
console.log("=====================================");
console.log("🏁 REGENERATION COMPLETE");
console.log("=====================================\n");

console.log("📊 SUMMARY:");
console.log(`   ✅ Successful: ${successCount}/${scripts.length}`);
console.log(`   ❌ Failed: ${failureCount}/${scripts.length}`);
console.log(
  `   📈 Success Rate: ${Math.round((successCount / scripts.length) * 100)}%\n`
);

if (failureCount > 0) {
  console.log("❌ FAILED SCRIPTS:");
  results
    .filter((r) => r.status === "FAILED")
    .forEach((r) => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  console.log();
}

console.log("✅ SUCCESSFUL SCRIPTS:");
results
  .filter((r) => r.status === "SUCCESS")
  .forEach((r) => {
    console.log(`   • ${r.name}`);
  });

console.log("\n🎯 Next Steps:");
console.log("   1. Check generated files in test-data/ directory");
console.log("   2. Run systematic verification of each file");
console.log("   3. Validate against standardized-schema.json v1.1.0");

// Note about Moonsighting.json (no script needed)
console.log(
  "\n📝 Note: Moonsighting.json does not need regeneration (API-sourced data)"
);
