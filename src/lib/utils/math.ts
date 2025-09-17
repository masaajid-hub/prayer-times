/**
 * Mathematical utilities with degree-based trigonometry
 * Simplified approach from praytime.js for consistency and ease of use
 */

// Constants
export const PI = Math.PI;
export const TWO_PI = 2 * Math.PI;

// Degree-radian conversion
export const dtr = (degrees: number): number => (degrees * PI) / 180;
export const rtd = (radians: number): number => (radians * 180) / PI;

// Degree-based trigonometric functions
export const sin = (degrees: number): number => Math.sin(dtr(degrees));
export const cos = (degrees: number): number => Math.cos(dtr(degrees));
export const tan = (degrees: number): number => Math.tan(dtr(degrees));

// Inverse trigonometric functions (return degrees)
export const arcsin = (value: number): number => rtd(Math.asin(value));
export const arccos = (value: number): number => rtd(Math.acos(value));
export const arctan = (value: number): number => rtd(Math.atan(value));

// Additional trigonometric functions
export const arccot = (x: number): number => rtd(Math.atan(1 / x));
export const arctan2 = (y: number, x: number): number => rtd(Math.atan2(y, x));

// Angle normalization utilities (from adhan-js precision)
export function unwindAngle(angle: number): number {
  return angle - 360 * Math.floor(angle / 360);
}

export function normalizeToScale(value: number, max: number): number {
  return value - max * Math.floor(value / max);
}

// Quadrant shift angle (from adhan-js)
export function quadrantShiftAngle(angle: number): number {
  if (angle >= -180 && angle <= 180) {
    return angle;
  }

  return angle - 360 * Math.round(angle / 360);
}

// Modulo operation that always returns positive result (from praytime.js)
export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

// Linear interpolation utility
export function lerp(start: number, end: number, factor: number): number {
  return start + factor * (end - start);
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Check if number is approximately equal (for floating point comparisons)
export function isApproximatelyEqual(
  a: number,
  b: number,
  epsilon = 1e-10
): boolean {
  return Math.abs(a - b) < epsilon;
}

// Convert decimal hours to hours and minutes
export function decimalHoursToHM(decimalHours: number): {
  hours: number;
  minutes: number;
} {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  return { hours, minutes };
}

// Round to specified decimal places
export function roundToPrecision(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Additional functions needed by solar.ts
export const radians = dtr; // Alias for degree to radian conversion
export const degrees = rtd; // Alias for radian to degree conversion
export const normalizeAngle = unwindAngle; // Alias for angle normalization

// Additional missing functions
export const fixAngle = unwindAngle; // Alias
export const fixHour = (hours: number): number => mod(hours, 24); // Normalize hours to 0-24
