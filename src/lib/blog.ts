/**
 * ブログ記事データ管理
 *
 * Neon Postgres (blog_posts table) から記事を読み込む。
 * SEOメディア化のコア機能。
 *
 * hero_image (base64) はページに埋め込まず、/api/blog/image/[slug] 経由で配信。
 * FALLBACK_BODY_TOO_LARGE 対策。
 */

import { getDb } from "./db";
import { blogPosts } from "./schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  city: string | null;
  /** Image URL (/api/blog/image/[slug]) — base64 is no longer embedded */
  heroImage: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  isPublished: boolean;
}

/** ブログカテゴリ */
export const BLOG_CATEGORIES = [
  { id: "tips", label: "デートのコツ" },
  { id: "seasonal", label: "季節のデート" },
  { id: "area-guide", label: "エリアガイド" },
  { id: "first-date", label: "初デート" },
  { id: "anniversary", label: "記念日" },
  { id: "column", label: "コラム" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["id"];

/** Lightweight columns — hero_image excluded, replaced by boolean check */
const lightColumns = {
  id: blogPosts.id,
  slug: blogPosts.slug,
  title: blogPosts.title,
  excerpt: blogPosts.excerpt,
  content: blogPosts.content,
  category: blogPosts.category,
  tags: blogPosts.tags,
  city: blogPosts.city,
  hasHeroImage: sql<boolean>`hero_image IS NOT NULL`.as("has_hero_image"),
  publishedAt: blogPosts.publishedAt,
  updatedAt: blogPosts.updatedAt,
  createdAt: blogPosts.createdAt,
  isPublished: blogPosts.isPublished,
} as const;

type LightRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: unknown;
  city: string | null;
  hasHeroImage: boolean;
  publishedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  isPublished: boolean;
};

function rowToPost(row: LightRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: (row.tags as string[]) || [],
    city: row.city,
    heroImage: row.hasHeroImage ? `/api/blog/image/${row.slug}` : null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
    isPublished: row.isPublished,
  };
}

/**
 * 公開済みブログ記事を取得（新しい順）
 */
export async function getPublishedPosts(
  limit = 20,
): Promise<BlogPost[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select(lightColumns)
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.isPublished, true),
          isNotNull(blogPosts.publishedAt),
        ),
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);

    return (rows as LightRow[]).map(rowToPost);
  } catch (e) {
    console.warn("Failed to fetch blog posts:", e);
    return [];
  }
}

/**
 * カテゴリ別にブログ記事を取得
 */
export async function getPostsByCategory(
  category: string,
  limit = 20,
): Promise<BlogPost[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select(lightColumns)
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.isPublished, true),
          eq(blogPosts.category, category),
          isNotNull(blogPosts.publishedAt),
        ),
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);

    return (rows as LightRow[]).map(rowToPost);
  } catch (e) {
    console.warn("Failed to fetch blog posts by category:", e);
    return [];
  }
}

/**
 * slugでブログ記事を取得
 */
export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  try {
    const db = getDb();
    if (!db) return undefined;

    const rows = await db
      .select(lightColumns)
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (rows.length === 0) return undefined;
    return rowToPost(rows[0] as LightRow);
  } catch (e) {
    console.warn("Failed to fetch blog post:", e);
    return undefined;
  }
}

/**
 * 最新ブログ記事を取得（トップページ等）
 */
export async function getLatestPosts(
  limit = 3,
): Promise<BlogPost[]> {
  return getPublishedPosts(limit);
}

/**
 * 全公開済みブログ記事のslugを取得（sitemap用）
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.isPublished, true),
          isNotNull(blogPosts.publishedAt),
        ),
      );

    return rows.map((r) => r.slug);
  } catch (e) {
    console.warn("Failed to fetch blog slugs:", e);
    return [];
  }
}

/**
 * 管理用: 全ブログ記事を取得（公開・非公開含む）
 */
export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select(lightColumns)
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));

    return (rows as LightRow[]).map(rowToPost);
  } catch (e) {
    console.warn("Failed to fetch all blog posts:", e);
    return [];
  }
}
