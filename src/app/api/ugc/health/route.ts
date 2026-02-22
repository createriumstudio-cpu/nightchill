import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ugcPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Called by frontend when an embed fails to load
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    await db.update(ugcPosts)
      .set({
        isAvailable: false,
        lastCheckedAt: new Date(),
      })
      .where(eq(ugcPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UGC health report error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
