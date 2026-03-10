import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PremiumCheckoutButton } from "./PremiumCheckoutButton";

export const metadata: Metadata = {
  title: "プレミアムプラン | futatabito",
  description:
    "PDF保存、予約リンク付きメール、無制限プラン生成。futatabitoプレミアムでデートをもっと便利に。",
};

const FREE_FEATURES = [
  { label: "AIデートプラン生成", available: true },
  { label: "全国10都市対応", available: true },
  { label: "LINE / URL共有", available: true },
  { label: "デート履歴保存", available: true },
  { label: "プランPDF保存", available: false },
  { label: "予約リンク付きメール送信", available: false },
  { label: "無制限プラン生成", available: false },
  { label: "広告非表示", available: false },
];

const PREMIUM_FEATURES = [
  { label: "AIデートプラン生成", available: true },
  { label: "全国10都市対応", available: true },
  { label: "LINE / URL共有", available: true },
  { label: "デート履歴保存", available: true },
  { label: "プランPDF保存", available: true },
  { label: "予約リンク付きメール送信", available: true },
  { label: "無制限プラン生成", available: true },
  { label: "広告非表示", available: true },
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            Premium Plan
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            デートをもっと、スマートに。
          </h1>
          <p className="text-muted max-w-lg mx-auto">
            プレミアムプランなら、プランのPDF保存や予約リンク付きメールなど、
            デート当日に役立つ機能が使えます。
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {/* Free Plan */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold mb-1">フリー</h2>
            <p className="text-3xl font-bold mb-1">
              &yen;0
              <span className="text-sm font-normal text-muted"> / 月</span>
            </p>
            <p className="text-xs text-muted mb-6">ずっと無料</p>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  {f.available ? (
                    <span className="text-primary">&#x2713;</span>
                  ) : (
                    <span className="text-muted/40">&#x2014;</span>
                  )}
                  <span className={f.available ? "" : "text-muted/50"}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-primary bg-surface p-6 relative">
            <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              おすすめ
            </div>
            <h2 className="text-lg font-bold mb-1">プレミアム</h2>
            <p className="text-3xl font-bold mb-1">
              &yen;480
              <span className="text-sm font-normal text-muted"> / 月</span>
            </p>
            <p className="text-xs text-muted mb-6">デートの全てをサポート</p>
            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&#x2713;</span>
                  {f.label}
                </li>
              ))}
            </ul>
            <PremiumCheckoutButton />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
