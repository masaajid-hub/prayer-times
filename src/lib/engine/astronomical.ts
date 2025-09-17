/**
 * Astronomical calculations following adhan-js exactly
 * Implements the sophisticated corrected hour angle method with interpolation
 */

import { SolarCoordinates } from "./solar-coordinates";
import { julianDay } from "../utils/astronomy";
import {
  dtr,
  rtd,
  unwindAngle,
  quadrantShiftAngle,
  normalizeToScale,
} from "../utils/math";
import {
  interpolate,
  interpolateAngles,
  altitudeOfCelestialBody,
  daysSinceSolstice,
} from "../utils/astronomy";
import { addSeconds } from "../utils/time";
import type { Coordinates } from "../../types";

export type Shafaq = "general" | "ahmer" | "abyad";

/**
 * Approximate transit calculation following adhan-js
 */
export function approximateTransit(
  longitude: number,
  siderealTime: number,
  rightAscension: number
): number {
  const L = longitude;
  const Theta0 = siderealTime;
  const a2 = rightAscension;
  const Lw = L * -1;
  return normalizeToScale((a2 + Lw - Theta0) / 360, 1);
}

/**
 * Corrected transit time following adhan-js exactly
 */
export function correctedTransit(
  approximateTransit: number,
  longitude: number,
  siderealTime: number,
  rightAscension: number,
  previousRightAscension: number,
  nextRightAscension: number
): number {
  const m0 = approximateTransit;
  const L = longitude;
  const Theta0 = siderealTime;
  const a2 = rightAscension;
  const a1 = previousRightAscension;
  const a3 = nextRightAscension;

  const Lw = L * -1;
  const Theta = unwindAngle(Theta0 + 360.985647 * m0);
  const a = unwindAngle(interpolateAngles(a2, a1, a3, m0));
  const H = quadrantShiftAngle(Theta - Lw - a);
  const dm = H / -360;
  return (m0 + dm) * 24;
}

/**
 * Corrected hour angle calculation following adhan-js exactly
 * This is the key method that provides the precision we need
 */
export function correctedHourAngle(
  approximateTransit: number,
  angle: number,
  coordinates: Coordinates,
  afterTransit: boolean,
  siderealTime: number,
  rightAscension: number,
  previousRightAscension: number,
  nextRightAscension: number,
  declination: number,
  previousDeclination: number,
  nextDeclination: number
): number {
  const m0 = approximateTransit;
  const h0 = angle;
  const Theta0 = siderealTime;
  const a2 = rightAscension;
  const a1 = previousRightAscension;
  const a3 = nextRightAscension;
  const d2 = declination;
  const d1 = previousDeclination;
  const d3 = nextDeclination;

  // Equation from Astronomical Algorithms page 102
  const Lw = coordinates.longitude * -1;
  const term1 =
    Math.sin(dtr(h0)) - Math.sin(dtr(coordinates.latitude)) * Math.sin(dtr(d2));
  const term2 = Math.cos(dtr(coordinates.latitude)) * Math.cos(dtr(d2));
  const H0 = rtd(Math.acos(term1 / term2));
  const m = afterTransit ? m0 + H0 / 360 : m0 - H0 / 360;
  const Theta = unwindAngle(Theta0 + 360.985647 * m);
  const a = unwindAngle(interpolateAngles(a2, a1, a3, m));
  const delta = interpolate(d2, d1, d3, m);
  const H = Theta - Lw - a;
  const h = altitudeOfCelestialBody(coordinates.latitude, delta, H);
  const term3 = h - h0;
  const term4 =
    360 *
    Math.cos(dtr(delta)) *
    Math.cos(dtr(coordinates.latitude)) *
    Math.sin(dtr(H));
  const dm = term3 / term4;
  return (m + dm) * 24;
}

/**
 * Calculate solar coordinates for current, previous, and next day
 * This is the foundation of the SolarTime class
 */
export function calculateSolarCoordinatesForDays(date: Date): {
  current: SolarCoordinates;
  previous: SolarCoordinates;
  next: SolarCoordinates;
} {
  const jd = julianDay(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    0
  );

  return {
    current: new SolarCoordinates(jd),
    previous: new SolarCoordinates(jd - 1),
    next: new SolarCoordinates(jd + 1),
  };
}

/**
 * Season-adjusted morning twilight for Moonsighting Committee calculations
 * Based on adhan-js seasonAdjustedMorningTwilight implementation
 * Used for high latitude Fajr time calculations
 */
export function seasonAdjustedMorningTwilight(
  latitude: number,
  dayOfYearValue: number,
  year: number,
  sunrise: Date
): Date {
  const a = 75 + (28.65 / 55.0) * Math.abs(latitude);
  const b = 75 + (19.44 / 55.0) * Math.abs(latitude);
  const c = 75 + (32.74 / 55.0) * Math.abs(latitude);
  const d = 75 + (48.1 / 55.0) * Math.abs(latitude);

  const dyy = daysSinceSolstice(dayOfYearValue, year, latitude);

  let adjustment: number;
  if (dyy < 91) {
    adjustment = a + ((b - a) / 91.0) * dyy;
  } else if (dyy < 137) {
    adjustment = b + ((c - b) / 46.0) * (dyy - 91);
  } else if (dyy < 183) {
    adjustment = c + ((d - c) / 46.0) * (dyy - 137);
  } else if (dyy < 229) {
    adjustment = d + ((c - d) / 46.0) * (dyy - 183);
  } else if (dyy < 275) {
    adjustment = c + ((b - c) / 46.0) * (dyy - 229);
  } else {
    adjustment = b + ((a - b) / 91.0) * (dyy - 275);
  }

  return addSeconds(sunrise, Math.round(adjustment * -60.0));
}

/**
 * Season-adjusted evening twilight for Moonsighting Committee calculations
 * Based on adhan-js seasonAdjustedEveningTwilight implementation
 * Used for high latitude Isha time calculations
 */
export function seasonAdjustedEveningTwilight(
  latitude: number,
  dayOfYearValue: number,
  year: number,
  sunset: Date,
  shafaq: Shafaq = "general"
): Date {
  let a: number, b: number, c: number, d: number;

  if (shafaq === "ahmer") {
    a = 62 + (17.4 / 55.0) * Math.abs(latitude);
    b = 62 - (7.16 / 55.0) * Math.abs(latitude);
    c = 62 + (5.12 / 55.0) * Math.abs(latitude);
    d = 62 + (19.44 / 55.0) * Math.abs(latitude);
  } else if (shafaq === "abyad") {
    a = 75 + (25.6 / 55.0) * Math.abs(latitude);
    b = 75 + (7.16 / 55.0) * Math.abs(latitude);
    c = 75 + (36.84 / 55.0) * Math.abs(latitude);
    d = 75 + (81.84 / 55.0) * Math.abs(latitude);
  } else {
    // Default "general" shafaq (matches adhan.js default behavior)
    a = 75 + (25.6 / 55.0) * Math.abs(latitude);
    b = 75 + (7.16 / 55.0) * Math.abs(latitude);
    c = 75 + (36.84 / 55.0) * Math.abs(latitude);
    d = 75 + (81.84 / 55.0) * Math.abs(latitude);
  }

  const dyy = daysSinceSolstice(dayOfYearValue, year, latitude);

  let adjustment: number;
  if (dyy < 91) {
    adjustment = a + ((b - a) / 91.0) * dyy;
  } else if (dyy < 137) {
    adjustment = b + ((c - b) / 46.0) * (dyy - 91);
  } else if (dyy < 183) {
    adjustment = c + ((d - c) / 46.0) * (dyy - 137);
  } else if (dyy < 229) {
    adjustment = d + ((c - d) / 46.0) * (dyy - 183);
  } else if (dyy < 275) {
    adjustment = c + ((b - c) / 46.0) * (dyy - 229);
  } else {
    adjustment = b + ((a - b) / 91.0) * (dyy - 275);
  }

  return addSeconds(sunset, Math.round(adjustment * 60.0));
}
