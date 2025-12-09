import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: POST /api/shorten-url
 *
 * Shortens a URL using TinyURL API from the server side to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      console.error('[shorten-url] No URL provided');
      return NextResponse.json(
        { error: 'URL is required', success: false },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      console.error('[shorten-url] Invalid URL format:', url);
      return NextResponse.json(
        { error: 'Invalid URL format', success: false },
        { status: 400 }
      );
    }

    console.log('[shorten-url] Attempting to shorten URL:', url.substring(0, 100) + '...');

    // Call TinyURL from server side (no CORS issues)
    const tinyUrlEndpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;

    const tinyUrlResponse = await fetch(tinyUrlEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    console.log('[shorten-url] TinyURL response status:', tinyUrlResponse.status);

    if (!tinyUrlResponse.ok) {
      const errorText = await tinyUrlResponse.text();
      console.error('[shorten-url] TinyURL error response:', errorText);
      throw new Error(`TinyURL returned ${tinyUrlResponse.status}: ${errorText}`);
    }

    const shortUrl = await tinyUrlResponse.text();
    console.log('[shorten-url] TinyURL response:', shortUrl.substring(0, 100));

    // Validate we got a proper URL back
    if (!shortUrl.startsWith('http')) {
      console.error('[shorten-url] Invalid response from TinyURL:', shortUrl);
      throw new Error('Invalid response from TinyURL');
    }

    console.log('[shorten-url] Successfully shortened URL to:', shortUrl);

    return NextResponse.json({
      shortUrl: shortUrl.trim(),
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[shorten-url] Error:', errorMessage);

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}
