/**
 * Time conversion utilities
 * UTC timestamp handling and format conversions
 * Combines praytime.js simplicity with timezone support
 */

import { mod, decimalHoursToHM } from "./math";

export type TimeFormat = "24h" | "12h" | "12hNS" | "timestamp" | "iso8601";
export type RoundingMethod = "nearest" | "up" | "down" | "none";

// Time components interface
export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds?: number;
}

// Convert decimal hours to Date object for a specific date
export function decimalHoursToDate(
  decimalHours: number,
  year: number,
  month: number,
  day: number
): Date {
  const utcTime = Date.UTC(year, month, day);
  const milliseconds = decimalHours * 3600 * 1000;
  return new Date(utcTime + milliseconds);
}

// Convert decimal hours to UTC timestamp
export function decimalHoursToTimestamp(
  decimalHours: number,
  utcBaseTime: number,
  longitude: number
): number {
  // Adjust for longitude (praytime.js approach)
  const adjustedTime = decimalHours - longitude / 15;
  return utcBaseTime + Math.floor(adjustedTime * 3600 * 1000);
}

// Round time according to rounding method
export function roundTime(timestamp: number, rounding: RoundingMethod): number {
  if (rounding === "none") {
    return timestamp;
  }

  const oneMinute = 60 * 1000;
  const roundingFn = {
    up: Math.ceil,
    down: Math.floor,
    nearest: Math.round,
  }[rounding];

  return roundingFn(timestamp / oneMinute) * oneMinute;
}

// Format timestamp to string
export function formatTime(
  timestamp: number,
  format: TimeFormat = "24h",
  timezone?: string
): string {
  if (isNaN(timestamp)) {
    return "-----"; // Invalid time marker
  }

  if (format === "timestamp") {
    return Math.floor(timestamp).toString();
  }

  const date = new Date(timestamp);

  if (format === "iso8601") {
    return timezone ? date.toISOString() : date.toISOString();
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: format === "24h" ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: format !== "24h",
  };

  if (timezone) {
    options.timeZone = timezone;
  }

  let timeString = date.toLocaleTimeString("en-US", options);

  // Remove AM/PM suffix for 12hNS format
  if (format === "12hNS") {
    timeString = timeString.replace(/ ?[AP]M/, "");
  }

  return timeString;
}

// Parse time string to decimal hours
export function parseTimeToDecimal(timeString: string): number {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?$/i.exec(
    timeString
  );

  if (!match) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4]?.toLowerCase();

  // Handle 12-hour format
  if (ampm) {
    if (ampm === "pm" && hours !== 12) {
      hours += 12;
    } else if (ampm === "am" && hours === 12) {
      hours = 0;
    }
  }

  return hours + minutes / 60 + seconds / 3600;
}

// Add minutes to a Date object
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Add seconds to a Date object
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

// Add days to a Date object
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Check if date is valid
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Rounding modes for prayer times
export const RoundingMode = {
  Nearest: "nearest",
  Up: "up",
  None: "none",
} as const;

export type RoundingMode = (typeof RoundingMode)[keyof typeof RoundingMode];

// Round Date to nearest minute (following adhan-js pattern)
export function roundedMinute(
  date: Date,
  rounding: RoundingMode = RoundingMode.Nearest
): Date {
  const seconds = date.getUTCSeconds();
  let offset = 0;

  if (rounding === RoundingMode.Nearest) {
    // Round to nearest: ≥30 seconds rounds up, <30 seconds rounds down
    offset = seconds >= 30 ? 60 - seconds : -1 * seconds;
  } else if (rounding === RoundingMode.Up) {
    // Always round up to next minute
    offset = seconds > 0 ? 60 - seconds : 0;
  } else if (rounding === RoundingMode.None) {
    // No rounding
    offset = 0;
  }

  return addSeconds(date, offset);
}

// Get UTC base time for a date (midnight UTC)
export function getUtcBaseTime(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

// Convert time components to decimal hours
export function timeComponentsToDecimal(components: TimeComponents): number {
  const { hours, minutes, seconds = 0 } = components;
  return hours + minutes / 60 + seconds / 3600;
}

// Convert decimal hours to time components
export function decimalToTimeComponents(decimalHours: number): TimeComponents {
  const totalSeconds = Math.round(decimalHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

// Calculate time difference in hours between two dates
export function timeDifferenceInHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Normalize hours to 0-24 range
export function normalizeHours(hours: number): number {
  return mod(hours, 24);
}

// Get timezone offset in minutes for a specific date and timezone
export function getTimezoneOffset(date: Date, timezone: string): number {
  const utc1 = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const utc2 = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (utc2.getTime() - utc1.getTime()) / (1000 * 60);
}

// Format duration in hours and minutes
export function formatDuration(hours: number): string {
  const { hours: h, minutes: m } = decimalHoursToHM(Math.abs(hours));
  const sign = hours < 0 ? "-" : "";
  return `${sign}${h}h ${m}m`;
}

// Get current date in specific timezone
export function getCurrentDateInTimezone(timezone: string): Date {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const offset = getTimezoneOffset(now, timezone);
  return new Date(utcTime + offset * 60000);
}

// Check if time is between two other times (handles midnight crossing)
export function isTimeBetween(
  time: number,
  start: number,
  end: number
): boolean {
  if (start <= end) {
    return time >= start && time <= end;
  } else {
    // Crosses midnight
    return time >= start || time <= end;
  }
}

// Calculate minutes until next time
export function minutesUntil(current: number, target: number): number {
  let diff = target - current;
  if (diff < 0) {
    diff += 24; // Next day
  }
  return Math.round(diff * 60);
}

// Convert date to specific timezone - creates a Date with local time representation
export function convertToTimezone(date: Date, timezone: string): Date {
  try {
    // Prayer times should be returned in UTC like adhan-js
    // External formatting handles timezone display
    return date;
  } catch (error) {
    console.warn(`Timezone conversion failed for ${timezone}:`, error);
    return new Date(date);
  }
}

// Get current timezone
export function getCurrentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Missing functions needed by exports
export function decimalHoursToTime(decimalHours: number): string {
  const { hours, minutes } = decimalHoursToHM(decimalHours);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function timeToDecimalHours(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours + (minutes || 0) / 60;
}

export function formatPrayerTimes(
  times: any,
  format: TimeFormat = "24h",
  _rounding?: RoundingMethod
): any {
  const formatted: any = {};

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  for (const [prayer, time] of Object.entries(times)) {
    if (time instanceof Date) {
      formatted[prayer] = formatTime(time.getTime(), format);
    }
  }

  return formatted;
}

export function timestampToDecimalHours(timestamp: number): number {
  const date = new Date(timestamp);
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
