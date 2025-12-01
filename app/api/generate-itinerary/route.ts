/**
 * API Route: POST /api/generate-itinerary
 *
 * Generates a personalized travel itinerary using OpenAI's GPT-4o-mini model.
 *
 * This endpoint:
 * 1. Validates user input (city, radius, preferences)
 * 2. Constructs a detailed AI prompt with budget/travel time constraints
 * 3. Calls OpenAI API to generate structured itinerary JSON
 * 4. Parses and returns the itinerary to the client
 *
 * @param request - Next.js request object with JSON body
 * @returns JSON response with itinerary or error
 *
 * @example
 * // Request:
 * POST /api/generate-itinerary
 * {
 *   "city": "New York",
 *   "radius": "5",
 *   "preferences": ["Museums", "Restaurants"],
 *   "coordinates": { "lat": 40.7128, "lng": -74.0060 },
 *   "budget": 200,
 *   "travelers": 2
 * }
 *
 * // Response (200):
 * {
 *   "city": "New York",
 *   "itinerary": [
 *     {
 *       "name": "Metropolitan Museum",
 *       "address": "1000 5th Ave...",
 *       "time": "9:00 AM - 11:00 AM",
 *       "duration": "2 hours",
 *       "description": "...",
 *       "type": "Museums",
 *       "coordinates": { "lat": 40.7794, "lng": -73.9632 },
 *       "travelTime": "Start of day",
 *       "estimatedCost": 30
 *     },
 *     // ... more activities
 *   ]
 * }
 *
 * // Error Response (400):
 * { "error": "Missing required fields" }
 *
 * // Error Response (500):
 * { "error": "OpenAI API key is not configured" }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { format, differenceInDays, addDays } from 'date-fns';
import { GenerateItineraryRequest, Itinerary, MultiDayItinerary, DayType, ItineraryItem, GooglePlaceData } from '@/types';
import { validateActivityTiming, getActivityDuration, parseTime, formatTimeFromMinutes } from '@/utils/timeUtils';

/**
 * Calculate the number of days in a date range
 */
function getDayCount(startDate: Date, endDate: Date): number {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
}

/**
 * Determine the day type based on position in trip
 */
function getDayType(dayIndex: number, totalDays: number): DayType {
  if (dayIndex === 0) return 'arrival';
  if (dayIndex === totalDays - 1) return 'departure';
  return 'full';
}

/**
 * Get activity count based on day type and pace
 */
function getActivityCount(dayType: DayType, pace: string): string {
  if (dayType === 'arrival' || dayType === 'departure') {
    return '2-3';
  }

  switch (pace) {
    case 'relaxed':
      return '3-4';
    case 'moderate':
      return '5-6';
    case 'packed':
      return '7-8';
    default:
      return '5-6';
  }
}

/**
 * Get time range based on day type
 */
function getTimeRange(dayType: DayType): { start: string; end: string } {
  switch (dayType) {
    case 'arrival':
      return { start: '2:00 PM', end: '9:00 PM' };
    case 'departure':
      return { start: '9:00 AM', end: '2:00 PM' };
    case 'full':
    default:
      return { start: '9:00 AM', end: '9:00 PM' };
  }
}

// Limits for validation and replacement
const VALIDATION_LIMITS = {
  MAX_ALTERNATIVES_PER_VENUE: 5,
  REPLACEMENT_TIMEOUT_MS: 10000,
  MAX_PARALLEL_ENRICHMENTS: 10,
};

/**
 * Map our activity types to Google Places API types
 * Google Places uses specific type values: https://developers.google.com/maps/documentation/places/web-service/supported_types
 */
function mapActivityTypeToGoogleType(activityType: string): string {
  const mapping: Record<string, string> = {
    'Restaurants': 'restaurant',
    'Museums': 'museum',
    'Parks & Outdoors': 'park',
    'Nightlife & Bars': 'bar',
    'Shopping': 'shopping_mall',
    'Historical Sites': 'tourist_attraction',
    'Entertainment': 'movie_theater',
    'Coffee Shops': 'cafe',
    'Art Galleries': 'art_gallery',
    'Sports & Recreation': 'stadium',
  };

  return mapping[activityType] || activityType.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Try to adjust activity timing to fit within opening hours
 *
 * @param activityTime - Current activity time (e.g., "8:00 AM - 10:00 AM")
 * @param openingTime - Opening time (e.g., "10:00 AM")
 * @param closingTime - Closing time (e.g., "6:00 PM")
 * @param duration - Activity duration in minutes
 * @returns Adjusted time string or null if can't fit
 */
function tryAdjustTimingToFit(
  activityTime: string,
  openingTime: string,
  closingTime: string,
  duration: number
): string | null {
  try {
    // Parse opening and closing times
    const opening = parseTime(openingTime);
    const closing = parseTime(closingTime);

    // Convert to minutes since midnight
    const openingMinutes = opening.hours * 60 + opening.minutes;
    const closingMinutes = closing.hours * 60 + closing.minutes;

    // Try Strategy 1: Shift to start at opening time
    const newEndMinutes = openingMinutes + duration;
    if (newEndMinutes <= closingMinutes) {
      const newStart = formatTimeFromMinutes(openingMinutes);
      const newEnd = formatTimeFromMinutes(newEndMinutes);
      return `${newStart} - ${newEnd}`;
    }

    // Try Strategy 2: Shift to end at closing time
    const newStartMinutes = closingMinutes - duration;
    if (newStartMinutes >= openingMinutes) {
      const newStart = formatTimeFromMinutes(newStartMinutes);
      const newEnd = formatTimeFromMinutes(closingMinutes);
      return `${newStart} - ${newEnd}`;
    }

    // Can't fit - activity duration is longer than available hours
    return null;
  } catch (error) {
    console.error('Error adjusting timing:', error);
    return null;
  }
}

/**
 * Fetch Google Places data for a single activity
 */
async function fetchGooglePlaceData(
  name: string,
  address: string,
  city: string,
  coordinates?: { lat: number; lng: number }
): Promise<GooglePlaceData | null> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    // Step 1: Text Search
    const searchQuery = `${name} ${city}`;
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', searchQuery);
    searchUrl.searchParams.append('key', apiKey);

    if (coordinates) {
      searchUrl.searchParams.append('location', `${coordinates.lat},${coordinates.lng}`);
      searchUrl.searchParams.append('radius', '5000');
    }

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (!searchData.results?.[0]?.place_id) {
      console.warn(`No place found for: ${name}`);
      return null;
    }

    const placeId = searchData.results[0].place_id;

    // Step 2: Place Details
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.append('place_id', placeId);
    detailsUrl.searchParams.append('fields',
      'place_id,name,rating,user_ratings_total,reviews,photos,opening_hours,price_level,formatted_phone_number,website,formatted_address'
    );
    detailsUrl.searchParams.append('key', apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    if (!detailsData.result) {
      return null;
    }

    const result = detailsData.result;
    return {
      place_id: placeId,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: result.reviews?.slice(0, 3),
      photos: result.photos?.slice(0, 5),
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
      price_level: result.price_level,
      formatted_phone_number: result.formatted_phone_number,
      website: result.website,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error(`Error fetching Google data for ${name}:`, error);
    return null;
  }
}

/**
 * Batch enrich all activities with Google Places data in parallel
 */
async function enrichAllActivities(
  days: Array<{ date: Date; activities: ItineraryItem[] }>,
  city: string
): Promise<void> {
  console.log('🔍 Enriching activities with Google Places data...');

  // Collect all activities across all days
  const allActivities: Array<{ activity: ItineraryItem; dayIndex: number; activityIndex: number }> = [];
  days.forEach((day, dayIndex) => {
    day.activities.forEach((activity, activityIndex) => {
      allActivities.push({ activity, dayIndex, activityIndex });
    });
  });

  // Process in batches to avoid overwhelming the API
  const batchSize = VALIDATION_LIMITS.MAX_PARALLEL_ENRICHMENTS;
  for (let i = 0; i < allActivities.length; i += batchSize) {
    const batch = allActivities.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async ({ activity }) => {
        const googleData = await fetchGooglePlaceData(
          activity.name,
          activity.address,
          city,
          activity.coordinates
        );
        activity.googleData = googleData || undefined;
      })
    );

    // Small delay between batches to respect rate limits
    if (i + batchSize < allActivities.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`✅ Enrichment complete (${allActivities.length} activities)`);
}

/**
 * Find a replacement for a closed venue
 */
async function findReplacement(
  closedActivity: ItineraryItem,
  activityDate: Date,
  city: string,
  radius: number
): Promise<ItineraryItem | null> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;

    console.log(`🔄 Searching for replacement for: ${closedActivity.name}`);

    // Use Nearby Search to find alternatives of the same type
    const googleType = mapActivityTypeToGoogleType(closedActivity.type);
    const nearbyUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    nearbyUrl.searchParams.append('location',
      `${closedActivity.coordinates.lat},${closedActivity.coordinates.lng}`
    );
    nearbyUrl.searchParams.append('radius', String(radius * 1600)); // miles to meters
    nearbyUrl.searchParams.append('type', googleType);
    nearbyUrl.searchParams.append('key', apiKey);

    console.log(`   Searching for type: ${googleType} (from ${closedActivity.type})`);

    const nearbyResponse = await fetch(nearbyUrl.toString());
    const nearbyData = await nearbyResponse.json();

    if (!nearbyData.results || nearbyData.results.length === 0) {
      console.log(`❌ No alternatives found for ${closedActivity.name}`);
      return null;
    }

    // Try up to MAX_ALTERNATIVES_PER_VENUE alternatives
    const maxAttempts = Math.min(
      nearbyData.results.length,
      VALIDATION_LIMITS.MAX_ALTERNATIVES_PER_VENUE
    );

    for (let i = 0; i < maxAttempts; i++) {
      const place = nearbyData.results[i];

      // Skip if it's the same place
      if (place.name.toLowerCase() === closedActivity.name.toLowerCase()) {
        console.log(`   Skipping same venue: ${place.name}`);
        continue;
      }

      console.log(`   Checking alternative ${i + 1}/${maxAttempts}: ${place.name}`);

      // Fetch details with opening hours
      const googleData = await fetchGooglePlaceData(
        place.name,
        place.vicinity || place.formatted_address,
        city,
        {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        }
      );

      if (!googleData) {
        console.log(`   ❌ Could not fetch data for ${place.name}`);
        continue;
      }

      if (!googleData.opening_hours) {
        console.log(`   ⚠️ No opening hours data for ${place.name}, skipping`);
        continue;
      }

      // Validate this alternative is open during the scheduled time
      const validation = validateActivityTiming(
        closedActivity.time,
        googleData.opening_hours,
        activityDate
      );

      if (validation.isValid) {
        console.log(`   ✅ Found valid replacement: ${place.name}`);

        // Create replacement activity with same structure
        const replacement: ItineraryItem = {
          ...closedActivity,
          name: place.name,
          address: place.vicinity || place.formatted_address || closedActivity.address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          googleData,
          estimatedCost: closedActivity.estimatedCost, // Keep original estimate
        };

        return replacement;
      } else {
        console.log(`   ❌ ${place.name} also closed: ${validation.reason}`);
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`❌ No open replacement found after ${maxAttempts} attempts`);
    return null;
  } catch (error) {
    console.error(`Error finding replacement for ${closedActivity.name}:`, error);
    return null;
  }
}

/**
 * Validate and replace closed venues in the itinerary
 */
async function validateAndReplaceClosedVenues(
  itinerary: MultiDayItinerary,
  city: string,
  radius: number
): Promise<void> {
  console.log('🔍 Validating venue opening hours...');

  // Step 1: Enrich all activities with Google Places data
  await enrichAllActivities(itinerary.days, city);

  // Step 2: Validate and replace closed venues
  let totalReplaced = 0;
  let totalValidated = 0;

  for (const day of itinerary.days) {
    for (let i = 0; i < day.activities.length; i++) {
      const activity = day.activities[i];
      totalValidated++;

      // Skip if no Google data (can't validate)
      if (!activity.googleData?.opening_hours) {
        console.log(`ℹ️ No hours data for ${activity.name}, assuming open`);
        continue;
      }

      // Validate timing
      const validation = validateActivityTiming(
        activity.time,
        activity.googleData.opening_hours,
        new Date(day.date)
      );

      if (!validation.isValid) {
        console.log(`❌ ${activity.name} timing issue: ${validation.reason}`);

        // Try to auto-adjust the timing first
        if (validation.openingTime && validation.closingTime) {
          const duration = getActivityDuration(activity.time);
          const adjustedTime = tryAdjustTimingToFit(
            activity.time,
            validation.openingTime,
            validation.closingTime,
            duration
          );

          if (adjustedTime) {
            console.log(`✅ Auto-adjusted ${activity.name} timing to: ${adjustedTime}`);
            activity.time = adjustedTime;
            continue; // Successfully adjusted, no need to replace
          }
        }

        // Couldn't adjust timing, try to find a replacement
        const replacement = await findReplacement(
          activity,
          new Date(day.date),
          city,
          radius
        );

        if (replacement) {
          // Replace the activity
          day.activities[i] = replacement;
          totalReplaced++;
          console.log(`✅ Replaced ${activity.name} with ${replacement.name}`);
        } else {
          // Keep original but add warning
          activity.validationWarning = validation.reason;
          activity.needsReplacement = true;
          console.log(`⚠️ Keeping ${activity.name} with warning: ${validation.reason}`);
        }
      }
    }
  }

  console.log(`✅ Validation complete: ${totalValidated} activities checked, ${totalReplaced} replaced`);
}

/**
 * Validate and replace closed venues in single-day itinerary
 */
async function validateAndReplaceClosedVenuesSingleDay(
  activities: ItineraryItem[],
  city: string,
  radius: number,
  date: Date
): Promise<void> {
  console.log('🔍 Validating venue opening hours...');

  // Step 1: Enrich all activities with Google Places data
  await enrichAllActivities([{ date, activities }], city);

  // Step 2: Validate and replace closed venues
  let totalReplaced = 0;
  let totalValidated = 0;

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    totalValidated++;

    // Skip if no Google data (can't validate)
    if (!activity.googleData?.opening_hours) {
      console.log(`ℹ️ No hours data for ${activity.name}, assuming open`);
      continue;
    }

    // Validate timing
    const validation = validateActivityTiming(
      activity.time,
      activity.googleData.opening_hours,
      date
    );

    if (!validation.isValid) {
      console.log(`❌ ${activity.name} timing issue: ${validation.reason}`);

      // Try to auto-adjust the timing first
      if (validation.openingTime && validation.closingTime) {
        const duration = getActivityDuration(activity.time);
        const adjustedTime = tryAdjustTimingToFit(
          activity.time,
          validation.openingTime,
          validation.closingTime,
          duration
        );

        if (adjustedTime) {
          console.log(`✅ Auto-adjusted ${activity.name} timing to: ${adjustedTime}`);
          activity.time = adjustedTime;
          continue; // Successfully adjusted, no need to replace
        }
      }

      // Couldn't adjust timing, try to find a replacement
      const replacement = await findReplacement(
        activity,
        date,
        city,
        radius
      );

      if (replacement) {
        // Replace the activity
        activities[i] = replacement;
        totalReplaced++;
        console.log(`✅ Replaced ${activity.name} with ${replacement.name}`);
      } else {
        // Keep original but add warning
        activity.validationWarning = validation.reason;
        activity.needsReplacement = true;
        console.log(`⚠️ Keeping ${activity.name} with warning: ${validation.reason}`);
      }
    }
  }

  console.log(`✅ Validation complete: ${totalValidated} activities checked, ${totalReplaced} replaced`);
}

/**
 * Get opening hours guidelines for AI prompt
 */
function getOpeningHoursGuidelines(date?: Date): string {
  const dayName = date ? format(date, 'EEEE') : 'the trip date';

  return `
10. **CRITICAL: ENSURE ALL VENUES ARE OPEN DURING SUGGESTED TIMES**:

   The trip is on ${dayName}.

   🚨 MANDATORY REQUIREMENT 🚨
   Every venue you suggest MUST be open during the time you schedule it.

   Before including ANY activity in your itinerary, you MUST verify:

   ✓ Is this type of venue typically open on ${dayName}?
   ✓ Is this type of venue typically open at the time I'm suggesting?
   ✓ Have I included a 30-minute safety buffer from opening/closing times?

   SELF-CHECK PROCESS FOR EACH ACTIVITY:

   Step 1: Identify the venue type (museum, restaurant, park, shop, etc.)
   Step 2: Consider typical hours for that venue type in this city
   Step 3: Check if the venue type is typically open on ${dayName}
   Step 4: Verify your suggested time fits within typical operating hours
   Step 5: Add 30-min buffers (start 30 min after opening, end 30 min before closing)

   COMMON OPERATING HOURS (as general guidance):
   - Museums/Galleries: Often 10 AM - 5/6 PM, many closed Mondays
   - Restaurants (lunch): Typically 11:30 AM - 2:30 PM
   - Restaurants (dinner): Typically 5:00 PM - 10:00 PM
   - Coffee shops: Typically 7 AM - 6/7 PM
   - Parks: Usually dawn to dusk, open daily
   - Retail shops: Typically 10 AM - 8 PM, reduced Sunday hours
   - Attractions: Often 10 AM - 6 PM, check day-specific closures

   IF YOU'RE UNSURE:
   - Research typical hours for that specific venue type and location
   - Use conservative timing (11 AM - 5 PM is usually safe for most venues)
   - Choose venues that are more likely to be open (parks over museums on Mondays)
   - It's better to suggest fewer activities with correct timing than many with errors

   FINAL VERIFICATION:
   Before finalizing your response, review EVERY activity and ask:
   "Would I confidently tell a friend to visit this venue at this time on this day?"
   If the answer isn't a definite YES, adjust the timing or choose a different venue.

   Remember: Users are relying on this itinerary for real travel plans.
   Suggesting a closed venue creates a terrible experience.`;
}

/**
 * Generate multi-day itinerary
 */
async function generateMultiDayItinerary(
  openai: any,
  city: string,
  radius: string,
  preferences: string[],
  coordinates: any,
  dateRange: any,
  numDays: number,
  pace: string,
  dailyHours: number,
  budgetPerPerson: number,
  budgetInfo: string
) {
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  const prompt = `You are an expert travel planner creating a ${numDays}-day itinerary for ${city}.

TRIP DETAILS:
- Destination: ${city}
- Dates: ${format(startDate, 'MMMM d, yyyy')} to ${format(endDate, 'MMMM d, yyyy')} (${numDays} days)
- Search radius: Within ${radius} miles from city center
- Interests: ${preferences.join(', ')}
- Pace: ${pace}
- Daily activity hours: ${dailyHours}${budgetInfo}

DAY PLANNING STRATEGY:

Day 1 (${format(startDate, 'EEEE, MMMM d')}):
- Arrival day - assume check-in around 2:00 PM
- Start activities at 2:00 PM
- ${getActivityCount('arrival', pace)} lighter activities
- End by 9:00 PM
- Focus on nearby activities to ease into the trip

${numDays > 2 ? `Days 2-${numDays - 1} (Full Days):
- Full day of activities
- Start at 9:00 AM
- ${getActivityCount('full', pace)} activities per day
- Include breakfast/brunch, lunch, and dinner
- Mix activity types for variety
- Consider energy levels (don't schedule all museums in one day)
- Balance educational with recreational activities
` : ''}

${numDays > 1 ? `Day ${numDays} (${format(endDate, 'EEEE, MMMM d')}):
- Departure day - assume checkout by 11:00 AM
- Start at 9:00 AM
- End activities by 2:00 PM for travel
- ${getActivityCount('departure', pace)} activities maximum
- Focus on nearby activities
- Include a nice final meal or experience
` : ''}

CRITICAL REQUIREMENTS:

1. **GEOGRAPHIC OPTIMIZATION**:
   - Group activities that are near each other
   - Minimize backtracking across the city
   - Account for 15-30 min travel time between locations
   - Consider natural geographic flow (downtown → neighborhood → back)

2. **VARIETY ACROSS DAYS**:
   - Don't repeat the same restaurant or venue
   - Mix indoor and outdoor activities each day
   - Balance museums/culture with parks/recreation
   - Vary the pace - don't make every day intense

3. **REALISTIC TIMING**:
   - Each activity's start time accounts for:
     * Duration of previous activity
     * Travel time (10-30 minutes depending on distance)
     * Short breaks (5-10 minutes)
   - Don't schedule activities back-to-back without travel time

4. **MEAL PLANNING**:
   - Day 1: Dinner only (arrival day)
   - Full days: Include breakfast/brunch, lunch, and dinner options
   - Final day: Brunch or lunch before departure
   - Suggest restaurants near other activities to minimize travel

5. **COST MANAGEMENT**:
   - Provide realistic per-person costs in USD
   - Mix free and paid activities${budgetPerPerson > 0 ? `\n   - Stay within $${budgetPerPerson.toFixed(2)} per person budget` : ''}
   - Consider ${city} pricing levels

6. **COORDINATES**:
   - Include accurate latitude/longitude for each location
   - Ensure all locations are within ${radius} miles of city center${coordinates ? `\n   - City center: ${coordinates.lat}, ${coordinates.lng}` : ''}

DAY-OF-WEEK AWARENESS:
${Array.from({ length: numDays }, (_, i) => {
  const dayDate = new Date(startDate);
  dayDate.setDate(startDate.getDate() + i);
  const dayName = format(dayDate, 'EEEE');

  return `
Day ${i + 1} is ${dayName} - verify each venue will be open on this day`;
}).join('')}

${getOpeningHoursGuidelines(startDate)}

Return the response in this EXACT JSON format:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "${format(startDate, 'yyyy-MM-dd')}",
      "dayType": "arrival",
      "summary": "Arrival day - taking it easy",
      "activities": [
        {
          "name": "Activity Name",
          "address": "Full street address",
          "time": "2:00 PM - 3:30 PM",
          "duration": "1.5 hours",
          "description": "What to do here (1-2 sentences)",
          "type": "One of: ${preferences.join(', ')}",
          "coordinates": { "lat": 0.0, "lng": 0.0 },
          "travelTime": "Start of day",
          "estimatedCost": 0.0
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- Provide realistic places that actually exist in ${city}
- Include specific addresses
- Make sure times don't overlap
- Account for travel time between activities
- Maintain the same quality and detail for ALL ${numDays} days
- Each day should have a brief summary describing the day's theme or focus`;

  // Adjust token limit based on trip length
  const maxTokens = Math.min(8000, 1000 + (numDays * 500));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert travel planner specializing in multi-day itineraries.

CRITICAL: Before suggesting any venue, verify it will be open during the time you schedule it. Consider the day of the week and typical operating hours for that venue type. Only suggest venues you're confident will be open.

Always respond with valid JSON only, no additional text or formatting.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const responseText = completion.choices[0].message.content?.trim() || '';

  let jsonText = responseText;
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }

  const parsed = JSON.parse(jsonText);

  // Transform the response into MultiDayItinerary format
  const multiDayItinerary: MultiDayItinerary = {
    tripId: `trip-${Date.now()}`,
    city,
    dateRange: {
      startDate: startDate,
      endDate: endDate,
    },
    days: parsed.days.map((day: any, index: number) => ({
      date: addDays(startDate, index),
      dayNumber: index + 1,
      dayType: getDayType(index, numDays),
      summary: day.summary || '',
      activities: day.activities,
    })),
    totalActivities: parsed.days.reduce((sum: number, day: any) => sum + day.activities.length, 0),
    createdAt: new Date(),
  };

  // Validate and replace closed venues
  await validateAndReplaceClosedVenues(multiDayItinerary, city, parseInt(radius));

  return NextResponse.json(multiDayItinerary);
}

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client with API key from environment
    // Using environment variable keeps the key secure (server-side only)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Parse and destructure the request body
    const body: GenerateItineraryRequest = await request.json();
    const { city, radius, preferences, coordinates, budget, travelers, dateRange, pace, dailyHours } = body;

    // Validate required fields
    // City, radius, and at least one preference are mandatory
    if (!city || !radius || !preferences || preferences.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check that OpenAI API key is configured
    // Without this, we cannot generate itineraries
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Determine if this is a multi-day itinerary
    const isMultiDay = dateRange && dateRange.startDate && dateRange.endDate;
    const numDays = isMultiDay ? getDayCount(dateRange.startDate, dateRange.endDate) : 1;

    // Validate trip length
    if (isMultiDay && numDays > 14) {
      return NextResponse.json(
        { error: 'Trip length cannot exceed 14 days' },
        { status: 400 }
      );
    }

    // Calculate per-person budget for AI prompt
    const budgetPerPerson = budget && travelers ? budget / travelers : 0;
    const budgetInfo = budget && travelers
      ? `\n- Total budget: $${budget} USD for ${travelers} traveler(s) = $${budgetPerPerson.toFixed(2)} per person`
      : travelers
      ? `\n- Number of travelers: ${travelers}`
      : '';

    /**
     * Generate itinerary based on trip type (single-day vs multi-day)
     */
    if (isMultiDay) {
      // Multi-day itinerary generation
      return await generateMultiDayItinerary(
        openai,
        city,
        radius,
        preferences,
        coordinates,
        dateRange,
        numDays,
        pace || 'moderate',
        dailyHours || 10,
        budgetPerPerson,
        budgetInfo
      );
    }

    // Single-day itinerary generation (existing logic)
    /**
     * Construct the AI prompt for single-day
     *
     * This prompt is carefully engineered to:
     * - Guide the AI to generate realistic, geographically optimized itineraries
     * - Account for travel time between locations (walking, transit, driving)
     * - Provide cost estimates per activity
     * - Stay within budget constraints (if provided)
     * - Return valid JSON in the exact format we need
     *
     * The prompt uses several techniques:
     * 1. Clear role definition ("You are a travel itinerary planner")
     * 2. Specific constraints (radius, activity count, time range)
     * 3. Critical requirements (numbered and bolded)
     * 4. JSON format specification with examples
     * 5. Important reminders at the end
     */
    const prompt = `You are a travel itinerary planner. Generate a detailed day itinerary for ${city} with the following specifications:

- Search radius: ${radius} miles from the city center
- Activity preferences: ${preferences.join(', ')}
- Number of activities: 6-8 activities for a full day
- Time range: 9:00 AM to 9:00 PM${budgetInfo}

CRITICAL Requirements:
1. Return ONLY valid JSON, no additional text or markdown
2. Include realistic locations that actually exist in ${city}
3. Provide specific addresses for each location
4. Include varied activities based on the preferences
5. **ACCOUNT FOR TRAVEL TIME**: Space activities appropriately with realistic travel time between locations
   - Consider walking time (15-20 min per mile)
   - Consider public transit time (10-15 min between stops)
   - Consider driving time in traffic (varies by city)
   - Leave buffer time between activities for transitions
6. **OPTIMIZE ROUTE**: Arrange activities in a logical geographic order to minimize backtracking
7. **REALISTIC TIMING**: Each activity's start time should account for:
   - Duration of previous activity
   - Travel time from previous location (estimate 10-30 minutes depending on distance)
   - Short breaks between activities (5-10 minutes)
8. **COST ESTIMATES**: Provide realistic cost estimates per person in USD for each activity
   - Include admission fees, meal costs, or activity costs
   - Use $0 for free activities (parks, walking tours, etc.)${budget ? `\n   - Keep total costs within budget of $${budgetPerPerson.toFixed(2)} per person` : ''}
   - Consider typical prices in ${city}
9. Include realistic coordinates (latitude/longitude) for each location within ${radius} miles of the city center${coordinates ? ` (center: ${coordinates.lat}, ${coordinates.lng})` : ''}
${getOpeningHoursGuidelines()}

Example timing flow:
- Activity 1: 9:00 AM - 10:30 AM (1.5 hours at location)
- Travel time: 10:30 AM - 10:50 AM (20 minutes to next location)
- Activity 2: 11:00 AM - 12:30 PM (1.5 hours at location)

Return the response in this EXACT JSON format:
{
  "city": "${city}",
  "itinerary": [
    {
      "name": "Activity/Location Name",
      "address": "Full street address",
      "time": "Start time - End time (e.g., 9:00 AM - 10:30 AM)",
      "duration": "X hours/minutes",
      "description": "Brief description of what to do here (1-2 sentences)",
      "type": "One of: ${preferences.join(', ')}",
      "coordinates": {
        "lat": 0.0,
        "lng": 0.0
      },
      "travelTime": "Estimated travel time from previous location (e.g., '15 min walk' or '10 min drive'). Use 'Start of day' for first location.",
      "estimatedCost": 0.0
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks or additional text
- Ensure times are sequential and realistic with travel time included
- Activities should be geographically optimized to minimize travel time
- estimatedCost should be per person in USD (use 0 for free activities)${budget ? `\n- Total costs should stay within $${budgetPerPerson.toFixed(2)} per person budget` : ''}`;

    /**
     * Call OpenAI API to generate itinerary
     *
     * Model: gpt-4o-mini
     * - Cost-effective ($0.15/1M input tokens, $0.60/1M output tokens)
     * - Fast response times (~2-4 seconds)
     * - Sufficient capability for structured JSON generation
     *
     * Temperature: 0.7
     * - Balanced between deterministic (0.0) and creative (1.0)
     * - Provides variety while maintaining accuracy
     *
     * Max Tokens: 2000
     * - Enough for 6-8 activities with full details
     * - Prevents excessive API costs
     *
     * Messages:
     * - System message: Sets AI behavior (return JSON only)
     * - User message: Contains the detailed prompt
     */
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful travel assistant that generates detailed itineraries.

CRITICAL: Before suggesting any venue, verify it will be open during the time you schedule it. Consider the day of the week and typical operating hours for that venue type. Only suggest venues you're confident will be open.

Always respond with valid JSON only, no additional text or formatting.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,      // Balanced creativity
      max_tokens: 2000,      // Sufficient for full itinerary
    });

    // Extract the response text from OpenAI's completion
    const responseText = completion.choices[0].message.content?.trim() || '';

    /**
     * Parse the AI response
     *
     * Sometimes GPT models wrap JSON in markdown code blocks despite instructions.
     * We need to strip these markers before parsing to avoid JSON.parse errors.
     *
     * Patterns handled:
     * - ```json\n{...}\n```
     * - ```\n{...}\n```
     * - {...} (clean JSON)
     */
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON string into an Itinerary object
    const itinerary: Itinerary = JSON.parse(jsonText);

    // Validate and replace closed venues
    if (itinerary.itinerary && itinerary.itinerary.length > 0) {
      const tripDate = new Date(); // Use current date for single-day trips
      await validateAndReplaceClosedVenuesSingleDay(
        itinerary.itinerary,
        city,
        parseInt(radius),
        tripDate
      );
    }

    // Return the itinerary to the client
    return NextResponse.json(itinerary);
  } catch (error) {
    // Log error for debugging (visible in server logs)
    console.error('Error generating itinerary:', error);

    /**
     * Handle different error types
     *
     * SyntaxError: JSON parsing failed
     * - AI returned invalid JSON format
     * - Markdown stripping didn't work
     *
     * Other errors:
     * - OpenAI API errors (network, rate limit, etc.)
     * - Invalid API key
     * - Timeout
     */
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse itinerary response. Please try again.' },
        { status: 500 }
      );
    }

    // Generic error for all other failures
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 500 }
    );
  }
}
