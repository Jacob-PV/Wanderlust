import { NextRequest, NextResponse } from 'next/server';
import { saveItinerary } from '@/lib/share-db';
import { MultiDayItinerary } from '@/types';

export async function POST(req: NextRequest) {
  try {
    console.log('[share] Received share request');

    const itinerary: MultiDayItinerary = await req.json();

    // Validate itinerary
    if (!itinerary.city || !itinerary.days || itinerary.days.length === 0) {
      console.error('[share] Invalid itinerary data');
      return NextResponse.json(
        { error: 'Invalid itinerary data' },
        { status: 400 }
      );
    }

    console.log(`[share] Saving itinerary for ${itinerary.city}, ${itinerary.days.length} days`);

    // Save to database and get short ID
    const id = await saveItinerary(itinerary);

    console.log(`[share] Successfully saved with ID: ${id}`);

    // Create shareable URL
    const shareUrl = `${req.nextUrl.origin}/trip/${id}`;

    return NextResponse.json({
      id,
      shareUrl,
      expiresInDays: 90
    });

  } catch (error) {
    console.error('[share] Error creating share link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create share link';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
