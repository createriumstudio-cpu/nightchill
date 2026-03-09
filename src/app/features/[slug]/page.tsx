import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getFeatureBySlug, getAllFeatures } from "@/lib/features";
import { searchVenue, type VenueFactData } from "@/lib/google-places";
import Header from "@/components/Header";
import SpotImage from "@/components/SpotImage";
import ContextualPRSection from "@/components/ContextualPRSection";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.futatabito.com";

/** ISR: 1時間ごとに再生成（週次記事の反映用） */
export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Rate-limit helper: 2sec delay between API calls */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** ISR時に各スポットのGoogle Business Profile情報を取得 */
async function resolveSpotVenues(
  spots: { name: string; area: string; genre: string }[],
): Promise<Map<string, VenueFactData>> {
  const map = new Map<string, VenueFactData>();
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    try {
      const venue = await searchVenue(spot.name, spot.area, spot.genre);
      if (venue) {
        map.set(spot.name, venue);
      }
    } catch (e) {
      console.warn(`[feature-detail] searchVenue failed for "${spot.name}":`, e);
    }
    // 2sec delay between API calls for rate limiting (skip after last)
    if (i < spots.length - 1) {
      await delay(2000);
    }
  }
  return map;
}

export async function generateStaticParams() {
  const features = await getAllFeatures();
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  if (!feature) return { title: "特集が見つかりません" };

  const pageUrl = `${siteUrl}/features/${slug}`;
  const title = feature.title;
  const description = feature.description;
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({ title: feature.title, area: feature.area, subtitle: feature.subtitle }).toString()}`;

  // エリア固有のキーワード
  const areaKeywords = [
    `${feature.area} デート`,
    `${feature.area} ディナー`,
    `${feature.area} おすすめ`,
    ...feature.tags.map((tag) => tag),
  ];

  return {
    title,
    description,
    keywords: areaKeywords,
    alternates: {
      canonical: pageUrl,
      languages: {
        ja: pageUrl,
        en: `${siteUrl}/en/features/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: feature.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      site: "@futatabito_date",
    },
  };
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  if (!feature) notFound();

  // ISR時にGoogle Business Profile情報を取得
  const venueMap = await resolveSpotVenues(feature.spots);

  const pageUrl = `${siteUrl}/features/${slug}`;
  const ogImageUrl = `${siteUrl}/api/og?${new URLSearchParams({ title: feature.title, area: feature.area }).toString()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: feature.title,
    description: feature.description,
    image: ogImageUrl,
    url: pageUrl,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
      },
    },
    author: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
    },
    datePublished: feature.publishedAt,
    dateModified: feature.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    about: {
      "@type": "Place",
      name: feature.area,
      address: {
        "@type": "PostalAddress",
        addressLocality: feature.area,
        addressCountry: "JP",
      },
    },
    keywords: [
      `${feature.area} デート`,
      `${feature.area} おすすめ`,
      ...feature.tags,
    ],
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
        name: "特集",
        item: `${siteUrl}/features`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: feature.title,
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
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <section className="relative py-16 px-4 pt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 to-transparent" />
          <div className="relative max-w-3xl mx-auto text-center">
            <Link
              href="/features"
              className="inline-block text-sm text-gray-400 hover:text-orange-400 mb-6 transition-colors"
            >
              ← 特集一覧に戻る
            </Link>
            {feature.heroImage ? (
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                <Image
                  src={feature.heroImage}
                  alt={feature.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
              </div>
            ) : (
              <div className="text-5xl mb-4">{feature.heroEmoji}</div>
            )}
            <span className="text-xs text-orange-400 font-medium">
              {feature.area}エリア特集
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
              {feature.title}
            </h1>
            <p className="text-gray-400 text-lg mb-4">{feature.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {feature.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Date Guide Section */}
        {feature.dateGuide && (
          <section className="max-w-3xl mx-auto px-4 pb-6">
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-orange-400 mb-3">📊 このエリアのデートガイド</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">エリアタイプ</div>
                  <div className="text-sm font-medium mt-1">{feature.dateGuide.areaTypeLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">おすすめ集合</div>
                  <div className="text-sm font-medium mt-1">{feature.dateGuide.recommendedMeetTime}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">滞在目安</div>
                  <div className="text-sm font-medium mt-1">{feature.dateGuide.recommendedDuration}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">こんな人に</div>
                  <div className="text-sm font-medium mt-1">{feature.dateGuide.bestFor}</div>
                </div>
              </div>
              {feature.dateGuide.tip && (
                <p className="text-xs text-gray-400 mt-3 text-center">💡 {feature.dateGuide.tip}</p>
              )}
            </div>
          </section>
        )}

        {/* Description */}
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <p className="text-gray-300 leading-relaxed">{feature.description}</p>
        </section>

        {/* Spots */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="space-y-12">
            {feature.spots.map((spot, index) => {
              const venue = venueMap.get(spot.name);
              const resolvedPhotoUrl = venue?.photoUrl || spot.photoUrl;
              const resolvedRating = venue?.rating ?? null;
              const resolvedGoogleMapsUrl = venue?.googleMapsUrl || null;
              const spotMapsLink = resolvedGoogleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + " " + spot.area)}`;

              return (
                <article
                  key={spot.name}
                  className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
                >
                  {/* Spot Header */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#c9485b] text-white font-bold text-lg">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">
                            <a href={spotMapsLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {spot.name}
                            </a>
                          </h2>
                          {resolvedRating !== null && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                              ⭐ {resolvedRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{spot.area}</span>
                          <span className="text-gray-600">|</span>
                          <span>{spot.genre}</span>
                        </div>
                      </div>
                    </div>

                    {/* Photo: Google Places photo > spot.photoUrl > emoji fallback */}
                    <SpotImage spotName={spot.name} area={spot.area} genre={spot.genre} photoUrl={resolvedPhotoUrl} />

                    <p className="text-gray-300 leading-relaxed mb-4">
                      {spot.description}
                    </p>

                    {/* Tip */}
                    <div className="bg-[#c9485b]/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 text-lg">💡</span>
                        <div>
                          <div className="text-xs text-orange-400 font-medium mb-1">
                            デートのコツ
                          </div>
                          <p className="text-sm text-gray-300">{spot.tip}</p>
                        </div>
                      </div>
                    </div>

                    {/* Google Maps Link */}
                    {resolvedGoogleMapsUrl && (
                      <a
                        href={resolvedGoogleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        📍 Google Maps で見る
                      </a>
                    )}
                    {venue?.source === "google_places" && (
                      <p className="mt-2 text-[11px] text-gray-500">
                        店舗情報提供: <span translate="no" className="font-normal" style={{ fontFamily: "Roboto, sans-serif" }}>Google Maps</span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Walking Route Suggestion */}
          {feature.spots && feature.spots.length >= 2 && (
            <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-800 p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">
                🚶 {feature.spots[0].name} → {feature.spots[1].name}
              </p>
              <p className="text-xs text-gray-500">
                Google Mapsで正確なルートと所要時間を確認できます
              </p>
              <a
                href={`https://www.google.com/maps/dir/${encodeURIComponent(feature.spots[0].name + " " + feature.spots[0].area)}/${encodeURIComponent(feature.spots[1].name + " " + feature.spots[1].area)}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                📍 ルートを確認する →
              </a>
            </div>
          )}

          {/* Contextual PR */}
          <ContextualPRSection area={feature.area} />

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              このエリアのデートプランを作ってみる？
            </p>
            <Link
              href={`/plan?area=${encodeURIComponent(feature.area)}`}
              className="inline-block bg-gradient-to-r from-[#c9a96e] to-red-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
              ✨ {feature.area}のデートプランを作る
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
