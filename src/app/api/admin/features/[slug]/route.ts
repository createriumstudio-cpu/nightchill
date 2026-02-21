import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { features, auditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
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

  const { slug } = await params;

  try {
    const [row] = await db
      .select()
      .from(features)
      .where(eq(features.slug, slug))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (err) {
    console.error("Failed to fetch feature:", err);
    return NextResponse.json(
      { error: "Failed to fetch feature" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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

  const { slug } = await params;

  try {
    const body = await request.json();
    const now = new Date();

    const [updated] = await db
      .update(features)
      .set({
        title: body.title,
        subtitle: body.subtitle,
        description: body.description,
        area: body.area,
        tags: body.tags,
        heroEmoji: body.heroEmoji,
        heroImage: body.heroImage || null,
        spots: body.spots,
        isPublished: body.isPublished,
        updatedAt: now,
      })
      .where(eq(features.slug, slug))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(auditLog).values({
      action: "feature.update",
      target: slug,
      details: { title: body.title },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update feature:", err);
    return NextResponse.json(
      { error: "Failed to update feature" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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

  const { slug } = await params;

  try {
    const [deleted] = await db
      .delete(features)
      .where(eq(features.slug, slug))
      .returning({ slug: features.slug });

    if (!deleted) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(auditLog).values({
      action: "feature.delete",
      target: slug,
      details: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete feature:", err);
    return NextResponse.json(
      { error: "Failed to delete feature" },
      { status: 500 }
    );
  }
}
