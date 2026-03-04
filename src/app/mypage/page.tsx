"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface UserProfile {
  id: number;
  email: string | null;
  nickname: string | null;
}

interface HistoryEntry {
  id: number;
  planSlug: string | null;
  title: string;
  city: string | null;
  location: string | null;
  occasion: string | null;
  mood: string | null;
  budget: string | null;
  planSummary: string | null;
  venueNames: string[];
  rating: number | null;
  feedback: string | null;
  createdAt: string | null;
}

interface Suggestions {
  suggestedCity: string | null;
  suggestedActivities: string[];
  suggestedMood: string | null;
  suggestedBudget: string | null;
  message: string;
  stats: {
    totalPlans: number;
    averageRating: number | null;
    favoriteCity: string | null;
  };
}

const moodLabels: Record<string, string> = {
  romantic: "ロマンチック",
  fun: "楽しい",
  relaxed: "リラックス",
  luxurious: "ラグジュアリー",
  adventurous: "アドベンチャー",
};

const budgetLabels: Record<string, string> = {
  low: "〜5,000円",
  medium: "5,000〜15,000円",
  high: "15,000〜30,000円",
  unlimited: "予算は気にしない",
};

export default function MyPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [ratingTarget, setRatingTarget] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);

  // Load user data
  useEffect(() => {
    async function load() {
      try {
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();

        if (!authData.user) {
          // Auto-create anonymous user
          const regRes = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "register" }),
          });
          const regData = await regRes.json();
          if (regData.user) {
            setUser(regData.user);
            setNickname(regData.user.nickname || "");
          }
        } else {
          setUser(authData.user);
          setNickname(authData.user.nickname || "");
        }

        // Load history
        const histRes = await fetch("/api/history");
        const histData = await histRes.json();
        setHistory(histData.history || []);

        // Load suggestions
        const sugRes = await fetch("/api/personalize");
        const sugData = await sugRes.json();
        setSuggestions(sugData.suggestions || null);
      } catch {
        // DB may not be configured
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdateNickname = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", nickname }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setEditingNickname(false);
      }
    } catch {
      // ignore
    }
  }, [user, nickname]);

  const handleRate = useCallback(
    async (historyId: number, rating: number) => {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rate", historyId, rating }),
        });
        setHistory((prev) =>
          prev.map((h) => (h.id === historyId ? { ...h, rating } : h)),
        );
        setRatingTarget(null);
        setSelectedRating(0);
      } catch {
        // ignore
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-6 pt-28 pb-16 text-center">
          <p className="text-muted">読み込み中...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
        {/* Profile Section */}
        <section className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl">
              {user?.nickname ? user.nickname[0] : "👤"}
            </span>
          </div>
          <div className="mt-3">
            {editingNickname ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ニックネーム"
                  maxLength={20}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-center text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={handleUpdateNickname}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingNickname(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingNickname(true)}
                className="text-lg font-bold hover:text-primary transition-colors"
              >
                {user?.nickname || "ニックネームを設定"}{" "}
                <span className="text-xs text-muted">✏️</span>
              </button>
            )}
          </div>
        </section>

        {/* Stats */}
        {suggestions && suggestions.stats.totalPlans > 0 && (
          <section className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {suggestions.stats.totalPlans}
              </p>
              <p className="text-xs text-muted">プラン作成数</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {suggestions.stats.averageRating
                  ? `${suggestions.stats.averageRating}`
                  : "—"}
              </p>
              <p className="text-xs text-muted">平均評価</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {suggestions.stats.favoriteCity || "—"}
              </p>
              <p className="text-xs text-muted">お気に入り都市</p>
            </div>
          </section>
        )}

        {/* Personalized Suggestion */}
        {suggestions && suggestions.stats.totalPlans > 0 && (
          <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="text-lg font-bold">あなたへのおすすめ</h2>
            <p className="mt-2 text-sm text-muted">{suggestions.message}</p>

            {(suggestions.suggestedMood || suggestions.suggestedCity) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.suggestedMood && (
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">
                    {moodLabels[suggestions.suggestedMood] ||
                      suggestions.suggestedMood}
                  </span>
                )}
                {suggestions.suggestedBudget && (
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">
                    {budgetLabels[suggestions.suggestedBudget] ||
                      suggestions.suggestedBudget}
                  </span>
                )}
              </div>
            )}

            <Link
              href={
                suggestions.suggestedCity
                  ? `/plan?city=${suggestions.suggestedCity}`
                  : "/plan"
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              おすすめでプランを作成
            </Link>
          </section>
        )}

        {/* Date History */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">デート履歴</h2>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-muted">まだデート履歴がありません</p>
              <p className="mt-1 text-xs text-muted">
                プランを作成すると自動的に保存されます
              </p>
              <Link
                href="/plan"
                className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
              >
                最初のプランを作成
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{entry.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {entry.city && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {entry.city}
                          </span>
                        )}
                        {entry.mood && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                            {moodLabels[entry.mood] || entry.mood}
                          </span>
                        )}
                        {entry.budget && (
                          <span className="text-xs text-muted">
                            {budgetLabels[entry.budget] || entry.budget}
                          </span>
                        )}
                      </div>
                      {entry.planSummary && (
                        <p className="mt-2 text-sm text-muted line-clamp-2">
                          {entry.planSummary}
                        </p>
                      )}
                      {entry.venueNames.length > 0 && (
                        <p className="mt-1 text-xs text-muted">
                          📍 {entry.venueNames.slice(0, 3).join(" → ")}
                          {entry.venueNames.length > 3 && " ..."}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      {entry.createdAt && (
                        <p className="text-xs text-muted">
                          {new Date(entry.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      )}
                      {entry.rating ? (
                        <p className="mt-1 text-sm">
                          {"⭐".repeat(entry.rating)}
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setRatingTarget(entry.id);
                            setSelectedRating(0);
                          }}
                          className="mt-1 text-xs text-primary hover:underline"
                        >
                          評価する
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating UI */}
                  {ratingTarget === entry.id && (
                    <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                      <span className="text-xs text-muted">このデートは？</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            className={`text-lg transition-transform hover:scale-110 ${
                              star <= selectedRating
                                ? "text-amber-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {selectedRating > 0 && (
                        <button
                          onClick={() => handleRate(entry.id, selectedRating)}
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white"
                        >
                          送信
                        </button>
                      )}
                      <button
                        onClick={() => setRatingTarget(null)}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        取消
                      </button>
                    </div>
                  )}

                  {/* View plan link */}
                  {entry.planSlug && (
                    <div className="mt-3 border-t border-border pt-3">
                      <Link
                        href={`/plan/${entry.planSlug}`}
                        className="text-xs text-primary hover:underline"
                      >
                        プランを見る →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/plan"
            className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark"
          >
            新しいプランを作成
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
