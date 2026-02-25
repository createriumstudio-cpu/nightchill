"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  type Occasion,
  type Mood,
  type Budget,
  type DateType,
  type AgeGroup,
  type DateSchedule,
  occasionLabels,
  moodLabels,
  budgetLabels,
  dateTypeLabels,
  ageGroupLabels,
  dateScheduleLabels,
} from "@/lib/types";

const TOTAL_STEPS = 3;

const loadingMessages = [
  "シチュエーションを分析中...",
  "最適なプランを組み立て中...",
  "服装アドバイスを考案中...",
  "会話のネタを準備中...",
  "仕上げの調整中...",
];

/* ─────────── chip button ─────────── */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

export default function PlanPage() {
  const router = useRouter();

  /* form state */
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [mood, setMood] = useState<Mood | "">("");
  const [budget, setBudget] = useState<Budget | "">("");
  const [dateType, setDateType] = useState<DateType | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [dateSchedule, setDateSchedule] = useState<DateSchedule>("undecided");
  const [location, setLocation] = useState("");
  const [partnerInterests, setPartnerInterests] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  /* validation per step */
  const stepValid = useCallback(
    (s: number) => {
      if (s === 1) return !!occasion && !!mood;
      if (s === 2) return !!budget && !!dateType && !!ageGroup;
      return true; // step 3 has only optional fields
    },
    [occasion, mood, budget, dateType, ageGroup, dateSchedule],
  );

  const canProceed = stepValid(step);

  function goNext() {
    if (!canProceed) return;
    setDirection("forward");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 1));
  }

  /* submit */
  async function handleSubmit() {
    setError("");
    if (!occasion || !mood || !budget || !dateType || !ageGroup) {
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
          dateType,
          ageGroup,
          dateSchedule,
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

  /* ─── loading screen ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-8 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <h2 className="text-xl font-bold">プランを生成しています</h2>
            <p className="mt-3 text-sm text-muted">{loadingMessage}</p>
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

  /* ─── step labels ─── */
  const stepLabels = ["シーン", "条件", "詳細"];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-6 pt-28 pb-16">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            デートプランを作成
          </h1>
          <p className="mt-3 text-muted">
            あなたのシチュエーションを教えてください。最適なプランを提案します。
          </p>
        </div>

        {/* ─── Progress bar ─── */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const current = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (s < step) {
                      setDirection("back");
                      setStep(s);
                    }
                  }}
                  disabled={s > step}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-white cursor-pointer"
                      : current
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-border text-muted cursor-default"
                  }`}
                >
                  {done ? "✓" : s}
                </button>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    current ? "text-primary" : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {s < TOTAL_STEPS && (
                  <div
                    className={`h-0.5 w-6 rounded-full transition-colors sm:w-10 ${
                      done ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
          <span className="ml-3 text-xs text-muted">
            ステップ {step}/{TOTAL_STEPS}
          </span>
        </div>

        {/* ─── Step panels ─── */}
        <div className="relative mt-10 overflow-hidden">
          <div
            className={`transition-all duration-300 ease-in-out ${
              direction === "forward"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            key={step}
          >
            {step === 1 && (
              <div className="space-y-8">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    シチュエーション{" "}
                    <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(
                      Object.entries(occasionLabels) as [Occasion, string][]
                    ).map(([value, label]) => (
                      <Chip
                        key={value}
                        selected={occasion === value}
                        onClick={() => setOccasion(value)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    雰囲気 <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(Object.entries(moodLabels) as [Mood, string][]).map(
                      ([value, label]) => (
                        <Chip
                          key={value}
                          selected={mood === value}
                          onClick={() => setMood(value)}
                        >
                          {label}
                        </Chip>
                      ),
                    )}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    予算 <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      Object.entries(budgetLabels) as [Budget, string][]
                    ).map(([value, label]) => (
                      <Chip
                        key={value}
                        selected={budget === value}
                        onClick={() => setBudget(value)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    デートの種類{" "}
                    <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      Object.entries(dateTypeLabels) as [DateType, string][]
                    ).map(([value, label]) => (
                      <Chip
                        key={value}
                        selected={dateType === value}
                        onClick={() => setDateType(value)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold">
                    年齢確認{" "}
                    <span className="text-red-500">*</span>
                  </legend>
                  <p className="mb-3 text-xs text-muted">
                    アルコールやシーシャを提供する店舗の推薦に必要です
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      Object.entries(ageGroupLabels) as [AgeGroup, string][]
                    ).map(([value, label]) => (
                      <Chip
                        key={value}
                        selected={ageGroup === value}
                        onClick={() => setAgeGroup(value)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

              {/* デート予定日 */}
              <fieldset>
                <legend className="text-sm font-medium mb-2">
                  いつのデート？
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    Object.entries(dateScheduleLabels) as [DateSchedule, string][]
                  ).map(([value, label]) => (
                    <Chip
                      key={value}
                      selected={dateSchedule === value}
                      onClick={() => setDateSchedule(value)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
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

                {/* Summary preview */}
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="mb-3 text-sm font-semibold text-muted">
                    選択内容の確認
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {occasion && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {occasionLabels[occasion]}
                      </span>
                    )}
                    {mood && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {moodLabels[mood]}
                      </span>
                    )}
                    {budget && (
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        {budgetLabels[budget]}
                      </span>
                    )}
                    {dateType && (
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        {dateTypeLabels[dateType]}
                      </span>
                    )}
                    {ageGroup && (
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        {ageGroupLabels[ageGroup]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {/* ─── Navigation buttons ─── */}
        <div className="mt-10 flex items-center gap-4">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface"
            >
              戻る
            </button>
          )}

          <div className="flex-1" />

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              デートプランを作成
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          完全無料・登録不要で利用できます
        </p>
      </main>

      <Footer />
    </div>
  );
}
