import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/stripe/checkout — プレミアムサブスクリプションのCheckoutセッション作成
 */
export async function POST() {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: "現在準備中です", redirect: "/premium" },
      { status: 503 },
    );
  }

  // NextAuth セッションからユーザー情報を取得
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

  // 既存の Stripe Customer があればそれを使う
  const db = getDb();
  let stripeCustomerId: string | undefined;

  if (db) {
    const rows = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.googleId, session.user.id))
      .limit(1);

    if (rows[0]?.stripeCustomerId) {
      stripeCustomerId = rows[0].stripeCustomerId;
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    ...(stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: session.user.email || undefined }),
    metadata: {
      googleId: session.user.id,
    },
    success_url: `${siteUrl}/mypage?upgraded=true`,
    cancel_url: `${siteUrl}/premium`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
