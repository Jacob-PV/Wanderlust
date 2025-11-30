/**
 * API Route: POST /api/replace-activity
 *
 * Replace an activity in the itinerary and regenerate an optimized schedule
 * using OpenAI to handle routing, timing, and reordering intelligently.
 *
 * This endpoint:
 * 1. Validates the replacement request
 * 2. Sends the current itinerary + replacement to OpenAI
 * 3. AI regenerates the schedule with optimal routing and timing
 * 4. Returns the new itinerary with a summary of changes
 *
 * @param request - Next.js request object with JSON body
 * @returns JSON response with new itinerary and change summary
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ReplaceActivityRequest, ReplaceActivityResponse, ItineraryItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Parse request body
    const body: ReplaceActivityRequest = await request.json();
    const { currentItinerary, replaceIndex, replacement, preferences } = body;

    // Validation
    if (!currentItinerary || replaceIndex === undefined || !replacement || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (replaceIndex < 0 || replaceIndex >= currentItinerary.length) {
      return NextResponse.json(
        { error: 'Invalid replace index' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const activityToReplace = currentItinerary[replaceIndex];

    /**
     * Construct AI prompt for itinerary optimization
     *
     * The AI will:
     * - Replace the specified activity with the new one
     * - Reorder activities for optimal routing (minimize backtracking)
     * - Adjust timing to account for new drive times
     * - Maintain logical flow (meals at meal times, etc.)
     */
    const prompt = `You are a travel itinerary optimizer. A user wants to replace one activity in their itinerary with a new one.

CURRENT ITINERARY:
${JSON.stringify(currentItinerary, null, 2)}

USER WANTS TO REPLACE:
Activity #${replaceIndex + 1}: ${activityToReplace.name}
Located at: ${activityToReplace.address}

WITH THIS NEW ACTIVITY:
Name: ${replacement.name}
Type: ${replacement.type}
Address: ${replacement.address || 'TBD'}
Coordinates: ${JSON.stringify(replacement.coordinates)}

ORIGINAL PREFERENCES:
- City: ${preferences.city}
- Radius: ${preferences.radius} miles
- Activities: ${preferences.activities.join(', ')}${preferences.budget ? `\n- Budget: $${preferences.budget} USD total` : ''}${preferences.travelers ? ` for ${preferences.travelers} traveler(s)` : ''}

YOUR TASK:
Generate a new optimized itinerary that:

1. **REPLACES** activity #${replaceIndex + 1} with "${replacement.name}"
2. **REORDERS** activities for optimal routing to minimize backtracking and travel time
3. **ADJUSTS TIMING** to account for new drive times and distances
4. **MAINTAINS FLOW** - Keep the day flowing logically:
   - Breakfast/brunch: 8-11 AM
   - Lunch: 11:30 AM - 2 PM
   - Dinner: 5:30 PM - 9 PM
   - Activities spaced with realistic travel time
5. **KEEPS SAME TOTAL** - Maintain ${currentItinerary.length} activities total
6. **PRESERVES FAVORITES** - Keep other activities the user seemed to like unless reordering is necessary

IMPORTANT ROUTING CONSIDERATIONS:
- Calculate realistic travel times between activities (10-30 minutes typical)
- Arrange activities geographically to minimize total distance traveled
- Consider time of day (avoid rush hours if possible)
- Account for opening/closing hours when adjusting timing

Return your response in this EXACT JSON format:
{
  "itinerary": [
    {
      "name": "Activity Name",
      "address": "Full street address",
      "time": "9:00 AM - 11:00 AM",
      "duration": "2 hours",
      "description": "What to do here (1-2 sentences)",
      "type": "Activity type",
      "coordinates": { "lat": 40.7, "lng": -74.0 },
      "travelTime": "15 min walk",
      "estimatedCost": 25.00
    }
  ],
  "changes": {
    "summary": "Brief description of what changed (1-2 sentences)",
    "timingAdjusted": true,
    "reordered": true,
    "replaced": "${activityToReplace.name}",
    "with": "${replacement.name}"
  }
}

CRITICAL:
- Return ONLY valid JSON, no markdown blocks or additional text
- Keep the same style and quality as the original itinerary
- Provide realistic addresses and coordinates for all activities
- Ensure times are sequential and realistic
- Include travel time estimates between each activity
- Maintain cost estimates per person in USD`;

    /**
     * Call OpenAI API to regenerate the itinerary
     *
     * Using gpt-4o-mini for cost-effectiveness
     * Temperature: 0.7 for balanced optimization
     */
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner specializing in efficient, optimized itineraries. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500, // Slightly more tokens for full itinerary + change summary
    });

    // Extract and parse response
    const responseText = completion.choices[0].message.content?.trim() || '';

    // Strip markdown code blocks if present
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON response
    const result = JSON.parse(jsonText);

    // Validate response structure
    if (!result.itinerary || !Array.isArray(result.itinerary) || !result.changes) {
      throw new Error('Invalid response structure from AI');
    }

    // Construct response
    const response: ReplaceActivityResponse = {
      newItinerary: result.itinerary,
      changes: {
        replaced: result.changes.replaced || activityToReplace.name,
        with: result.changes.with || replacement.name,
        timingAdjusted: result.changes.timingAdjusted !== false, // Default to true
        reordered: result.changes.reordered !== false, // Default to true
        summary: result.changes.summary || `Replaced ${activityToReplace.name} with ${replacement.name} and optimized the schedule.`,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error replacing activity:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse optimization response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to optimize itinerary. Please try again.' },
      { status: 500 }
    );
  }
}
