/**
 * All Islamic authority calculation methods in single file
 * Comprehensive collection of worldwide prayer time calculation authorities
 * Easy to extend with new methods
 */

import type { MethodCode, MethodParams, MethodRegistry } from "../../types";

// All calculation methods consolidated in single object
export const CALCULATION_METHODS: MethodRegistry = {
  // North American Methods
  ISNA: {
    fajr: 15,
    isha: 15,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { fajr: -12.5, dhuhr: 5, asr: -1, maghrib: 2, isha: -1.5 }, // Optimized for Mississauga ISNA official data
  },

  // International/Global Methods
  MWL: {
    fajr: 18,
    isha: 17,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { dhuhr: 1 }, // Standard adhan-js adjustment
  },

  // Middle Eastern Methods
  Egypt: {
    fajr: 19.5,
    isha: 17.5,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { fajr: -0.5, sunrise: -0.5, asr: 0.5, maghrib: -1 }, // Optimized for Cairo official data
  },

  UmmAlQura: {
    fajr: 18.5,
    isha: "90 min", // 90 minutes after Maghrib
    maghrib: "1 min",
    midnight: "Standard",
    // No adjustments in adhan-js UmmAlQura method
  },

  // Gulf Region Methods
  Qatar: {
    fajr: 18,
    isha: "90 min",
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { fajr: -0.5, maghrib: 2, isha: 3 }, // Optimized for Qatar official data
  },

  Dubai: {
    fajr: 18.2,
    isha: 18.2,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { sunrise: -3.5, dhuhr: 3, asr: 1.5, maghrib: 2.5, isha: 0.5 }, // Optimized for Dubai official data
  },

  // Southeast Asian Methods
  JAKIM: {
    fajr: 18,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { fajr: 1, dhuhr: 2, asr: 1, isha: 1 }, // Fine-tuned for Perlis JAKIM official data
  },

  Kemenag: {
    fajr: 20,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: {
      fajr: 2,
      dhuhr: 3,
      asr: 2,
      maghrib: 2,
      isha: 2,
      sunrise: -4,
    }, // Calibrated for Indonesian official data
  },

  Singapore: {
    fajr: 20,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { fajr: 0.5, sunrise: 0.5, dhuhr: 1, asr: 1, isha: 1 }, // Optimized for Singapore official data
  },

  // European Methods
  France12: {
    fajr: 12,
    isha: 12,
    maghrib: "1 min",
    midnight: "Standard",
    // UOIF (Union des Organisations Musulmanes de France) method
  },

  France15: {
    fajr: 15,
    isha: 15,
    maghrib: "1 min",
    midnight: "Standard",
    // Moderate French method used by some mosques
  },

  France18: {
    fajr: 18,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    // Grande Mosquée de Paris style method
  },

  Turkey: {
    fajr: 18,
    isha: 17,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: { sunrise: -7, dhuhr: 5, asr: 5.5, maghrib: 7, isha: 1.5 }, // Optimized for Turkey official data
  },

  Russia: {
    fajr: 16,
    isha: 15,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: {
      fajr: -0.5,
      sunrise: -0.5,
      dhuhr: -0.5,
      asr: 0.5,
      maghrib: -1.5,
      isha: -0.5,
    }, // Calibrated for Moscow official data
  },

  // Special Methods
  Moonsighting: {
    fajr: 18,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    shafaq: "general",
    adjustments: { dhuhr: 5, maghrib: 3 }, // adhan-js MoonsightingCommittee method
  },

  // Shia Methods
  Tehran: {
    fajr: 17.7,
    isha: 14,
    maghrib: 4.5, // 4.5 degrees after sunset
    midnight: "Jafari",
    // No adjustments in adhan-js Tehran method
  },

  Jafari: {
    fajr: 16,
    isha: 14,
    maghrib: 4, // 4 degrees after sunset
    midnight: "Jafari",
  },

  Karachi: {
    fajr: 18,
    isha: 18,
    maghrib: "1 min",
    midnight: "Standard",
    adjustments: {
      dhuhr: 1, // Match adhan.js implementation
    },
    // University of Islamic Sciences, Karachi - generally applicable method
  },

  // Custom method placeholder
  Custom: {
    fajr: 18,
    isha: 17,
    maghrib: "1 min",
    midnight: "Standard",
  },
};

// Method display names and descriptions
export const METHOD_NAMES: Record<MethodCode, string> = {
  ISNA: "Islamic Society of North America",
  MWL: "Muslim World League",
  Egypt: "Egyptian General Authority of Survey",
  UmmAlQura: "Umm Al-Qura University, Saudi Arabia",
  Qatar: "Qatar",
  Dubai: "Dubai",
  JAKIM: "Jabatan Kemajuan Islam Malaysia",
  Kemenag: "Kementerian Agama, Indonesia",
  Singapore: "Singapore",
  France12: "France (UOIF 12°)",
  France15: "France (Moderate 15°)",
  France18: "France (Grande Mosquée 18°)",
  Turkey: "Turkey Diyanet",
  Russia: "Spiritual Administration of Muslims in Russia",
  Moonsighting: "Moonsighting Committee Worldwide",
  Tehran: "Institute of Geophysics, University of Tehran",
  Jafari: "Jafari (Shia) Jurisprudence",
  Karachi: "University of Islamic Sciences, Karachi",
  Custom: "Custom Method",
};

// Method descriptions
export const METHOD_DESCRIPTIONS: Record<MethodCode, string> = {
  ISNA: "Widely used in North America. Uses 15° for both Fajr and Isha.",
  MWL: "International standard used globally. Fajr at 18° and Isha at 17°.",
  Egypt:
    "Used in Egypt and surrounding regions. Higher angles for twilight prayers.",
  UmmAlQura:
    "Official method of Saudi Arabia. Uses 90-minute interval for Isha.",
  Qatar: "Official method used in Qatar.",
  Dubai: "Method used in Dubai and UAE.",
  JAKIM:
    "Official method of Malaysia. Uses higher angles for tropical regions.",
  Kemenag: "Official method of Indonesia.",
  Singapore: "Official method used in Singapore.",
  France12: "UOIF method. Uses 12° for both Fajr and Isha.",
  France15: "Moderate French method. Uses 15° for both Fajr and Isha.",
  France18: "Grande Mosquée de Paris method. Uses 18° for both Fajr and Isha.",
  Turkey: "Official method used in Turkey.",
  Russia: "Adapted for very high latitudes in Russia.",
  Moonsighting:
    "Based on actual moon sighting traditions. Uses seasonal adjustments.",
  Tehran: "Shia method used in Iran. Different maghrib calculation.",
  Jafari: "Traditional Shia jurisprudence method.",
  Karachi:
    "Generally applicable method from University of Islamic Sciences, Karachi. Uses standard 18° angles.",
  Custom: "User-defined custom calculation parameters.",
};

// Get method parameters
export function getMethodParams(method: MethodCode): MethodParams {
  const params = CALCULATION_METHODS[method];
  if (!params) {
    throw new Error(`Unknown calculation method: ${method}`);
  }
  return { ...params }; // Return copy to prevent mutation
}

// Get method name
export function getMethodName(method: MethodCode): string {
  return METHOD_NAMES[method] ?? method;
}

// Get method description
export function getMethodDescription(method: MethodCode): string {
  return METHOD_DESCRIPTIONS[method] ?? "No description available";
}

// Check if method exists
export function isValidMethod(method: string): method is MethodCode {
  return method in CALCULATION_METHODS;
}

// Get all available methods
export function getAllMethods(): MethodCode[] {
  return Object.keys(CALCULATION_METHODS) as MethodCode[];
}

// Get methods by region (for filtering)
export function getMethodsByRegion(region: string): MethodCode[] {
  const regionMethods: Record<string, MethodCode[]> = {
    north_america: ["ISNA", "MWL"],
    europe: ["MWL", "France15", "France12", "France18", "Turkey", "Russia"],
    middle_east: ["MWL", "Egypt", "UmmAlQura", "Qatar", "Dubai"],
    southeast_asia: ["JAKIM", "Kemenag", "Singapore", "MWL"],
    africa: ["MWL", "Egypt"],
    south_asia: ["MWL", "Kemenag"],
  };

  return regionMethods[region] ?? ["MWL"];
}

// Parse angle or time interval
export function parseAngleOrInterval(value: number | string): {
  type: "angle" | "interval";
  value: number;
} {
  if (typeof value === "number") {
    return { type: "angle", value };
  }

  const minuteMatch = /^(\d+(?:\.\d+)?)\s*min$/i.exec(value);
  if (minuteMatch) {
    return { type: "interval", value: parseFloat(minuteMatch[1]) };
  }

  // Try to parse as number
  const numericValue = parseFloat(value);
  if (!isNaN(numericValue)) {
    return { type: "angle", value: numericValue };
  }

  throw new Error(`Invalid angle or interval format: ${value}`);
}

// Get night portions for high latitude adjustments
export function getNightPortions(method: MethodCode): {
  fajr: number;
  isha: number;
} {
  const params = getMethodParams(method);

  // Convert angles to portions of night
  const fajrPortion =
    typeof params.fajr === "number" ? params.fajr / 60 : 1 / 7; // Default to 1/7 if interval
  const ishaPortion =
    typeof params.isha === "number" ? params.isha / 60 : 1 / 7;

  return {
    fajr: Math.min(fajrPortion, 1 / 3), // Cap at 1/3 of night
    isha: Math.min(ishaPortion, 1 / 3),
  };
}

// Create custom method
export function createCustomMethod(
  params: Partial<MethodParams>
): MethodParams {
  const defaultParams = getMethodParams("MWL"); // Use MWL as base

  return {
    ...defaultParams,
    ...params,
  };
}

// Validate method parameters
export function validateMethodParams(params: MethodParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate fajr angle
  if (typeof params.fajr !== "number" || params.fajr < 0 || params.fajr > 30) {
    errors.push("Fajr angle must be between 0 and 30 degrees");
  }

  // Validate isha parameter
  try {
    const ishaParsed = parseAngleOrInterval(params.isha);
    if (
      ishaParsed.type === "angle" &&
      (ishaParsed.value < 0 || ishaParsed.value > 30)
    ) {
      errors.push("Isha angle must be between 0 and 30 degrees");
    }
    if (
      ishaParsed.type === "interval" &&
      (ishaParsed.value < 0 || ishaParsed.value > 300)
    ) {
      errors.push("Isha interval must be between 0 and 300 minutes");
    }
  } catch (e) {
    errors.push("Invalid Isha parameter format");
  }

  // Validate maghrib parameter if present
  if (params.maghrib !== undefined) {
    try {
      const maghribParsed = parseAngleOrInterval(params.maghrib);
      if (
        maghribParsed.type === "angle" &&
        (maghribParsed.value < 0 || maghribParsed.value > 10)
      ) {
        errors.push("Maghrib angle must be between 0 and 10 degrees");
      }
      if (
        maghribParsed.type === "interval" &&
        (maghribParsed.value < 0 || maghribParsed.value > 60)
      ) {
        errors.push("Maghrib interval must be between 0 and 60 minutes");
      }
    } catch (e) {
      errors.push("Invalid Maghrib parameter format");
    }
  }

  // Validate midnight mode
  if (params.midnight && !["Standard", "Jafari"].includes(params.midnight)) {
    errors.push('Midnight mode must be either "Standard" or "Jafari"');
  }

  // Validate shafaq type
  if (params.shafaq && !["general", "ahmer", "abyad"].includes(params.shafaq)) {
    errors.push('Shafaq type must be "general", "ahmer", or "abyad"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
