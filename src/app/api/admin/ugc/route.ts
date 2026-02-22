import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { ugcPosts, auditLog } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let rows;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      rows = await db
        .select()
        .from(ugcPosts)
        .where(eq(ugcPosts.status, status))
        .orderBy(desc(ugcPosts.createdAt));
    } else {
      rows = await db
        .select()
        .from(ugcPosts)
        .orderBy(desc(ugcPosts.createdAt));
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Failed to fetch UGC posts:", err);
    return NextResponse.json({ error: "Failed to fetch UGC posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const body = await request.json();

    if (!body.postUrl || !body.platform) {
      return NextResponse.json(
        { error: "postUrl and platform are required" },
        { status: 400 }
      );
    }

    const newPost = await db.insert(ugcPosts).values({
      platform: body.platform,
      postUrl: body.postUrl,
      embedHtml: body.embedHtml || null,
      caption: body.caption || null,
      featureSlug: body.featureSlug || null,
      status: body.status || "pending",
    }).returning();

    await db.insert(auditLog).values({
      action: "ugc.create",
      target: `${body.platform}:${body.postUrl}`,
      details: { featureSlug: body.featureSlug },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (err) {
    console.error("Failed to create UGC post:", err);
    return NextResponse.json({ error: "Failed to create UGC post" }, { status: 500 });
  }
}
