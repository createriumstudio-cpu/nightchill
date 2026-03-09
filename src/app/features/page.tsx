import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { getAllFeatures, getLatestWeeklyFeatures } from "@/lib/features";
import type { FeaturedArticle } from "@/lib/features";
import { Metadata } from "next";
import Footer from "@/components/Footer";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

/** ISR: 1時間ごとに再生成（週次記事の反映用） */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "デート特集",
  description:
    "今週のトレンドスポットから、実際に予約できるおすすめプランまで。恵比寿・渋谷・表参道・六本木・銀座・中目黒・代官山のエリア別デートガイド。",
  keywords: [
    "東京 デート特集",
    "デートスポット まとめ",
    "恵比寿 デート",
    "渋谷 デート",
    "表参道 デート",
    "六本木 デート",
    "銀座 デート",
    "中目黒 デート",
    "代官山 デート",
  ],
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    title: "デート特集一覧",
    description:
      "今週のトレンドスポットから、実際に予約できるおすすめプランまで。エリア別デートガイド。",
    url: `${siteUrl}/features`,
    siteName: "futatabito",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: `${siteUrl}/api/og?${new URLSearchParams({ title: "デート特集一覧", subtitle: "エリア別の厳選デートスポットガイド" }).toString()}`,
        width: 1200,
        height: 630,
        alt: "デート特集一覧",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "デート特集一覧",
    description:
      "今週のトレンドスポットから、実際に予約できるおすすめプランまで",
    images: [
      `${siteUrl}/api/og?${new URLSearchParams({ title: "デート特集一覧", subtitle: "エリア別の厳選デートスポットガイド" }).toString()}`,
    ],
    site: "@futatabito_date",
  },
};

function FeatureCard({ feature }: { feature: FeaturedArticle }) {
  return (
    <Link
      key={feature.slug}
      href={`/features/${feature.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-xl hover:border-primary/30"
    >
      {feature.heroImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={feature.heroImage}
            alt={feature.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="text-xs font-medium text-primary-light bg-black/40 px-2 py-1 rounded-full">
              {feature.area}エリア
            </span>
            {feature.dateGuide && (
              <span className="text-xs font-medium text-orange-300 bg-black/40 px-2 py-1 rounded-full ml-1">
                {feature.dateGuide.areaTypeLabel}
              </span>
            )}
          </div>
        </div>
      ) : feature.spots[0]?.photoUrl ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={feature.spots[0].photoUrl}
            alt={feature.spots[0].name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={`/api/og?${new URLSearchParams({ title: feature.title, subtitle: feature.area + 'エリア' }).toString()}`}
            alt={feature.title}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="text-xs font-medium text-primary-light bg-black/40 px-2 py-1 rounded-full">
              {feature.area}エリア
            </span>
          </div>
        </div>
      )}
      <div className="p-5">
        <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
          {feature.title}
        </h2>
        <p className="mt-2 text-sm text-muted line-clamp-2">
          {feature.subtitle}
        </p>
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
        <div className="mt-4 flex items-center gap-1 text-xs text-muted">
          <span>📍</span>
          <span>{feature.spots.map((s) => s.name).join(" → ")}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>
            {new Date(feature.publishedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            公開
          </span>
          <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">
            詳しく見る →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function FeaturesPage() {
  const [allFeatures, weeklyFeatures] = await Promise.all([
    getAllFeatures(),
    getLatestWeeklyFeatures(6),
  ]);

  const staticFeatures = allFeatures.filter((f) => !f.isWeekly);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "デート特集一覧",
    description: "エリア別の厳選デートスポットガイド",
    numberOfItems: allFeatures.length,
    itemListElement: allFeatures.map((feature, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: feature.title,
      url: `${siteUrl}/features/${feature.slug}`,
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
            <span className="mr-2">🔥</span>デート特集
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            今週のトレンドスポットから、実際に予約できるおすすめプランまで。
          </p>
        </section>

        {weeklyFeatures.length > 0 && (
          <section className="mx-auto max-w-4xl px-6 pb-12">
            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-2xl font-bold">今週のおすすめデートプラン</h2>
              <span className="ml-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                NEW
              </span>
            </div>
            <p className="mb-6 text-sm text-muted">
              毎週月曜に更新。各都市の最新スポットとトレンドをもとに自動生成されたデートプランです。
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {weeklyFeatures.map((feature) => (
                <Link
                  key={feature.slug}
                  href={`/features/${feature.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-xl hover:border-primary/30"
                >
                  {feature.heroImage ? (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={feature.heroImage}
                        alt={feature.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : feature.spots[0]?.photoUrl ? (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={feature.spots[0].photoUrl}
                        alt={feature.spots[0].name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={`/api/og?${new URLSearchParams({ title: feature.title, subtitle: feature.area + 'エリア' }).toString()}`}
                        alt={feature.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        fill
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {feature.area}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted line-clamp-1">
                      {feature.subtitle}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted">
                      <span>📍</span>
                      <span className="line-clamp-1">
                        {feature.spots
                          .slice(0, 3)
                          .map((s) => s.name)
                          .join(" → ")}
                      </span>
                    </div>
                    <div className="mt-2 text-right text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                      詳しく見る →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-4xl px-6 pb-16">
          {weeklyFeatures.length > 0 && (
            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <h2 className="text-2xl font-bold">定番エリアガイド</h2>
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-2">
            {staticFeatures.map((feature) => (
              <FeatureCard key={feature.slug} feature={feature} />
            ))}
          </div>
        </section>

        <section className="px-6 pb-20 text-center">
          <p className="text-muted">
            特集にないエリアやシーンも、あなただけのデートプランを作れます
          </p>
          <Link
            href="/plan"
            className="mt-4 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            ✨ あなただけのプランを作る
          </Link>
        </section>
      </div>
      <Footer />
    </>
  );
}
