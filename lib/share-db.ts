import Redis from 'ioredis';
import { customAlphabet } from 'nanoid';
import { MultiDayItinerary } from '@/types';

// Create Redis client - works with REDIS_URL from Vercel KV
const redis = new Redis(process.env.REDIS_URL || '');

// Generate short, readable IDs (e.g., "a7b3x9")
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export interface ShareMetadata {
  id: string;
  createdAt: string;
  city: string;
  dayCount: number;
  views: number;
}

/**
 * Save itinerary and get short ID
 *
 * @param itinerary - The itinerary to share
 * @returns Short ID for the shareable link
 */
export async function saveItinerary(
  itinerary: MultiDayItinerary
): Promise<string> {
  // Generate unique short ID
  const id = nanoid();

  // Store itinerary with 90-day expiration
  await redis.setex(
    `itinerary:${id}`,
    60 * 60 * 24 * 90, // 90 days in seconds
    JSON.stringify(itinerary)
  );

  // Store metadata for analytics (optional)
  await redis.setex(
    `meta:${id}`,
    60 * 60 * 24 * 90,
    JSON.stringify({
      id,
      createdAt: new Date().toISOString(),
      city: itinerary.city,
      dayCount: itinerary.days.length,
      views: 0
    })
  );

  // Track total shares (optional analytics)
  await redis.incr('stats:total_shares');

  console.log(`✅ Saved itinerary with ID: ${id}`);

  return id;
}

/**
 * Get itinerary by ID
 *
 * @param id - The short ID
 * @returns The itinerary or null if not found/expired
 */
export async function getItinerary(
  id: string
): Promise<MultiDayItinerary | null> {
  try {
    const data = await redis.get(`itinerary:${id}`);

    if (!data) {
      console.log(`Itinerary ${id} not found`);
      return null;
    }

    // Increment view count
    await redis.hincrby(`views:${id}`, 'count', 1);

    // Parse and return
    return JSON.parse(data);

  } catch (error) {
    console.error(`Error fetching itinerary ${id}:`, error);
    return null;
  }
}

/**
 * Get view count for an itinerary
 */
export async function getViewCount(id: string): Promise<number> {
  try {
    const count = await redis.hget(`views:${id}`, 'count');
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error fetching view count:', error);
    return 0;
  }
}

/**
 * Get metadata for an itinerary
 */
export async function getMetadata(id: string): Promise<ShareMetadata | null> {
  try {
    const data = await redis.get(`meta:${id}`);
    if (!data) return null;

    const metadata = JSON.parse(data);
    const views = await getViewCount(id);

    return { ...metadata, views };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

/**
 * Delete an itinerary (for moderation or user request)
 */
export async function deleteItinerary(id: string): Promise<boolean> {
  try {
    await redis.del(`itinerary:${id}`);
    await redis.del(`meta:${id}`);
    await redis.del(`views:${id}`);

    console.log(`Deleted itinerary ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return false;
  }
}

/**
 * Get total statistics (optional)
 */
export async function getStats(): Promise<{
  totalShares: number;
}> {
  const totalShares = await redis.get('stats:total_shares');

  return { totalShares: totalShares ? parseInt(totalShares, 10) : 0 };
}
