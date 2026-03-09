import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPostBySlug, getLatestPosts, BLOG_CATEGORIES } from "@/lib/blog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished) return { title: "記事が見つかりません" };

  const pageUrl = `${siteUrl}/blog/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({ title: post.title, subtitle: post.excerpt.slice(0, 60) }).toString()}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: pageUrl,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImageUrl],
      site: "@futatabito_date",
    },
  };
}

function getCategoryLabel(categoryId: string): string {
  return (
    BLOG_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
  );
}

function renderContent(content: string) {
  const paragraphs = content.split("\n\n").filter((p) => p.trim());
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();

    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="text-2xl font-bold mt-10 mb-4 text-foreground"
        >
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="text-xl font-bold mt-8 mb-3 text-foreground"
        >
          {trimmed.slice(4)}
        </h3>
      );
    }

    const lines = trimmed.split("\n");
    const isList = lines.every((l) => l.startsWith("- ") || l.startsWith("* "));
    if (isList) {
      return (
        <ul key={index} className="list-disc pl-6 space-y-1 my-4 text-muted">
          {lines.map((line, li) => (
            <li key={li}>{line.slice(2)}</li>
          ))}
        </ul>
      );
    }

    const isNumberedList = lines.every((l) => /^\d+\.\s/.test(l));
    if (isNumberedList) {
      return (
        <ol
          key={index}
          className="list-decimal pl-6 space-y-1 my-4 text-muted"
        >
          {lines.map((line, li) => (
            <li key={li}>{line.replace(/^\d+\.\s/, "")}</li>
          ))}
        </ol>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary/30 pl-4 my-6 text-muted italic"
        >
          {trimmed.slice(2)}
        </blockquote>
      );
    }

    return (
      <p key={index} className="text-muted leading-relaxed my-4">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished) notFound();

  const relatedPosts = await getLatestPosts(4);
  const filteredRelated = relatedPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const pageUrl = `${siteUrl}/blog/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({ title: post.title }).toString()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.heroImage || ogImageUrl,
    url: pageUrl,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
    },
    author: {
      "@type": "Organization",
      name: "futatabito",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    keywords: post.tags,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ブログ",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative py-16 px-4 pt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative max-w-3xl mx-auto text-center">
            <Link
              href="/blog"
              className="inline-block text-sm text-muted hover:text-primary mb-6 transition-colors"
            >
              ← ブログ一覧に戻る
            </Link>
            {post.heroImage && (
              <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            )}
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              {getCategoryLabel(post.category)}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
              {post.title}
            </h1>
            <p className="text-muted text-lg mb-4">{post.excerpt}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-surface-alt text-muted px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="text-sm text-muted">
              {post.publishedAt &&
                new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              {post.updatedAt &&
                post.updatedAt !== post.publishedAt &&
                ` (更新: ${new Date(post.updatedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })})`}
            </div>
          </div>
        </section>

        {/* Content */}
        <article className="max-w-3xl mx-auto px-4 pb-12">
          <div className="prose-equivalent">{renderContent(post.content)}</div>
        </article>

        {/* Related Posts */}
        {filteredRelated.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-12">
            <h2 className="text-xl font-bold mb-6">関連記事</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {filteredRelated.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary mb-2">
                    {getCategoryLabel(related.category)}
                  </span>
                  <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-6 pb-20 text-center">
          <p className="text-muted text-sm mb-4">
            記事を読んだら、あなただけのデートプランを作ってみませんか？
          </p>
          <Link
            href="/plan"
            className="inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            デートを計画する
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
