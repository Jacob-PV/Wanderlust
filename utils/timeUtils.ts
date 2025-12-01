/**
 * Time Utility Functions for Opening Hours Validation
 *
 * Provides functions for parsing, formatting, and validating activity times
 * against venue opening hours from Google Places API.
 */

import { OpeningHoursPeriod } from '@/types';

/**
 * Parsed time representation
 */
export interface ParsedTime {
  hours: number;
  minutes: number;
  period: 'AM' | 'PM';
}

/**
 * Time validation result
 */
export interface TimeValidation {
  /** Whether the activity timing is valid */
  isValid: boolean;
  /** Reason for validation failure */
  reason?: string;
  /** Suggested adjustment for timing conflict */
  suggestedAdjustment?: string;
  /** Opening time for the day */
  openingTime?: string;
  /** Closing time for the day */
  closingTime?: string;
}

/**
 * Parse a time string into structured format
 *
 * @param timeStr - Time string (e.g., "2:00 PM", "10:30 AM")
 * @returns Parsed time object with hours in 24-hour format
 *
 * @example
 * parseTime("2:00 PM") // { hours: 14, minutes: 0, period: 'PM' }
 * parseTime("9:30 AM") // { hours: 9, minutes: 30, period: 'AM' }
 */
export function parseTime(timeStr: string): ParsedTime {
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase() as 'AM' | 'PM';

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes, period };
}

/**
 * Format a Google Places time code to human-readable format
 *
 * @param time - 4-digit time string from Google Places (e.g., "1400", "0930")
 * @returns Formatted time string (e.g., "2:00 PM", "9:30 AM")
 *
 * @example
 * formatTime("1400") // "2:00 PM"
 * formatTime("0930") // "9:30 AM"
 * formatTime("0000") // "12:00 AM"
 */
export function formatTime(time: string): string {
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = time.substring(2, 4);

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${minutes} ${period}`;
}

/**
 * Convert minutes since midnight to formatted time string
 *
 * @param minutes - Minutes since midnight (0-1439)
 * @returns Formatted time string (e.g., "2:00 PM")
 *
 * @example
 * formatTimeFromMinutes(840) // "2:00 PM" (14 * 60)
 * formatTimeFromMinutes(570) // "9:30 AM" (9 * 60 + 30)
 */
export function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate duration in minutes from a time range string
 *
 * @param timeRange - Time range string (e.g., "9:00 AM - 11:00 AM")
 * @returns Duration in minutes
 *
 * @example
 * getActivityDuration("9:00 AM - 11:00 AM") // 120
 * getActivityDuration("2:30 PM - 5:00 PM") // 150
 */
export function getActivityDuration(timeRange: string): number {
  const [start, end] = timeRange.split(' - ').map((t) => t.trim());
  const startTime = parseTime(start);
  const endTime = parseTime(end);

  const startMinutes = startTime.hours * 60 + startTime.minutes;
  const endMinutes = endTime.hours * 60 + endTime.minutes;

  return endMinutes - startMinutes;
}

/**
 * Get opening hours text for a specific date from Google Places data
 *
 * @param openingHours - Google Places opening hours object
 * @param date - Date to get hours for
 * @returns Opening hours string for that day, or null if not available
 *
 * @example
 * getHoursForDate(googleData.opening_hours, new Date('2024-11-16'))
 * // Returns: "10:00 AM – 6:00 PM" or "Closed" or null
 */
export function getHoursForDate(
  openingHours: { weekday_text?: string[]; periods?: OpeningHoursPeriod[] } | undefined,
  date: Date
): string | null {
  if (!openingHours?.weekday_text) {
    return null;
  }

  // Get day name for the date
  const dayName = getDayOfWeek(date); // "Monday", "Tuesday", etc.

  // Find the matching day in weekday_text by parsing the day name
  // Google returns strings like "Monday: 9:00 AM – 6:00 PM"
  const hoursText = openingHours.weekday_text.find(text =>
    text.toLowerCase().startsWith(dayName.toLowerCase())
  );

  if (!hoursText) {
    return null;
  }

  // Extract just the hours part (after the colon)
  // "Monday: 9:00 AM – 6:00 PM" → "9:00 AM – 6:00 PM"
  const hours = hoursText.split(': ')[1];

  return hours || null;
}

/**
 * Validate if an activity's suggested time conflicts with opening hours
 *
 * @param activityTime - Suggested time range (e.g., "2:00 PM - 4:00 PM")
 * @param openingHours - Google Places opening hours object
 * @param date - Date of the activity
 * @returns Validation result with details
 *
 * @example
 * validateActivityTiming("8:00 AM - 10:00 AM", googleData.opening_hours, new Date())
 * // Returns: { isValid: false, reason: "Opens at 9:00 AM", ... }
 */
export function validateActivityTiming(
  activityTime: string,
  openingHours: { weekday_text?: string[]; periods?: OpeningHoursPeriod[] } | undefined,
  date: Date
): TimeValidation {
  if (!openingHours?.periods || openingHours.periods.length === 0) {
    // No hours data, assume it's always open (park, street, etc.)
    return { isValid: true };
  }

  try {
    // Parse suggested activity time
    const [startTime, endTime] = activityTime.split(' - ').map((t) => t.trim());
    const activityStart = parseTime(startTime);
    const activityEnd = parseTime(endTime);

    // Get opening hours for this day
    const dayOfWeek = date.getDay();
    const dayPeriods = openingHours.periods.filter((p) => p.open.day === dayOfWeek);

    console.log(`[Validation] Activity: ${activityTime}, Day: ${dayOfWeek}, Periods found: ${dayPeriods.length}`);

    if (dayPeriods.length === 0) {
      console.log(`[Validation] INVALID: No periods for day ${dayOfWeek}`);
      return {
        isValid: false,
        reason: 'Closed on this day',
      };
    }

    const activityStartNum = activityStart.hours * 100 + activityStart.minutes;
    const activityEndNum = activityEnd.hours * 100 + activityEnd.minutes;

    console.log(`[Validation] Activity time: ${activityStartNum} - ${activityEndNum}`);

    // Track the earliest conflict for better error messages
    let earliestConflict: TimeValidation | null = null;

    // Check if activity time falls within any opening period
    for (const period of dayPeriods) {
      const openTime = parseInt(period.open.time, 10);
      const closeTime = period.close ? parseInt(period.close.time, 10) : 2359;

      console.log(`[Validation] Checking period: ${openTime} - ${closeTime}`);

      // Check for 24-hour operation
      if (openTime === 0 && closeTime === 0) {
        console.log(`[Validation] VALID: 24-hour operation`);
        return {
          isValid: true,
          openingTime: 'Open 24 hours',
          closingTime: 'Open 24 hours',
        };
      }

      // Check if activity is entirely within opening hours
      if (activityStartNum >= openTime && activityEndNum <= closeTime) {
        console.log(`[Validation] VALID: Activity fits within period`);
        return {
          isValid: true,
          openingTime: formatTime(period.open.time),
          closingTime: period.close ? formatTime(period.close.time) : undefined,
        };
      }

      // Track conflicts for better error messages
      if (activityStartNum < openTime && !earliestConflict) {
        earliestConflict = {
          isValid: false,
          reason: `Opens at ${formatTime(period.open.time)}`,
          suggestedAdjustment: `Suggest moving to ${formatTime(period.open.time)}`,
          openingTime: formatTime(period.open.time),
          closingTime: period.close ? formatTime(period.close.time) : undefined,
        };
      } else if (activityEndNum > closeTime && !earliestConflict) {
        earliestConflict = {
          isValid: false,
          reason: `Closes at ${formatTime(period.close?.time || '2359')}`,
          suggestedAdjustment: 'Shorten activity or move earlier',
          openingTime: formatTime(period.open.time),
          closingTime: period.close ? formatTime(period.close.time) : undefined,
        };
      }
    }

    // If we have a tracked conflict, return it
    if (earliestConflict) {
      console.log(`[Validation] INVALID: ${earliestConflict.reason}`);
      return earliestConflict;
    }

    console.log(`[Validation] INVALID: Closed during suggested time`);
    return {
      isValid: false,
      reason: 'Closed during suggested time',
    };
  } catch (error) {
    // If parsing fails, assume valid (don't break the UI)
    console.error('Error validating activity timing:', error);
    return { isValid: true };
  }
}

/**
 * Adjust activity time to fit within opening hours
 *
 * @param activityTime - Current activity time range
 * @param openingTime - Opening time for the day
 * @param closingTime - Closing time for the day
 * @returns Adjusted time range, or null if cannot fit
 *
 * @example
 * adjustActivityTime("8:00 AM - 10:00 AM", "9:00 AM", "6:00 PM")
 * // Returns: "9:00 AM - 11:00 AM"
 */
export function adjustActivityTime(
  activityTime: string,
  openingTime: string,
  closingTime: string
): string | null {
  try {
    const duration = getActivityDuration(activityTime);
    const opening = parseTime(openingTime);
    const closing = parseTime(closingTime);

    // Try to shift to start at opening time
    const openingMinutes = opening.hours * 60 + opening.minutes;
    const durationMinutes = duration;
    const newEndMinutes = openingMinutes + durationMinutes;
    const closingMinutes = closing.hours * 60 + closing.minutes;

    if (newEndMinutes <= closingMinutes) {
      const newStart = formatTimeFromMinutes(openingMinutes);
      const newEnd = formatTimeFromMinutes(newEndMinutes);
      return `${newStart} - ${newEnd}`;
    }

    // Duration too long, try to fit before closing
    const newStartMinutes = closingMinutes - durationMinutes;
    if (newStartMinutes >= openingMinutes) {
      const newStart = formatTimeFromMinutes(newStartMinutes);
      const newEnd = closingTime;
      return `${newStart} - ${newEnd}`;
    }

    // Can't fit - needs replacement
    return null;
  } catch (error) {
    console.error('Error adjusting activity time:', error);
    return null;
  }
}

/**
 * Get day of week name from date
 *
 * @param date - Date object
 * @returns Day name (e.g., "Monday", "Tuesday")
 */
export function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get abbreviated day of week name from date
 *
 * @param date - Date object
 * @returns Abbreviated day name (e.g., "Mon", "Tue")
 */
export function getAbbreviatedDay(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
