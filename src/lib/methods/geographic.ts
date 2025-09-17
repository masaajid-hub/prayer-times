/**
 * Geographic method auto-suggestion
 * Intelligent recommendations based on coordinates
 * Regional boundaries and method preferences
 */

import type {
  Coordinates,
  GeographicBounds,
  MethodCode,
  MethodSuggestion,
  RegionCode,
} from "../../types";
import { getRegion, isWithinBounds } from "../utils/coordinates";

// More specific country/region boundaries for precise recommendations
const SPECIFIC_REGIONS: Record<
  string,
  { bounds: GeographicBounds; method: MethodCode }
> = {
  // Gulf Countries (precise boundaries)
  saudi_arabia: {
    bounds: { north: 32.5, south: 16, east: 50.5, west: 34.5 },
    method: "UmmAlQura",
  },

  qatar: {
    bounds: { north: 26.2, south: 24.5, east: 51.7, west: 50.7 },
    method: "Qatar",
  },

  uae: {
    bounds: { north: 26.5, south: 22.5, east: 56.5, west: 51 },
    method: "Dubai",
  },

  // Southeast Asian Countries
  malaysia: {
    bounds: { north: 7.5, south: 0.5, east: 119.5, west: 99.5 },
    method: "JAKIM",
  },

  indonesia: {
    bounds: { north: 6, south: -11, east: 141, west: 95 },
    method: "Kemenag",
  },

  singapore: {
    bounds: { north: 1.5, south: 1.2, east: 104.1, west: 103.6 },
    method: "Singapore",
  },

  // European Countries
  france: {
    bounds: { north: 51.5, south: 41.5, east: 9.5, west: -5 },
    method: "France15", // Default to moderate method
  },

  turkey: {
    bounds: { north: 42.5, south: 35.5, east: 45, west: 25.5 },
    method: "Turkey",
  },

  russia: {
    bounds: { north: 82, south: 41.5, east: -169, west: 19 },
    method: "Russia",
  },

  // Iran (special Shia region)
  iran: {
    bounds: { north: 40, south: 25, east: 63.5, west: 44 },
    method: "Tehran",
  },
};

// Method preferences by region with alternatives
const REGIONAL_METHOD_PREFERENCES: Record<
  RegionCode,
  {
    primary: MethodCode;
    alternatives: MethodCode[];
    reason: string;
  }
> = {
  north_america: {
    primary: "ISNA",
    alternatives: ["MWL"],
    reason: "ISNA is widely accepted across North American Muslim communities",
  },

  europe: {
    primary: "MWL",
    alternatives: ["France15", "France12", "France18", "Turkey", "Russia"],
    reason: "Muslim World League method is internationally recognized",
  },

  middle_east: {
    primary: "UmmAlQura",
    alternatives: ["MWL", "Egypt"],
    reason:
      "Umm Al-Qura is used in the holy cities and widely accepted in the region",
  },

  southeast_asia: {
    primary: "JAKIM",
    alternatives: ["Kemenag", "Singapore", "MWL"],
    reason: "JAKIM method is optimized for tropical latitudes",
  },

  africa: {
    primary: "Egypt",
    alternatives: ["MWL"],
    reason: "Egyptian method is traditional in North Africa",
  },

  south_asia: {
    primary: "MWL",
    alternatives: ["Kemenag"],
    reason:
      "Muslim World League method is widely used in the Indian subcontinent",
  },

  unknown: {
    primary: "MWL",
    alternatives: ["ISNA", "UmmAlQura"],
    reason: "Muslim World League is a safe default for unknown regions",
  },
};

/**
 * Suggest the most appropriate calculation method for given coordinates
 */
export function suggestMethod(coordinates: Coordinates): MethodSuggestion {
  // First check specific country/region boundaries for precise matches
  for (const [region, config] of Object.entries(SPECIFIC_REGIONS)) {
    if (isWithinBounds(coordinates, config.bounds)) {
      const preference = getRegionalPreference(coordinates);
      return {
        recommended: config.method,
        region: preference.region,
        alternatives: [
          preference.primary,
          ...preference.alternatives.slice(0, 2),
        ],
        reason: `Specific method for ${region.replace("_", " ")}: ${config.method}`,
      };
    }
  }

  // Fall back to general regional suggestion
  const preference = getRegionalPreference(coordinates);
  return {
    recommended: preference.primary,
    region: preference.region,
    alternatives: preference.alternatives,
    reason: preference.reason,
  };
}

/**
 * Get regional method preference for coordinates
 */
function getRegionalPreference(coordinates: Coordinates): {
  primary: MethodCode;
  alternatives: MethodCode[];
  reason: string;
  region: RegionCode;
} {
  const region = getRegion(coordinates) as RegionCode;
  const preference = REGIONAL_METHOD_PREFERENCES[region];

  return {
    ...preference,
    region,
  };
}

/**
 * Get all methods suitable for a region
 */
export function getRegionalMethods(coordinates: Coordinates): MethodCode[] {
  const region = getRegion(coordinates) as RegionCode;
  const preference = REGIONAL_METHOD_PREFERENCES[region];

  return [preference.primary, ...preference.alternatives];
}

/**
 * Check if a method is suitable for given coordinates
 */
export function isMethodSuitableForLocation(
  method: MethodCode,
  coordinates: Coordinates
): { suitable: boolean; reason?: string } {
  const regionalMethods = getRegionalMethods(coordinates);

  if (regionalMethods.includes(method)) {
    return { suitable: true };
  }

  // Special cases
  const latitude = Math.abs(coordinates.latitude);

  // High latitude regions
  if (latitude > 55) {
    const highLatMethods: MethodCode[] = ["Russia", "MWL", "Moonsighting"];
    if (highLatMethods.includes(method)) {
      return { suitable: true, reason: "Method adapted for high latitudes" };
    }
    return {
      suitable: false,
      reason:
        "Method may not work well at high latitudes. Consider Russia or Moonsighting method.",
    };
  }

  // Tropical regions
  if (latitude < 25) {
    const tropicalMethods: MethodCode[] = [
      "JAKIM",
      "Kemenag",
      "Singapore",
      "MWL",
    ];
    if (tropicalMethods.includes(method)) {
      return { suitable: true, reason: "Method suitable for tropical regions" };
    }
    return {
      suitable: false,
      reason:
        "Method may not be optimal for tropical regions. Consider JAKIM or Kemenag.",
    };
  }

  // Method is usable but not optimal
  return {
    suitable: true,
    reason: "Method will work but may not be regionally optimal",
  };
}

/**
 * Get country name from coordinates (simplified)
 */
export function getCountryFromCoordinates(
  coordinates: Coordinates
): string | null {
  // Check specific regions first
  for (const [country, config] of Object.entries(SPECIFIC_REGIONS)) {
    if (isWithinBounds(coordinates, config.bounds)) {
      return country.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  // Fall back to general regions
  const region = getRegion(coordinates);
  const regionNames: Record<string, string> = {
    north_america: "North America",
    europe: "Europe",
    middle_east: "Middle East",
    southeast_asia: "Southeast Asia",
    africa: "Africa",
    south_asia: "South Asia",
    unknown: "Unknown Region",
  };

  return regionNames[region] ?? null;
}

/**
 * Get methods that use time intervals instead of angles
 */
export function getIntervalBasedMethods(): MethodCode[] {
  return ["UmmAlQura", "Qatar"];
}

/**
 * Get methods suitable for Shia communities
 */
export function getShiaMethods(): MethodCode[] {
  return ["Tehran", "Jafari"];
}

/**
 * Get methods with seasonal adjustments
 */
export function getSeasonalAdjustmentMethods(): MethodCode[] {
  return ["Moonsighting"];
}

/**
 * Suggest high latitude rule based on coordinates
 */
export function suggestHighLatitudeRule(coordinates: Coordinates): {
  rule: "NightMiddle" | "AngleBased" | "OneSeventh" | "None";
  reason: string;
} {
  const latitude = Math.abs(coordinates.latitude);

  if (latitude < 48) {
    return {
      rule: "None",
      reason: "Standard calculations work well at this latitude",
    };
  }

  if (latitude < 55) {
    return {
      rule: "AngleBased",
      reason: "Angle-based adjustment recommended for moderate high latitudes",
    };
  }

  if (latitude < 66.5) {
    return {
      rule: "NightMiddle",
      reason: "Night middle method recommended for high latitudes",
    };
  }

  return {
    rule: "OneSeventh",
    reason: "One-seventh method recommended for polar regions",
  };
}

/**
 * Get timezone suggestions based on coordinates
 */
export function suggestTimezone(coordinates: Coordinates): string[] {
  // Simplified timezone suggestions based on geographic bounds
  const timezones: { bounds: GeographicBounds; timezone: string }[] = [
    // Major timezone examples - in practice would need comprehensive database
    {
      bounds: { north: 50, south: 25, east: -65, west: -125 },
      timezone: "America/New_York",
    },
    {
      bounds: { north: 50, south: 25, east: -125, west: -170 },
      timezone: "America/Los_Angeles",
    },
    {
      bounds: { north: 72, south: 35, east: 40, west: -10 },
      timezone: "Europe/London",
    },
    {
      bounds: { north: 42, south: 12, east: 60, west: 34 },
      timezone: "Asia/Dubai",
    },
    {
      bounds: { north: 28, south: -11, east: 141, west: 95 },
      timezone: "Asia/Singapore",
    },
  ];

  const suggestions: string[] = [];

  for (const { bounds, timezone } of timezones) {
    if (isWithinBounds(coordinates, bounds)) {
      suggestions.push(timezone);
    }
  }

  return suggestions.length > 0 ? suggestions : ["UTC"];
}
