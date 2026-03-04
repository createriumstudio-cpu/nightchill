import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { products, auditLog } from "@/lib/schema";
import { isAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const results = await db.select().from(products);
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const body = await request.json();

  if (!body.slug || !body.name || !body.description || body.price == null) {
    return NextResponse.json(
      { error: "slug, name, description, price are required" },
      { status: 400 },
    );
  }

  const result = await db
    .insert(products)
    .values({
      slug: body.slug,
      name: body.name,
      description: body.description,
      shortDescription: body.shortDescription || null,
      price: Number(body.price),
      imageUrl: body.imageUrl || null,
      category: body.category || "other",
      targetOccasions: body.targetOccasions || [],
      targetMoods: body.targetMoods || [],
      targetBudgets: body.targetBudgets || [],
      stripeProductId: body.stripeProductId || null,
      stripePriceId: body.stripePriceId || null,
      isActive: body.isActive ?? true,
      stock: body.stock ?? null,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  await db.insert(auditLog).values({
    action: "create",
    target: `product:${result[0].id}`,
    details: { name: body.name, slug: body.slug },
  });

  return NextResponse.json(result[0], { status: 201 });
}
