"use client";

import Link from "next/link";
import Image from "next/image";

const PICKS = [
  {
    slug: "omotesando-sophisticated-date",
    title: "表参道デートプラン",
    area: "表参道",
    desc: "おしゃれカフェからフレンチビストロへ",
    image: "/images/omotesando-date-hero.png",
  },
  {
    slug: "ginza-luxury-date",
    title: "銀座ラグジュアリーデート",
    area: "銀座",
    desc: "大人のための特別な一夜",
    image: "/images/ginza-luxury-date-hero.png",
  },
  {
    slug: "shibuya-casual-date",
    title: "渋谷カジュアルデート",
    area: "渋谷",
    desc: "気取らない距離が縮まる穴場",
    image: "/images/shibuya-casual-date-hero.png",
  },
];

export default function FeaturedPicks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-primary text-sm font-semibold tracking-wider mb-2">
          POPULAR
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          人気の特集
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PICKS.map((pick) => (
            <Link
              key={pick.slug}
              href={`/features/${pick.slug}`}
              className="group block rounded-2xl overflow-hidden relative h-64 md:h-72 shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Background Image */}
              <Image
                src={pick.image}
                alt={pick.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/90 transition-all duration-300" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-xs font-semibold text-primary tracking-wider mb-1">
                  {pick.area}
                </p>
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                  {pick.title}
                </h3>
                <p className="text-sm text-white/70 mt-1">{pick.desc}</p>
                <span className="inline-block mt-3 text-xs text-primary font-semibold group-hover:translate-x-1 transition-transform">
                  詳しく見る →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/features"
            className="text-sm text-muted hover:text-primary transition-colors border border-border hover:border-primary rounded-full px-6 py-2 inline-block"
          >
            すべての特集を見る →
          </Link>
        </div>
      </div>
    </section>
  );
}
