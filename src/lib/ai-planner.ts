import Anthropic from "@anthropic-ai/sdk";
import type { PlanRequest, DatePlan } from "./types";
import { env } from "./env";
import { searchVenue } from "./google-places";
import type { VenueFactData } from "./google-places";
import { getWalkingRoute } from "./google-maps";
import type { WalkingRoute } from "./google-maps";
import { findRelevantPR, formatPRForPrompt } from "./contextual-pr";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `あなたは東京のデートプランニングの専門家です。
ユーザーの条件に合わせて、具体的で実在する店舗・スポットを使ったデートプランを提案します。

【最重要ルール ― 多様性と重複禁止】
− 同じ店舗名を2回以上提案に含めてはならない
− 毎回異なるプランを生成すること。定番だけでなく隠れた名店や新しい店も積極的に提案する
− 同じエリアでもリクエストごとに違う店を推薦する。ランダム性を持たせること
− チェーン店より個人店・独立店を優先する
− 同じジャンルの店が連続しないようにする（例：レストラン→カフェ→散歩→バー）

【タイムライン設計ルール ― 店舗紹介付き】
− 合流〜解散の時間帯が指定されている場合、その範囲内で計画する
− タイムラインの各ステップには必ず具体的な店舗名・スポット名を含める
− 各ステップの description にはジャンル名を短く書く（例：イタリアン、カフェ、美術館）。詳細はシステムが自動付与する
− 所要時間の目安：2時間→2〜3スポット、4時間→3〜5スポット、6時間以上→5〜7スポット
− 移動も考慮する（徒歩圏内が望ましい。移動が必要な場合はそれも記載）
− 各ステップの time は "HH:MM" 形式で記載する

【曜日・日時を考慮したプランニング ― 厳守】
− 平日の場合：ランチ営業の店、オフィス街の隠れ家などを活用
− 土日祝の場合：混雑を避ける時間帯の提案、予約推奨の記載
− 時間帯を考慮する：
  - 午前（〜12:00）：モーニング、カフェ、公園散歩
  - 昼（12:00〜14:00）：ランチメインの店
  - 午後（14:00〜17:00）：カフェ、美術館、ショッピング
  - 夕方（17:00〜19:00）：サンセットスポット、早めディナー
  - 夜（19:00〜）：ディナー、バー、夜景

【天気・気温・季節を考慮 ― 厳守】
− 季節と推定気温に応じた屋内/屋外バランスを調整する
− 雨天リスクがある場合：屋内中心のプランにする。屋外は代替案も記載
− 夏（6〜8月・25℃以上）：涼しい屋内スポット多め。かき氷やアイスの店も。長時間の屋外は避ける
− 冬（12〜2月・10℃以下）：暖かい屋内中心。イルミネーションや温泉も。防寒対策を服装に
− 春（3〜5月）：花見スポット、テラス席、公園。花粉症注意を記載
− 秋（9〜11月）：紅葉スポット、屋外散策。過ごしやすい気候を活かす
− 梅雨（6月中旬〜7月中旬）：完全屋内プラン。美術館、デパ地下、映画館

【関係性 × ムードのクロスマッチング】
− 「まだ友達」× ロマンチック → カジュアルだけど特別感のあるスポット
− 「恋人」× アドベンチャー → 二人の思い出になるアクティブなスポット
− 「夫婦」× リラックス → 日常を離れたゆったり空間

【好みの反映 ― 厳守】
− 「静か」→ にぎやかな場所を避ける
− 「アクティブ」→ 体を動かせるスポットを含める
− 相手や自分の好みが書かれていたら、それに合わせてスポットを選ぶ

【宿泊（複数日）プランのルール ― 該当時のみ適用】
− 宿泊プランの場合、タイムラインを日ごとに構成する
− 各日の最初のステップの activity に「【Day N】」を付ける（例：「【Day 1】ランチからスタート」「【Day 2】ホテル周辺で朝食」）
− チェックイン（15:00〜18:00目安）とチェックアウト（〜11:00目安）の時間を考慮する
− 宿泊施設は venue に具体的なホテル名・旅館名を入れる（例：「MUJI HOTEL GINZA」「星のや東京」）
− 2日目の朝〜チェックアウトまでのプランも含める
− 1泊2日なら7〜10スポット、2泊3日なら12〜15スポットを目安にする

【年齢制限ルール ― 厳守】
− 「20歳未満」の場合：バー、居酒屋、シーシャ、ナイトクラブ、アルコールを提供する店は絶対に推薦しない
− 「20歳以上」の場合：全ての店舗を推薦可能

【JSON出力ルール ― 厳守】
1. 純粋なJSONのみ出力。マークダウンのコードブロックで囲まない
2. 全ての文字列値は1行で書く。改行を入れない
3. 文字列値の中にダブルクォートを使わない。必要なら「」を使う
4. 文字列値の中に { } を使わない
5. 文字列値は短く簡潔に（各50文字以内を目安）
6. timeline の venue は絶対に空文字にしない。必ず実在する具体的な店舗名やスポット名を入れること
7. venue の例: "ABOUT LIFE COFFEE BREWERS", "代々木公園", "恵比寿ガーデンプレイス", "森美術館"
8. 「カフェで休憩」のような一般名ではなく、具体的な実在店舗名を必ず入れる

以下のJSON構造で応答してください：
{
  "title": "プランのタイトル（20文字以内）",
  "summary": "プランの概要（1文、50文字以内）",
  "timeline": [
    {
      "time": "HH:MM",
      "activity": "アクティビティの内容（50文字以内）",
      "venue": "【必須】具体的な実在する店舗名・スポット名（例：ABOUT LIFE COFFEE BREWERS）。絶対に空にしない",
      "description": "この店の特徴やおすすめポイント（80文字以内）",
      "tip": "成功のためのコツ（50文字以内）"
    }
  ]
}
`;

// ============================================================
// ユーザープロンプト構築
// ============================================================

function buildUserPrompt(
  request: PlanRequest,
  venues: VenueFactData[],
  route: WalkingRoute | null,
  prText: string,
): string {
  const parts: string[] = [];

  const randomSeed = Math.random().toString(36).substring(2, 10);
  parts.push(`[リクエストID: ${randomSeed}] ※ 毎回異なるプランを生成してください`);

  const activityLabels: Record<string, string> = {
    dinner: "ディナー・食事", cafe: "カフェ", bar: "バー・お酒",
    entertainment: "エンタメ・遊び", culture: "アート・文化", outdoor: "散歩・アウトドア",
    shopping: "ショッピング", wellness: "リラクゼーション・癒し",
  };
  const selectedActivities = request.activities.map(a => activityLabels[a] || a).join("、");

  const moodLabelsMap: Record<string, string> = {
    romantic: "ロマンチック", fun: "楽しい", relaxed: "リラックス",
    luxurious: "ラグジュアリー", adventurous: "アドベンチャー"
  };
  const relationshipLabelsMap: Record<string, string> = {
    lover: "恋人", spouse: "夫婦", "not-yet": "まだ友達（関係が浅い）"
  };
  const budgetLabelsMap: Record<string, string> = {
    low: "〜5,000円", medium: "5,000〜15,000円", high: "15,000〜30,000円", unlimited: "予算は気にしない"
  };

  // Day of week
  if (request.dateStr) {
    const dateObj = new Date(request.dateStr);
    const dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
    const dayOfWeekStr = dayNames[dateObj.getDay()];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    parts.push(`日付: ${request.dateStr}（${dayOfWeekStr}）${isWeekend ? "← 週末" : "← 平日"}`);
  }

  // Month & season context
  let month = new Date().getMonth() + 1;
  if (request.dateStr) {
    month = parseInt(request.dateStr.split("-")[1], 10);
  }

  const monthlyContext: Record<number, string> = {
    1: "1月・冬：平均気温2〜10℃。寒い。晴れの日が多いが風が冷たい。防寒必須",
    2: "2月・冬：平均気温3〜11℃。寒い。乾燥している。まだ防寒が必要",
    3: "3月・春：平均気温6〜15℃。寒暖差大。桜の開花時期。花粉注意",
    4: "4月・春：平均気温11〜20℃。過ごしやすい。桜満開〜散り。花粉注意",
    5: "5月・春：平均気温15〜24℃。快適。新緑が美しい。紫外線注意",
    6: "6月・梅雨：平均気温19〜26℃。雨が多い。湿度高い。折り畳み傘必須。屋内プラン推奨",
    7: "7月・夏：平均気温23〜31℃。暑い。梅雨明け後は猛暑。熱中症注意。涼しい場所を選ぶ",
    8: "8月・夏：平均気温24〜32℃。猛暑。屋外は短時間に。花火大会シーズン",
    9: "9月・秋：平均気温20〜28℃。残暑あり。台風シーズン。雨の可能性高い",
    10: "10月・秋：平均気温14〜22℃。過ごしやすい。紅葉の始まり",
    11: "11月・秋：平均気温9〜17℃。涼しい〜寒い。紅葉見頃。日が短くなる",
    12: "12月・冬：平均気温4〜12℃。寒い。イルミネーションシーズン。防寒必須",
  };
  const weatherContext = monthlyContext[month] || "気温・天気は不明";
  parts.push(`季節・気候: ${weatherContext}`);

  parts.push("=== デートの条件 ===");
  parts.push(`やりたいこと：${selectedActivities}`);
  parts.push(`雰囲気：${moodLabelsMap[request.mood] || request.mood}`);
  parts.push(`関係性：${relationshipLabelsMap[request.relationship] || request.relationship}`);
  parts.push(`予算：${budgetLabelsMap[request.budget] || request.budget}`);
  parts.push(`エリア：${request.location || "指定なし"}`);
  parts.push(`年齢層：${request.ageGroup}`);

  // Time/duration
  if (request.startTime && request.endTime) {
    const startH = parseInt(request.startTime.split(":")[0], 10);
    const endH = parseInt(request.endTime.split(":")[0], 10);
    const durationH = endH - startH;
    parts.push(`時間帯：${request.startTime}〜${request.endTime}（約${durationH}時間）`);

    let minSpots = 2;
    if (durationH >= 6) minSpots = 5;
    else if (durationH >= 4) minSpots = 4;
    else if (durationH >= 3) minSpots = 3;
    parts.push(`→ ${minSpots}スポット以上のタイムラインを作成してください`);
  } else if (request.startTime) {
    parts.push(`開始時間：${request.startTime}`);
  }

  if (request.endDateStr && request.dateStr && request.endDateStr > request.dateStr) {
    const startDate = new Date(request.dateStr);
    const endDate = new Date(request.endDateStr);
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`終了日：${request.endDateStr}（${nights}泊${nights + 1}日の宿泊プラン）`);
    parts.push("");
    parts.push("=== 宿泊プラン構成の指示 ===");
    parts.push(`− これは${nights}泊${nights + 1}日のお泊まりデートです`);
    parts.push("− タイムラインを日ごとに構成してください");
    parts.push("− 各日の最初のステップの activity に【Day N】を付けてください");
    parts.push("− 宿泊施設（ホテル・旅館）も venue に具体名を入れてください");
    parts.push("− 2日目以降の朝食〜チェックアウトのプランも含めてください");
    if (nights === 1) {
      parts.push("− 1泊2日：Day 1 に4〜5スポット + ホテル、Day 2 に3〜4スポットを目安に");
    } else {
      parts.push(`− ${nights}泊${nights + 1}日：各日に3〜5スポットを目安に`);
    }
  } else if (request.endDateStr) {
    parts.push(`終了日：${request.endDateStr}（複数日プラン）`);
  }

  parts.push("→ 【重要】timeline各項目のvenueには必ず実在する店舗名を入れてください。空にしないでください");

  // Season-specific prompt
  if (month >= 3 && month <= 5) {
    parts.push("季節：春 → テラス席や公園散歩がおすすめ。花見スポットも検討");
  } else if (month >= 6 && month <= 8) {
    parts.push("季節：夏 → 涼しい屋内中心に。冷たいスイーツの店も。長時間の屋外は避ける");
  } else if (month >= 9 && month <= 11) {
    parts.push("季節：秋 → 紅葉スポットや散策がおすすめ。屋外も快適");
  } else {
    parts.push("季節：冬 → 暖かい屋内中心に。イルミネーションスポットも検討");
  }

  // Relationship-specific
  parts.push("");
  parts.push("=== 関係性に応じた注意点 ===");
  if (request.relationship === "not-yet") {
    parts.push("まだ友達の段階です。以下を守ってください：");
    parts.push("− 個室やムーディーすぎる場所は避ける");
    parts.push("− オープンで会話が弾みやすい場所を選ぶ");
    parts.push("− 程よい距離感を保てるカジュアルなスポットを優先");
    parts.push("− 長すぎないプランにする（相手が疲れないように）");
  } else if (request.relationship === "lover") {
    parts.push("恋人同士です。以下を考慮してください：");
    parts.push("− 二人の距離が近くなれるスポットを含める");
    parts.push("− 記念になるような特別感のある場所も含める");
    parts.push("− ムードのある場所と楽しい場所をバランスよく");
  } else {
    parts.push("夫婦です。以下を考慮してください：");
    parts.push("− 日常を離れた特別感のある場所を提案");
    parts.push("− ゆったり過ごせる場所を多めに");
    parts.push("− 新しい発見があるようなスポットを含める");
  }

  // Additional notes
  if (request.additionalNotes) {
    parts.push("");
    parts.push("=== ユーザーの追加リクエスト（最優先で反映）===");
    parts.push(request.additionalNotes);
  }

  // Venue fact data injection (pre-search results as reference)
  if (venues.length > 0) {
    parts.push("");
    parts.push("=== 以下はGoogle Places APIから取得した参考データです ===");
    parts.push("参考にしてもよいが、これに限定せず自分の知識も活用して多様な店を提案すること：");
    venues.forEach((v) => {
      const ratingStr = v.rating !== null ? `★${v.rating}` : "評価不明";
      const priceStr = v.priceLevel !== null ? `${"¥".repeat(v.priceLevel || 1)}` : "価格不明";
      parts.push(`− ${v.name} (${v.address}) ${ratingStr} ${priceStr}`);
    });
  }

  if (route) {
    parts.push("");
    parts.push(`徒歩ルート情報：${route.distanceText} (${route.durationText})`);
  }

  if (prText) {
    parts.push("");
    parts.push(prText);
  }

  return parts.join("\n");
}

// ============================================================
// JSON パース（堅牢な4段階フォールバック）
// ============================================================

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

  // JSONオブジェクトの開始・終了位置
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // 末尾カンマ除去
  cleaned = cleaned.replace(/,\s*([\\]}])/g, "$1");

  return cleaned.trim();
}

function cleanAIResponseText(text: string): string {
  let cleaned = text;

  // JSX風パターン除去
  cleaned = cleaned.replace(/\{\s*['"]\\n\s*['"]\s*\}/g, " ");
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

function extractFieldsWithRegex(text: string): Record<string, unknown> | null {
  console.log("Attempting regex field extraction...");

  const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
  if (!titleMatch) {
    console.error("Regex: title not found");
    return null;
  }

  const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);

  const timelineItems: Array<{ time: string; activity: string; venue: string; description: string; tip: string }> = [];
  const timePattern = /"time"\s*:\s*"([^"]+)"/g;
  const activityPattern = /"activity"\s*:\s*"([^"]+)"/g;
  const venuePattern = /"venue"\s*:\s*"([^"]*)"/g;
  const descPattern = /"description"\s*:\s*"([^"]*)"/g;
  const tipPattern = /"tip"\s*:\s*"([^"]+)"/g;

  const times: string[] = [];
  const activities: string[] = [];
  const venues: string[] = [];
  const descriptions: string[] = [];
  const tips: string[] = [];

  let m;
  while ((m = timePattern.exec(text)) !== null) times.push(m[1]);
  while ((m = activityPattern.exec(text)) !== null) activities.push(m[1]);
  while ((m = venuePattern.exec(text)) !== null) venues.push(m[1]);
  while ((m = descPattern.exec(text)) !== null) descriptions.push(m[1]);
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
      venue: venues[i] || "",
      description: descriptions[i] || "",
      tip: tips[i] || "",
    });
  }

  console.log(`Regex extraction success: title="${titleMatch[1]}", timeline items=${timelineItems.length}`);

  return {
    title: titleMatch[1],
    summary: summaryMatch ? summaryMatch[1] : "AIが生成したデートプラン",
    timeline: timelineItems,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function robustJsonParse(text: string): Record<string, unknown> {
  const sanitized = sanitizeJsonResponse(text);

  // 1回目: クリーンアップしてパース
  try {
    const cleaned = cleanAIResponseText(sanitized);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (firstError) {
    const err = firstError as SyntaxError;
    console.error("First JSON parse attempt failed:", err.message);

    const pos = parseInt(err.message.match(/position (\d+)/)?.[1] || "0");
    if (pos > 0) {
      const start = Math.max(0, pos - 40);
      const end = Math.min(sanitized.length, pos + 40);
      console.error("Context around error position:", JSON.stringify(sanitized.slice(start, end)));
    }
  }

  // 2回目: 改行を空白に置換
  try {
    const noNewlines = sanitized.replace(/\n/g, " ").replace(/\r/g, " ");
    const cleaned = cleanAIResponseText(noNewlines);
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (secondError) {
    console.error("Second JSON parse attempt failed:", (secondError as Error).message);
  }

  // 3回目: 積極的クリーンアップ
  try {
    let aggressive = sanitized;
    aggressive = aggressive.replace(/[\n\r\t]/g, " ");
    aggressive = aggressive.replace(/  +/g, " ");
    aggressive = aggressive.replace(/\{[^{}]*\}/g, (match) => {
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
  if (regexResult) return regexResult;

  const noNewlines = sanitized.replace(/[\n\r]/g, " ");
  const regexResult2 = extractFieldsWithRegex(noNewlines);
  if (regexResult2) return regexResult2;

  throw new Error(`JSON parse failed after all attempts. Raw text (first 200 chars): ${text.slice(0, 200)}`);
}

// ============================================================
// Google Places ファクトデータ → description 変換
// ============================================================

function buildFactDescription(venue: VenueFactData): string {
  const parts: string[] = [];
  if (venue.rating !== null) {
    parts.push(`★${venue.rating}`);
  }
  if (venue.priceLevel !== null) {
    const level = venue.priceLevel ?? 1;
    parts.push("¥".repeat(level));
  }
  parts.push(venue.address);
  return parts.join(" | ");
}

// ============================================================
// メイン生成関数
// ============================================================

export async function generateAIPlan(request: PlanRequest): Promise<DatePlan> {
  const area = request.location || "東京";

  // ── Step 1: Contextual PR取得 ──
  const prItems = findRelevantPR(request.activities[0] || "dinner", request.mood, area);
  const prText = formatPRForPrompt(prItems);

  // ── Step 2: AI生成（最大2回リトライ） ──
  const model = env().ANTHROPIC_MODEL;
  let lastError: Error | null = null;
  let walkingRoute: WalkingRoute | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await getClient().messages.create({
        model,
        max_tokens: 768,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(request, [], walkingRoute, prText),
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("AI応答にテキストが含まれていません");
      }

      console.log(`AI response (attempt ${attempt + 1}, first 300 chars):`, textBlock.text.slice(0, 300));

      const parsed = robustJsonParse(textBlock.text);

      // ── Step 3: タイムラインの店舗名でGoogle Places検索 → ファクトデータ付与 ──
      const timelineVenues = (parsed.timeline as Array<{ venue?: string }>)
        .map(t => t.venue)
        .filter((v): v is string => !!v && v.length > 0);

      const uniqueVenueNames = [...new Set(timelineVenues)];

      // 全店舗を並列検索
      const venueSearchResults = await Promise.all(
        uniqueVenueNames.map(name => searchVenue(name, area))
      );
      const enrichedVenues = venueSearchResults.filter(
        (v): v is VenueFactData => v !== null
      );

      // Google Places で見つかった実データを優先
      const googleVenues = enrichedVenues.filter(v => v.source === "google_places");
      const finalVenues = googleVenues.length > 0 ? googleVenues : enrichedVenues;

      // ── Step 3.5: タイムラインの description を Google Places ファクトデータで上書き ──
      const venueDataMap = new Map<string, VenueFactData>();
      for (let i = 0; i < uniqueVenueNames.length; i++) {
        const result = venueSearchResults[i];
        if (result && result.source === "google_places") {
          venueDataMap.set(uniqueVenueNames[i], result);
        }
      }
      const timeline = parsed.timeline as Array<{ venue?: string; description?: string }>;
      for (const item of timeline) {
        if (item.venue && venueDataMap.has(item.venue)) {
          item.description = buildFactDescription(venueDataMap.get(item.venue)!);
        }
      }

      // ── Step 4: 徒歩ルート取得（最初と2番目の店舗間） ──
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
