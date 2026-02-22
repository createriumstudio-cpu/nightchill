"use client";

import Link from "next/link";

const PICKS = [
  {
    slug: "omotesando-sophisticated-date",
    title: "表参道デートプラン",
    area: "表参道",
    desc: "おしゃれカフェからフレンチビストロへ",
    emoji: "🌿",
  },
  {
    slug: "ginza-luxury-date",
    title: "銀座ラグジュアリーデート",
    area: "銀座",
    desc: "大人のための特別な一夜",
    emoji: "✨",
  },
  {
    slug: "shibuya-casual-date",
    title: "渋谷カジュアルデート",
    area: "渋谷",
    desc: "気取らない距離が縮まる穴場",
    emoji: "🎧",
  },
];

export default function FeaturedPicks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-orange-400 text-sm font-semibold tracking-wider mb-2">POPULAR</p>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">人気の特集</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PICKS.map((pick) => (
            <Link
              key={pick.slug}
              href={`/features/${pick.slug}`}
              className="group block rounded-xl border border-gray-800 hover:border-orange-500/50 bg-gray-900/50 hover:bg-gray-900 transition-all duration-300 p-6"
            >
              <span className="text-3xl">{pick.emoji}</span>
              <p className="text-xs text-orange-400 mt-3 mb-1">{pick.area}</p>
              <h3 className="text-lg font-bold group-hover:text-orange-400 transition-colors">{pick.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{pick.desc}</p>
              <span className="inline-block mt-3 text-xs text-orange-400 group-hover:translate-x-1 transition-transform">
                詳しく見る →
              </span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/features" className="text-sm text-gray-400 hover:text-orange-400 transition-colors border border-gray-700 hover:border-orange-400 rounded-full px-6 py-2">
            すべての特集を見る →
          </Link>
        </div>
      </div>
    </section>
  );
}
