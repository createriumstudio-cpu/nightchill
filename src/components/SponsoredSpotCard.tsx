/* eslint-disable @next/next/no-img-element */

interface SponsoredSpot {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl?: string | null;
  category: string | null;
  labelJa?: string | null;
  labelEn?: string | null;
}

export default function SponsoredSpotCard({ spot, locale = "ja" }: Props) {
  const label = locale === "en"
    ? (spot.labelEn || "Sponsored")
    : (spot.labelJa || "PR");

  const isVideo = spot.imageUrl && /\.(mp4|webm|mov)$/i.test(spot.imageUrl);

  return (
    <a
      href={spot.url || "#"}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all duration-300 group bg-gray-900/50 hover:bg-gray-900/80"
    >
      <div className="relative">
        <span className="absolute top-2 left-2 z-10 bg-orange-500/90 text-white text-xs font-bold px-2 py-0.5 rounded">
          {label}
        </span>
        {spot.imageUrl && (
          isVideo ? (
            <video
              src={spot.imageUrl}
              className="w-full h-40 object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <div className="relative h-40 overflow-hidden">
              <img
                src={spot.imageUrl}
                alt={spot.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )
        )}
        {!spot.imageUrl && (
          <div className="h-20 bg-gradient-to-r from-orange-500/10 to-purple-500/10 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-base font-bold mb-1 group-hover:text-orange-400 transition-colors">
          {spot.title}
        </h4>
        {spot.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {spot.description}
          </p>
        )}
        <span className="inline-block mt-2 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
          {locale === "en" ? "Learn more →" : "詳しく見る →"}
        </span>
      </div>
    </a>
  );
}

interface Props {
  spot: SponsoredSpot;
  locale?: string;
}
