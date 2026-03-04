/**
 * Phase 5: Cookie-based anonymous user auth
 *
 * ユーザーを匿名Cookieで識別し、DBにユーザーレコードを作成する。
 * ログイン不要でマイページ・履歴・パーソナライゼーション機能を提供。
 */

import { cookies } from "next/headers";
import { getDb } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const COOKIE_NAME = "futatabito-uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Cookie から匿名ユーザーIDを取得（なければ生成してDB登録）
 * Server Component / Route Handler から呼び出す。
 */
export async function getOrCreateUser(): Promise<{ userId: string; isNew: boolean }> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;

  if (existing) {
    // DBにユーザーが存在するか確認
    const db = getDb();
    if (db) {
      const rows = await db.select().from(users).where(eq(users.anonId, existing)).limit(1);
      if (rows.length > 0) {
        return { userId: existing, isNew: false };
      }
      // Cookie はあるがDBにない → 再作成
      await db.insert(users).values({ anonId: existing });
      return { userId: existing, isNew: false };
    }
    return { userId: existing, isNew: false };
  }

  // 新規ユーザー
  const newId = randomUUID();
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  const db = getDb();
  if (db) {
    await db.insert(users).values({ anonId: newId });
  }

  return { userId: newId, isNew: true };
}

/**
 * Cookie から匿名ユーザーIDを取得（存在しない場合は null）
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

/**
 * Request ヘッダーから匿名ユーザーIDを取得（API route 用）
 */
export function getUserIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] || null;
}
