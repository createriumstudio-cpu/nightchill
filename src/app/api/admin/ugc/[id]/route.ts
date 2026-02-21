import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { ugcPosts, auditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await db
      .update(ugcPosts)
      .set({ status, reviewedAt: new Date() })
      .where(eq(ugcPosts.id, numId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "UGC post not found" }, { status: 404 });
    }

    await db.insert(auditLog).values({
      action: `ugc.${status}`,
      target: `ugc:${id}`,
      details: null,
    });

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("Failed to update UGC post:", err);
    return NextResponse.json({ error: "Failed to update UGC post" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = await db
      .delete(ugcPosts)
      .where(eq(ugcPosts.id, numId))
      .returning({ id: ugcPosts.id });

    if (!deleted.length) {
      return NextResponse.json({ error: "UGC post not found" }, { status: 404 });
    }

    await db.insert(auditLog).values({
      action: "ugc.delete",
      target: `ugc:${id}`,
      details: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete UGC post:", err);
    return NextResponse.json({ error: "Failed to delete UGC post" }, { status: 500 });
  }
}
