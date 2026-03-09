import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublishedPosts, BLOG_CATEGORIES } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";
import { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "デートのコツ、季節のおすすめプラン、エリアガイドなど、ふたりの時間をもっと楽しくする記事をお届けします。",
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: "ブログ | futatabito",
    description:
      "デートのコツ、季節のおすすめプラン、エリアガイドなど、ふたりの時間をもっと楽しくする記事をお届けします。",
    url: `${siteUrl}/blog`,
    siteName: "futatabito",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: `${siteUrl}/api/og?${new URLSearchParams({ title: "ブログ", subtitle: "デートをもっと楽しくするヒント" }).toString()}`,
        width: 1200,
        height: 630,
        alt: "futatabito ブログ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ブログ | futatabito",
    description:
      "デートのコツ、季節のおすすめプラン、エリアガイドなど",
    site: "@nightchill_date",
  },
};

function getCategoryLabel(categoryId: string): string {
  return (
    BLOG_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-xl hover:border-primary/30"
    >
      {post.heroImage ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.heroImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="text-xs font-medium text-primary-light bg-black/40 px-2 py-1 rounded-full">
              {getCategoryLabel(post.category)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-surface-alt">
          <span className="text-5xl">
            {post.category === "tips"
              ? "💡"
              : post.category === "seasonal"
                ? "🌸"
                : post.category === "first-date"
                  ? "💕"
                  : post.category === "anniversary"
                    ? "🎉"
                    : "📝"}
          </span>
        </div>
      )}
      <div className="p-5">
        <h2 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </span>
          <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">
            続きを読む →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await getPublishedPosts(20);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "futatabito ブログ",
    description: "デートをもっと楽しくするヒント",
    url: `${siteUrl}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <div className="min-h-screen bg-background">
        <section className="px-6 pt-28 pb-12 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            <span className="mr-2">📝</span>ブログ
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            デートのコツ、季節のおすすめプラン、エリアガイドなど、ふたりの時間をもっと楽しくするヒント
          </p>
        </section>

        {/* カテゴリフィルタ */}
        <section className="mx-auto max-w-4xl px-6 pb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {BLOG_CATEGORIES.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-surface-alt px-4 py-1.5 text-sm text-muted"
              >
                {cat.label}
              </span>
            ))}
          </div>
        </section>

        {posts.length > 0 ? (
          <section className="mx-auto max-w-4xl px-6 pb-16">
            <div className="grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-4xl px-6 pb-16 text-center">
            <div className="rounded-2xl border border-border bg-surface p-12">
              <p className="text-4xl mb-4">📝</p>
              <p className="text-lg font-medium">まもなく記事を公開予定です</p>
              <p className="mt-2 text-sm text-muted">
                デートのコツやおすすめプランなど、役立つ情報をお届けします
              </p>
            </div>
          </section>
        )}

        <section className="px-6 pb-20 text-center">
          <p className="text-muted">
            記事を読んだら、あなただけのデートプランを作ってみませんか？
          </p>
          <Link
            href="/plan"
            className="mt-4 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            デートを計画する
          </Link>
        </section>
      </div>
      <Footer />
    </>
  );
}
