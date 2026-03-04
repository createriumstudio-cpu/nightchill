import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reservations } from "@/lib/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const results = await db
    .select()
    .from(reservations)
    .orderBy(desc(reservations.createdAt))
    .limit(100);
  return NextResponse.json(results);
}
