import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook — Stripe Webhook ハンドラ（サブスクリプション用）
 *
 * 処理するイベント:
 * - checkout.session.completed → is_premium = true, stripe_customer_id/subscription_id 保存
 * - customer.subscription.deleted → is_premium = false
 * - customer.subscription.updated → ステータス更新
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  // Webhook 署名検証
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // 開発環境: 署名検証をスキップ
    event = JSON.parse(body) as Stripe.Event;
    console.warn("Webhook signature verification skipped (dev mode)");
  }

  const db = getDb();
  if (!db) {
    console.error("Database not configured for webhook processing");
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode !== "subscription") break;

      const googleId = session.metadata?.googleId;
      if (!googleId) {
        console.error("No googleId in checkout session metadata");
        break;
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      await db
        .update(users)
        .set({
          isPremium: true,
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscriptionId || null,
          lastSeenAt: new Date(),
        })
        .where(eq(users.googleId, googleId));

      console.log(`Premium activated for googleId: ${googleId}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;

      await db
        .update(users)
        .set({
          isPremium: false,
          stripeSubscriptionId: null,
          premiumExpiresAt: new Date(),
        })
        .where(eq(users.stripeSubscriptionId, subId));

      console.log(`Premium deactivated for subscription: ${subId}`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;
      const isActive = ["active", "trialing"].includes(subscription.status);

      // Stripe SDK v20+: current_period_end は items.data[0].current_period_end にある場合がある
      const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number | undefined;

      await db
        .update(users)
        .set({
          isPremium: isActive,
          ...(periodEnd
            ? { premiumExpiresAt: new Date(periodEnd * 1000) }
            : {}),
        })
        .where(eq(users.stripeSubscriptionId, subId));

      console.log(`Subscription ${subId} updated: active=${isActive}`);
      break;
    }

    default:
      // 未対応イベントはスキップ
      break;
  }

  return NextResponse.json({ received: true });
}
