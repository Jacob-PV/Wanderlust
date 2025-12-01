# Smart Opening Hours Display & Validation

## Overview

This feature replaces the generic "Open now" badge with **date-specific opening hours** and validates that activities are scheduled during actual venue opening times. It provides intelligent warnings when timing conflicts occur and helps ensure users don't visit closed venues.

## What Changed

### 1. Enhanced Type Definitions

**File**: [types/index.ts](types/index.ts)

Added comprehensive types for opening hours data:

```typescript
// New interface for Google Places opening hours periods
export interface OpeningHoursPeriod {
  open: {
    day: number;  // 0=Sunday, 1=Monday, ..., 6=Saturday
    time: string; // 24-hour format: "0900", "1730"
  };
  close?: {
    day: number;
    time: string;
  };
}

// Updated GooglePlaceData interface
interface GooglePlaceData {
  // ... existing fields
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];      // NEW: Day-specific hours text
    periods?: OpeningHoursPeriod[]; // NEW: Structured periods data
  };
}

// Added validation fields to ItineraryItem
interface ItineraryItem {
  // ... existing fields
  validationWarning?: string;     // NEW: Warning about timing conflicts
  needsReplacement?: boolean;     // NEW: Flag for activities that can't be fixed
}
```

### 2. Time Utility Functions

**File**: [utils/timeUtils.ts](utils/timeUtils.ts) *(NEW)*

Created comprehensive time parsing and validation utilities:

- **`parseTime(timeStr)`**: Parses "2:00 PM" → `{ hours: 14, minutes: 0, period: 'PM' }`
- **`formatTime(time)`**: Converts Google's "1400" → "2:00 PM"
- **`formatTimeFromMinutes(minutes)`**: Converts minutes since midnight → "2:00 PM"
- **`getActivityDuration(timeRange)`**: Calculates duration from "9:00 AM - 11:00 AM"
- **`getHoursForDate(openingHours, date)`**: Extracts hours for specific day of week
- **`validateActivityTiming(activityTime, openingHours, date)`**: Validates timing against hours
- **`adjustActivityTime(activityTime, openingTime, closingTime)`**: Auto-adjusts conflicting times
- **`getDayOfWeek(date)`**: Returns "Monday", "Tuesday", etc.
- **`getAbbreviatedDay(date)`**: Returns "Mon", "Tue", etc.

### 3. Enhanced Google Places API Integration

**File**: [app/api/enrich-place/route.ts](app/api/enrich-place/route.ts)

Updated to fetch and return detailed opening hours:

```typescript
// Request includes periods data
const fields = [
  'place_id',
  'name',
  'rating',
  // ...
  'opening_hours',  // Now includes weekday_text AND periods
];

// Response parsing includes periods
opening_hours: result.opening_hours ? {
  open_now: result.opening_hours.open_now ?? false,
  weekday_text: result.opening_hours.weekday_text,
  periods: result.opening_hours.periods?.map((period: any) => ({
    open: {
      day: period.open.day,
      time: period.open.time,
    },
    close: period.close ? {
      day: period.close.day,
      time: period.close.time,
    } : undefined,
  })),
} : undefined,
```

### 4. Enhanced OpenAI Prompts

**File**: [app/api/generate-itinerary/route.ts](app/api/generate-itinerary/route.ts)

Added opening hours awareness to AI prompt generation:

```typescript
function getOpeningHoursGuidelines(date?: Date): string {
  return `
10. **OPENING HOURS AWARENESS**:
   - The trip is on ${dayName}
   - NEVER schedule activities during typical closing times:
     * Museums: Usually 10 AM - 5 PM or 6 PM, often closed Mondays
     * Restaurants (lunch): 11:30 AM - 2:30 PM
     * Restaurants (dinner): 5:00 PM - 10:00 PM
     * Coffee shops: 7 AM - 6 PM
     * Parks: Usually dawn to dusk (6 AM - 8 PM)
     * Shopping: Usually 10 AM - 8 PM
   - Start activities at least 30 min after opening time
   - End activities at least 30 min before closing time
   - Don't suggest:
     * Museums at 8 AM (not open yet)
     * Lunch restaurants at 4 PM (most closed)
     * Dinner restaurants at 11 PM (most closed)
   - If unsure about hours, err on the side of typical business hours (10 AM - 6 PM)`;
}
```

This guidance is added to both single-day and multi-day itinerary prompts.

### 5. OpeningHoursDisplay Component

**File**: [components/OpeningHoursDisplay.tsx](components/OpeningHoursDisplay.tsx) *(NEW)*

Smart component that displays day-specific hours with color-coded validation:

**Features**:
- ✅ **Green badge**: Valid timing, no conflicts
- ⚠️ **Yellow badge**: Timing conflict with suggested fix
- ❌ **Red badge**: Closed on this day
- 🔵 **Blue badge**: Open 24 hours

**Example outputs**:

```
✅ Mon hours: 9:00 AM – 6:00 PM
   (Green - activity time fits within hours)

⚠️ Tue hours: 10:00 AM – 5:00 PM
   ⚠️ Timing Issue
      Opens at 10:00 AM
      Suggest moving to 10:00 AM
   (Yellow - activity starts too early)

❌ Closed Mon
   (Red - venue closed on this day)

🔵 Open 24 hours
   (Blue - always open)
```

### 6. Updated Activity Cards

**Files**:
- [components/ItineraryDisplay.tsx](components/ItineraryDisplay.tsx)
- [components/DayNavigation.tsx](components/DayNavigation.tsx)

**Changes**:
1. Added `date` prop to ActivityCard components
2. Replaced "Open now" badge with `<OpeningHoursDisplay />`
3. Pass activity date to show hours for the specific trip day

**Before**:
```tsx
{enrichedData.opening_hours && (
  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
    enrichedData.opening_hours.open_now
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }`}>
    {enrichedData.opening_hours.open_now ? '✓ Open now' : '✗ Closed'}
  </span>
)}
```

**After**:
```tsx
{enrichedData.opening_hours && (
  <OpeningHoursDisplay
    openingHours={enrichedData.opening_hours}
    date={activityDate}
    activityTime={item.time}
  />
)}
```

## How It Works

### Validation Flow

1. **Google Places API** returns opening hours with `periods` array
2. **`getHoursForDate()`** extracts hours for the specific trip day
3. **`validateActivityTiming()`** checks if activity time conflicts with hours
4. **`OpeningHoursDisplay`** renders color-coded badge based on validation

### Example Validation

**Activity**: Metropolitan Museum, Tuesday, 8:00 AM - 10:00 AM
**Google Hours**: Tuesday: 10:00 AM – 5:00 PM

**Validation Result**:
```typescript
{
  isValid: false,
  reason: "Opens at 10:00 AM",
  suggestedAdjustment: "Suggest moving to 10:00 AM",
  openingTime: "10:00 AM",
  closingTime: "5:00 PM"
}
```

**Display**: Yellow warning badge with timing issue

### Edge Cases Handled

✅ **24-hour venues**: Displays "Open 24 hours" badge
✅ **Closed days**: Shows red "Closed [Day]" badge
✅ **No hours data**: Gracefully hides (assumes always open - parks, streets, etc.)
✅ **Multiple periods**: Handles lunch/dinner split (e.g., 11:30-2:30, 5:00-10:00)
✅ **Parse errors**: Fails gracefully, assumes valid to avoid breaking UI

## User Benefits

### Before (Generic "Open now")
```
Museum XYZ
📍 123 Main St
✓ Open now        ← Not helpful for future trip
$$ • 4.5 ⭐
```

### After (Smart Hours Display)
```
Museum XYZ
📍 123 Main St
✅ Fri hours: 10:00 AM – 6:00 PM   ← Shows actual hours for trip date
$$ • 4.5 ⭐
```

### With Timing Conflict
```
Museum XYZ
📍 123 Main St
⚠️ Fri hours: 10:00 AM – 6:00 PM
   ⚠️ Timing Issue
      Opens at 10:00 AM            ← Clear warning + suggestion
      Suggest moving to 10:00 AM
$$ • 4.5 ⭐
```

## AI Improvements

The OpenAI prompts now include:
- Day-of-week awareness
- Typical opening hours for venue types
- Buffer time requirements (30 min after open, 30 min before close)
- Common mistakes to avoid (museums at 8 AM, dinner at 11 PM)

This results in better itineraries out-of-the-box, reducing validation warnings.

## Technical Details

### Google Places API Cost

**No additional cost** - we already request `opening_hours` field. The `periods` data comes automatically with `opening_hours`.

**Existing cost per enrichment**: ~$0.049
**New cost per enrichment**: ~$0.049 (unchanged)

### Performance

- Time utilities are pure functions (instant)
- Validation runs client-side (no API calls)
- Opening hours cached for 24h (existing cache)
- No impact on initial page load

### Browser Compatibility

All utilities use standard JavaScript features:
- `Date.getDay()` - Universal support
- String parsing with regex - Universal support
- No external dependencies

## Future Enhancements

### Possible Additions (Not Implemented)

1. **Auto-adjust timing**: Automatically fix conflicts instead of just warning
2. **Alternative suggestions**: Suggest replacement venues if current one is closed
3. **Holiday hours**: Detect and warn about holiday schedules
4. **Real-time status**: Show if venue is currently open (keep "Open now" for current time)
5. **Click to adjust**: Interactive button to accept suggested timing adjustments

## Testing Recommendations

### Manual Testing Scenarios

1. **Different days of week**:
   - Create itinerary for Monday (many museums closed)
   - Create itinerary for Sunday (different hours)
   - Create itinerary for Friday (extended hours)

2. **Various venue types**:
   - Museums (limited hours)
   - Restaurants (lunch/dinner splits)
   - Parks (dawn to dusk)
   - 24-hour venues (diners, some attractions)

3. **Timing conflicts**:
   - Activity before opening
   - Activity after closing
   - Activity spanning closed period

4. **Edge cases**:
   - Venues with no hours data
   - Venues closed on trip day
   - Multi-period hours (lunch and dinner)

### Example Test Cases

```typescript
// Test 1: Valid timing
Activity: 2:00 PM - 4:00 PM
Hours: Monday 9:00 AM – 6:00 PM
Expected: ✅ Green badge "Mon hours: 9:00 AM – 6:00 PM"

// Test 2: Too early
Activity: 8:00 AM - 10:00 AM
Hours: Tuesday 10:00 AM – 5:00 PM
Expected: ⚠️ Yellow badge + "Opens at 10:00 AM"

// Test 3: Closed day
Activity: 2:00 PM - 4:00 PM
Hours: Monday Closed
Expected: ❌ Red badge "Closed Mon"

// Test 4: 24 hours
Activity: 2:00 AM - 3:00 AM
Hours: Open 24 hours
Expected: 🔵 Blue badge "Open 24 hours"
```

## Files Modified

### New Files
- ✨ `utils/timeUtils.ts` - Time parsing and validation utilities
- ✨ `components/OpeningHoursDisplay.tsx` - Smart hours display component
- ✨ `OPENING_HOURS_FEATURE.md` - This documentation

### Modified Files
- 📝 `types/index.ts` - Added `OpeningHoursPeriod`, updated `GooglePlaceData` and `ItineraryItem`
- 📝 `app/api/enrich-place/route.ts` - Fetch and parse `periods` data
- 📝 `app/api/generate-itinerary/route.ts` - Added opening hours awareness to prompts
- 📝 `components/ItineraryDisplay.tsx` - Use `OpeningHoursDisplay` component
- 📝 `components/DayNavigation.tsx` - Use `OpeningHoursDisplay` component

## Summary

This feature transforms the travel itinerary app from showing generic "Open now" status to providing **intelligent, date-aware opening hours validation**. Users now see:

✅ **Actual hours for their trip date**
⚠️ **Clear warnings about timing conflicts**
💡 **Suggestions to fix conflicts**
🎯 **Better AI-generated itineraries** (with hours awareness)

The implementation is **zero-cost** (uses existing API calls), **performant** (client-side validation), and **user-friendly** (color-coded visual feedback).
