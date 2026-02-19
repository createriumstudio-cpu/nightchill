import Anthropic from "@anthropic-ai/sdk";
import type { PlanRequest, DatePlan } from "./types";
import { occasionLabels, moodLabels, budgetLabels } from "./types";
import { env } from "./env";
import { searchVenue, formatVenueForPrompt } from "./google-places";
import type { VenueFactData } from "./google-places";
import { getWalkingRoute, formatRouteForPrompt } from "./google-maps";
import type { WalkingRoute } from "./google-maps";
import { findRelevantPR, formatPRForPrompt } from "./contextual-pr";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `あなたは「nightchill」というデートコンシェルジュサービスのAIプランナーです。
ユーザーの入力に基づいて、具体的で実践的なデートプランをJSON形式で生成してください。

【最重要ルール】
- 「ファクトデータ」として提供された情報（店名・住所・営業時間）は絶対に改変してはならない
- ファクトデータがない場合、営業時間や住所を創作してはならない
- 「Where（場所）」ではなく「How（どう過ごすか）」を提案する
- 1軒目→2軒目の「線」としてのストーリーを重視する

以下の点を重視してください：
- 具体的な時間配分とアクティビティの流れ
- 1軒目から2軒目への移動中の会話ネタや雰囲気づくり
- 相手を喜ばせるためのリアルなtip（コツ）
- 雰囲気や状況に合った服装アドバイス
- 会話のネタと注意点

【重要】応答はJSON形式のみで返してください。マークダウンのコードブロック（\`\`\`json等）で囲まないでください。
JSON内の文字列値にダブルクォートを含める場合は必ずバックスラッシュでエスケープしてください。

以下のJSON形式で応答してください：
{
  "title": "プランのタイトル（20文字以内）",
  "summary": "プランの概要（1〜2文、エリアや特徴を含む）",
  "timeline": [
    {
      "time": "HH:MM",
      "activity": "アクティビティの内容",
      "tip": "成功のためのコツやアドバイス（具体的に）"
    }
  ],
  "fashionAdvice": "具体的な服装アドバイス（1段落）",
  "conversationTopics": ["会話ネタ1", "会話ネタ2", "会話ネタ3", "会話ネタ4"],
  "warnings": ["注意点1", "注意点2", "注意点3"]
}

timelineは4〜6項目（移動時間も含む）、conversationTopicsは3〜5項目、warningsは2〜4項目にしてください。`;

function buildUserPrompt(
  request: PlanRequest,
  venues: VenueFactData[],
  route: WalkingRoute | null,
  prText: string,
): string {
  const parts = [
    `シチュエーション: ${occasionLabels[request.occasion]}`,
    `雰囲気: ${moodLabels[request.mood]}`,
    `予算: ${budgetLabels[request.budget]}`,
    `エリア: ${request.location || "東京"}`,
  ];

  if (request.partnerInterests) {
    parts.push(`相手の趣味・好み: ${request.partnerInterests}`);
  }

  if (request.additionalNotes) {
    parts.push(`その他の要望: ${request.additionalNotes}`);
  }

  // ファクトデータ注入
  if (venues.length > 0) {
    parts.push("");
    parts.push("=== 以下はGoogle Places APIから取得したファクトデータです ===");
    parts.push("※ 店名・住所・営業時間は絶対に改変しないでください");
    for (const venue of venues) {
      parts.push("");
      parts.push(formatVenueForPrompt(venue));
    }
  }

  // 徒歩ルート情報注入
  if (route) {
    parts.push("");
    parts.push(formatRouteForPrompt(route));
  }

  // PR情報注入（あれば）
  if (prText) {
    parts.push("");
    parts.push(prText);
  }

  return parts.join("\n");
}

/**
 * AIレスポンスからJSONを抽出・修正
 * - markdownコードブロック除去
 * - JSONオブジェクト部分の抽出
 * - よくあるJSON構文エラーの修正
 */
function sanitizeJsonResponse(text: string): string {
  let cleaned = text.trim();

  // \`\`\`json ... \`\`\` or \`\`\` ... \`\`\` パターンを除去
  if (cleaned.startsWith("\`\`\`")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
    if (cleaned.endsWith("\`\`\`")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }

  // JSONオブジェクトの開始・終了位置を見つける
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // 末尾カンマの除去（配列・オブジェクト内）
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  return cleaned.trim();
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * JSON.parseを試行し、失敗した場合は修正を試みる
 */
function robustJsonParse(text: string): Record<string, unknown> {
  const sanitized = sanitizeJsonResponse(text);

  // 1回目: そのままパース
  try {
    return JSON.parse(sanitized) as Record<string, unknown>;
  } catch (firstError) {
    console.error("First JSON parse attempt failed:", (firstError as Error).message);
    console.error("Sanitized text (first 500 chars):", sanitized.slice(0, 500));
  }

  // 2回目: 制御文字を除去してからパース
  try {
    // eslint-disable-next-line no-control-regex
    const noControl = sanitized.replace(/[\x00-\x1f\x7f]/g, (ch) => {
      if (ch === "\n" || ch === "\r" || ch === "\t") return ch;
      return "";
    });
    return JSON.parse(noControl) as Record<string, unknown>;
  } catch (secondError) {
    console.error("Second JSON parse attempt failed:", (secondError as Error).message);
  }

  // 3回目: 文字列値内の改行をエスケープ
  try {
    const escaped = sanitized.replace(/"([^"]*)"\s*:/g, (match) => match)
      .replace(/:\s*"([^"]*)"/g, (match, val: string) => {
        const fixed = val.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
        return `: "${fixed}"`;
      });
    return JSON.parse(escaped) as Record<string, unknown>;
  } catch (thirdError) {
    console.error("Third JSON parse attempt failed:", (thirdError as Error).message);
    throw new Error(`JSON parse failed after 3 attempts. Raw text (first 200 chars): ${text.slice(0, 200)}`);
  }
}

/**
 * ファクトデータを収集してからAIプランを生成
 */
export async function generateAIPlan(request: PlanRequest): Promise<DatePlan> {
  const area = request.location || "東京";

  // Step 1: 店舗ファクトデータ取得（並行実行）
  const venuePromises = [
    searchVenue(`${area} デート レストラン`, area),
    searchVenue(`${area} デート バー カフェ`, area),
  ];

  const venueResults = await Promise.all(venuePromises);
  const venues = venueResults.filter((v): v is VenueFactData => v !== null);

  // Step 2: 徒歩ルート取得（2軒見つかった場合）
  let walkingRoute: WalkingRoute | null = null;
  if (venues.length >= 2 && venues[0].lat !== 0 && venues[1].lat !== 0) {
    walkingRoute = await getWalkingRoute(
      { lat: venues[0].lat, lng: venues[0].lng },
      { lat: venues[1].lat, lng: venues[1].lng },
    );
  } else if (venues.length >= 2) {
    walkingRoute = await getWalkingRoute(venues[0].name + " " + area, venues[1].name + " " + area);
  }

  // Step 3: Contextual PR取得
  const prItems = findRelevantPR(request.occasion, request.mood, area);
  const prText = formatPRForPrompt(prItems);

  // Step 4: AI生成（最大2回リトライ）
  const model = env().ANTHROPIC_MODEL;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await getClient().messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(request, venues, walkingRoute, prText),
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("AI応答にテキストが含まれていません");
      }

      console.log(`AI response (attempt ${attempt + 1}, first 300 chars):`, textBlock.text.slice(0, 300));

      const parsed = robustJsonParse(textBlock.text);

      return {
        id: generateId(),
        title: parsed.title as string,
        summary: parsed.summary as string,
        occasion: request.occasion,
        mood: request.mood,
        timeline: parsed.timeline as DatePlan["timeline"],
        fashionAdvice: parsed.fashionAdvice as string,
        conversationTopics: parsed.conversationTopics as string[],
        warnings: parsed.warnings as string[],
        venues,
        walkingRoute: walkingRoute ?? undefined,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`AI plan generation attempt ${attempt + 1} failed:`, (error as Error).message);
      if (attempt < 1) {
        console.log("Retrying AI plan generation...");
      }
    }
  }

  throw lastError ?? new Error("AI plan generation failed");
}

export { buildUserPrompt };
