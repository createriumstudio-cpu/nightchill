import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import FeaturedPicks from "@/components/FeaturedPicks";
import WeeklyPicksSection from "@/components/WeeklyPicksSection";
import { CITIES } from "@/lib/cities";
import { getLatestPosts, BLOG_CATEGORIES, type BlogPost } from "@/lib/blog";

export const revalidate = 3600;

const features = [
  {
    icon: "🗺️",
    title: "タイムライン提案",
    description:
      "集合から解散まで時間配分付きのデートプランを自動生成。迷わず動ける具体的な流れをお届け。",
  },
  {
    icon: "📍",
    title: "実在する店舗情報",
    description:
      "連携でリアルな写真・営業情報を表示。行ってみたら閉まっていた、をゼロに。",
  },
  {
    icon: "📊",
    title: "エリア別デートガイド",
    description:
      "昼向き・夜向きなどエリア特性を分析。最適な集合時間・滞在時間をエリアの特集で紹介。",
  },
  {
    icon: "✨",
    title: "パーソナライズ",
    description:
      "関係性・シーン・予算に応じてプランをカスタマイズ。初デートから記念日まで最適な提案を。",
  },
];

const steps = [
  {
    number: "01",
    title: "シチュエーションを入力",
    description:
      "デートの目的、相手との関係性、予算などの基本情報を教えてください。",
  },
  {
    number: "02",
    title: "あなただけのプランを生成",
    description:
      "あなたの情報をもとに、最適なデートプランと成功のポイントを提案します。",
  },
  {
    number: "03",
    title: "自信を持ってデートへ",
    description:
      "タイムライン付きの具体的なプランに沿って、自信を持ってデートを楽しんでください。",
  },
];

const testimonials = [
  {
    text: "初デートでどこに行けばいいか迷っていたけど、タイムライン付きのプランがすごく助かった。おかげで2回目のデートも決まりました！",
    author: "T.K.",
    age: "28歳",
    occasion: "初デート",
  },
  {
    text: "記念日のプランに悩んでいたところ、エリアの雰囲気から時間配分まで完璧に提案してくれました。彼女も大喜びでした。",
    author: "S.M.",
    age: "32歳",
    occasion: "記念日",
  },
  {
    text: "プロポーズの段取りをどうするか途方に暮れていましたが、具体的な流れと店の写真まで見れて本当に心強かったです。",
    author: "R.Y.",
    age: "35歳",
    occasion: "プロポーズ",
  },
];

const occasions = [
  { label: "初デート", emoji: "💕" },
  { label: "記念日", emoji: "🎉" },
  { label: "誕生日", emoji: "🎂" },
  { label: "プロポーズ", emoji: "💍" },
  { label: "カジュアル", emoji: "☕" },
  { label: "仲直り", emoji: "🤝" },
];

function getCategoryLabel(categoryId: string): string {
  const cat = BLOG_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.label ?? categoryId;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

async function LatestBlogPosts() {
  const posts = await getLatestPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
            Blog
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            最新のブログ記事
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            デートに役立つ情報やコツをお届けします。
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: BlogPost) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  {getCategoryLabel(post.category)}
                </span>
                {post.publishedAt && (
                  <span className="text-xs text-muted">
                    {formatDate(post.publishedAt)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
                {post.excerpt}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">
                続きを読む &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WeeklyPicksLoading() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <span className="text-sm">✨</span>
            <span className="text-xs font-semibold text-primary tracking-wider uppercase">
              Weekly Update
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            今週のおすすめデートプラン
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-5 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-muted/20 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-12 rounded bg-muted/20" />
                  <div className="h-4 w-full rounded bg-muted/20" />
                </div>
              </div>
              <div className="h-3 w-3/4 rounded bg-muted/20 mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <JsonLd type="website" />
      <JsonLd type="organization" />

      {/* Hero */}
      <section className="relative flex min-h-[80vh] md:min-h-screen items-end justify-center overflow-hidden px-4 md:px-6 pb-12 md:pb-24">
        <div className="absolute inset-0">
          <Image
            src="/images/shibuya-sky-date-hero.png"
            alt="デートシーン"
            fill
            className="object-cover scale-110 object-[80%_80%] md:object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center drop-shadow-lg">
          <p className="mb-2 md:mb-4 text-xs md:text-sm font-semibold tracking-widest text-[#c9a96e] uppercase [text-shadow:_0_1px_6px_rgba(0,0,0,0.6)]">
            ふたりが楽しめる場所を、AIが30秒で見つける。
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
            ふたりの時間を、<br className="hidden sm:block" />もっと特別に。
          </h1>
          <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-sm md:text-lg leading-relaxed text-white/90 [text-shadow:_0_1px_8px_rgba(0,0,0,0.7)]">
            お店選び、時間配分、移動ルート——全部まるっとAIが提案。
            <br className="hidden sm:block" />
            全国10都市対応、毎週更新の最新情報で、
            <br className="hidden sm:block" />
            もうデートプランで迷わない。
          </p>
          <div className="mt-6 md:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/plan"
              className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30"
            >
              30秒でプランをつくる
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/30 px-8 py-3.5 text-base font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              使い方を見る
            </a>
          </div>
          <p className="mt-4 md:mt-6 text-xs text-white/60 [text-shadow:_0_1px_4px_rgba(0,0,0,0.5)]">
            無料で試せる・30秒で完成
          </p>
        </div>
      </section>

      {/* Occasion Tags */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-center text-sm font-medium text-muted">
            あらゆるシーンに対応
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {occasions.map((o) => (
              <Link
                key={o.label}
                href="/plan"
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition-all hover:border-primary/50 hover:shadow-sm"
              >
                {o.emoji} {o.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Picks - Dynamic from DB */}
      <Suspense fallback={<WeeklyPicksLoading />}>
        <WeeklyPicksSection />
      </Suspense>

      {/* Featured Picks */}
      <FeaturedPicks />

      {/* City Links */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Cities
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              全国10都市に対応
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              各都市のエリア特性を活かしたデートプランをAIが提案します。
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {CITIES.map((city) => (
              <Link
                key={city.id}
                href={`/${city.id}`}
                className="group rounded-xl border border-border bg-surface p-4 text-center transition-all hover:border-primary/50 hover:shadow-md"
              >
                <p className="text-lg font-bold group-hover:text-primary transition-colors">
                  {city.name}
                </p>
                <p className="mt-1 text-xs text-muted line-clamp-1">
                  {city.areas.slice(0, 3).join("・")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <Suspense fallback={null}>
        <LatestBlogPosts />
      </Suspense>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              なぜ、&ldquo;外さない&rdquo;のか
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              場所を並べるだけの旅行サイトとは違います。&ldquo;ふたりの時間の流れ&rdquo;を設計します。
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-surface px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              ふたりの答えを、30秒で。
            </h2>
          </div>
          <div className="mt-16 space-y-12">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6">
                <span className="font-mono text-4xl font-bold text-primary/20">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/plan"
              className="inline-block rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
            >
              今すぐ試してみる
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Voice
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              &ldquo;助かった&rdquo;の声
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <p className="text-sm leading-relaxed text-muted">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {t.author}（{t.age}）
                    </p>
                    <p className="text-xs text-muted">{t.occasion}で利用</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-12 text-center text-white md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">
            &ldquo;どこ行く？&rdquo;はもう終わり。
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            あとは楽しむだけ。全国10都市のリアルタイム情報から、あなただけのデートプランをAIが提案。
          </p>
          <Link
            href="/plan"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-primary-dark shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            30秒でプランをつくる
          </Link>
          <p className="mt-4 text-xs text-white/60">
            今すぐ無料で試す
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
