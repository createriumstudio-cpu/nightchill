import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { blogPosts, auditLog } from "@/lib/schema";
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
      { status: 503 },
    );
  }

  const { slug } = await params;

  try {
    const [current] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const newPublished = !current.isPublished;

    const [updated] = await db
      .update(blogPosts)
      .set({
        isPublished: newPublished,
        publishedAt: newPublished && !current.publishedAt ? now : current.publishedAt,
        updatedAt: now,
      })
      .where(eq(blogPosts.slug, slug))
      .returning();

    await db.insert(auditLog).values({
      action: newPublished ? "blog.publish" : "blog.unpublish",
      target: slug,
      details: { title: current.title },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to toggle blog post:", err);
    return NextResponse.json(
      { error: "Failed to toggle blog post" },
      { status: 500 },
    );
  }
}
