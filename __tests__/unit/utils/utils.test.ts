/**
 * Utility function tests - Updated for current implementation
 */

import { describe, expect, it } from "bun:test";
import * as MathUtils from "../../../src/lib/utils/math";
import * as TimeUtils from "../../../src/lib/utils/time";
import * as LocationUtils from "../../../src/lib/utils/coordinates";

describe("MathUtils", () => {
  describe("trigonometric functions", () => {
    it("should convert degrees to radians correctly", () => {
      expect(MathUtils.dtr(0)).toBe(0);
      expect(MathUtils.dtr(90)).toBeCloseTo(Math.PI / 2, 10);
      expect(MathUtils.dtr(180)).toBeCloseTo(Math.PI, 10);
    });

    it("should convert radians to degrees correctly", () => {
      expect(MathUtils.rtd(0)).toBe(0);
      expect(MathUtils.rtd(Math.PI / 2)).toBeCloseTo(90, 10);
      expect(MathUtils.rtd(Math.PI)).toBeCloseTo(180, 10);
    });

    it("should calculate degree-based trigonometric functions", () => {
      expect(MathUtils.sin(0)).toBeCloseTo(0, 10);
      expect(MathUtils.sin(90)).toBeCloseTo(1, 10);
      expect(MathUtils.cos(0)).toBeCloseTo(1, 10);
      expect(MathUtils.cos(90)).toBeCloseTo(0, 10);
      expect(MathUtils.tan(45)).toBeCloseTo(1, 10);
    });

    it("should calculate inverse trigonometric functions", () => {
      expect(MathUtils.arcsin(0)).toBeCloseTo(0, 10);
      expect(MathUtils.arcsin(1)).toBeCloseTo(90, 10);
      expect(MathUtils.arccos(1)).toBeCloseTo(0, 10);
      expect(MathUtils.arccos(0)).toBeCloseTo(90, 10);
      expect(MathUtils.arctan(1)).toBeCloseTo(45, 10);
    });
  });

  describe("angle normalization", () => {
    it("should normalize angles to [0, 360) range", () => {
      expect(MathUtils.unwindAngle(0)).toBe(0);
      expect(MathUtils.unwindAngle(360)).toBe(0);
      expect(MathUtils.unwindAngle(450)).toBe(90);
      expect(MathUtils.unwindAngle(-90)).toBe(270);
    });

    it("should normalize hours to [0, 24) range", () => {
      expect(MathUtils.fixHour(0)).toBe(0);
      expect(MathUtils.fixHour(24)).toBe(0);
      expect(MathUtils.fixHour(25)).toBe(1);
      expect(MathUtils.fixHour(-2)).toBe(22);
    });
  });

  describe("utility functions", () => {
    it("should perform positive modulo correctly", () => {
      expect(MathUtils.mod(5, 3)).toBe(2);
      expect(MathUtils.mod(-1, 3)).toBe(2);
      expect(MathUtils.mod(7, 3)).toBe(1);
    });

    it("should convert decimal hours to hours and minutes", () => {
      const result1 = MathUtils.decimalHoursToHM(12.5);
      expect(result1.hours).toBe(12);
      expect(result1.minutes).toBe(30);

      const result2 = MathUtils.decimalHoursToHM(6.25);
      expect(result2.hours).toBe(6);
      expect(result2.minutes).toBe(15);
    });

    it("should clamp values correctly", () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });

    it("should check approximate equality", () => {
      expect(MathUtils.isApproximatelyEqual(1.0, 1.0000001, 1e-5)).toBe(true);
      expect(MathUtils.isApproximatelyEqual(1.0, 1.1, 1e-5)).toBe(false);
    });
  });
});

describe("TimeUtils", () => {
  describe("time formatting", () => {
    it("should format 24h time correctly", () => {
      const timestamp = new Date("2024-06-15T12:30:00Z").getTime();
      expect(TimeUtils.formatTime(timestamp, "24h")).toMatch(/\d{2}:\d{2}/);
    });

    it("should format 12h time correctly", () => {
      const timestamp = new Date("2024-06-15T15:30:00Z").getTime();
      expect(TimeUtils.formatTime(timestamp, "12h")).toMatch(
        /\d{1,2}:\d{2}\s*(AM|PM)/
      );
    });

    it("should handle invalid timestamps", () => {
      expect(TimeUtils.formatTime(NaN)).toBe("-----");
    });
  });

  describe("decimal hours conversion", () => {
    it("should convert decimal hours to date correctly", () => {
      const date = TimeUtils.decimalHoursToDate(12.5, 2024, 5, 15);
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCHours()).toBe(12);
      expect(date.getUTCMinutes()).toBe(30);
    });
  });

  describe("time rounding", () => {
    it("should round time according to method", () => {
      const timestamp = new Date("2024-06-15T12:30:30Z").getTime();
      const rounded = TimeUtils.roundTime(timestamp, "nearest");
      expect(rounded).toBeDefined();
      expect(typeof rounded).toBe("number");
    });
  });
});

describe("LocationUtils", () => {
  describe("coordinate validation", () => {
    it("should validate correct coordinates", () => {
      expect(LocationUtils.isValidLatitude(40.7)).toBe(true);
      expect(LocationUtils.isValidLatitude(91)).toBe(false);
      expect(LocationUtils.isValidLongitude(-74.0)).toBe(true);
      expect(LocationUtils.isValidLongitude(181)).toBe(false);
    });

    it("should validate coordinate objects", () => {
      const coords = LocationUtils.validateCoordinates([40.7, -74.0]);
      expect(coords.latitude).toBe(40.7);
      expect(coords.longitude).toBe(-74.0);
    });
  });

  describe("coordinate parsing", () => {
    it("should parse array format", () => {
      const coords = LocationUtils.parseCoordinates([40.7, -74.0]);
      expect(coords.latitude).toBe(40.7);
      expect(coords.longitude).toBe(-74.0);
    });

    it("should parse object format", () => {
      const coords = LocationUtils.parseCoordinates({
        latitude: 40.7,
        longitude: -74.0,
      });
      expect(coords.latitude).toBe(40.7);
      expect(coords.longitude).toBe(-74.0);
    });

    it("should parse string format", () => {
      const coords = LocationUtils.parseCoordinates("40.7,-74.0");
      expect(coords.latitude).toBe(40.7);
      expect(coords.longitude).toBe(-74.0);
    });
  });

  describe("distance calculations", () => {
    it("should calculate distance between two points", () => {
      const coords1 = { latitude: 40.7, longitude: -74.0 }; // NYC
      const coords2 = { latitude: 51.5, longitude: -0.1 }; // London
      const distance = LocationUtils.calculateDistance(coords1, coords2);

      expect(distance).toBeGreaterThan(5500); // Approximate distance in km
      expect(distance).toBeLessThan(5600);
    });

    it("should return 0 for same coordinates", () => {
      const coords = { latitude: 40.7, longitude: -74.0 };
      const distance = LocationUtils.calculateDistance(coords, coords);
      expect(distance).toBeCloseTo(0, 5);
    });
  });

  describe("Qibla direction", () => {
    it("should calculate Qibla direction", () => {
      const coords = { latitude: 40.7, longitude: -74.0 }; // NYC
      const qibla = LocationUtils.calculateQiblaDirection(coords);

      expect(typeof qibla).toBe("number");
      expect(qibla).toBeGreaterThan(0);
      expect(qibla).toBeLessThan(360);
      expect(qibla).toBeCloseTo(58.5, 1); // Approximate Qibla from NYC
    });
  });

  describe("polar region detection", () => {
    it("should detect polar regions", () => {
      const polarCoords = { latitude: 70, longitude: 0 };
      const normalCoords = { latitude: 40, longitude: 0 };

      expect(LocationUtils.isInPolarRegion(polarCoords)).toBe(true);
      expect(LocationUtils.isInPolarRegion(normalCoords)).toBe(false);
    });
  });

  describe("distance to Mecca", () => {
    it("should calculate distance to Mecca", () => {
      const coords = { latitude: 40.7, longitude: -74.0 }; // NYC
      const distance = LocationUtils.distanceToMecca(coords);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeGreaterThan(10000); // Should be thousands of km
    });
  });

  describe("cardinal directions", () => {
    it("should get cardinal direction from bearing", () => {
      expect(LocationUtils.getCardinalDirection(0)).toBe("N");
      expect(LocationUtils.getCardinalDirection(90)).toBe("E");
      expect(LocationUtils.getCardinalDirection(180)).toBe("S");
      expect(LocationUtils.getCardinalDirection(270)).toBe("W");
    });
  });
});
