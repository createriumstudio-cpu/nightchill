"use client";

interface SponsoredSpot {
  id: number;
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  category: string;
  labelJa?: string | null;
  labelEn?: string | null;
}

interface Props {
  spot: SponsoredSpot;
  locale?: "ja" | "en";
}

export default function SponsoredSpotCard({ spot, locale = "ja" }: Props) {
  const label = locale === "en" ? (spot.labelEn || "Recommended") : (spot.labelJa || "おすすめ");
  const disclosure = locale === "en" ? "Sponsored" : "PR";

  return (
    <a
      href={spot.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block rounded-2xl overflow-hidden bg-gradient-to-br from-orange-950/30 to-gray-900 border border-orange-800/30 hover:border-orange-600/50 transition-all duration-300"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
            {label}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {disclosure}
          </span>
        </div>
        {spot.imageUrl && (
          <div className="relative h-32 rounded-xl overflow-hidden mb-3">
            <img
              src={spot.imageUrl}
              alt={spot.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <h4 className="text-base font-bold mb-1 group-hover:text-orange-400 transition-colors">
          {spot.title}
        </h4>
        <p className="text-sm text-gray-400 line-clamp-2">
          {spot.description}
        </p>
        <span className="inline-block mt-3 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
          {locale === "en" ? "Learn more →" : "詳しく見る →"}
        </span>
      </div>
    </a>
  );
}
