"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface HistoryEntry {
  id: number;
  city: string;
  area: string;
  occasion: string;
  mood: string;
  budget: string;
  planTitle: string;
  createdAt: string;
}

interface Recommendations {
  recommendedCities: string[];
  recommendedAreas: string[];
  recommendedFeatures: { slug: string; title: string; area: string; heroEmoji: string }[];
  message: string;
  preferences: Record<string, unknown> | null;
}

export default function MyPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  // 初期化: 認証 → 履歴 + パーソナライズ取得
  useEffect(() => {
    async function init() {
      try {
        // 匿名認証
        await fetch("/api/auth");

        // 並列取得
        const [historyRes, personalizeRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/personalize"),
        ]);

        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistory(data.history || []);
        }
        if (personalizeRes.ok) {
          const data = await personalizeRes.json();
          setRecommendations(data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("この履歴を削除しますか？")) return;
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
      }
    } catch {
      // silent fail
    }
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">マイページ</h1>
        <p className="text-muted mb-8">あなたのデート履歴とおすすめ</p>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="mt-4 text-muted text-sm">読み込み中...</p>
          </div>
        ) : (
          <>
            {/* Personalized Recommendations */}
            {recommendations && (
              <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">あなたへのおすすめ</h2>
                <p className="text-sm text-muted mb-1">{recommendations.message}</p>
                <p className="text-xs text-muted/70 mb-4">デートの記録を保存すると、あなた好みのおすすめが届きます。</p>

                {recommendations.recommendedFeatures.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {recommendations.recommendedFeatures.map((f) => (
                      <Link
                        key={f.slug}
                        href={`/features/${f.slug}`}
                        className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                      >
                        <div className="text-3xl mb-2">{f.heroEmoji}</div>
                        <h3 className="font-semibold text-sm line-clamp-2">{f.title}</h3>
                        <p className="text-xs text-muted mt-1">{f.area}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Date History */}
            <section>
              <h2 className="text-xl font-bold mb-4">デート履歴</h2>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-muted mb-4">プランを作って、ふたりの記録を残そう。</p>
                  <Link
                    href="/plan"
                    className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    デートプランを作る
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-border bg-surface p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{entry.planTitle}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted">{entry.city}</span>
                          {entry.area && (
                            <>
                              <span className="text-xs text-muted/50">|</span>
                              <span className="text-xs text-muted">{entry.area}</span>
                            </>
                          )}
                          <span className="text-xs text-muted/50">|</span>
                          <span className="text-xs text-muted">{formatDate(entry.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {entry.occasion && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {entry.occasion}
                            </span>
                          )}
                          {entry.mood && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                              {entry.mood}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="shrink-0 text-xs text-muted hover:text-red-500 transition-colors p-1"
                        title="削除"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Action */}
            <div className="mt-12 text-center">
              <Link
                href="/plan"
                className="inline-block rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark"
              >
                新しいデートプランを作成
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
