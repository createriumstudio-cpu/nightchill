/**
 * Google Maps Directions API サービス
 *
 * 1軒目→2軒目への徒歩ルートと所要時間を取得する。
 * 結果にはGoogle Maps埋め込みiframe URLも含む。
 *
 * GOOGLE_MAPS_API_KEY が未設定の場合はフォールバックを返す。
 */

export interface WalkingRoute {
  durationText: string;
  durationMinutes: number;
  distanceText: string;
  distanceMeters: number;
  summary: string;
  mapEmbedUrl: string | null;
  source: "google_maps" | "fallback";
}

interface DirectionsResponse {
  routes: Array<{
    summary: string;
    legs: Array<{
      duration: { text: string; value: number };
      distance: { text: string; value: number };
    }>;
  }>;
  status: string;
}

const DIRECTIONS_API_BASE = "https://maps.googleapis.com/maps/api/directions/json";
const EMBED_API_BASE = "https://www.google.com/maps/embed/v1/directions";

function getApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

/**
 * 2地点間の徒歩ルートを取得
 */
export async function getWalkingRoute(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
): Promise<WalkingRoute> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.log("[google-maps] API key not set, using fallback");
    return createFallbackRoute();
  }

  const originStr = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`;
  const destStr = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`;

  try {
    const url = new URL(DIRECTIONS_API_BASE);
    url.searchParams.set("origin", originStr);
    url.searchParams.set("destination", destStr);
    url.searchParams.set("mode", "walking");
    url.searchParams.set("language", "ja");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Directions API failed: ${res.status}`);
    }

    const data = (await res.json()) as DirectionsResponse;
    if (data.status !== "OK" || data.routes.length === 0) {
      console.warn("[google-maps] No route found");
      return createFallbackRoute();
    }

    const leg = data.routes[0].legs[0];

    // 埋め込みマップURL生成
    const embedUrl = new URL(EMBED_API_BASE);
    embedUrl.searchParams.set("key", apiKey);
    embedUrl.searchParams.set("origin", originStr);
    embedUrl.searchParams.set("destination", destStr);
    embedUrl.searchParams.set("mode", "walking");

    return {
      durationText: leg.duration.text,
      durationMinutes: Math.ceil(leg.duration.value / 60),
      distanceText: leg.distance.text,
      distanceMeters: leg.distance.value,
      summary: data.routes[0].summary,
      mapEmbedUrl: embedUrl.toString(),
      source: "google_maps",
    };
  } catch (error) {
    console.error("[google-maps] API error:", error);
    return createFallbackRoute();
  }
}

/**
 * APIキー未設定時のフォールバック
 */
function createFallbackRoute(): WalkingRoute {
  return {
    durationText: "徒歩約5〜10分",
    durationMinutes: 7,
    distanceText: "約500m",
    distanceMeters: 500,
    summary: "近隣エリア内を徒歩移動",
    mapEmbedUrl: null,
    source: "fallback",
  };
}

/**
 * 徒歩ルート情報をAIプロンプト用テキストに変換
 */
export function formatRouteForPrompt(route: WalkingRoute): string {
  const parts: string[] = [];
  parts.push(`【移動情報】`);
  parts.push(`移動手段: 徒歩`);
  parts.push(`所要時間: ${route.durationText}`);
  parts.push(`距離: ${route.distanceText}`);

  if (route.source === "fallback") {
    parts.push(`※ 上記は推定値です。Google Maps API設定後に正確な情報が取得されます。`);
  }

  return parts.join("\n");
}
