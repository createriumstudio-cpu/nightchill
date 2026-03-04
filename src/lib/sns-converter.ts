/**
 * SNSマルチフォーマット変換
 *
 * 特集記事をInstagram/X/TikTok向けのSNS投稿テキストに変換する。
 * Claude APIで生成し、結果をDBに保存。
 * ユーザーはコピーボタンで取得（外部リンク導線なし）。
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { getDb } from "./db";
import { snsContents } from "./schema";
import { eq, and } from "drizzle-orm";
import type {
  SnsPlatform,
  SnsContentJson,
  InstagramContent,
  XContent,
  TikTokContent,
} from "./schema";
import type { FeaturedArticle } from "./features";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
}

// ============================================================
// Claude API プロンプト
// ============================================================

function buildPrompt(article: FeaturedArticle): string {
  const spotsText = article.spots
    .map((s, i) => `${i + 1}. ${s.name}（${s.genre}）: ${s.description}`)
    .join("\n");

  return `以下の特集記事をSNS投稿用に変換してください。

【特集記事】
タイトル: ${article.title}
サブタイトル: ${article.subtitle}
エリア: ${article.area}
説明: ${article.description}
タグ: ${article.tags.join(", ")}
スポット:
${spotsText}

【出力形式】以下のJSON形式で出力してください。それ以外のテキストは不要です。

{
  "instagram": {
    "slides": [
      {"text": "（1枚目: アイキャッチ。300文字以内）"},
      {"text": "（2枚目以降: スポット紹介。各300文字以内。最大10枚）"}
    ],
    "hashtags": ["デート", "（エリア名）デート", "...（最大15個）"]
  },
  "x": {
    "tweets": [
      {"text": "（1ツイート目: フック。280文字以内）"},
      {"text": "（2ツイート目以降: 詳細。各280文字以内。最大5ツイート）"}
    ]
  },
  "tiktok": {
    "hook": "（最初の3秒で引きつけるセリフ。50文字以内）",
    "body": "（本編ナレーション。30-60秒分。300文字以内）",
    "cta": "（最後のCTA。50文字以内）"
  }
}

【ルール】
- ブランド名「futatabito」は入れない
- 自然で親しみやすいトーンで
- Instagram: カルーセル形式。1枚目はキャッチーに、2枚目以降でスポット紹介
- X: スレッド形式。1ツイート目で興味を引き、続きで詳細紹介
- TikTok: 30-60秒の動画台本。フック→本編→CTA構成
- 具体的なスポット名・エリア名を活用する
- 絵文字を適度に使用`;
}

// ============================================================
// AI生成
// ============================================================

interface SnsGenerationResult {
  instagram: InstagramContent;
  x: XContent;
  tiktok: TikTokContent;
}

export async function generateSnsContent(
  article: FeaturedArticle,
): Promise<SnsGenerationResult> {
  const anthropic = getClient();
  const prompt = buildPrompt(article);

  const message = await anthropic.messages.create({
    model: env().ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // JSONを抽出（コードブロック内の場合にも対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as SnsGenerationResult;

  // バリデーション
  if (!parsed.instagram?.slides || !parsed.x?.tweets || !parsed.tiktok?.hook) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
}

// ============================================================
// DB保存・取得
// ============================================================

export async function saveSnsContent(
  featureSlug: string,
  platform: SnsPlatform,
  content: SnsContentJson,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  // 既存レコードがあれば更新
  const existing = await db
    .select()
    .from(snsContents)
    .where(
      and(
        eq(snsContents.featureSlug, featureSlug),
        eq(snsContents.platform, platform),
      ),
    );

  if (existing.length > 0) {
    await db
      .update(snsContents)
      .set({ content, updatedAt: new Date() })
      .where(eq(snsContents.id, existing[0].id));
  } else {
    await db.insert(snsContents).values({
      featureSlug,
      platform,
      content,
    });
  }
}

export async function getSnsContentsBySlug(
  featureSlug: string,
): Promise<Record<SnsPlatform, SnsContentJson | null>> {
  const result: Record<SnsPlatform, SnsContentJson | null> = {
    instagram: null,
    x: null,
    tiktok: null,
  };

  const db = getDb();
  if (!db) return result;

  const rows = await db
    .select()
    .from(snsContents)
    .where(eq(snsContents.featureSlug, featureSlug));

  for (const row of rows) {
    const platform = row.platform as SnsPlatform;
    if (platform in result) {
      result[platform] = row.content;
    }
  }

  return result;
}

// ============================================================
// 一括生成+保存
// ============================================================

export async function convertAndSave(
  article: FeaturedArticle,
): Promise<Record<SnsPlatform, SnsContentJson>> {
  const generated = await generateSnsContent(article);

  const platforms: { key: SnsPlatform; data: SnsContentJson }[] = [
    { key: "instagram", data: generated.instagram },
    { key: "x", data: generated.x },
    { key: "tiktok", data: generated.tiktok },
  ];

  for (const { key, data } of platforms) {
    await saveSnsContent(article.slug, key, data);
  }

  return {
    instagram: generated.instagram,
    x: generated.x,
    tiktok: generated.tiktok,
  };
}
