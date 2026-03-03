import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { blogPosts, auditLog } from "@/lib/schema";
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
      { status: 503 },
    );
  }

  const { slug } = await params;

  try {
    const [row] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(row);
  } catch (err) {
    console.error("Failed to fetch blog post:", err);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 },
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
      { status: 503 },
    );
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const now = new Date();

    const wasPublished = await db
      .select({ isPublished: blogPosts.isPublished, publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    const publishedAt =
      body.isPublished && !wasPublished[0]?.publishedAt
        ? now
        : wasPublished[0]?.publishedAt;

    const [updated] = await db
      .update(blogPosts)
      .set({
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        category: body.category,
        tags: body.tags,
        city: body.city || null,
        heroImage: body.heroImage || null,
        isPublished: body.isPublished,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(blogPosts.slug, slug))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    await db.insert(auditLog).values({
      action: "blog.update",
      target: slug,
      details: { title: body.title },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update blog post:", err);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 },
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
      { status: 503 },
    );
  }

  const { slug } = await params;

  try {
    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .returning({ slug: blogPosts.slug });

    if (!deleted) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    await db.insert(auditLog).values({
      action: "blog.delete",
      target: slug,
      details: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete blog post:", err);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 },
    );
  }
}
