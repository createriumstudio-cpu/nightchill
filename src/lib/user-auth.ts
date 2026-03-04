import { getDb } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "futatabito-user";
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex chars

/** Generate a cryptographically random token */
function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface UserSession {
  id: number;
  token: string;
  email: string | null;
  nickname: string | null;
}

/** Get current user from cookie token. Returns null if not found. */
export async function getCurrentUser(): Promise<UserSession | null> {
  const db = getDb();
  if (!db) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      token: users.token,
      email: users.email,
      nickname: users.nickname,
    })
    .from(users)
    .where(eq(users.token, token))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

/** Create a new anonymous user and set cookie. Returns the new user. */
export async function createAnonymousUser(): Promise<UserSession | null> {
  const db = getDb();
  if (!db) return null;

  const token = generateToken();
  const rows = await db
    .insert(users)
    .values({ token })
    .returning({
      id: users.id,
      token: users.token,
      email: users.email,
      nickname: users.nickname,
    });

  if (rows.length === 0) return null;
  const user = rows[0];

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: "/",
  });

  return user;
}

/** Get or create user (lazy account creation) */
export async function getOrCreateUser(): Promise<UserSession | null> {
  const existing = await getCurrentUser();
  if (existing) return existing;
  return createAnonymousUser();
}

/** Update user profile (email, nickname) */
export async function updateUserProfile(
  userId: number,
  data: { email?: string; nickname?: string },
): Promise<UserSession | null> {
  const db = getDb();
  if (!db) return null;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (data.email !== undefined) updateData.email = data.email;
  if (data.nickname !== undefined) updateData.nickname = data.nickname;

  const rows = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      token: users.token,
      email: users.email,
      nickname: users.nickname,
    });

  return rows[0] ?? null;
}

/** Read token from request cookie header (for API routes that don't use next/headers) */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]+)`),
  );
  return match ? match[1] : null;
}

/** Get user from request cookie (for API routes) */
export async function getUserFromRequest(
  request: Request,
): Promise<UserSession | null> {
  const db = getDb();
  if (!db) return null;

  const token = getTokenFromRequest(request);
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      token: users.token,
      email: users.email,
      nickname: users.nickname,
    })
    .from(users)
    .where(eq(users.token, token))
    .limit(1);

  return rows[0] ?? null;
}
