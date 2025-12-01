/**
 * Opening Hours Validation & Auto-Fix System
 *
 * This module provides comprehensive validation and automatic fixing of timing
 * conflicts in itineraries. It ensures that no activities are scheduled during
 * closed hours, and automatically adjusts or replaces activities as needed.
 */

import { ItineraryItem, MultiDayItinerary, DayItinerary, GooglePlaceData } from '@/types';
import { parseTime, formatTime, formatTimeFromMinutes, getActivityDuration, validateActivityTiming, TimeValidation } from '@/utils/timeUtils';

export interface ConflictDetail {
  dayIndex: number;
  activityIndex: number;
  activity: ItineraryItem;
  validation: TimeValidation;
}

export interface ValidationResult {
  hasConflicts: boolean;
  conflicts: ConflictDetail[];
}

/**
 * Parse time string to number for easier comparison
 * "2:00 PM" -> 1400
 */
function parseTimeToNumber(timeStr: string): number {
  const parsed = parseTime(timeStr);
  return parsed.hours * 100 + parsed.minutes;
}

/**
 * Format number back to time string
 * 1400 -> "2:00 PM"
 */
function formatTimeFromNumber(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Validate entire multi-day itinerary and collect all conflicts
 */
export function validateItinerary(itinerary: MultiDayItinerary): ValidationResult {
  const conflicts: ConflictDetail[] = [];

  itinerary.days.forEach((day, dayIndex) => {
    day.activities.forEach((activity, activityIndex) => {
      // Skip if no Google data (can't validate)
      if (!activity.googleData?.opening_hours) {
        return;
      }

      const validation = validateActivityTiming(
        activity.time,
        activity.googleData.opening_hours,
        new Date(day.date)
      );

      if (!validation.isValid) {
        conflicts.push({
          dayIndex,
          activityIndex,
          activity,
          validation,
        });
      }
    });
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Adjust subsequent activities to maintain spacing after a time change
 */
function adjustSubsequentActivities(
  activities: ItineraryItem[],
  startIndex: number,
  travelTimeMinutes: number = 15
): void {
  if (startIndex >= activities.length - 1) {
    return; // No subsequent activities
  }

  // Get the adjusted activity's end time
  const adjustedActivity = activities[startIndex];
  const [_, endTime] = adjustedActivity.time.split(' - ').map(t => t.trim());
  let lastEndTime = parseTimeToNumber(endTime);

  // Adjust each subsequent activity
  for (let i = startIndex + 1; i < activities.length; i++) {
    const activity = activities[i];
    const duration = getActivityDuration(activity.time);

    // Add buffer for travel time
    const travelHours = Math.floor(travelTimeMinutes / 60);
    const travelMins = travelTimeMinutes % 60;
    const newStartNum = lastEndTime + (travelHours * 100) + travelMins;

    // Calculate new end time
    const durationHours = Math.floor(duration / 60);
    const durationMins = duration % 60;
    const newEndNum = newStartNum + (durationHours * 100) + durationMins;

    // Update activity time
    activity.time = `${formatTimeFromNumber(newStartNum)} - ${formatTimeFromNumber(newEndNum)}`;

    // Update travel time text
    if (travelTimeMinutes > 0) {
      activity.travelTime = `${travelTimeMinutes} min`;
    }

    lastEndTime = newEndNum;
  }
}

/**
 * Attempt to fix a single timing conflict by adjusting the time
 */
function tryAdjustTiming(
  activity: ItineraryItem,
  validation: TimeValidation,
  allActivities: ItineraryItem[],
  activityIndex: number
): boolean {
  if (!validation.openingTime || !validation.closingTime) {
    return false;
  }

  const duration = getActivityDuration(activity.time);
  const openTime = parseTimeToNumber(validation.openingTime);
  const closeTime = parseTimeToNumber(validation.closingTime);

  // Try to shift to opening time
  const newStartNum = openTime;
  const durationHours = Math.floor(duration / 60);
  const durationMins = duration % 60;
  const newEndNum = newStartNum + (durationHours * 100) + durationMins;

  if (newEndNum <= closeTime) {
    // Success! Update the activity time
    activity.time = `${formatTimeFromNumber(newStartNum)} - ${formatTimeFromNumber(newEndNum)}`;

    // Adjust subsequent activities
    adjustSubsequentActivities(allActivities, activityIndex);

    console.log(`✓ Adjusted timing for ${activity.name}: ${formatTimeFromNumber(newStartNum)} - ${formatTimeFromNumber(newEndNum)}`);
    return true;
  }

  // Try to shift to fit before closing
  const newEndNum2 = closeTime;
  const newStartNum2 = newEndNum2 - (durationHours * 100) - durationMins;

  if (newStartNum2 >= openTime) {
    // Success! Update the activity time
    activity.time = `${formatTimeFromNumber(newStartNum2)} - ${formatTimeFromNumber(newEndNum2)}`;

    // Adjust subsequent activities
    adjustSubsequentActivities(allActivities, activityIndex);

    console.log(`✓ Adjusted timing for ${activity.name}: ${formatTimeFromNumber(newStartNum2)} - ${formatTimeFromNumber(newEndNum2)}`);
    return true;
  }

  // Can't fit this activity within opening hours
  return false;
}

/**
 * Auto-fix all timing conflicts in an itinerary
 *
 * Strategy:
 * 1. Try to adjust timing (shift activity to fit within hours)
 * 2. If can't adjust, mark for removal (will be handled by caller)
 * 3. Adjust subsequent activities to maintain flow
 */
export function autoFixConflicts(itinerary: MultiDayItinerary): MultiDayItinerary {
  const validation = validateItinerary(itinerary);

  if (!validation.hasConflicts) {
    console.log('✓ No timing conflicts found');
    return itinerary; // No issues, return as-is
  }

  console.log(`⚠ Found ${validation.conflicts.length} timing conflict(s), attempting to fix...`);

  // Track activities to remove (can't be fixed)
  const toRemove: Array<{ dayIndex: number; activityIndex: number }> = [];

  // Process conflicts in reverse order to avoid index shifting issues
  const sortedConflicts = [...validation.conflicts].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return b.dayIndex - a.dayIndex;
    return b.activityIndex - a.activityIndex;
  });

  for (const conflict of sortedConflicts) {
    const { dayIndex, activityIndex, activity, validation: val } = conflict;
    const day = itinerary.days[dayIndex];

    // Strategy 1: Try to adjust timing
    const adjusted = tryAdjustTiming(
      activity,
      val,
      day.activities,
      activityIndex
    );

    if (!adjusted) {
      // Strategy 2: Mark for removal (closed all day or can't fit)
      console.log(`✗ Cannot fix ${activity.name} (${val.reason}), marking for removal`);
      toRemove.push({ dayIndex, activityIndex });
    }
  }

  // Remove activities that couldn't be fixed
  for (const { dayIndex, activityIndex } of toRemove) {
    const removed = itinerary.days[dayIndex].activities.splice(activityIndex, 1);
    console.log(`✗ Removed ${removed[0].name} (could not fix timing conflict)`);
  }

  // Validate again to ensure all conflicts resolved
  const finalValidation = validateItinerary(itinerary);

  if (finalValidation.hasConflicts) {
    console.warn(`⚠ Still have ${finalValidation.conflicts.length} conflict(s) after auto-fix attempt`);
  } else {
    console.log(`✓ All timing conflicts resolved`);
  }

  return itinerary;
}

/**
 * Validate and auto-fix timing for a single-day itinerary
 */
export function validateAndFixSingleDay(
  activities: ItineraryItem[],
  date: Date
): ItineraryItem[] {
  const conflicts: Array<{ index: number; validation: TimeValidation }> = [];

  // Find all conflicts
  activities.forEach((activity, index) => {
    if (!activity.googleData?.opening_hours) {
      return;
    }

    const validation = validateActivityTiming(
      activity.time,
      activity.googleData.opening_hours,
      date
    );

    if (!validation.isValid) {
      conflicts.push({ index, validation });
    }
  });

  if (conflicts.length === 0) {
    return activities;
  }

  console.log(`⚠ Found ${conflicts.length} timing conflict(s) in single-day itinerary`);

  // Track which activities to remove
  const toRemove: number[] = [];

  // Process conflicts in reverse order
  const sortedConflicts = [...conflicts].sort((a, b) => b.index - a.index);

  for (const { index, validation } of sortedConflicts) {
    const activity = activities[index];

    const adjusted = tryAdjustTiming(activity, validation, activities, index);

    if (!adjusted) {
      console.log(`✗ Cannot fix ${activity.name}, marking for removal`);
      toRemove.push(index);
    }
  }

  // Remove activities that couldn't be fixed
  for (const index of toRemove) {
    const removed = activities.splice(index, 1);
    console.log(`✗ Removed ${removed[0].name} from itinerary`);
  }

  return activities;
}

/**
 * Check if a day is a Monday (many museums closed)
 */
export function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

/**
 * Check if a day is a Sunday (reduced shopping hours)
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Get recommended activity types for a specific day
 * (avoid suggesting museums on Monday, etc.)
 */
export function getRecommendedActivityTypes(date: Date, allTypes: string[]): string[] {
  if (isMonday(date)) {
    // Avoid museums and galleries on Monday
    return allTypes.filter(
      type => !type.toLowerCase().includes('museum') && !type.toLowerCase().includes('gallery')
    );
  }

  return allTypes;
}
