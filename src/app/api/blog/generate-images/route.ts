/**
 * heroImageがnullの全ブログ記事に対して画像を生成しDBに保存するAPIルート
 *
 * POST /api/blog/generate-images
 * 認証: CRON_SECRET (Authorization: Bearer <secret>)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { blogPosts } from "@/lib/schema";
import { isNull, eq } from "drizzle-orm";
import { generateBlogImage } from "@/lib/generateBlogImage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // 認証チェック
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    // heroImageがnullの記事を全取得
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        excerpt: blogPosts.excerpt,
        city: blogPosts.city,
      })
      .from(blogPosts)
      .where(isNull(blogPosts.heroImage));

    if (posts.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No posts need image generation",
        processed: 0,
      });
    }

    console.log(`[generate-images] Found ${posts.length} posts without heroImage`);

    const results: Array<{
      slug: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const post of posts) {
      try {
        const imageDataUrl = await generateBlogImage({
          title: post.title,
          category: post.category,
          excerpt: post.excerpt,
          city: post.city,
        });

        if (imageDataUrl) {
          await db
            .update(blogPosts)
            .set({
              heroImage: imageDataUrl,
              updatedAt: new Date(),
            })
            .where(eq(blogPosts.id, post.id));

          results.push({ slug: post.slug, success: true });
          console.log(`[generate-images] Updated: ${post.slug}`);
        } else {
          results.push({
            slug: post.slug,
            success: false,
            error: "Image generation returned null",
          });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({ slug: post.slug, success: false, error: msg });
        console.error(`[generate-images] Failed for ${post.slug}:`, error);
      }

      // APIレート制限対策: 各生成間に2秒待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      ok: true,
      summary: { succeeded, failed, total: results.length },
      results,
    });
  } catch (error) {
    console.error("[generate-images] Batch failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
