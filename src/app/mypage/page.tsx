"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // 初期化: アカウントリンク → 履歴 + パーソナライズ + プレミアムステータス取得
  useEffect(() => {
    async function init() {
      try {
        // Googleログイン済みならアカウントリンク（匿名IDとGoogle IDを紐付け）
        if (session?.user) {
          await fetch("/api/auth/link", { method: "POST" });
        } else {
          // 未ログイン時は匿名認証
          await fetch("/api/auth");
        }

        // 並列取得
        const [historyRes, personalizeRes, premiumRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/personalize"),
          session?.user ? fetch("/api/premium") : Promise.resolve(null),
        ]);

        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistory(data.history || []);
        }
        if (personalizeRes.ok) {
          const data = await personalizeRes.json();
          setRecommendations(data);
        }
        if (premiumRes && premiumRes.ok) {
          const data = await premiumRes.json();
          setIsPremium(data.isPremium ?? false);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    // NextAuth セッション確認が完了してからデータ取得
    if (sessionStatus !== "loading") {
      init();
    }
  }, [session, sessionStatus]);

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

        {loading || sessionStatus === "loading" ? (
          <div className="text-center py-16">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="mt-4 text-muted text-sm">読み込み中...</p>
          </div>
        ) : (
          <>
            {/* アップグレード完了メッセージ */}
            {upgraded && (
              <section className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
                <p className="text-lg font-bold mb-1">
                  プレミアムへようこそ!
                </p>
                <p className="text-sm text-muted">
                  アップグレードが完了しました。全ての機能をお楽しみください。
                </p>
              </section>
            )}

            {/* Google ユーザー情報 or ログイン誘導 */}
            {session?.user ? (
              <section className="mb-8 rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-4">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary shrink-0">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{session.user.name}</p>
                      {isPremium && (
                        <span className="shrink-0 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2.5 py-0.5">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted truncate">{session.user.email}</p>
                    <p className="text-xs text-muted/70 mt-0.5">
                      Googleアカウントでログイン中 — 別のデバイスでも履歴が同期されます
                    </p>
                  </div>
                </div>
                {/* プレミアム管理 or アップグレード */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  {isPremium ? (
                    <button
                      onClick={async () => {
                        setPortalLoading(true);
                        try {
                          const res = await fetch("/api/stripe/portal", { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                        } catch {
                          // silent
                        } finally {
                          setPortalLoading(false);
                        }
                      }}
                      disabled={portalLoading}
                      className="text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {portalLoading ? "読み込み中..." : "プランを管理"}
                    </button>
                  ) : (
                    <Link
                      href="/premium"
                      className="text-sm text-primary hover:underline"
                    >
                      プレミアムにアップグレード
                    </Link>
                  )}
                </div>
              </section>
            ) : (
              <section className="mb-8 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">&#x1F512;</span>
                  <div>
                    <p className="font-semibold text-sm mb-1">
                      Googleログインで履歴をずっと残せます
                    </p>
                    <p className="text-xs text-muted mb-3">
                      ログインすると、別のデバイスでもデート履歴やおすすめが同期されます。現在の履歴もそのまま引き継がれます。
                    </p>
                    <button
                      onClick={() => signIn("google", { callbackUrl: "/mypage" })}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Googleでログイン
                    </button>
                  </div>
                </div>
              </section>
            )}

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
                  <p className="text-4xl mb-3">&#x1F4DD;</p>
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
                        &#x2715;
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
