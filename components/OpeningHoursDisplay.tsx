'use client';

import { Clock, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { getHoursForDate, validateActivityTiming, getAbbreviatedDay } from '@/utils/timeUtils';

/**
 * OpeningHoursDisplay Component
 *
 * Displays day-specific opening hours and validates against activity timing.
 * Shows color-coded badges indicating whether the activity timing is valid.
 */

interface OpeningHoursDisplayProps {
  /** Google Places opening hours data */
  openingHours:
    | {
        open_now: boolean;
        weekday_text?: string[];
        periods?: Array<{
          open: { day: number; time: string };
          close?: { day: number; time: string };
        }>;
      }
    | undefined;
  /** Date of the activity */
  date: Date;
  /** Activity time range (e.g., "2:00 PM - 4:00 PM") */
  activityTime: string;
}

export default function OpeningHoursDisplay({
  openingHours,
  date,
  activityTime,
}: OpeningHoursDisplayProps) {
  if (!openingHours?.weekday_text) {
    return null;
  }

  const hours = getHoursForDate(openingHours, date);
  const validation = validateActivityTiming(activityTime, openingHours, date);

  // Closed on this day
  if (!hours || hours.toLowerCase().includes('closed')) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">Closed {getAbbreviatedDay(date)}</span>
      </div>
    );
  }

  // Check if it's 24 hours
  const is24Hours = hours.toLowerCase().includes('24 hours') || hours.toLowerCase().includes('open 24 hours');

  if (is24Hours) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">Open 24 hours</span>
      </div>
    );
  }

  // Valid timing - no conflicts
  if (validation.isValid) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          <span className="font-medium">{getAbbreviatedDay(date)} hours:</span>
          {' '}
          {hours}
        </span>
      </div>
    );
  }

  // Timing conflict
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          <span className="font-medium">{getAbbreviatedDay(date)} hours:</span>
          {' '}
          {hours}
        </span>
      </div>
      {validation.reason && (
        <div className="flex items-start gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-200">
          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Timing Issue</p>
            <p>{validation.reason}</p>
            {validation.suggestedAdjustment && (
              <p className="mt-1 text-yellow-700">{validation.suggestedAdjustment}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
