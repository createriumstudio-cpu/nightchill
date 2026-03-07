import { NextRequest, NextResponse } from "next/server";

// Cache to avoid repeated API calls (in-memory, persists per Vercel function instance)
// Bounded to 500 entries max to prevent unbounded growth
const MAX_CACHE_SIZE = 500;
const photoCache = new Map<string, { photoUri: string; attribution: string; attributionUri: string; googleMapsUri: string; placeId: string; mapEmbedUrl: string; cachedAt: number }>();
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

function setCacheEntry(key: string, value: { photoUri: string; attribution: string; attributionUri: string; googleMapsUri: string; placeId: string; mapEmbedUrl: string; cachedAt: number }) {
  if (photoCache.size >= MAX_CACHE_SIZE) {
    const firstKey = photoCache.keys().next().value;
    if (firstKey) photoCache.delete(firstKey);
  }
  photoCache.set(key, value);
}

const PLACES_API_BASE = "https://places.googleapis.com/v1";

/**
 * 写真リソース名から直接CDN URLを解決する
 */
async function resolvePhotoByName(
  photoName: string,
  apiKey: string,
): Promise<{ photoUri: string | null }> {
  try {
    const res = await fetch(
      `${PLACES_API_BASE}/${photoName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`,
    );
    if (!res.ok) return { photoUri: null };
    const data = await res.json();
    return { photoUri: data.photoUri ?? null };
  } catch {
    return { photoUri: null };
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const photoName = req.nextUrl.searchParams.get("name");
  const area = req.nextUrl.searchParams.get("area") || "";

  if (!query && !photoName) {
    return NextResponse.json({ error: "Missing q or name parameter" }, { status: 400 });
  }

  // Use GOOGLE_PLACES_API_KEY, fallback to GOOGLE_MAPS_API_KEY
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // ── Mode 1: 写真リソース名から直接解決 ──
  if (photoName) {
    const cacheKey = `name:${photoName}`;
    const cached = photoCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return NextResponse.json(
        { photoUri: cached.photoUri, cached: true },
        { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
      );
    }

    const result = await resolvePhotoByName(photoName, apiKey);
    if (result.photoUri) {
      setCacheEntry(cacheKey, {
        photoUri: result.photoUri,
        attribution: "",
        attributionUri: "",
        googleMapsUri: "",
        placeId: "",
        mapEmbedUrl: "",
        cachedAt: Date.now(),
      });
    }

    return NextResponse.json(
      { photoUri: result.photoUri },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
    );
  }

  // ── Mode 2: テキスト検索 → 写真取得 ──
  const cacheKey = query!.toLowerCase().trim();
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { photoUri: cached.photoUri, attribution: cached.attribution, attributionUri: cached.attributionUri, googleMapsUri: cached.googleMapsUri, placeId: cached.placeId, mapEmbedUrl: cached.mapEmbedUrl, cached: true },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
    );
  }

  try {
    // Step 1: Text Search (New) to find the place and get photo references + Google Maps URI
    const searchRes = await fetch(
      `${PLACES_API_BASE}/places:searchText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery: area ? `${query} ${area}` : query!,
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

    const placeId = place?.id ?? null;
    const googleMapsUri = place?.googleMapsUri ?? null;
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapEmbedUrl = placeId && mapsApiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=place_id:${placeId}`
      : null;

    if (!place?.photos?.length) {
      return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri, placeId, mapEmbedUrl });
    }

    const photoResourceName = place.photos[0].name;
    const authorAttribution = place.photos[0].authorAttributions?.[0];
    const attribution = authorAttribution?.displayName ?? null;
    const attributionUri = authorAttribution?.uri ?? null;

    // Step 2: Get photo URL
    const photoRes = await fetch(
      `${PLACES_API_BASE}/${photoResourceName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
    );

    if (!photoRes.ok) {
      return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri, placeId, mapEmbedUrl });
    }

    const photoData = await photoRes.json();
    const photoUri = photoData.photoUri ?? null;

    if (photoUri) {
      setCacheEntry(cacheKey, { photoUri, attribution: attribution ?? "", attributionUri: attributionUri ?? "", googleMapsUri: googleMapsUri ?? "", placeId: placeId ?? "", mapEmbedUrl: mapEmbedUrl ?? "", cachedAt: Date.now() });
    }

    return NextResponse.json(
      { photoUri, attribution, attributionUri, googleMapsUri, placeId, mapEmbedUrl },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    console.error("place-photo API error:", err);
    return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri: null, placeId: null, mapEmbedUrl: null });
  }
}
