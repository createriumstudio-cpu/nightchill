/**
 * SNS Webhook ビジネスロジック
 *
 * Make/Zapier連携用のWebhookステータス更新と未投稿コンテンツ取得。
 */

import { getDb } from "./db";
import { snsContents } from "./schema";
import { eq, and, desc } from "drizzle-orm";

const VALID_ACTIONS = ["schedule", "publish", "fail"] as const;
const VALID_PLATFORMS = ["instagram", "x", "tiktok"] as const;

export type WebhookAction = (typeof VALID_ACTIONS)[number];
export type WebhookPlatform = (typeof VALID_PLATFORMS)[number];

export interface WebhookRequestBody {
  contentId: number;
  action: WebhookAction;
  platform: WebhookPlatform;
  platformPostId?: string;
}

export interface WebhookResult {
  success: boolean;
  contentId: number;
  status: string;
}

export interface ScheduledItem {
  id: number;
  featureSlug: string;
  platform: string;
  content: unknown;
  status: string;
  generatedAt: Date | null;
}

/**
 * Bearer tokenの認証チェック
 */
export function authenticateWebhook(authHeader: string | null): boolean {
  const secret = process.env.SNS_WEBHOOK_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/**
 * リクエストボディのバリデーション
 */
export function validateWebhookBody(body: unknown): body is WebhookRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.contentId !== "number" || !Number.isInteger(b.contentId)) return false;
  if (!VALID_ACTIONS.includes(b.action as WebhookAction)) return false;
  if (!VALID_PLATFORMS.includes(b.platform as WebhookPlatform)) return false;
  if (b.platformPostId !== undefined && typeof b.platformPostId !== "string") return false;

  return true;
}

/**
 * Webhookステータス更新処理
 */
export async function processWebhook(body: WebhookRequestBody): Promise<
  { ok: true; result: WebhookResult } | { ok: false; error: string; status: number }
> {
  const { contentId, action, platform, platformPostId } = body;

  const db = getDb();
  if (!db) {
    return { ok: false, error: "Database not available", status: 503 };
  }

  // 対象レコードの存在確認
  const existing = await db
    .select()
    .from(snsContents)
    .where(and(eq(snsContents.id, contentId), eq(snsContents.platform, platform)));

  if (existing.length === 0) {
    return { ok: false, error: "Content not found", status: 404 };
  }

  // ステータス更新
  const now = new Date();
  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  switch (action) {
    case "schedule":
      updateData.status = "scheduled";
      updateData.scheduledAt = now;
      break;
    case "publish":
      updateData.status = "published";
      updateData.publishedAt = now;
      if (platformPostId) {
        updateData.platformPostId = platformPostId;
      }
      break;
    case "fail":
      updateData.status = "failed";
      break;
  }

  await db
    .update(snsContents)
    .set(updateData)
    .where(eq(snsContents.id, contentId));

  console.log(
    `[sns/webhook] Updated content #${contentId}: ${action} (${platform})`,
  );

  return {
    ok: true,
    result: {
      success: true,
      contentId,
      status: updateData.status as string,
    },
  };
}

/**
 * 未投稿（status='generated'）のSNSコンテンツ一覧を取得
 */
export async function getScheduledContents(): Promise<
  { ok: true; data: ScheduledItem[] } | { ok: false; error: string; status: number }
> {
  const db = getDb();
  if (!db) {
    return { ok: false, error: "Database not available", status: 503 };
  }

  const items = await db
    .select()
    .from(snsContents)
    .where(eq(snsContents.status, "generated"))
    .orderBy(desc(snsContents.generatedAt));

  return {
    ok: true,
    data: items.map((item) => ({
      id: item.id,
      featureSlug: item.featureSlug,
      platform: item.platform,
      content: item.content,
      status: item.status,
      generatedAt: item.generatedAt,
    })),
  };
}
