import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { blogPosts, auditLog } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
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

  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Failed to fetch blog posts:", err);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

  try {
    const body = await request.json();

    if (!body.slug || !body.title || !body.content) {
      return NextResponse.json(
        { error: "slug, title, content は必須です" },
        { status: 400 },
      );
    }

    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "このslugは既に使用されています" },
        { status: 409 },
      );
    }

    const now = new Date();
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt || "",
        content: body.content,
        category: body.category || "column",
        tags: body.tags || [],
        city: body.city || null,
        heroImage: body.heroImage || null,
        publishedAt: body.isPublished ? now : null,
        updatedAt: now,
        isPublished: body.isPublished ?? false,
      })
      .returning();

    await db.insert(auditLog).values({
      action: "blog.create",
      target: body.slug,
      details: { title: body.title },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (err) {
    console.error("Failed to create blog post:", err);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 },
    );
  }
}
