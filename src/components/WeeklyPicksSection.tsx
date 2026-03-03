import Link from "next/link";
import { getLatestWeeklyFeatures, FeaturedArticle } from "@/lib/features";

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
          {articles.map((article: FeaturedArticle) => (
            <Link
              key={article.slug}
              href={`/features/${article.slug}`}
              className="group block rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl shrink-0">{article.heroEmoji}</span>
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-1.5">
                    {article.area}
                  </span>
                  <h3 className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-muted line-clamp-2 mb-3">
                {article.subtitle || article.description}
              </p>
              {article.spots && article.spots.length > 0 && (
                <p className="text-[11px] text-muted/70 line-clamp-1">
                  📍 {article.spots.map((s) => s.name).join(" → ")}
                </p>
              )}
              <span className="inline-block mt-3 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                詳しく見る →
              </span>
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
