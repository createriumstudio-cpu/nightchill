import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { blogPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const db = getDb();
    if (!db) {
      return new NextResponse("Service unavailable", { status: 503 });
    }

    const rows = await db
      .select({ heroImage: blogPosts.heroImage })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (rows.length === 0 || !rows[0].heroImage) {
      return new NextResponse("Not found", { status: 404 });
    }

    const base64 = rows[0].heroImage;

    // Remove data URI prefix if present (e.g. "data:image/png;base64,...")
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;
    const buffer = Buffer.from(raw, "base64");

    // Detect content type from data URI or default to PNG
    let contentType = "image/png";
    const match = base64.match(/^data:(image\/[a-z+]+);base64,/);
    if (match) {
      contentType = match[1];
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    console.error("Failed to serve blog image:", e);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
