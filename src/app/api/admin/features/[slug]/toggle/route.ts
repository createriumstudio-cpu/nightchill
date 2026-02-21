import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { features, auditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
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
    // Get current state
    const [current] = await db
      .select({ isPublished: features.isPublished })
      .from(features)
      .where(eq(features.slug, slug))
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 }
      );
    }

    const newState = !current.isPublished;

    const [updated] = await db
      .update(features)
      .set({
        isPublished: newState,
        updatedAt: new Date(),
      })
      .where(eq(features.slug, slug))
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      action: newState ? "feature.publish" : "feature.unpublish",
      target: slug,
      details: { isPublished: newState },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to toggle feature:", err);
    return NextResponse.json(
      { error: "Failed to toggle feature" },
      { status: 500 }
    );
  }
}
