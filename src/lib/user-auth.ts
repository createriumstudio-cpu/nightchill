/**
 * Phase 5: Cookie-based anonymous user auth + Google OAuth リンク
 *
 * ユーザーを匿名Cookieで識別し、DBにユーザーレコードを作成する。
 * Googleログイン時はアカウントをリンクし、クロスデバイスで履歴を共有。
 */

import { cookies } from "next/headers";
import { getDb } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";

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

/**
 * Google アカウントと匿名ユーザーをリンク
 *
 * 1. googleId で既存ユーザーを検索 → 見つかればそのanonIdを返す（クロスデバイス）
 * 2. 見つからなければ現在のCookie anonIdのレコードにgoogleId/email/nameを紐付け
 * 3. Cookie anonIdもなければ新規作成
 */
export async function linkGoogleAccount(
  googleId: string,
  email: string | null,
  name: string | null,
): Promise<{ anonId: string; linked: boolean; migrated: boolean }> {
  const db = getDb();
  if (!db) {
    // DB未接続時はCookieベースにフォールバック
    const cookieAnonId = await getUserId();
    return { anonId: cookieAnonId || randomUUID(), linked: false, migrated: false };
  }

  // 1. Google IDで既存ユーザーを検索（別デバイスからのログイン）
  const existingGoogle = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  if (existingGoogle.length > 0) {
    const linkedAnonId = existingGoogle[0].anonId;
    // Cookieを既存のanonIdに同期
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, linkedAnonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    // lastSeenAt更新
    await db
      .update(users)
      .set({ lastSeenAt: new Date(), email, name })
      .where(eq(users.googleId, googleId));
    return { anonId: linkedAnonId, linked: true, migrated: false };
  }

  // 2. Cookie anonId のレコードにGoogle情報を紐付け
  const cookieAnonId = await getUserId();
  if (cookieAnonId) {
    const existingAnon = await db
      .select()
      .from(users)
      .where(eq(users.anonId, cookieAnonId))
      .limit(1);

    if (existingAnon.length > 0) {
      await db
        .update(users)
        .set({ googleId, email, name, lastSeenAt: new Date() })
        .where(eq(users.anonId, cookieAnonId));
      return { anonId: cookieAnonId, linked: true, migrated: false };
    }
  }

  // 3. 新規ユーザー作成（Cookie + Google 両方セット）
  const newAnonId = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, newAnonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  await db.insert(users).values({ anonId: newAnonId, googleId, email, name });
  return { anonId: newAnonId, linked: true, migrated: false };
}

/**
 * NextAuthセッション → anonId を解決（API route 用）
 *
 * 1. NextAuthセッションがあれば googleId → users.anonId を引く
 * 2. なければ Cookie ベースの anonId にフォールバック
 */
export async function resolveUserId(request: Request): Promise<string | null> {
  // NextAuth セッションを確認
  const session = await auth();
  if (session?.user?.id) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select({ anonId: users.anonId })
        .from(users)
        .where(eq(users.googleId, session.user.id))
        .limit(1);
      if (rows.length > 0) {
        return rows[0].anonId;
      }
    }
  }

  // フォールバック: Cookie ベース
  return getUserIdFromRequest(request);
}
