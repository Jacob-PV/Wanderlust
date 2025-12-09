import { NextRequest, NextResponse } from 'next/server';
import { getItinerary, getViewCount } from '@/lib/share-db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Fetch itinerary from database
    const itinerary = await getItinerary(id);

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found or expired' },
        { status: 404 }
      );
    }

    // Get view count
    const views = await getViewCount(id);

    return NextResponse.json({
      itinerary,
      views
    });

  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary' },
      { status: 500 }
    );
  }
}
