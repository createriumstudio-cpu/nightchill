import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllFeatures } from "@/lib/features";
import { getCityById, CITIES } from "@/lib/cities";
import { Metadata } from "next";

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

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

  const allFeatures = await getAllFeatures();

  // Filter features by city areas
  const cityAreas = city.areas.map((a) => a.toLowerCase());
    const cityFeatures = allFeatures.filter((feature) => {
          const featureArea = feature.area.toLowerCase();
          return (
                  cityAreas.some((a) => featureArea.includes(a)) ||
                  feature.tags.some((t) =>
                            cityAreas.some((a) => t.toLowerCase().includes(a))
                                          )
                );
    });

  return (
        <>
              <Header />
              <div className="min-h-screen bg-background">
                {/* Hero */}
                      <section className="px-6 pt-28 pb-12 text-center">
                                <Link
                                              href={`/${cityId}`}
                                              className="inline-block text-sm text-muted hover:text-primary transition-colors mb-4"
                                            >
                                            ← {city.name}トップに戻る
                                </Link>Link>
                                <h1 className="text-4xl font-bold md:text-5xl">
                                            <span className="mr-2">🔥</span>span>
                                  {city.name}のデート特集
                                </h1>h1>
                                <p className="mx-auto mt-4 max-w-xl text-muted">
                                  {city.name}エリアのおすすめデートスポットをプロの視点で厳選して紹介
                                </p>p>
                      </section>section>
              
                {cityFeatures.length > 0 ? (
                    /* Feature Cards */
                    <section className="mx-auto max-w-4xl px-6 pb-16">
                                <div className="grid gap-8 md:grid-cols-2">
                                  {cityFeatures.map((feature) => (
                                      <Link
                                                          key={feature.slug}
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
                                                                                                                              </span>span>
                                                                                                      </div>div>
                                                                              </div>div>
                                                                            ) : (
                                                                              <div className="flex h-48 items-center justify-center bg-surface-alt">
                                                                                                    <span className="text-6xl">{feature.heroEmoji}</span>span>
                                                                              </div>div>
                                                        )}
                                                        <div className="p-5">
                                                                            <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                                                                              {feature.title}
                                                                            </h2>h2>
                                                                            <p className="mt-2 text-sm text-muted line-clamp-2">
                                                                              {feature.subtitle}
                                                                            </p>p>
                                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                              {feature.tags.slice(0, 3).map((tag) => (
                                                                                  <span
                                                                                                              key={tag}
                                                                                                              className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-muted"
                                                                                                            >
                                                                                                            #{tag}
                                                                                    </span>span>
                                                                                ))}
                                                                            </div>div>
                                                                            <div className="mt-4 flex items-center gap-1 text-xs text-muted">
                                                                                                  <span>📍</span>span>
                                                                                                  <span>
                                                                                                    {feature.spots.map((s) => s.name).join(" → ")}
                                                                                                    </span>span>
                                                                            </div>div>
                                                                            <div className="mt-4 flex items-center justify-between text-xs text-muted">
                                                                                                  <span>
                                                                                                    {new Date(feature.publishedAt).toLocaleDateString(
                                                                                    "ja-JP",
                                                          { year: "numeric", month: "long", day: "numeric" }
                                                                                  )}{" "}
                                                                                                                          公開
                                                                                                    </span>span>
                                                                                                  <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">
                                                                                                                          詳しく見る →
                                                                                                    </span>span>
                                                                            </div>div>
                                                        </div>div>
                                      </Link>Link>
                                    ))}
                                </div>div>
                    </section>section>
                  ) : (
                    /* Coming Soon */
                    <section className="mx-auto max-w-2xl px-6 pb-16 text-center">
                                <div className="rounded-2xl border border-border bg-surface p-12">
                                              <span className="text-6xl">🏗️</span>span>
                                              <h2 className="mt-6 text-2xl font-bold">
                                                {city.name}の特集記事は準備中です
                                              </h2>h2>
                                              <p className="mt-3 text-muted">
                                                {city.name}エリアのデート特集を鋭意制作中です。お楽しみに！
                                              </p>p>
                                </div>div>
                    </section>section>
                      )}
              
                {/* CTA */}
                      <section className="px-6 pb-20 text-center">
                                <p className="text-muted">
                                  {city.name}であなただけのデートプランを作りませんか？
                                </p>p>
                                <Link
                                              href={`/plan?city=${cityId}`}
                                              className="mt-4 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
                                            >
                                            ✨ {city.name}のプランを作る
                                </Link>Link>
                      </section>section>
              </div>div>
              <Footer />
        </>>
      );
}</>
