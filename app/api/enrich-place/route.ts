/**
 * POST /api/enrich-place
 *
 * Enriches an itinerary location with real data from Google Places API.
 * Fetches ratings, reviews, photos, pricing, and operational details.
 *
 * This endpoint uses a two-step process:
 * 1. Text Search: Find the place based on name and location
 * 2. Place Details: Get detailed information including reviews
 *
 * Cost Optimization:
 * - Only requests specific fields needed (reduces cost)
 * - Results should be cached client-side to avoid repeat calls
 * - Consider implementing server-side caching for production
 *
 * Google Places API Pricing (as of 2024):
 * - Text Search: $32 per 1,000 requests
 * - Place Details: $17 per 1,000 requests
 * - Total per place: ~$0.049
 * - Monthly free tier: $200 credit (~4,000 places)
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnrichPlaceRequest, GooglePlaceData } from '@/types';

// In-memory cache for place data (24 hour TTL)
// For production, consider Redis or database caching
const placeCache = new Map<string, { data: GooglePlaceData; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Cleans expired entries from the cache
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of placeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      placeCache.delete(key);
    }
  }
}

/**
 * Generates a cache key from place identifiers
 */
function getCacheKey(name: string, city: string): string {
  return `${name.toLowerCase().trim()}|${city.toLowerCase().trim()}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: EnrichPlaceRequest = await request.json();
    const { name, address, city, coordinates } = body;

    // Validate required fields
    if (!name || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: name and city are required' },
        { status: 400 }
      );
    }

    // Check for Google Places API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Google Places API is not configured' },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(name, city);
    const cached = placeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for: ${name}`);
      return NextResponse.json(cached.data);
    }

    // Clean old cache entries periodically
    if (placeCache.size > 100) {
      cleanCache();
    }

    // Step 1: Find the place using Text Search
    console.log(`Searching for place: ${name} in ${city}`);

    const searchQuery = `${name} ${city}`;
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', searchQuery);
    searchUrl.searchParams.append('key', apiKey);

    // Add location bias if coordinates are provided
    if (coordinates) {
      searchUrl.searchParams.append('location', `${coordinates.lat},${coordinates.lng}`);
      searchUrl.searchParams.append('radius', '5000'); // 5km radius
    }

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error(`Google Places API error: ${searchResponse.status}`);
      return NextResponse.json(
        { error: 'Failed to search for place' },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    // Handle API-level errors
    if (searchData.status === 'ZERO_RESULTS') {
      console.log(`No results found for: ${name}`);
      return NextResponse.json(
        { error: 'Place not found', status: 'ZERO_RESULTS' },
        { status: 404 }
      );
    }

    if (searchData.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Places API quota exceeded');
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (searchData.status !== 'OK' || !searchData.results?.[0]) {
      console.error(`Google Places API returned status: ${searchData.status}`);
      return NextResponse.json(
        { error: 'Failed to find place', status: searchData.status },
        { status: 500 }
      );
    }

    const placeId = searchData.results[0].place_id;
    console.log(`Found place_id: ${placeId}`);

    // Step 2: Get detailed place information
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.append('place_id', placeId);

    // Request only the fields we need to minimize cost
    const fields = [
      'place_id',
      'name',
      'rating',
      'user_ratings_total',
      'reviews',
      'photos',
      'price_level',
      'opening_hours',
      'formatted_phone_number',
      'website',
      'formatted_address',
    ].join(',');

    detailsUrl.searchParams.append('fields', fields);
    detailsUrl.searchParams.append('key', apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());

    if (!detailsResponse.ok) {
      console.error(`Google Place Details API error: ${detailsResponse.status}`);
      return NextResponse.json(
        { error: 'Failed to get place details' },
        { status: detailsResponse.status }
      );
    }

    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      console.error(`Google Place Details API returned status: ${detailsData.status}`);
      return NextResponse.json(
        { error: 'Failed to get place details', status: detailsData.status },
        { status: 500 }
      );
    }

    const result = detailsData.result;

    // Format the response data
    const placeData: GooglePlaceData = {
      place_id: result.place_id,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: result.reviews?.slice(0, 5).map((review: any) => ({
        author_name: review.author_name,
        author_url: review.author_url,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relative_time_description,
      })),
      photos: result.photos?.slice(0, 3).map((photo: any) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
        html_attributions: photo.html_attributions,
      })),
      price_level: result.price_level,
      opening_hours: result.opening_hours ? {
        open_now: result.opening_hours.open_now ?? false,
        weekday_text: result.opening_hours.weekday_text,
      } : undefined,
      formatted_phone_number: result.formatted_phone_number,
      website: result.website,
      formatted_address: result.formatted_address,
    };

    // Cache the result
    placeCache.set(cacheKey, {
      data: placeData,
      timestamp: Date.now(),
    });

    console.log(`Successfully enriched: ${name}`);
    return NextResponse.json(placeData);

  } catch (error) {
    console.error('Error enriching place:', error);
    return NextResponse.json(
      { error: 'Internal server error while enriching place data' },
      { status: 500 }
    );
  }
}
