import Link from "next/link";
import Header from "@/components/Header";
import { getAllFeatures } from "@/lib/features";

import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

export const metadata: Metadata = {
  title: "特集 | futatabito",
  description: "今話題のデートスポットを、SNSの口コミとプロのアドバイスとともに紹介",
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: "デート特集一覧 | futatabito",
    description: "今話題のデートスポットを、SNSの口コミとプロのアドバイスとともに紹介",
    url: `${siteUrl}/features`,
    siteName: "futatabito",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "デート特集一覧 | futatabito",
    description: "今話題のデートスポットを、SNSの口コミとプロのアドバイスとともに紹介",
  },
};

export default async function FeaturesPage() {
  const features = await getAllFeatures();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="px-6 pt-28 pb-12 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            <span className="mr-2">🔥</span>デート特集
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            今話題のデートスポットを、SNSの口コミとプロのアドバイスとともに紹介
          </p>
        </section>

        {/* Feature Cards */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-xl hover:border-primary/30"
              >
                {/* Hero Image */}
                {feature.heroImage ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={feature.heroImage}
                      alt={feature.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs font-medium text-primary-light bg-black/40 px-2 py-1 rounded-full">
                        {feature.area}エリア
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-surface-alt">
                    <span className="text-6xl">{feature.heroEmoji}</span>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-5">
                  <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted line-clamp-2">
                    {feature.subtitle}
                  </p>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feature.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Spots Preview */}
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted">
                    <span>📍</span>
                    <span>
                      {feature.spots.map((s) => s.name).join(" → ")}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>{feature.publishedAt} 公開</span>
                    <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">
                      詳しく見る →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-20 text-center">
          <p className="text-muted">
            特集にないエリアやシーンも、あなただけのデートプランを作れます
          </p>
          <Link
            href="/plan"
            className="mt-4 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            ✨ あなただけのプランを作る
          </Link>
        </section>
      </div>
    </>
  );
}
