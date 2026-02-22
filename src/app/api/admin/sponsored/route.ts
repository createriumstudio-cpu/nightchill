import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sponsoredSpots, auditLog } from "@/lib/schema";
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
  const results = await db.select().from(sponsoredSpots).orderBy(sponsoredSpots.priority);
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
  const result = await db.insert(sponsoredSpots).values({
    title: body.title,
    description: body.description,
    url: body.url,
    imageUrl: body.imageUrl || null,
    category: body.category || "other",
    targetAreas: body.targetAreas || [],
    labelJa: body.labelJa || "おすすめ",
    labelEn: body.labelEn || "Recommended",
    isActive: body.isActive ?? true,
  }).returning();

  await db.insert(auditLog).values({
    action: "create",
    target: `sponsored_spot:${result[0].id}`,
    details: { title: body.title },
  });

  return NextResponse.json(result[0], { status: 201 });
}
