import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import FeaturedPicks from "@/components/FeaturedPicks";

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
    title: "デートを楽しむ",
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
              alt="東京デートシーン"
              fill
              className="object-cover scale-110 object-center"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
          </div>
        <div className="relative mx-auto max-w-4xl text-center drop-shadow-lg">
          <p className="mb-2 md:mb-4 text-xs md:text-sm font-semibold tracking-widest text-[#c9a96e] uppercase [text-shadow:_0_1px_6px_rgba(0,0,0,0.6)]">
            デート視点の東京カルチャーガイド
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
            ふたりの時間を
            <br />
            もっとおもしろく
          </h1>
          <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-sm md:text-lg leading-relaxed text-white/90 [text-shadow:_0_1px_8px_rgba(0,0,0,0.7)]">
            「どこに行くか」ではなく「どうデートするか」。
            <br className="hidden sm:block" />
            エリアの魅力・お店の動線・会話のきっかけまで
            <br className="hidden sm:block" />
            ふたりのデートをもっと楽しく。
          </p>
          <div className="mt-6 md:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/plan"
              className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30"
            >
              デートプランをつくる
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/30 px-8 py-3.5 text-base font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              使い方を見る
            </a>
          </div>
          <p className="mt-4 md:mt-6 text-xs text-white/60 [text-shadow:_0_1px_4px_rgba(0,0,0,0.5)]">
            登録不要・完全無料・30秒で完成
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


        {/* Featured Picks */}
        <FeaturedPicks />

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-[#c9a96e] uppercase">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              futatabitoの特徴
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              場所の提案だけではありません。時間配分から店舗情報まで、デートの「How」をお届けします。
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
              3ステップでデートプランを
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
              利用者の声
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
            次のデートを、もっと楽しく。
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            ふたりの時間をもっとおもしろくデートという視点で東京のカルチャーを提案します。
          </p>
          <Link
            href="/plan"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-primary-dark shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            デートプランをつくる
          </Link>
          <p className="mt-4 text-xs text-white/60">
            登録不要・完全無料
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
