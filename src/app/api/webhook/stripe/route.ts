import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/webhook/stripe — Stripe Webhookハンドラ
 *
 * checkout.session.completed イベントで注文ステータスを更新。
 * STRIPE_WEBHOOK_SECRET 環境変数で署名検証。
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // 開発環境: 署名検証なし
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderNumber = session.metadata?.orderNumber;

    if (orderNumber) {
      await db
        .update(orders)
        .set({
          status: "paid",
          customerEmail: session.customer_details?.email || "",
          customerName: session.customer_details?.name || null,
          stripePaymentIntentId: session.payment_intent || null,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.orderNumber, orderNumber));
    }
  }

  return NextResponse.json({ received: true });
}
