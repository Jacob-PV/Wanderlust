import { NextRequest } from 'next/server';
import { AlternativeActivity } from '@/types';

/**
 * GET /api/find-alternatives
 *
 * Find alternative activities of the same type nearby using Google Places API.
 *
 * Query parameters:
 * - type: Activity type (e.g., "museum", "restaurant")
 * - lat: Latitude of current location
 * - lng: Longitude of current location
 * - radius: Search radius in meters (default: 8000 = ~5 miles)
 *
 * @returns Array of alternative activities sorted by rating and distance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const activityType = searchParams.get('type');
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lng');
    const radius = searchParams.get('radius') || '8000'; // Default 8km (~5 miles)

    // Validation
    if (!activityType || !latitude || !longitude) {
      return Response.json(
        { error: 'Missing required parameters: type, lat, lng' },
        { status: 400 }
      );
    }

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

    // Format results
    const alternatives: AlternativeActivity[] = data.results
      .slice(0, 15) // Limit to top 15 results
      .map((place: any) => ({
        name: place.name,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        vicinity: place.vicinity,
        type: activityType,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        openNow: place.opening_hours?.open_now,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        placeId: place.place_id,
      }));

    // Sort by rating (descending) and then by distance (ascending)
    alternatives.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      // If rating difference is significant (>0.3), sort by rating
      if (Math.abs(ratingDiff) > 0.3) {
        return ratingDiff;
      }
      // Otherwise, prefer closer locations
      return a.distance - b.distance;
    });

    return Response.json({ alternatives });
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return Response.json(
      { error: 'Failed to find alternative activities' },
      { status: 500 }
    );
  }
}
