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

/**
 * Gemini画像生成APIでイメージ画像を生成するフォールバック
 */
async function generateImageWithGemini(
  query: string,
  area: string,
): Promise<{ photoUri: string | null; attribution: string | null }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn("place-photo: GEMINI_API_KEY not configured, skipping image generation fallback");
    return { photoUri: null, attribution: null };
  }

  const prompt = `${query}${area ? `（${area}）` : ""}の外観または内装のリアルな写真風画像。デートスポットとして魅力的な構図。`;

  // gemini-2.0-flash-exp → gemini-2.5-flash の順にフォールバック
  const models = ["gemini-2.0-flash-exp", "gemini-2.5-flash"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`place-photo: Gemini image generation failed with ${model} ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData) {
          const { mimeType, data: base64Data } = part.inlineData;
          return {
            photoUri: `data:${mimeType};base64,${base64Data}`,
            attribution: "AI Generated Image",
          };
        }
      }
    } catch (err) {
      console.warn(`place-photo: Gemini image generation error with ${model}:`, err);
      continue;
    }
  }

  return { photoUri: null, attribution: null };
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

    if (apiKey) {
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
        return NextResponse.json(
          { photoUri: result.photoUri },
          { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
        );
      }
    }

    return NextResponse.json(
      { photoUri: null },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
    );
  }

  // ── Mode 2: テキスト検索 → 写真取得 (+ Gemini画像生成フォールバック) ──
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
    let place = null;
    if (apiKey) {
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
        console.warn(`place-photo: searchText failed ${searchRes.status}: ${errText}`);
        // searchText失敗 → Gemini画像生成フォールバック
      } else {
        const searchData = await searchRes.json();
        place = searchData.places?.[0] ?? null;
      }
    }

    const placeId = place?.id ?? null;
    const googleMapsUri = place?.googleMapsUri ?? null;
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapEmbedUrl = placeId && mapsApiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=place_id:${placeId}`
      : null;

    // Step 2: Places APIで写真取得を試みる
    if (place?.photos?.length && apiKey) {
      const photoResourceName = place.photos[0].name;
      const authorAttribution = place.photos[0].authorAttributions?.[0];
      const attribution = authorAttribution?.displayName ?? null;
      const attributionUri = authorAttribution?.uri ?? null;

      const photoRes = await fetch(
        `${PLACES_API_BASE}/${photoResourceName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
      );

      if (photoRes.ok) {
        const photoData = await photoRes.json();
        const photoUri = photoData.photoUri ?? null;

        if (photoUri) {
          setCacheEntry(cacheKey, { photoUri, attribution: attribution ?? "", attributionUri: attributionUri ?? "", googleMapsUri: googleMapsUri ?? "", placeId: placeId ?? "", mapEmbedUrl: mapEmbedUrl ?? "", cachedAt: Date.now() });
        }

        return NextResponse.json(
          { photoUri, attribution, attributionUri, googleMapsUri, placeId, mapEmbedUrl },
          { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
        );
      }
    }

    // Step 3: Gemini画像生成フォールバック
    const geminiResult = await generateImageWithGemini(query!, area);
    if (geminiResult.photoUri) {
      setCacheEntry(cacheKey, {
        photoUri: geminiResult.photoUri,
        attribution: geminiResult.attribution ?? "",
        attributionUri: "",
        googleMapsUri: googleMapsUri ?? "",
        placeId: placeId ?? "",
        mapEmbedUrl: mapEmbedUrl ?? "",
        cachedAt: Date.now(),
      });
    }

    return NextResponse.json(
      { photoUri: geminiResult.photoUri, attribution: geminiResult.attribution, attributionUri: null, googleMapsUri, placeId, mapEmbedUrl },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    console.warn("place-photo API error:", err);

    // 最終フォールバック: Gemini画像生成
    if (query) {
      const geminiResult = await generateImageWithGemini(query, area);
      if (geminiResult.photoUri) {
        return NextResponse.json(
          { photoUri: geminiResult.photoUri, attribution: geminiResult.attribution, attributionUri: null, googleMapsUri: null, placeId: null, mapEmbedUrl: null },
          { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" } },
        );
      }
    }

    return NextResponse.json({ photoUri: null, attribution: null, attributionUri: null, googleMapsUri: null, placeId: null, mapEmbedUrl: null });
  }
}
