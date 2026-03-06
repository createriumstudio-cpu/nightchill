import Link from "next/link";
import Image from "next/image";
import { getLatestWeeklyFeatures, FeaturedArticle } from "@/lib/features";

function getCardImage(article: FeaturedArticle): string | null {
  if (article.heroImage) return article.heroImage;
  if (article.spots && article.spots.length > 0) {
    for (const spot of article.spots) {
      if (spot.photoUrl) return spot.photoUrl;
    }
  }
  return null;
}

export default async function WeeklyPicksSection() {
  const articles = await getLatestWeeklyFeatures(6);

  if (articles.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <span className="text-sm">✨</span>
            <span className="text-xs font-semibold text-primary tracking-wider uppercase">
              Weekly Update
            </span>
            <span className="inline-block bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              NEW
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            今週のおすすめデートプラン
          </h2>
          <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
            毎週月曜に更新。各都市の最新スポットとトレンドをもとに自動生成されたデートプランです。
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article: FeaturedArticle) => {
            const imageUrl = getCardImage(article);
            return (
              <Link
                key={article.slug}
                href={`/features/${article.slug}`}
                className="group block rounded-2xl overflow-hidden border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-lg"
              >
                {imageUrl ? (
                  <div className="relative h-40 w-full">
                    <Image
                      src={imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute top-2 left-2 inline-block text-[10px] font-semibold text-white bg-primary rounded-full px-2 py-0.5">
                      {article.area}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-primary/5">
                    <span className="text-5xl">{article.heroEmoji}</span>
                  </div>
                )}
                <div className="p-4">
                  {!imageUrl && (
                    <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-1.5">
                      {article.area}
                    </span>
                  )}
                  <h3 className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 mt-1.5 mb-2">
                    {article.subtitle || article.description}
                  </p>
                  {article.spots && article.spots.length > 0 && (
                    <p className="text-[11px] text-muted/70 line-clamp-1">
                      📍 {article.spots.map((s) => s.name).join(" → ")}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    詳しく見る →
                  </span>
                </div>
              </Link>
            );
          })}
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
