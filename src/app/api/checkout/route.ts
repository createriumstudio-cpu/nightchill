import { NextRequest, NextResponse } from "next/server";
import { getStripe, generateOrderNumber } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { products, orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/checkout — Stripeチェックアウトセッション作成
 *
 * Body: { productSlug, quantity?, planSlug? }
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 503 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { productSlug, quantity = 1, planSlug } = body;

  if (!productSlug) {
    return NextResponse.json(
      { error: "productSlug is required" },
      { status: 400 },
    );
  }

  // 商品取得
  const productResult = await db
    .select()
    .from(products)
    .where(eq(products.slug, productSlug))
    .limit(1);

  const product = productResult[0];
  if (!product || !product.isActive) {
    return NextResponse.json(
      { error: "Product not found or unavailable" },
      { status: 404 },
    );
  }

  // 在庫チェック
  if (product.stock !== null && product.stock < quantity) {
    return NextResponse.json(
      { error: "Insufficient stock" },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://futatabito.com";
  const orderNumber = generateOrderNumber();

  // Stripeチェックアウトセッション作成
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: product.name,
            description: product.shortDescription || product.description,
            ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
          },
          unit_amount: product.price,
        },
        quantity,
      },
    ],
    metadata: {
      orderNumber,
      productId: String(product.id),
      productSlug: product.slug,
      planSlug: planSlug || "",
    },
    success_url: `${siteUrl}/checkout/success?order=${orderNumber}`,
    cancel_url: `${siteUrl}/checkout/cancel?product=${product.slug}`,
  });

  // 注文レコード作成（pending状態）
  await db.insert(orders).values({
    orderNumber,
    productId: product.id,
    quantity,
    totalAmount: product.price * quantity,
    status: "pending",
    customerEmail: "", // Stripe webhook で更新
    stripeSessionId: session.id,
    planSlug: planSlug || null,
  });

  return NextResponse.json({ url: session.url, orderNumber });
}
