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

const SYSTEM_PROMPT = `あなたは「futatabito」というデート視点の東京カルチャーガイドのプランナーです。
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

【JSON出力ルール - 厳守】
1. 純粋なJSONのみ出力。マークダウンのコードブロックで囲まない
2. 全ての文字列値は1行で書く。改行を入れない
3. 文字列値の中にダブルクォートを使わない。必要なら「」を使う
4. 文字列値の中に { } を使わない
5. 文字列値は短く簡潔に（各50文字以内を目安）

以下のJSON構造で応答してください：
{
  "title": "プランのタイトル（20文字以内）",
  "summary": "プランの概要（1文、50文字以内）",
  "timeline": [
    {
      "time": "HH:MM",
      "activity": "アクティビティの内容（50文字以内）",
      "tip": "成功のためのコツ（50文字以内）"
    }
  ],
  "fashionAdvice": "服装アドバイス（100文字以内）",
  "conversationTopics": ["会話ネタ1", "会話ネタ2", "会話ネタ3"],
  "warnings": ["注意点1", "注意点2", "注意点3"]
}

timelineは4〜6項目、conversationTopicsは3〜5項目、warningsは2〜4項目。`;

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
 */
function sanitizeJsonResponse(text: string): string {
  let cleaned = text.trim();

  // markdownコードブロック除去
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

  // 末尾カンマの除去
  cleaned = cleaned.replace(/,\s*([\\]}])/g, "$1");

  return cleaned.trim();
}

/**
 * AIが生成する壊れたJSON文字列を積極的にクリーンアップ
 * JSX風の {'\n'} パターンや制御文字を除去
 */
function cleanAIResponseText(text: string): string {
  let cleaned = text;

  // JSX風パターン除去: {'\n'}, {'\n    '}, {"\n"} 等
  cleaned = cleaned.replace(/\{\s*['"]\\n\s*['"]\s*\}/g, " ");

  // JSX風パターン: {' '}, {"  "} 等（空白のみ）
  cleaned = cleaned.replace(/\{\s*['"]\s+['"]\s*\}/g, " ");

  // 文字列値内のリテラル制御文字をエスケープ
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }
    result += ch;
  }

  return result;
}

/**
 * 正規表現でJSONフィールドを個別に抽出するフォールバック
 */
function extractFieldsWithRegex(text: string): Record<string, unknown> | null {
  console.log("Attempting regex field extraction...");

  // title抽出
  const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
  if (!titleMatch) {
    console.error("Regex: title not found");
    return null;
  }

  // summary抽出
  const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);

  // fashionAdvice抽出
  const fashionMatch = text.match(/"fashionAdvice"\s*:\s*"([^"]+)"/);

  // timeline抽出 - 個々のtimelineアイテムを抽出
  const timelineItems: Array<{ time: string; activity: string; tip: string }> = [];
  const timePattern = /"time"\s*:\s*"([^"]+)"/g;
  const activityPattern = /"activity"\s*:\s*"([^"]+)"/g;
  const tipPattern = /"tip"\s*:\s*"([^"]+)"/g;

  const times: string[] = [];
  const activities: string[] = [];
  const tips: string[] = [];

  let m;
  while ((m = timePattern.exec(text)) !== null) times.push(m[1]);
  while ((m = activityPattern.exec(text)) !== null) activities.push(m[1]);
  while ((m = tipPattern.exec(text)) !== null) tips.push(m[1]);

  const count = Math.min(times.length, activities.length);
  if (count === 0) {
    console.error("Regex: no timeline items found");
    return null;
  }

  for (let i = 0; i < count; i++) {
    timelineItems.push({
      time: times[i],
      activity: activities[i],
      tip: tips[i] || "",
    });
  }

  // conversationTopics抽出
  const topicsSection = text.match(/"conversationTopics"\s*:\s*\[([^\]]+)\]/);
  const topics: string[] = [];
  if (topicsSection) {
    const topicMatches = topicsSection[1].matchAll(/"([^"]+)"/g);
    for (const tm of topicMatches) topics.push(tm[1]);
  }

  // warnings抽出
  const warningsSection = text.match(/"warnings"\s*:\s*\[([^\]]+)\]/);
  const warnings: string[] = [];
  if (warningsSection) {
    const warnMatches = warningsSection[1].matchAll(/"([^"]+)"/g);
    for (const wm of warnMatches) warnings.push(wm[1]);
  }

  console.log(`Regex extraction success: title="${titleMatch[1]}", timeline items=${timelineItems.length}`);

  return {
    title: titleMatch[1],
    summary: summaryMatch ? summaryMatch[1] : "AIが生成したデートプラン",
    timeline: timelineItems,
    fashionAdvice: fashionMatch ? fashionMatch[1] : "清潔感のあるカジュアルスタイルがおすすめ",
    conversationTopics: topics.length > 0 ? topics : ["お互いの好きなこと", "最近の楽しかったこと", "行ってみたい場所"],
    warnings: warnings.length > 0 ? warnings : ["予約の確認を忘れずに", "時間に余裕を持って行動"],
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * JSON.parseを堅牢に実行（4段階フォールバック）
 */
function robustJsonParse(text: string): Record<string, unknown> {
  const sanitized = sanitizeJsonResponse(text);

  // 1回目: AIレスポンスをクリーンアップしてパース
  try {
    const cleaned = cleanAIResponseText(sanitized);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (firstError) {
    const err = firstError as SyntaxError;
    console.error("First JSON parse attempt failed:", err.message);

    // エラー位置周辺のコンテキストをログ
    const pos = parseInt(err.message.match(/position (\d+)/)?.[1] || "0");
    if (pos > 0) {
      const start = Math.max(0, pos - 40);
      const end = Math.min(sanitized.length, pos + 40);
      console.error("Context around error position:", JSON.stringify(sanitized.slice(start, end)));
    }
  }

  // 2回目: 全ての改行を空白に置換してクリーンアップ
  try {
    const noNewlines = sanitized.replace(/\n/g, " ").replace(/\r/g, " ");
    const cleaned = cleanAIResponseText(noNewlines);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (secondError) {
    console.error("Second JSON parse attempt failed:", (secondError as Error).message);
  }

  // 3回目: もっと積極的にクリーンアップ
  try {
    let aggressive = sanitized;
    // 全ての改行を空白に
    aggressive = aggressive.replace(/[\n\r\t]/g, " ");
    // 連続空白を1つに
    aggressive = aggressive.replace(/  +/g, " ");
    // JSX風パターン除去（もっと広いマッチ）
    aggressive = aggressive.replace(/\{[^{}]*\}/g, (match) => {
      // JSONの正規の {} は残す（キー:値を含むもの）
      if (match.includes(":")) return match;
      return " ";
    });
    const cleaned = cleanAIResponseText(aggressive);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (thirdError) {
    console.error("Third JSON parse attempt failed:", (thirdError as Error).message);
  }

  // 4回目: 正規表現で個別フィールド抽出
  const regexResult = extractFieldsWithRegex(sanitized);
  if (regexResult) {
    return regexResult;
  }

  // 改行除去版でもregex試行
  const noNewlines = sanitized.replace(/[\n\r]/g, " ");
  const regexResult2 = extractFieldsWithRegex(noNewlines);
  if (regexResult2) {
    return regexResult2;
  }

  throw new Error(`JSON parse failed after all attempts. Raw text (first 200 chars): ${text.slice(0, 200)}`);
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
    walkingRoute = await getWalkingRoute(
      venues[0].name + " " + area,
      venues[1].name + " " + area,
    );
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
      console.error(
        `AI plan generation attempt ${attempt + 1} failed:`,
        (error as Error).message,
      );
      if (attempt < 1) {
        console.log("Retrying AI plan generation...");
      }
    }
  }

  throw lastError ?? new Error("AI plan generation failed");
}

export { buildUserPrompt };
