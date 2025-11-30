'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker, DateRange as DayPickerDateRange } from 'react-day-picker';
import { format, differenceInDays, addDays, startOfToday } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  onDateRangeChange: (range: { from: Date; to: Date } | null) => void;
  value?: { from: Date; to: Date } | null;
}

export default function DateRangePicker({ onDateRangeChange, value }: DateRangePickerProps) {
  const [range, setRange] = useState<DayPickerDateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = startOfToday();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (selectedRange: DayPickerDateRange | undefined) => {
    setRange(selectedRange);

    if (selectedRange?.from && selectedRange?.to) {
      onDateRangeChange({
        from: selectedRange.from,
        to: selectedRange.to
      });
    } else if (selectedRange?.from) {
      // Single day selected - set both from and to to same day
      onDateRangeChange({
        from: selectedRange.from,
        to: selectedRange.from
      });
    }
  };

  const quickSelect = (days: number) => {
    const from = today;
    const to = addDays(from, days - 1);
    const newRange: DayPickerDateRange = { from, to };
    setRange(newRange);
    onDateRangeChange({ from, to });
  };

  const clearSelection = () => {
    setRange(undefined);
    onDateRangeChange(null);
  };

  const dayCount = range?.from && range?.to
    ? differenceInDays(range.to, range.from) + 1
    : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Date display button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left
                   hover:border-blue-500 focus:ring-2 focus:ring-blue-500
                   focus:border-transparent transition-all bg-white"
      >
        {range?.from && range?.to ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {format(range.from, 'MMM d')} - {format(range.to, 'MMM d, yyyy')}
            </span>
            <span className="text-sm text-gray-500">
              ({dayCount} day{dayCount !== 1 ? 's' : ''})
            </span>
          </div>
        ) : (
          <span className="text-gray-500">Select your travel dates</span>
        )}
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200
                        rounded-lg shadow-xl p-4 left-0 right-0 md:left-auto md:right-auto md:w-auto">
          <div className="rdp-custom">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              disabled={{ before: today }}
              numberOfMonths={2}
              className="rdp"
            />
          </div>

          {/* Quick select buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">Quick select:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => quickSelect(1)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                           rounded-md transition-colors font-medium"
              >
                Single day
              </button>
              <button
                type="button"
                onClick={() => quickSelect(2)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                           rounded-md transition-colors font-medium"
              >
                Weekend (2 days)
              </button>
              <button
                type="button"
                onClick={() => quickSelect(3)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                           rounded-md transition-colors font-medium"
              >
                3 days
              </button>
              <button
                type="button"
                onClick={() => quickSelect(7)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                           rounded-md transition-colors font-medium"
              >
                1 week
              </button>
              <button
                type="button"
                onClick={() => quickSelect(14)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                           rounded-md transition-colors font-medium"
              >
                2 weeks
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            {range && (
              <button
                type="button"
                onClick={clearSelection}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                           hover:bg-gray-200 transition-colors font-medium"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg
                         hover:bg-blue-600 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
