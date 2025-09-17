/**
 * Astronomical calculations based on Jean Meeus algorithms
 * High-precision implementations from "Astronomical Algorithms"
 * Adapted from adhan-js for maximum accuracy
 */

import {
  sin,
  cos,
  tan,
  arcsin,
  arctan2,
  dtr,
  unwindAngle,
  normalizeToScale,
} from "./math";

// Julian day calculations
export function julianDay(
  year: number,
  month: number,
  day: number,
  hours = 0
): number {
  const trunc = Math.trunc;

  const Y = trunc(month > 2 ? year : year - 1);
  const M = trunc(month > 2 ? month : month + 12);
  const D = day + hours / 24;

  const A = trunc(Y / 100);
  const B = trunc(2 - A + trunc(A / 4));

  const i0 = trunc(365.25 * (Y + 4716));
  const i1 = trunc(30.6001 * (M + 1));

  return i0 + i1 + D + B - 1524.5;
}

// Julian century from the epoch
export function julianCentury(julianDay: number): number {
  return (julianDay - 2451545.0) / 36525;
}

// Geometric mean longitude of the sun in degrees
export function meanSolarLongitude(julianCentury: number): number {
  const T = julianCentury;
  const term1 = 280.4664567;
  const term2 = 36000.76983 * T;
  const term3 = 0.0003032 * Math.pow(T, 2);
  const L0 = term1 + term2 + term3;
  return unwindAngle(L0);
}

// Geometric mean longitude of the moon in degrees
export function meanLunarLongitude(julianCentury: number): number {
  const T = julianCentury;
  const term1 = 218.3165;
  const term2 = 481267.8813 * T;
  const Lp = term1 + term2;
  return unwindAngle(Lp);
}

// Ascending lunar node longitude
export function ascendingLunarNodeLongitude(julianCentury: number): number {
  const T = julianCentury;
  const term1 = 125.04452;
  const term2 = 1934.136261 * T;
  const term3 = 0.0020708 * Math.pow(T, 2);
  const term4 = Math.pow(T, 3) / 450000;
  const Omega = term1 - term2 + term3 + term4;
  return unwindAngle(Omega);
}

// Mean anomaly of the sun
export function meanSolarAnomaly(julianCentury: number): number {
  const T = julianCentury;
  const term1 = 357.52911;
  const term2 = 35999.05029 * T;
  const term3 = 0.0001537 * Math.pow(T, 2);
  const M = term1 + term2 - term3;
  return unwindAngle(M);
}

// Sun's equation of the center in degrees
export function solarEquationOfTheCenter(
  julianCentury: number,
  meanAnomaly: number
): number {
  const T = julianCentury;
  const Mrad = dtr(meanAnomaly);
  const term1 =
    (1.914602 - 0.004817 * T - 0.000014 * Math.pow(T, 2)) * Math.sin(Mrad);
  const term2 = (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad);
  const term3 = 0.000289 * Math.sin(3 * Mrad);
  return term1 + term2 + term3;
}

// Apparent longitude of the Sun, referred to the true equinox of the date
export function apparentSolarLongitude(
  julianCentury: number,
  meanLongitude: number
): number {
  const T = julianCentury;
  const L0 = meanLongitude;
  const longitude = L0 + solarEquationOfTheCenter(T, meanSolarAnomaly(T));
  const Omega = 125.04 - 1934.136 * T;
  const Lambda = longitude - 0.00569 - 0.00478 * sin(Omega);
  return unwindAngle(Lambda);
}

// Mean obliquity of the ecliptic (IAU formula)
export function meanObliquityOfTheEcliptic(julianCentury: number): number {
  const T = julianCentury;
  const term1 = 23.439291;
  const term2 = 0.013004167 * T;
  const term3 = 0.0000001639 * Math.pow(T, 2);
  const term4 = 0.0000005036 * Math.pow(T, 3);
  return term1 - term2 - term3 + term4;
}

// Apparent obliquity of the ecliptic, corrected for calculating the apparent position of the sun
export function apparentObliquityOfTheEcliptic(
  julianCentury: number,
  meanObliquityOfTheEcliptic: number
): number {
  const T = julianCentury;
  const Epsilon0 = meanObliquityOfTheEcliptic;
  const O = 125.04 - 1934.136 * T;
  return Epsilon0 + 0.00256 * cos(O);
}

// Mean sidereal time, the hour angle of the vernal equinox, in degrees
export function meanSiderealTime(julianCentury: number): number {
  const T = julianCentury;
  const JD = T * 36525 + 2451545.0;
  const term1 = 280.46061837;
  const term2 = 360.98564736629 * (JD - 2451545);
  const term3 = 0.000387933 * Math.pow(T, 2);
  const term4 = Math.pow(T, 3) / 38710000;
  const Theta = term1 + term2 + term3 - term4;
  return unwindAngle(Theta);
}

// Nutation in longitude
export function nutationInLongitude(
  julianCentury: number,
  solarLongitude: number,
  lunarLongitude: number,
  ascendingNode: number
): number {
  const L0 = solarLongitude;
  const Lp = lunarLongitude;
  const Omega = ascendingNode;
  const term1 = (-17.2 / 3600) * sin(Omega);
  const term2 = (1.32 / 3600) * sin(2 * L0);
  const term3 = (0.23 / 3600) * sin(2 * Lp);
  const term4 = (0.21 / 3600) * sin(2 * Omega);
  return term1 - term2 - term3 + term4;
}

// Nutation in obliquity
export function nutationInObliquity(
  julianCentury: number,
  solarLongitude: number,
  lunarLongitude: number,
  ascendingNode: number
): number {
  const L0 = solarLongitude;
  const Lp = lunarLongitude;
  const Omega = ascendingNode;
  const term1 = (9.2 / 3600) * cos(Omega);
  const term2 = (0.57 / 3600) * cos(2 * L0);
  const term3 = (0.1 / 3600) * cos(2 * Lp);
  const term4 = (0.09 / 3600) * cos(2 * Omega);
  return term1 + term2 + term3 - term4;
}

// Altitude of celestial body
export function altitudeOfCelestialBody(
  observerLatitude: number,
  declination: number,
  localHourAngle: number
): number {
  const Phi = observerLatitude;
  const delta = declination;
  const H = localHourAngle;
  const term1 = sin(Phi) * sin(delta);
  const term2 = cos(Phi) * cos(delta) * cos(H);
  return arcsin(term1 + term2);
}

// Approximate transit
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

// Interpolation of a value given equidistant previous and next values
export function interpolate(
  y2: number,
  y1: number,
  y3: number,
  n: number
): number {
  const a = y2 - y1;
  const b = y3 - y2;
  const c = b - a;
  return y2 + (n / 2) * (a + b + n * c);
}

// Interpolation of three angles, accounting for angle unwinding
export function interpolateAngles(
  y2: number,
  y1: number,
  y3: number,
  n: number
): number {
  const a = unwindAngle(y2 - y1);
  const b = unwindAngle(y3 - y2);
  const c = b - a;
  return y2 + (n / 2) * (a + b + n * c);
}

// Additional functions needed by solar.ts
export { meanSolarLongitude as solarMeanLongitude };

// True longitude of the sun
export function solarTrueLongitude(
  meanLongitude: number,
  equationOfCenter: number
): number {
  return meanLongitude + equationOfCenter;
}

// Apparent longitude of the sun
export function solarApparentLongitude(
  trueLongitude: number,
  julianCentury: number
): number {
  const T = julianCentury;
  const O = 125.04 - 1934.136 * T;
  return trueLongitude - 0.00569 - 0.00478 * sin(O);
}

// Solar declination
export function solarDeclination(apparentLongitude: number): number {
  const epsilon = meanObliquityOfTheEcliptic(0); // Simplified
  return arcsin(sin(epsilon) * sin(apparentLongitude));
}

// Equation of time
export function equationOfTime(julianCentury: number): number {
  const T = julianCentury;
  const L0 = meanSolarLongitude(T);
  const epsilon = meanObliquityOfTheEcliptic(T);
  const M = meanSolarAnomaly(T);

  const y = Math.pow(tan(epsilon / 2), 2);
  const sin2L0 = sin(2 * L0);
  const sinM = sin(M);
  const cos2L0 = cos(2 * L0);
  const sin4L0 = sin(4 * L0);
  const sin2M = sin(2 * M);

  const Etime =
    y * sin2L0 -
    2 * 0.0167 * sinM +
    4 * 0.0167 * y * sinM * cos2L0 -
    0.5 * y * y * sin4L0 -
    1.25 * 0.0167 * 0.0167 * sin2M;

  return (Etime * 4) / 60; // Convert to minutes
}

// Apparent sidereal time
export function apparentSiderealTime(julianCentury: number): number {
  const meanSidereal = meanSiderealTime(julianCentury);
  const L0 = meanSolarLongitude(julianCentury);
  const Lp = meanLunarLongitude(julianCentury);
  const Omega = ascendingLunarNodeLongitude(julianCentury);
  const nutation = nutationInLongitude(julianCentury, L0, Lp, Omega);
  const epsilon = meanObliquityOfTheEcliptic(julianCentury);

  return meanSidereal + (nutation * cos(epsilon)) / 3600;
}

// Whether or not a year is a leap year
export function isLeapYear(year: number): boolean {
  if (year % 4 !== 0) {
    return false;
  }

  if (year % 100 === 0 && year % 400 !== 0) {
    return false;
  }

  return true;
}

// Days since solstice for seasonal adjustments
export function daysSinceSolstice(
  dayOfYear: number,
  year: number,
  latitude: number
): number {
  let daysSinceSolstice = 0;
  const northernOffset = 10;
  const southernOffset = isLeapYear(year) ? 173 : 172;
  const daysInYear = isLeapYear(year) ? 366 : 365;

  if (latitude >= 0) {
    daysSinceSolstice = dayOfYear + northernOffset;
    if (daysSinceSolstice >= daysInYear) {
      daysSinceSolstice = daysSinceSolstice - daysInYear;
    }
  } else {
    daysSinceSolstice = dayOfYear - southernOffset;
    if (daysSinceSolstice < 0) {
      daysSinceSolstice = daysSinceSolstice + daysInYear;
    }
  }

  return daysSinceSolstice;
}

// Get day of year from date
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Solar coordinates interface
export interface SolarCoordinates {
  declination: number;
  rightAscension: number;
  apparentSiderealTime: number;
}

// Calculate solar coordinates for a given Julian day
export function solarCoordinates(julianDay: number): SolarCoordinates {
  const T = julianCentury(julianDay);
  const L0 = meanSolarLongitude(T);
  const Lp = meanLunarLongitude(T);
  const Omega = ascendingLunarNodeLongitude(T);
  const Lambda = apparentSolarLongitude(T, L0);

  const Theta0 = meanSiderealTime(T);
  const deltaLongitude = nutationInLongitude(T, L0, Lp, Omega);
  const apparentSiderealTime = Theta0 + deltaLongitude;

  const Epsilon0 = meanObliquityOfTheEcliptic(T);
  const Epsilon = apparentObliquityOfTheEcliptic(T, Epsilon0);

  // Calculate right ascension and declination
  const rightAscension = unwindAngle(
    arctan2(cos(Epsilon) * sin(Lambda), cos(Lambda))
  );

  const declination = arcsin(sin(Epsilon) * sin(Lambda));

  return {
    declination,
    rightAscension,
    apparentSiderealTime,
  };
}
