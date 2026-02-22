import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sponsoredSpots, auditLog } from "@/lib/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const { id } = await params;
  const body = await request.json();
  const result = await db
    .update(sponsoredSpots)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(sponsoredSpots.id, Number(id)))
    .returning();

  await db.insert(auditLog).values({
    action: "update",
    target: `sponsored_spot:${id}`,
    details: body,
  });

  return NextResponse.json(result[0]);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const { id } = await params;
  await db.delete(sponsoredSpots).where(eq(sponsoredSpots.id, Number(id)));

  await db.insert(auditLog).values({
    action: "delete",
    target: `sponsored_spot:${id}`,
  });

  return NextResponse.json({ ok: true });
}
