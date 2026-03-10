"use client";

import { useState } from "react";
import Link from "next/link";

export default function PremiumBanner() {
  return (
    <section className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Coming Soon
          </p>
          <h3 className="text-lg font-bold mb-2">
            プレミアムプランで、もっと便利に
          </h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="text-primary">&#x2713;</span>
              プランをPDFで保存
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">&#x2713;</span>
              予約リンク付きメール送信
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">&#x2713;</span>
              無制限プラン生成
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">&#x2713;</span>
              広告非表示
            </li>
          </ul>
        </div>
        <div className="shrink-0">
          <Link
            href="/premium"
            className="inline-block rounded-full border border-primary bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            詳しく見る
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * プレミアムページ用のメール収集フォーム
 */
export function PremiumEmailForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "登録に失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-lg font-semibold mb-1">登録ありがとうございます</p>
        <p className="text-sm text-muted">
          プレミアムプランの開始時にお知らせします。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレスを入力"
        required
        className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-sm placeholder:text-muted/50 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "送信中..." : "開始時に通知を受け取る"}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
}
