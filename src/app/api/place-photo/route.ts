import { NextRequest, NextResponse } from "next/server";

// Cache to avoid repeated API calls (in-memory, persists per Vercel function instance)
// Bounded to 500 entries max to prevent unbounded growth
const MAX_CACHE_SIZE = 500;
const photoCache = new Map<string, { photoUri: string; attribution: string; attributionUri: string; googleMapsUri: string; cachedAt: number }>();
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

function setCacheEntry(key: string, value: { photoUri: string; attribution: string; attributionUri: string; googleMapsUri: string; cachedAt: number }) {
  if (photoCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = photoCache.keys().next().value;
    if (firstKey) photoCache.delete(firstKey);
  }
  photoCache.set(key, value);
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  // Use GOOGLE_PLACES_API_KEY, fallback to GOOGLE_MAPS_API_KEY
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { photoUri: cached.photoUri, attribution: cached.attribution, attributionUri: cached.attributionUri, googleMapsUri: cached.googleMapsUri, cached: true },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
        },
      }
    );
  }

  try {
    // Step 1: Text Search (New) to find the place and get photo references + Google Maps URI
    const searchRes = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery: `${query} 東京`,
          languageCode: "ja",
          maxResultCount: 1,
        }),
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error(`place-photo: searchText failed ${searchRes.status}: ${errText}`);
      return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri: null });
    }

    const searchData = await searchRes.json();
    const place = searchData.places?.[0];

    if (!place?.photos?.length) {
      return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri: place?.googleMapsUri ?? null });
    }

    const photoName = place.photos[0].name;
    const authorAttribution = place.photos[0].authorAttributions?.[0];
    const attribution = authorAttribution?.displayName ?? null;
    const attributionUri = authorAttribution?.uri ?? null;
    const googleMapsUri = place.googleMapsUri ?? null;

    // Step 2: Get photo URL
    const photoRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
    );

    if (!photoRes.ok) {
      return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri });
    }

    const photoData = await photoRes.json();
    const photoUri = photoData.photoUri ?? null;

    if (photoUri) {
      setCacheEntry(cacheKey, { photoUri, attribution: attribution ?? "", attributionUri: attributionUri ?? "", googleMapsUri: googleMapsUri ?? "", cachedAt: Date.now() });
    }

    return NextResponse.json(
      { photoUri, attribution, attributionUri, googleMapsUri },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.error("place-photo API error:", err);
    return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri: null });
  }
}
