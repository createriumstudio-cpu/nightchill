import type { PlanRequest, DatePlan } from "./types";
import { env } from "./env";
import { SYSTEM_PROMPT, buildUserPrompt, robustJsonParse, buildFactDescription } from "./ai-planner";
import { batchSearchVenuesWithGemini } from "./gemini-search";
import type { VenueFactData } from "./google-places";
import { getWalkingRoute } from "./google-maps";
import type { WalkingRoute } from "./google-maps";
import { findRelevantPR, formatPRForPrompt } from "./contextual-pr";
import { getCityById } from "./cities";

// ============================================================
// Gemini REST API 型定義（Google Search grounding 対応）
// ============================================================

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
      }>;
      webSearchQueries?: string[];
    };
  }>;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Gemini REST API を直接呼び出す（Google Search grounding 対応）。
 * SDK の generateContent() は google_search ツールの型定義がないため REST API を使用。
 */
async function callGeminiWithGrounding(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = env().GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = env().GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API failed ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];

  // With Google Search grounding enabled, Gemini returns multiple parts:
  // functionCall/functionResponse parts (no text) and multiple text parts.
  // Earlier text parts may contain partial/duplicate JSON.
  // Use only the LAST text part (the final synthesized answer).
  const textParts = (candidate?.content?.parts ?? [])
    .map((p) => p.text)
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const text = textParts.length > 0 ? textParts[textParts.length - 1] : "";

  return text;
}

export async function generateGeminiPlan(request: PlanRequest): Promise<DatePlan> {
  const apiKey = env().GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const cityData = getCityById(request.city || "tokyo");
  const cityName = cityData?.searchName || "東京";
  const area = request.location || cityName;

  // Step 1: Contextual PR
  const prItems = findRelevantPR(request.activities[0] || "dinner", request.mood, area);
  const prText = formatPRForPrompt(prItems);

  // Note: Pre-search (searchAreaVenues) を廃止。
  // Gemini の Google Search grounding により、AI が直接 Google 検索して
  // 実在する店舗を見つけるため、事前検索は不要。
  const preSearchVenues: VenueFactData[] = [];

  // Step 2: Gemini AI 生成（Google Search grounding 有効）
  let lastError: Error | null = null;
  let walkingRoute: WalkingRoute | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const userPrompt = buildUserPrompt(request, preSearchVenues, walkingRoute, prText);

      // Google Search grounding 付きで Gemini を呼び出し
      const text = await callGeminiWithGrounding(SYSTEM_PROMPT, userPrompt);

      console.log(`[gemini-planner] Response (attempt ${attempt + 1}, first 300 chars):`, text.slice(0, 300));

      const parsed = robustJsonParse(text);

      // Step 2.5: venue名バリデーション（一般名の検出のみ、pre-search 置換なし）
      const genericPatterns = /^(待ち合わせ|集合|移動|ランチ|ディナー|カフェ|バー|レストラン|散歩|休憩|居酒屋|ショッピング)$/;
      const areaGenericPattern = /^.{2,5}(で|の)(待ち合わせ|ランチ|ディナー|カフェ|バー|休憩|集合|散歩|食事|買い物)/;
      const adjectiveGenericPattern = /^(おしゃれな|人気の|素敵な|有名な|話題の|隠れ家的な)(カフェ|レストラン|バー|イタリアン|フレンチ|居酒屋|ダイニング|ビストロ)/;
      const timelineItems = parsed.timeline as Array<{ venue?: string; activity?: string }>;
      for (const item of timelineItems) {
        const isGeneric = !item.venue
          || genericPatterns.test(item.venue)
          || areaGenericPattern.test(item.venue)
          || adjectiveGenericPattern.test(item.venue);
        if (isGeneric) {
          console.warn(`[gemini-planner] Generic venue detected: "${item.venue}" for "${item.activity}"`);
        }
      }

      // Step 3+4: バッチ検索と徒歩ルートを並列実行
      const timelineVenues = (parsed.timeline as Array<{ venue?: string; activity?: string }>)
        .filter((t): t is { venue: string; activity?: string } => !!t.venue && t.venue.length > 0)
        .map(t => ({ name: t.venue, activity: t.activity }));
      const uniqueVenues = timelineVenues.filter(
        (v, i, arr) => arr.findIndex(a => a.name === v.name) === i,
      );

      // バッチ検索と徒歩ルートを Promise.all で並列実行
      // walkingRoute は venue名 + area で呼び出すため batchSearch 完了を待つ必要がない
      const walkingRoutePromise = uniqueVenues.length >= 2
        ? getWalkingRoute(
            uniqueVenues[0].name + " " + area,
            uniqueVenues[1].name + " " + area,
          )
        : Promise.resolve(null);

      const [venueDataMap, resolvedWalkingRoute] = await Promise.all([
        batchSearchVenuesWithGemini(uniqueVenues, area),
        walkingRoutePromise,
      ]);

      walkingRoute = resolvedWalkingRoute;

      const enrichedVenues: VenueFactData[] = [];
      for (const v of uniqueVenues) {
        const data = venueDataMap.get(v.name);
        if (data) enrichedVenues.push(data);
      }
      const finalVenues = enrichedVenues;

      // description をファクトデータで上書き
      const timeline = parsed.timeline as Array<{ venue?: string; description?: string }>;
      for (const item of timeline) {
        if (item.venue && venueDataMap.has(item.venue)) {
          item.description = buildFactDescription(venueDataMap.get(item.venue)!);
        }
      }

      return {
        id: generateId(),
        title: parsed.title as string,
        summary: parsed.summary as string,
        timeline: parsed.timeline as DatePlan["timeline"],
        fashionAdvice: (parsed.fashionAdvice as string | undefined) ?? "",
        warnings: (parsed.warnings as string[] | undefined) ?? [],
        venues: finalVenues,
        walkingRoute: walkingRoute ?? undefined,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[gemini-planner] Attempt ${attempt + 1} failed:`, (error as Error).message);
      if (attempt < 1) {
        console.log("[gemini-planner] Retrying...");
      }
    }
  }

  throw lastError ?? new Error("Gemini plan generation failed");
}
