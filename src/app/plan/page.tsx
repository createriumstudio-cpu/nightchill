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

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [mood, setMood] = useState<Mood | "">("");
  const [budget, setBudget] = useState<Budget | "">("");
  const [location, setLocation] = useState("");
  const [partnerInterests, setPartnerInterests] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!occasion || !mood || !budget) {
      setError("必須項目をすべて選択してください。");
      return;
    }

    setLoading(true);
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
      sessionStorage.setItem("nightchill-plan", JSON.stringify(plan));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
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

        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
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
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "プランを生成中..." : "デートプランを作成"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
