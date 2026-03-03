import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CITIES, getCityById, CITY_IDS } from "@/lib/cities";
import { getWeeklyFeatures, FeaturedArticle } from "@/lib/features";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return CITY_IDS.map((id) => ({ city: id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city: cityId } = await params;
  const city = getCityById(cityId);
  if (!city) return { title: "ページが見つかりません | futatabito" };

  const pageUrl = `${siteUrl}/${city.id}`;
  const title = `${city.name}のデートプラン - AI提案`;
  const description = `${city.name}（${city.areas.slice(0, 5).join("・")}など）のデートプランをAIが提案。実在する店舗のみ、時間配分・移動ルートまでまるっとプランニング。`;

  return {
    title,
    description,
    keywords: [
      `${city.name} デート`,
      `${city.name} デートプラン`,
      `${city.name} デートスポット`,
      ...city.areas.slice(0, 5).map((a) => `${a} デート`),
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${city.name}のデートプラン | futatabito`,
      description,
      url: pageUrl,
      siteName: "futatabito",
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: `${siteUrl}/api/og?${new URLSearchParams({
            title: `${city.name}のデートプラン`,
            area: city.name,
          }).toString()}`,
          width: 1200,
          height: 630,
          alt: `${city.name}のデートプラン`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${city.name}のデートプラン | futatabito`,
      description,
    },
  };
}

const occasions = [
  { label: "初デート", activity: "lunch" },
  { label: "記念日ディナー", activity: "anniversary" },
  { label: "誕生日", activity: "birthday" },
  { label: "カジュアルデート", activity: "chill" },
  { label: "ナイトデート", activity: "nightlife" },
  { label: "カフェ巡り", activity: "cafe" },
];

export default async function CityLandingPage({ params }: PageProps) {
  const { city: cityId } = await params;
  const city = getCityById(cityId);
  if (!city) notFound();

  const weeklyArticles = await getWeeklyFeatures(city.name, 3);

  const pageUrl = `${siteUrl}/${city.id}`;

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
        name: `${city.name}のデートプラン`,
        item: pageUrl,
      },
    ],
  };

  const placeLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: city.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressCountry: "JP",
    },
  };

  const otherCities = CITIES.filter((c) => c.id !== city.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeLd) }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end justify-center overflow-hidden px-4 pb-12 pt-24 md:pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary-dark" />
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(201,169,110,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(201,72,91,0.2),transparent_50%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
            {city.name} Date Plan
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            {city.name}の
            <br className="sm:hidden" />
            デートプラン
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {city.description}。
            <br className="hidden sm:block" />
            {city.name}のデートをAIがまるっと提案します。
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/plan?city=${city.id}`}
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-primary-dark shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
            >
              {city.name}でプランをつくる
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">
            登録不要・完全無料・30秒で完成
          </p>
        </div>
      </section>

      {/* Areas */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Areas
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {city.name}の人気エリア
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              エリアを選んで、あなただけのデートプランを作成できます。
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {city.areas.map((area) => (
              <Link
                key={area}
                href={`/plan?city=${city.id}&area=${encodeURIComponent(area)}`}
                className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Features Preview */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {weeklyArticles.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-3">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                    {city.name} Weekly
                  </span>
                  <span className="inline-block bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  {city.name}の今週のおすすめ
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyArticles.map((article: FeaturedArticle) => (
                  <Link
                    key={article.slug}
                    href={`/features/${article.slug}`}
                    className="group block rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl shrink-0">{article.heroEmoji}</span>
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 mb-2">
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
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href={`/${city.id}/features`}
                  className="text-sm text-muted hover:text-primary transition-colors border border-border hover:border-primary rounded-full px-6 py-2 inline-block"
                >
                  {city.name}の特集をすべて見る →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Link
                href={`/${city.id}/features`}
                className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <span className="text-lg">🔥</span>
                <span className="text-base font-semibold group-hover:text-primary transition-colors">
                  {city.name}のデート特集を見る
                </span>
                <span className="text-muted group-hover:text-primary transition-colors">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Occasions */}
      <section className="bg-surface px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Scenes
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {city.name}でこんなデートはいかが？
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {occasions.map((o) => (
              <Link
                key={o.label}
                href={`/plan?city=${city.id}`}
                className="group rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                  {city.name}で{o.label}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {city.name}の雰囲気を活かしたプランをAIが提案
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              How It Works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              30秒で{city.name}デートを計画
            </h2>
          </div>
          <div className="mt-10 space-y-8">
            {[
              {
                num: "01",
                title: "エリアとシーンを選ぶ",
                desc: `${city.name}のエリアとデートのシーンを選択するだけ。`,
              },
              {
                num: "02",
                title: "AIがプランを自動生成",
                desc: "時間配分・お店選び・移動ルートまでまるっと提案。",
              },
              {
                num: "03",
                title: "自信を持ってデートへ",
                desc: "実在する店舗情報付きで、安心してデートを楽しめます。",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <span className="font-mono text-3xl font-bold text-primary/20">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-10 text-center text-white md:p-14">
          <h2 className="text-2xl font-bold md:text-3xl">
            {city.name}のデート、もう迷わない。
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            エリアの特性を活かした、あなただけのプランをAIが30秒で提案します。
          </p>
          <Link
            href={`/plan?city=${city.id}`}
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-primary-dark shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            {city.name}でプランをつくる
          </Link>
          <p className="mt-4 text-xs text-white/50">登録不要・完全無料</p>
        </div>
      </section>

      {/* Other Cities */}
      <section className="bg-surface px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              他の都市のデートプラン
            </h2>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.id}
                href={`/${c.id}`}
                className="rounded-full border border-border bg-background px-5 py-2.5 text-sm transition-all hover:border-primary/50 hover:shadow-sm"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
