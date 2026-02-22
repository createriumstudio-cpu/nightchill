import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { features as featuresTable, ugcPosts, originalContents } from "@/lib/schema";
import { eq, and, ilike, or } from "drizzle-orm";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

async function getRelevantSpots(query: string) {
  const db = getDb();
  if (!db) return { features: [], ugc: [], originals: [] };

  const allFeatures = await db.select().from(featuresTable);
  const approvedUgc = await db.select().from(ugcPosts).where(
    and(eq(ugcPosts.status, "approved"), eq(ugcPosts.isAvailable, true))
  );

  let relevantOriginals: typeof originalContents.$inferSelect[] = [];
  try {
    relevantOriginals = await db.select().from(originalContents).where(
      eq(originalContents.isPublished, true)
    );
  } catch { /* table may not exist yet */ }

  return { features: allFeatures, ugc: approvedUgc, originals: relevantOriginals };
}

function buildSystemPrompt(spots: Awaited<ReturnType<typeof getRelevantSpots>>) {
  const spotSummaries = spots.features.map(f => {
    const spotsData = (f.spots as { name: string; area: string; genre: string; description: string; tip: string }[]) || [];
    return `## ${f.title} (${f.area})
${f.description}
スポット: ${spotsData.map(s => `${s.name}(${s.genre}) - ${s.description} [コツ: ${s.tip}]`).join("\n")}`;
  }).join("\n\n");

  const ugcSummaries = spots.ugc.length > 0
    ? `\n\n## 登録済みUGC\n${spots.ugc.map(u => `- [${u.platform}] ${u.caption || ""} (${u.featureSlug}) URL: ${u.postUrl}`).join("\n")}`
    : "";

  const originalSummaries = spots.originals.length > 0
    ? `\n\n## オリジナルコンテンツ\n${spots.originals.map(o => `- ${o.title}: ${o.description} (${o.area})`).join("\n")}`
    : "";

  return `あなたは futatabito（ふたたびと）のデートコンシェルジュです。
東京のデートスポットに精通し、ユーザーの好みや状況に合わせて具体的なお店やスポットを提案するプロフェッショナルです。

## 最重要ルール — 必ず具体的な店名を提案すること:
- 初回の返答から必ず、以下のスポットデータベースにある具体的な店名・スポット名を2〜3つ含めて提案してください
- 「いくつかおすすめがあります」のような曖昧な返答は禁止です。必ず実名で提案してください
- 例:「恵比寿なら、◯◯はいかがですか？雰囲気が良くて〜」のように具体的に
- ユーザーの条件が曖昧でも、まずはおすすめを提示し、その上で「もう少し詳しく聞かせてもらえれば、さらにぴったりな場所を提案できますよ」と添えてください

## 会話の流れ（2〜3往復で完結を目指す）:
1. ユーザーの最初のメッセージ → すぐに2〜3店舗を具体的に提案 + 必要なら1つだけ質問を添える
2. ユーザーの返答 → さらに絞り込んだ提案 or デートプラン全体の流れを提案
3. 最終確認・追加の提案

## その他のルール:
- フレンドリーで親しみやすい口調で会話してください
- 「AIが提案しています」等の表現は絶対に使わないでください
- UGCがある場合は「SNSでも話題の」等と自然に言及してください
- 返答は簡潔に。長くても1-3段落程度に
- マークダウンは使わず、プレーンテキストで返答してください
- スポットデータベースにある情報（店名、ジャンル、エリア、説明、コツ）は事実として正確に伝えてください
- データベースにない店舗を勝手に作り出さないでください

${spotSummaries}${ugcSummaries}${originalSummaries}`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const spots = await getRelevantSpots(messages[messages.length - 1]?.content || "");
    const systemPrompt = buildSystemPrompt(spots);

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && "delta" in event) {
            const delta = event.delta as { type: string; text?: string };
            if (delta.type === "text_delta" && delta.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(JSON.stringify({ error: "Chat failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
