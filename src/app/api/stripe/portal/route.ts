import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/stripe/portal — Stripeカスタマーポータルセッション作成
 * サブスクリプションの管理・キャンセル用
 */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  const rows = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.googleId, session.user.id))
    .limit(1);

  const stripeCustomerId = rows[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "サブスクリプションが見つかりません" },
      { status: 404 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${siteUrl}/mypage`,
  });

  return NextResponse.json({ url: portalSession.url });
}
