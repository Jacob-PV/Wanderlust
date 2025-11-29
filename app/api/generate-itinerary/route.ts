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
import { GenerateItineraryRequest, Itinerary } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client with API key from environment
    // Using environment variable keeps the key secure (server-side only)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Parse and destructure the request body
    const body: GenerateItineraryRequest = await request.json();
    const { city, radius, preferences, coordinates, budget, travelers } = body;

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

    // Calculate per-person budget for AI prompt
    // If budget and travelers are provided, divide total budget by number of travelers
    // This gives us the budget constraint per person for the AI
    const budgetPerPerson = budget && travelers ? budget / travelers : 0;

    // Construct budget information string for the AI prompt
    // This will be injected into the prompt to guide cost recommendations
    const budgetInfo = budget && travelers
      ? `\n- Total budget: $${budget} USD for ${travelers} traveler(s) = $${budgetPerPerson.toFixed(2)} per person`
      : travelers
      ? `\n- Number of travelers: ${travelers}`
      : '';

    /**
     * Construct the AI prompt
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
