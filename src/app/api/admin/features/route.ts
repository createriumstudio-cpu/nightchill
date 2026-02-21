import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { features, auditLog } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const rows = await db
      .select()
      .from(features)
      .orderBy(desc(features.publishedAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Failed to fetch features:", err);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!body.slug || !body.title) {
      return NextResponse.json(
        { error: "slug と title は必須です" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await db
      .select({ id: features.id })
      .from(features)
      .where(eq(features.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "このslugは既に使用されています" },
        { status: 409 }
      );
    }

    const now = new Date();
    const [newFeature] = await db
      .insert(features)
      .values({
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle || "",
        description: body.description || "",
        area: body.area || "",
        tags: body.tags || [],
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : now,
        updatedAt: now,
        heroEmoji: body.heroEmoji || "",
        heroImage: body.heroImage || null,
        spots: body.spots || [],
        isPublished: body.isPublished ?? true,
      })
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      action: "feature.create",
      target: body.slug,
      details: { title: body.title },
    });

    return NextResponse.json(newFeature, { status: 201 });
  } catch (err) {
    console.error("Failed to create feature:", err);
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}
