/**
 * 管理画面認証ユーティリティ
 *
 * シンプルなパスワード認証。
 * ADMIN_PASSWORD 環境変数で管理パスワードを設定。
 * 未設定の場合、管理画面は無効化される。
 */

import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "futatabito_admin_token";
const TOKEN_EXPIRY_HOURS = 24;

/**
 * 管理パスワードを検証
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

/**
 * 認証トークンを生成（シンプルなbase64エンコード + タイムスタンプ）
 */
export function generateToken(): string {
  const payload = {
    authenticated: true,
    timestamp: Date.now(),
    expires: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * トークンを検証
 */
export function verifyToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!payload.authenticated) return false;
    if (Date.now() > payload.expires) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 現在のリクエストが認証済みか確認
 */
export async function isAuthenticated(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}

/**
 * 管理画面が有効か（ADMIN_PASSWORDが設定されているか）
 */
export function isAdminEnabled(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export { ADMIN_COOKIE_NAME };
