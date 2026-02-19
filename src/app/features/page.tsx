import Link from "next/link";
import { getAllFeatures } from "@/lib/features";
import Header from "@/components/Header";

export const metadata = {
  title: "特集 | nightchill",
  description: "今話題のデートスポット特集。プロが厳選した最新のデートプランをSNSの口コミとともにお届け。",
};

export default function FeaturesPage() {
  const features = getAllFeatures();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 text-center pt-28">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 to-transparent" />
          <div className="relative max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🔥 デート特集
            </h1>
            <p className="text-gray-400 text-lg">
              今話題のデートスポットを、SNSの口コミとプロのアドバイスとともに紹介
            </p>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group block bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{feature.heroEmoji}</span>
                    <div>
                      <span className="text-xs text-orange-400 font-medium">
                        {feature.area}エリア
                      </span>
                      <h2 className="text-xl font-bold group-hover:text-orange-400 transition-colors">
                        {feature.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    {feature.subtitle}
                  </p>
                </div>

                {/* Tags */}
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                  {feature.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Spots Preview */}
                <div className="px-6 pb-4">
                  <div className="text-xs text-gray-500 mb-2">
                    📍 紹介スポット
                  </div>
                  <div className="flex flex-col gap-1">
                    {feature.spots.map((spot, i) => (
                      <div key={spot.name} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-orange-400 font-bold text-xs">
                          {i + 1}軒目
                        </span>
                        <span>{spot.name}</span>
                        <span className="text-gray-600 text-xs">
                          ({spot.genre})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-800/50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {feature.publishedAt} 公開
                  </span>
                  <span className="text-sm text-orange-400 group-hover:translate-x-1 transition-transform">
                    詳しく見る →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              特集にないエリアやシーンも、あなただけのデートプランを作れます
            </p>
            <Link
              href="/plan"
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
              ✨ あなただけのプランを作る
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
