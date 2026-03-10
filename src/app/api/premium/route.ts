import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/premium — ユーザーのプレミアムステータスを取得
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ isPremium: false });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ isPremium: false });
  }

  const rows = await db
    .select({
      isPremium: users.isPremium,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.googleId, session.user.id))
    .limit(1);

  return NextResponse.json({
    isPremium: rows[0]?.isPremium ?? false,
    hasSubscription: !!rows[0]?.stripeCustomerId,
  });
}
