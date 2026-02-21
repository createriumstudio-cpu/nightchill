import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ugcPosts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// Public API: Get approved UGC posts by featureSlug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureSlug = searchParams.get("featureSlug");

    if (!featureSlug) {
      return NextResponse.json({ error: "featureSlug is required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const posts = await db
      .select()
      .from(ugcPosts)
      .where(eq(ugcPosts.featureSlug, featureSlug))
      .orderBy(desc(ugcPosts.createdAt));

    // Only return approved posts for public API
    const approvedPosts = posts.filter((p) => p.status === "approved");

    return NextResponse.json(approvedPosts);
  } catch (err) {
    console.error("Failed to fetch UGC posts:", err);
    return NextResponse.json({ error: "Failed to fetch UGC posts" }, { status: 500 });
  }
}
