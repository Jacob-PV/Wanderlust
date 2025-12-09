import pako from 'pako';
import { MultiDayItinerary } from '@/types';

export interface ShareResult {
  shortUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Encode itinerary data for URL
 * Compresses and base64 encodes the itinerary
 */
function encodeItinerary(itinerary: MultiDayItinerary): string {
  // 1. Convert to JSON
  const json = JSON.stringify(itinerary);

  // 2. Compress using pako (gzip)
  const compressed = pako.deflate(json);

  // 3. Convert to base64
  const base64 = btoa(String.fromCharCode(...compressed));

  // 4. Make URL-safe
  const urlSafe = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return urlSafe;
}

/**
 * Decode itinerary data from URL parameter
 */
export function decodeItinerary(encodedData: string): MultiDayItinerary {
  try {
    // 1. Restore base64 padding and special characters
    let base64 = encodedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }

    // 2. Decode from base64
    const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // 3. Decompress
    const json = pako.inflate(compressed, { to: 'string' });

    // 4. Parse JSON
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode itinerary:', error);
    throw new Error('Invalid share link - unable to decode itinerary data');
  }
}

/**
 * Create shareable link
 *
 * Note: URL shortening services like TinyURL reject URLs that are too long (431 error).
 * Since itinerary data is large even when compressed, we return the direct share URL.
 * The URL is already optimized with gzip compression via pako.
 */
export async function createShareLink(
  itinerary: MultiDayItinerary
): Promise<ShareResult> {
  try {
    // 1. Encode the itinerary (compressed with pako)
    const encodedData = encodeItinerary(itinerary);

    // 2. Create share URL on your domain
    const shareUrl = `${window.location.origin}/share?data=${encodedData}`;

    console.log(`Created share URL (${shareUrl.length} characters, compressed with gzip)`);

    return {
      shortUrl: shareUrl,
      success: true
    };
  } catch (error) {
    console.error('Error creating share link:', error);

    // Fallback in case of encoding error
    const encodedData = encodeItinerary(itinerary);
    const fallbackUrl = `${window.location.origin}/share?data=${encodedData}`;

    return {
      shortUrl: fallbackUrl,
      success: true,
      error: 'Error creating share link'
    };
  }
}

/**
 * Get itinerary title for sharing
 */
export function getShareTitle(itinerary: MultiDayItinerary): string {
  const dayCount = itinerary.days.length;
  const dayText = dayCount === 1 ? 'day' : 'days';
  return `Check out my ${dayCount}-${dayText} ${itinerary.city} itinerary!`;
}
