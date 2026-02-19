import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const features = [
  {
    icon: "🎯",
    title: "Howを提案",
    description:
      "「どこに行くか」ではなく「どうデートするか」。会話のテクニックからタイミングまで、成功への道筋をご案内。",
  },
  {
    icon: "✨",
    title: "パーソナライズ",
    description:
      "お二人の性格・趣味・関係性を分析し、最適なデートプランをカスタマイズ。",
  },
  {
    icon: "🌙",
    title: "雰囲気づくり",
    description:
      "照明、音楽、服装まで。特別な夜を演出するためのトータルコーディネート。",
  },
  {
    icon: "💡",
    title: "シーン別アドバイス",
    description:
      "初デート、記念日、プロポーズ。どんなシーンでも最適なアドバイスをお届け。",
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
    title: "完璧なデートを実行",
    description:
      "タイムライン付きの具体的なプランに沿って、自信を持ってデートを楽しんでください。",
  },
];

const testimonials = [
  {
    text: "初デートで何を話せばいいか不安だったけど、会話のネタまで提案してくれて助かった。おかげで2回目のデートも決まりました！",
    author: "T.K.",
    age: "28歳",
    occasion: "初デート",
  },
  {
    text: "記念日のプランに悩んでいたところ、服装からタイムラインまで完璧に提案してくれました。彼女も大喜びでした。",
    author: "S.M.",
    age: "32歳",
    occasion: "記念日",
  },
  {
    text: "プロポーズの段取りをどうするか途方に暮れていましたが、具体的な流れと心構えまで教えてくれて本当に心強かったです。",
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

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-alt/50 to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest text-primary uppercase">
            成功確約型デートコンシェルジュ
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            特別な夜を、
            <br />
            <span className="text-primary">完璧</span>にプロデュース。
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            「どこに行くか」ではなく「どうデートするか」。
            <br className="hidden sm:block" />
            タイムライン・服装・会話術まで
            <br className="hidden sm:block" />
            あなたのデートを成功に導きます。
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/plan"
              className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30"
            >
              無料でプランを作成
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-surface"
            >
              使い方を見る
            </a>
          </div>
          <p className="mt-6 text-xs text-muted">
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

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              nightchillの特徴
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              場所の提案だけではありません。デートを成功させるための「How」をお届けします。
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
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              3ステップで完璧なデートを
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
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
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

      {/* What You Get */}
      <section className="bg-surface px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            nightchillが提案するもの
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "タイムライン",
                desc: "時間配分まで考え抜かれたデートの流れ",
              },
              {
                title: "服装アドバイス",
                desc: "シーンに合った最適なコーディネート",
              },
              {
                title: "会話のネタ",
                desc: "自然に盛り上がる話題を複数提案",
              },
              {
                title: "成功のコツ",
                desc: "各シーンで使える具体的なテクニック",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border p-4 text-left"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                  ✓
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted">{item.desc}</p>
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
            次のデートを、忘れられない夜に。
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            nightchillが、あなたのデートを成功に導く具体的なプランを提案します。
          </p>
          <Link
            href="/plan"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-primary-dark shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            無料でプランを作成
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
