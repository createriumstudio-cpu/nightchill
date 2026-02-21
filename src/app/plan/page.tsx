"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  type Occasion,
  type Mood,
  type Budget,
  occasionLabels,
  moodLabels,
  budgetLabels,
} from "@/lib/types";

const loadingMessages = [
  "シチュエーションを分析中...",
  "最適なプランを組み立て中...",
  "服装アドバイスを考案中...",
  "会話のネタを準備中...",
  "仕上げの調整中...",
];

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");

  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [mood, setMood] = useState<Mood | "">("");
  const [budget, setBudget] = useState<Budget | "">("");
  const [location, setLocation] = useState("");
  const [partnerInterests, setPartnerInterests] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const filledSteps =
    (occasion ? 1 : 0) + (mood ? 1 : 0) + (budget ? 1 : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!occasion || !mood || !budget) {
      setError("必須項目をすべて選択してください。");
      return;
    }

    setLoading(true);
    let msgIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 2500);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          mood,
          budget,
          location: location || "東京",
          partnerInterests,
          additionalNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const plan = await res.json();
      sessionStorage.setItem("futatabito-plan", JSON.stringify(plan));
      sessionStorage.setItem("futatabito-location", location || "東京");
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-8 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <h2 className="text-xl font-bold">
              プランを生成しています
            </h2>
            <p className="mt-3 text-sm text-muted">
              {loadingMessage}
            </p>
            <div className="mx-auto mt-6 flex max-w-xs gap-1.5">
              {loadingMessages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    loadingMessages.indexOf(loadingMessage) >= i
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-6 pt-28 pb-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            デートプランを作成
          </h1>
          <p className="mt-3 text-muted">
            あなたのシチュエーションを教えてください。最適なプランを提案します。
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  filledSteps >= step
                    ? "bg-primary text-white"
                    : "bg-border text-muted"
                }`}
              >
                {filledSteps >= step ? "✓" : step}
              </div>
              {step < 3 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-colors ${
                    filledSteps > step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-muted">
            {filledSteps}/3 必須項目
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          {/* Occasion */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              シチュエーション <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.entries(occasionLabels) as [Occasion, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOccasion(value)}
                    aria-pressed={occasion === value}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      occasion === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* Mood */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              雰囲気 <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.entries(moodLabels) as [Mood, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMood(value)}
                    aria-pressed={mood === value}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      mood === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* Budget */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              予算 <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(budgetLabels) as [Budget, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBudget(value)}
                    aria-pressed={budget === value}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      budget === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-semibold"
            >
              エリア
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 渋谷、銀座、横浜"
              maxLength={50}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {/* Partner Interests */}
          <div>
            <label
              htmlFor="interests"
              className="mb-2 block text-sm font-semibold"
            >
              相手の趣味・好み
            </label>
            <input
              id="interests"
              type="text"
              value={partnerInterests}
              onChange={(e) => setPartnerInterests(e.target.value)}
              placeholder="例: カフェ巡り、映画、アート"
              maxLength={200}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-semibold"
            >
              その他
            </label>
            <textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="気になることや要望があれば教えてください"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !occasion || !mood || !budget}
            className="w-full rounded-full bg-primary py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            デートプランを作成
          </button>

          <p className="text-center text-xs text-muted">
            完全無料・登録不要で利用できます
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
