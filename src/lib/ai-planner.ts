import Anthropic from "@anthropic-ai/sdk";
import type { PlanRequest, DatePlan } from "./types";
import { occasionLabels, moodLabels, budgetLabels } from "./types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const SYSTEM_PROMPT = `あなたは「nightchill」というデートコンシェルジュサービスのAIプランナーです。
ユーザーの入力に基づいて、具体的で実践的なデートプランをJSON形式で生成してください。

以下の点を重視してください：
- 「Where（場所）」ではなく「How（どう過ごすか）」を提案する
- 具体的な時間配分とアクティビティの流れ
- 相手を喜ばせるためのリアルなtip（コツ）
- 雰囲気や状況に合った服装アドバイス
- 会話のネタと注意点

必ず以下のJSON形式で応答してください。JSON以外のテキストは含めないでください：
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

timelineは4〜5項目、conversationTopicsは3〜5項目、warningsは2〜4項目にしてください。`;

function buildUserPrompt(request: PlanRequest): string {
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

  return parts.join("\n");
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function generateAIPlan(request: PlanRequest): Promise<DatePlan> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const message = await getClient().messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(request),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI応答にテキストが含まれていません");
  }

  const parsed = JSON.parse(textBlock.text);

  return {
    id: generateId(),
    title: parsed.title,
    summary: parsed.summary,
    occasion: request.occasion,
    mood: request.mood,
    timeline: parsed.timeline,
    fashionAdvice: parsed.fashionAdvice,
    conversationTopics: parsed.conversationTopics,
    warnings: parsed.warnings,
  };
}

export { buildUserPrompt };
