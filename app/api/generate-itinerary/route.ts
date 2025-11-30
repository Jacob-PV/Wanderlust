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
import { GenerateItineraryRequest, Itinerary, MultiDayItinerary, DayType } from '@/types';

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
        content: 'You are an expert travel planner specializing in multi-day itineraries. Always respond with valid JSON only, no additional text or formatting.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
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
          content: 'You are a helpful travel assistant that generates detailed itineraries. Always respond with valid JSON only, no additional text or formatting.',
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
