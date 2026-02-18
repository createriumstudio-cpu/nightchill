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
    description: "デートの目的、相手との関係性、予算などの基本情報を教えてください。",
  },
  {
    number: "02",
    title: "AIがプランを生成",
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
            nightchillが、あなたのデートを成功に導きます。
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
            今すぐ始める
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
