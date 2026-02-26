import Anthropic from "@anthropic-ai/sdk";
import type { PlanRequest, DatePlan } from "./types";
import { occasionLabels, moodLabels, budgetLabels, dateTypeLabels, ageGroupLabels, dateScheduleLabels } from "./types";
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
− 各ステップにはその店を選んだ理由や特徴を description に書く
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

【服装アドバイス ― 気温・天気・季節を反映 ― 厳守】
− fashionAdvice には必ず季節・推定気温を踏まえた具体的な服装を提案する
− 必ず「○月の東京は平均○〜○℃」のように具体的な気温を記載する
− 例：「2月の東京は平均5〜10℃。厚手のコートとマフラー必須。室内は暖房が効いているので脱ぎ着しやすいレイヤードがおすすめ」
− 雨の可能性がある場合：折り畳み傘、撥水素材の靴を推奨
− 歩きが多いプランの場合：歩きやすい靴を推奨
− デートの雰囲気に合わせたコーディネート提案も含める

【注意ポイント（warnings）― 季節・天気・気温を必ず含める ― 厳守】
− warnings の最初の項目は必ず季節の特徴と推定気温に関する注意にする
− 天気リスク（雨、猛暑、寒波など）がある季節は、それに対する具体的な対策を含める
− 例：「2月は平均5〜10℃で寒さが厳しい。防寒対策を万全に」「6月は梅雨時期で雨が多い。折り畳み傘を忘れずに」
− 季節のイベント情報も注意点として含める（花粉、台風、混雑時期など）

【関係性 × ムードのクロスマッチング】
− 「まだ友達」× ロマンチック → カジュアルだけど特別感のあるスポット
− 「恋人」× アドベンチャー → 二人の思い出になるアクティブなスポット
− 「夫婦」× リラックス → 日常を離れたゆったり空間

【好みの反映 ― 厳守】
− 「静か」→ にぎやかな場所を避ける
− 「アクティブ」→ 体を動かせるスポットを含める
− 相手や自分の好みが書かれていたら、それに合わせてスポットを選ぶ

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
  ],
  "fashionAdvice": "季節・気温・天気を考慮した具体的な服装アドバイス（150文字以内）",
  "warnings": ["季節の特徴や推定気温に関する注意", "天気リスクの注意点", "その他の注意点"]
}
`;



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

  // Day of week calculation
  let dayOfWeekStr = "";
  if (request.dateStr) {
    const dateObj = new Date(request.dateStr);
    const dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
    dayOfWeekStr = dayNames[dateObj.getDay()];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    parts.push(`日付: ${request.dateStr}（${dayOfWeekStr}）${isWeekend ? "← 週末" : "← 平日"}`);
  }

  // Determine month and season for weather/temperature estimation
  let month = new Date().getMonth() + 1;
  if (request.dateStr) {
    month = parseInt(request.dateStr.split("-")[1], 10);
  }

  // Estimated temperature and weather context by month (Tokyo averages)
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

  // Time/duration info
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

  if (request.endDateStr) {
    parts.push(`終了日：${request.endDateStr}（複数日プラン）`);
  }

  // venue必須指示（時間指定の有無にかかわらず常に追加）
  parts.push("→ 【重要】timeline各項目のvenueには必ず実在する店舗名を入れてください。空にしないでください");

  // Season-specific prompt additions
  if (month >= 3 && month <= 5) {
    parts.push("季節：春 → テラス席や公園散歩がおすすめ。花見スポットも検討");
  } else if (month >= 6 && month <= 8) {
    parts.push("季節：夏 → 涼しい屋内中心に。冷たいスイーツの店も。長時間の屋外は避ける");
  } else if (month >= 9 && month <= 11) {
    parts.push("季節：秋 → 紅葉スポットや散策がおすすめ。屋外も快適");
  } else {
    parts.push("季節：冬 → 暖かい屋内中心に。イルミネーションスポットも検討");
  }

  // Clothing-specific weather instruction
  parts.push(`→ fashionAdviceには「${weatherContext}」を踏まえた具体的な服装を提案してください。必ず具体的な気温（例：5〜10℃）と季節名を含めること`);

  // Relationship-specific detailed instructions
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

  // Additional notes (user preferences)
  if (request.additionalNotes) {
    parts.push("");
    parts.push("=== ユーザーの追加リクエスト（最優先で反映）===");
    parts.push(request.additionalNotes);
  }

  // Venue fact data injection
  if (venues.length > 0) {
    parts.push("");
    parts.push("=== 以下はGoogle Places APIから取得したファクトデータです ===");
    parts.push("参考にしてもよいが、これに限定せず自分の知識も活用して多様な店を提案すること：");
    venues.forEach((v) => {
      parts.push(`− ${v.name} (${v.address}) 評価:${v.rating ?? "不明"} 価格帯:${"$".repeat(v.priceLevel ?? 0) || "不明"}`);
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
const activityLabelsMap: Record<string, string> = {
  birthday: "誕生日", anniversary: "記念日", lunch: "ランチ",
  dinner: "ディナー", cafe: "カフェ", shopping: "ショッピング",
  active: "アクティブ", nightlife: "バー", chill: "まったり", travel: "旅行"
};

export async function generateAIPlan(request: PlanRequest): Promise<DatePlan> {
  const area = request.location || "東京";

  // Step 1: 店舗ファクトデータ取得（デート種類・年齢に応じて検索）
  const isUnder20 = request.ageGroup === "under-20";
  const isOvernight = request.endTime ? parseInt(request.endTime.split(":")[0]) < parseInt(request.startTime.split(":")[0]) : false;
  
  const venuePromises: Promise<VenueFactData | null>[] = [
    searchVenue(`${area} ${request.activities.map(a => activityLabelsMap[a] || a).slice(0, 2).join(" ")} デート`, area),
  ];
  
  if (isUnder20) {
    // 20歳未満: カフェやアミューズメント系を検索
    venuePromises.push(searchVenue(`${area} ${["カフェ", "レストラン", "おしゃれ", "人気"][Math.floor(Math.random() * 4)]} デート`, area));
  } else {
    // 20歳以上: バーも含む
    venuePromises.push(searchVenue(`${area} ${["バー", "ワインバー", "ダイニング", "レストラン"][Math.floor(Math.random() * 4)]} 人気`, area));
  }
  
  if (isOvernight) {
    // お泊まり: ホテル情報も追加で取得
    venuePromises.push(searchVenue(`${area} デート ホテル`, area));
  }
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
  const prItems = findRelevantPR(request.activities[0] || "dinner", request.mood, area);
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

      // Step 5: タイムラインの実際の店舗名でGoogle Placesを再検索
      const timelineVenues = (parsed.timeline as Array<{ venue?: string }>)
        .map(t => t.venue)
        .filter((v): v is string => !!v && v.length > 0);
      
      const uniqueVenueNames = [...new Set(timelineVenues)];
      const venueSearchPromises = uniqueVenueNames.map(name =>
        searchVenue(name, "")
      );
      const venueSearchResults = await Promise.all(venueSearchPromises);
      const enrichedVenues = venueSearchResults.filter(
        (v): v is VenueFactData => v !== null && v.source === "google_places"
      );
      
      // enrichedVenuesがあればそちらを優先、なければ事前検索結果を使用
      const finalVenues = enrichedVenues.length > 0 ? enrichedVenues : venues;

      return {
        id: generateId(),
        title: parsed.title as string,
        summary: parsed.summary as string,
        timeline: parsed.timeline as DatePlan["timeline"],
        fashionAdvice: parsed.fashionAdvice as string,
        conversationTopics: (parsed.conversationTopics as string[] | undefined) ?? [],
        warnings: parsed.warnings as string[],
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
