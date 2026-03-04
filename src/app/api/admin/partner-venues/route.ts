import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { partnerVenues, auditLog } from "@/lib/schema";
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
  const results = await db.select().from(partnerVenues);
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

  if (!body.name || !body.category || !body.area || !body.city) {
    return NextResponse.json(
      { error: "name, category, area, city are required" },
      { status: 400 },
    );
  }

  const result = await db
    .insert(partnerVenues)
    .values({
      name: body.name,
      description: body.description || null,
      category: body.category,
      area: body.area,
      city: body.city,
      address: body.address || null,
      phone: body.phone || null,
      websiteUrl: body.websiteUrl || null,
      imageUrl: body.imageUrl || null,
      bookingUrl: body.bookingUrl || null,
      priceRange: body.priceRange || null,
      isActive: body.isActive ?? true,
    })
    .returning();

  await db.insert(auditLog).values({
    action: "create",
    target: `partner_venue:${result[0].id}`,
    details: { name: body.name },
  });

  return NextResponse.json(result[0], { status: 201 });
}
