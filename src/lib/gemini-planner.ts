import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PlanRequest, DatePlan } from "./types";
import { env } from "./env";
import { SYSTEM_PROMPT, buildUserPrompt, robustJsonParse, buildFactDescription } from "./ai-planner";
import { searchVenue, searchAreaVenues } from "./google-places";
import type { VenueFactData } from "./google-places";
import { getWalkingRoute } from "./google-maps";
import type { WalkingRoute } from "./google-maps";
import { findRelevantPR, formatPRForPrompt } from "./contextual-pr";
import { getCityById } from "./cities";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = env().GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
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

  // Step 1.5: エリア事前検索
  const preSearchVenues = await searchAreaVenues(area, cityName, request.activities, request.mood);
  console.log(`[gemini-planner] Pre-search returned ${preSearchVenues.length} venues`);

  // Step 2: Gemini AI生成
  const model = getClient().getGenerativeModel({
    model: env().GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  let lastError: Error | null = null;
  let walkingRoute: WalkingRoute | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const userPrompt = buildUserPrompt(request, preSearchVenues, walkingRoute, prText);

      const result = await model.generateContent(userPrompt);
      const text = result.response.text();

      console.log(`[gemini-planner] Response (attempt ${attempt + 1}, first 300 chars):`, text.slice(0, 300));

      const parsed = robustJsonParse(text);

      // Step 2.5: venue名バリデーション
      const genericPatterns = /^(待ち合わせ|集合|移動|ランチ|ディナー|カフェ|バー|レストラン|散歩|休憩|居酒屋|ショッピング)$/;
      const areaGenericPattern = /^.{2,5}(で|の)(待ち合わせ|ランチ|ディナー|カフェ|バー|休憩|集合|散歩|食事|買い物)/;
      const adjectiveGenericPattern = /^(おしゃれな|人気の|素敵な|有名な|話題の|隠れ家的な)(カフェ|レストラン|バー|イタリアン|フレンチ|居酒屋|ダイニング|ビストロ)/;
      const usedVenueNames = new Set<string>();
      const timelineItems = parsed.timeline as Array<{ venue?: string; activity?: string }>;
      for (const item of timelineItems) {
        if (item.venue) usedVenueNames.add(item.venue);
      }
      for (const item of timelineItems) {
        const isGeneric = !item.venue
          || genericPatterns.test(item.venue)
          || areaGenericPattern.test(item.venue)
          || adjectiveGenericPattern.test(item.venue);
        if (isGeneric) {
          console.warn(`[gemini-planner] Generic venue: "${item.venue}" for "${item.activity}"`);
          const replacement = preSearchVenues.find(v => !usedVenueNames.has(v.name));
          if (replacement) {
            console.log(`[gemini-planner] Replacing "${item.venue}" with "${replacement.name}"`);
            item.venue = replacement.name;
            usedVenueNames.add(replacement.name);
          }
        }
      }

      // Step 3: Google Places enrichment
      const timelineVenues = (parsed.timeline as Array<{ venue?: string }>)
        .map(t => t.venue)
        .filter((v): v is string => !!v && v.length > 0);
      const uniqueVenueNames = [...new Set(timelineVenues)];

      const venueSearchResults = await Promise.all(
        uniqueVenueNames.map(name => {
          const item = (parsed.timeline as Array<{ venue?: string; activity?: string }>).find(t => t.venue === name);
          return searchVenue(name, area, item?.activity);
        })
      );
      const enrichedVenues = venueSearchResults.filter((v): v is VenueFactData => v !== null);
      const googleVenues = enrichedVenues.filter(v => v.source === "google_places");
      const finalVenues = googleVenues.length > 0 ? googleVenues : enrichedVenues;

      // Step 3.5: description をファクトデータで上書き
      const venueDataMap = new Map<string, VenueFactData>();
      for (let i = 0; i < uniqueVenueNames.length; i++) {
        const r = venueSearchResults[i];
        if (r && r.source === "google_places") {
          venueDataMap.set(uniqueVenueNames[i], r);
        }
      }
      const timeline = parsed.timeline as Array<{ venue?: string; description?: string }>;
      for (const item of timeline) {
        if (item.venue && venueDataMap.has(item.venue)) {
          item.description = buildFactDescription(venueDataMap.get(item.venue)!);
        }
      }

      // Step 4: 徒歩ルート取得
      if (finalVenues.length >= 2 && finalVenues[0].lat !== 0 && finalVenues[1].lat !== 0) {
        walkingRoute = await getWalkingRoute(
          { lat: finalVenues[0].lat, lng: finalVenues[0].lng },
          { lat: finalVenues[1].lat, lng: finalVenues[1].lng },
        );
      } else if (finalVenues.length >= 2) {
        walkingRoute = await getWalkingRoute(
          finalVenues[0].name + " " + area,
          finalVenues[1].name + " " + area,
        );
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
