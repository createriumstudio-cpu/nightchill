import { notFound } from "next/navigation";
import Link from "next/link";
import { getFeatureBySlug, getAllFeatures } from "@/lib/features";
import FeatureSpotEmbed from "@/components/FeatureSpotEmbed";
import Header from "@/components/Header";
import UgcSection from "@/components/UgcSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getAllFeatures()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  if (!feature) return { title: "特集が見つかりません | futatabito" };
  return {
    title: `${feature.title} | futatabito`,
    description: feature.description,
  };
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = await getFeatureBySlug(slug);
  if (!feature) notFound();

  return (
    <>
      <Header />
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
              <div className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-4">
                <img
                  src={feature.heroImage}
                  alt={feature.title}
                  className="w-full h-full object-cover"
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

        {/* Description */}
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <p className="text-gray-300 leading-relaxed">{feature.description}</p>
        </section>

        {/* Spots */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="space-y-12">
            {feature.spots.map((spot, index) => (
              <article
                key={spot.name}
                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
              >
                {/* Spot Header */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-lg">
                      {index + 1}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold">{spot.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{spot.area}</span>
                        <span className="text-gray-600">|</span>
                        <span>{spot.genre}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-4">
                    {spot.description}
                  </p>

                  {/* Tip */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
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

                  {/* Hashtag Links */}
                  <div className="flex flex-wrap gap-3">
                    {spot.instagramHashtag && (
                      <a
                        href={`https://www.instagram.com/explore/tags/${encodeURIComponent(spot.instagramHashtag)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        📸 #{spot.instagramHashtag}
                      </a>
                    )}
                    {spot.tiktokHashtag && (
                      <a
                        href={`https://www.tiktok.com/tag/${encodeURIComponent(spot.tiktokHashtag)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        🎵 #{spot.tiktokHashtag}
                      </a>
                    )}
                  </div>
                </div>

                {/* SNS Embeds */}
                {spot.embeds.length > 0 && (
                  <div className="border-t border-gray-800 p-6">
                    <div className="text-xs text-gray-500 mb-4">
                      📱 SNSの口コミ
                    </div>
                    <div className="space-y-4">
                      {spot.embeds.map((embed, i) => (
                        <FeatureSpotEmbed key={i} embed={embed} />
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Walking Route Suggestion */}
          {feature.spots.length >= 2 && (
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

          {/* UGC Section */}
          <UgcSection featureSlug={slug} />

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              このエリアのデートプランを作ってみる？
            </p>
            <Link
              href={`/plan?area=${encodeURIComponent(feature.area)}`}
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
              ✨ {feature.area}のデートプランを作る
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
