import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllFeatures, getWeeklyFeatures } from "@/lib/features";
import type { FeaturedArticle } from "@/lib/features";
import { getCityById, CITIES } from "@/lib/cities";
import { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

export const revalidate = 3600;

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: cityId } = await params;
  const city = getCityById(cityId);
  if (!city) return {};

  const title = `${city.name}のデート特集 | futatabito`;
  const description = `${city.name}エリアのおすすめデートプラン特集。${city.name}で人気のデートスポットをプロの視点で厳選して紹介します。`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${cityId}/features` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${cityId}/features`,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "website",
    },
  };
}

export default async function CityFeaturesPage({ params }: Props) {
  const { city: cityId } = await params;
  const city = getCityById(cityId);
  if (!city) notFound();

  const [allFeatures, weeklyFeatures] = await Promise.all([
    getAllFeatures(),
    getWeeklyFeatures(city.name, 6),
  ]);

  const cityAreas = city.areas.map((a) => a.toLowerCase());
  const cityName = city.name.toLowerCase();

  // 静的記事: エリア名 or 都市名でフィルタ
  const staticFeatures = allFeatures.filter((feature) => {
    if (feature.isWeekly) return false;
    const featureArea = feature.area.toLowerCase();
    return (
      featureArea.includes(cityName) ||
      cityAreas.some((a) => featureArea.includes(a)) ||
      feature.tags.some(
        (t) =>
          t.toLowerCase().includes(cityName) ||
          cityAreas.some((a) => t.toLowerCase().includes(a)),
      )
    );
  });

  const hasContent = weeklyFeatures.length > 0 || staticFeatures.length > 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <section className="px-6 pt-28 pb-12 text-center">
          <Link
            href={`/${cityId}`}
            className="inline-block text-sm text-muted hover:text-primary transition-colors mb-4"
          >
            {city.name}トップに戻る
          </Link>
          <h1 className="text-4xl font-bold md:text-5xl">
            {city.name}のデート特集
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            {city.name}エリアのおすすめデートスポットをプロの視点で厳選して紹介
          </p>
        </section>

        {hasContent ? (
          <>
            {weeklyFeatures.length > 0 && (
              <section className="mx-auto max-w-4xl px-6 pb-12">
                <div className="mb-6 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-2xl font-bold">
                    {city.name}の今週のおすすめ
                  </h2>
                  <span className="ml-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                    NEW
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {weeklyFeatures.map((feature) => (
                    <FeatureCard key={feature.slug} feature={feature} />
                  ))}
                </div>
              </section>
            )}

            {staticFeatures.length > 0 && (
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
            )}
          </>
        ) : (
          <section className="mx-auto max-w-2xl px-6 pb-16 text-center">
            <div className="rounded-2xl border border-border bg-surface p-12">
              <h2 className="mt-6 text-2xl font-bold">
                {city.name}の特集記事は準備中です
              </h2>
              <p className="mt-3 text-muted">
                {city.name}エリアのデート特集を鋭意制作中です。お楽しみに！
              </p>
            </div>
          </section>
        )}

        <section className="px-6 pb-20 text-center">
          <p className="text-muted">
            {city.name}であなただけのデートプランを作りませんか？
          </p>
          <Link
            href={`/plan?city=${cityId}`}
            className="mt-4 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            {city.name}のプランを作る
          </Link>
        </section>
      </div>
      <Footer />
    </>
  );
}

function FeatureCard({ feature }: { feature: FeaturedArticle }) {
  return (
    <Link
      href={`/features/${feature.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-xl hover:border-primary/30"
    >
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
            })}
          </span>
          <span className="font-medium text-primary">詳しく見る →</span>
        </div>
      </div>
    </Link>
  );
}
