import { NextRequest } from 'next/server';
import { AlternativeActivity } from '@/types';
import { validateActivityTiming } from '@/utils/timeUtils';

/**
 * GET /api/find-alternatives
 *
 * Find alternative activities of the same type nearby using Google Places API.
 * Now filters by opening hours and validates timing.
 *
 * Query parameters:
 * - type: Activity type (e.g., "museum", "restaurant")
 * - lat: Latitude of current location
 * - lng: Longitude of current location
 * - radius: Search radius in meters (default: 8000 = ~5 miles)
 * - date: ISO date string for the activity (for day-specific hours validation)
 * - time: Activity time slot (e.g., "2:00 PM - 4:00 PM") to validate against hours
 *
 * @returns Array of alternative activities that are actually open during the requested time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const activityType = searchParams.get('type');
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lng');
    const radius = searchParams.get('radius') || '8000'; // Default 8km (~5 miles)
    const dateStr = searchParams.get('date'); // New: date for validation
    const timeSlot = searchParams.get('time'); // New: time slot to validate

    // Validation
    if (!activityType || !latitude || !longitude) {
      return Response.json(
        { error: 'Missing required parameters: type, lat, lng' },
        { status: 400 }
      );
    }

    // Parse date if provided
    const activityDate = dateStr ? new Date(dateStr) : new Date();

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return Response.json(
        { error: 'Google Places API not configured' },
        { status: 500 }
      );
    }

    // Map activity types to Google Places types
    const typeMapping: Record<string, string> = {
      'Restaurants': 'restaurant',
      'Museums': 'museum',
      'Parks & Outdoors': 'park',
      'Nightlife & Bars': 'bar',
      'Shopping': 'shopping_mall',
      'Historical Sites': 'tourist_attraction',
      'Entertainment': 'amusement_park',
      'Coffee Shops': 'cafe',
      'Art Galleries': 'art_gallery',
      'Sports & Recreation': 'gym',
    };

    const googleType = typeMapping[activityType] || 'point_of_interest';

    // Call Google Places Nearby Search API
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.set('location', `${latitude},${longitude}`);
    placesUrl.searchParams.set('radius', radius);
    placesUrl.searchParams.set('type', googleType);
    placesUrl.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

    const response = await fetch(placesUrl.toString());

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return Response.json({ alternatives: [] });
    }

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return Response.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Helper function to calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3958.8; // Earth's radius in miles
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Format and enrich results with opening hours validation
    const enrichedAlternatives: AlternativeActivity[] = [];

    // Process top results and fetch detailed opening hours
    for (const place of data.results.slice(0, 20)) {
      try {
        // Fetch detailed place info including opening hours
        // NOTE: The 'opening_hours' field includes both weekday_text and periods
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', place.place_id);
        detailsUrl.searchParams.set('fields', 'opening_hours,rating,user_ratings_total');
        detailsUrl.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!);

        console.log(`[Find-Alternatives] Fetching details for: ${place.name} (${place.place_id})`);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        console.log(`[Find-Alternatives] API Response status: ${detailsData.status}`);

        if (detailsData.status !== 'OK') {
          console.log(`[Find-Alternatives] SKIPPING ${place.name}: API status ${detailsData.status}`);
          continue; // Skip this place if we can't get details
        }

        const openingHours = detailsData.result?.opening_hours;

        // Log the actual opening hours structure to debug
        if (openingHours) {
          console.log(`[Find-Alternatives] ${place.name} opening_hours structure:`, JSON.stringify(openingHours, null, 2));
        }

        console.log(`[Find-Alternatives] ${place.name}: Has opening_hours: ${!!openingHours}, Has periods: ${!!openingHours?.periods}, Periods length: ${openingHours?.periods?.length || 0}`);

        // If time slot provided, validate that this place is open during that time
        let isValidTiming = true;
        if (timeSlot && openingHours?.periods) {
          const validation = validateActivityTiming(
            timeSlot,
            openingHours,
            activityDate
          );
          console.log(`[Find-Alternatives] ${place.name}: Validation result: ${validation.isValid}, Reason: ${validation.reason || 'N/A'}`);
          isValidTiming = validation.isValid;
        } else if (timeSlot && !openingHours?.periods) {
          console.log(`[Find-Alternatives] ${place.name}: SKIPPING - No periods data available for validation`);
          // If we don't have periods data, we can't validate, so skip this place
          isValidTiming = false;
        }

        // Only include if timing is valid
        if (isValidTiming) {
          enrichedAlternatives.push({
            name: place.name,
            rating: detailsData.result?.rating || place.rating,
            userRatingsTotal: detailsData.result?.user_ratings_total || place.user_ratings_total,
            vicinity: place.vicinity,
            type: activityType,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            openNow: openingHours?.open_now,
            openingHours: openingHours ? {
              open_now: openingHours.open_now,
              weekday_text: openingHours.weekday_text,
              periods: openingHours.periods,
            } : undefined,
            distance: calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            placeId: place.place_id,
          });
        }

        // Stop if we have enough valid alternatives
        if (enrichedAlternatives.length >= 10) {
          break;
        }
      } catch (error) {
        console.error(`Error enriching place ${place.name}:`, error);
        // Continue to next place
      }
    }

    // Sort by rating (descending) and then by distance (ascending)
    enrichedAlternatives.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      // If rating difference is significant (>0.3), sort by rating
      if (Math.abs(ratingDiff) > 0.3) {
        return ratingDiff;
      }
      // Otherwise, prefer closer locations
      return a.distance - b.distance;
    });

    console.log(`Found ${enrichedAlternatives.length} alternatives that are open during ${timeSlot || 'requested time'}`);

    return Response.json({ alternatives: enrichedAlternatives });
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return Response.json(
      { error: 'Failed to find alternative activities' },
      { status: 500 }
    );
  }
}
