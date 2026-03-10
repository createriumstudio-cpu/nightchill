"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  Activity,
  Relationship,
  Mood,
  Budget,
  AgeGroup,
} from "@/lib/types";
import {
  activityLabels,
  relationshipLabels,
  moodLabels,
  budgetLabels,
  ageGroupLabels,
} from "@/lib/types";
import { CITIES, getCityById } from "@/lib/cities";

const TOTAL_STEPS = 5;

export default function PlanPage() {
  return (
    <Suspense>
      <PlanPageContent />
    </Suspense>
  );
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);

  // Step
  const [step, setStep] = useState(1);

  // Step 1: いつ？
  const [dateStr, setDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Step 2: どこで？（都市 + エリア選択）
  const [cityId, setCityId] = useState("tokyo");
  const [locations, setLocations] = useState<string[]>([]);
  const [customLocation, setCustomLocation] = useState("");

  // Step 3: 誰と？
  const [relationship, setRelationship] = useState<Relationship | "">("");

  // Step 4: 何をしたい？
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mood, setMood] = useState<Mood | "">("");

  // Step 5: 詳細
  const [budget, setBudget] = useState<Budget | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Email signup during loading
  const [signupEmail, setSignupEmail] = useState("");
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  // ステップ切り替え時に画面トップへスクロール
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // クエリパラメータから都市・エリアを事前選択
  useEffect(() => {
    const qCity = searchParams.get("city");
    const qArea = searchParams.get("area");

    if (qCity && getCityById(qCity)) {
      setCityId(qCity);
      if (qArea) {
        setLocations([qArea]);
      }
      // 都市が事前選択されている場合、Step 2（どこで？）からスタート
      setStep(2);
    }
  }, [searchParams]);

  const toggleLocation = (area: string) => {
    setLocations((prev) =>
      prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]
    );
  };

  const toggleActivity = (a: Activity) => {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return true; // 日時は任意
      case 2: return cityId !== "" && (locations.length > 0 || customLocation.trim().length > 0);
      case 3: return relationship !== "";
      case 4: return activities.length > 0 && mood !== "";
      case 5: return budget !== "" && ageGroup !== "";
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleEmailSignup = async () => {
    const trimmed = signupEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setEmailSubmitting(true);
    try {
      await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      sessionStorage.setItem("futatabito-email", trimmed);
      setEmailRegistered(true);
    } catch {
      // silent fail
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsLoading(true);
    setError("");

    try {
      const combinedLocation = customLocation.trim()
        ? [...locations, customLocation.trim()].join(", ")
        : locations.join(", ");

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateStr,
          endDateStr,
          startTime,
          endTime,
          city: cityId,
          location: combinedLocation,
          relationship,
          activities,
          mood,
          budget,
          ageGroup,
          additionalNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "プランの生成に失敗しました");
      }

      const data = await res.json();
      if (data.slug) {
        router.push(`/plan/${data.slug}`);
      } else {
        sessionStorage.setItem("futatabito-plan", JSON.stringify(data));
        sessionStorage.setItem("futatabito-location", combinedLocation);
        sessionStorage.setItem("futatabito-context", JSON.stringify({
          occasion: activities[0] || "dinner",
          mood,
          budget,
          city: cityId,
        }));
        router.push("/results");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 今日の日付 (min用)
  const today = new Date().toISOString().split("T")[0];

  const selectedCity = getCityById(cityId);
  const locationPresets = selectedCity?.areas ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-lg font-bold text-foreground">
            futa<span className="text-accent">tabito</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8" ref={formRef}>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          デートプランを作成
        </h1>
        <p className="text-muted text-center mb-8 text-sm">
          あなたの理想のデートを教えてください。AIが最適なプランを提案します。
        </p>

        {/* ── Progress Bar ── */}
        <nav aria-label="プラン作成の進捗" className="flex items-center justify-center gap-1 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="flex items-center"
              role="listitem"
              aria-current={s === step ? "step" : undefined}
              aria-label={`ステップ${s}${s === step ? "（現在）" : s < step ? "（完了）" : ""}`}
            >
              <div
                className={`h-2 w-8 sm:w-12 rounded-full transition-colors ${
                  s <= step ? "bg-interactive" : "bg-border"
                }`}
              />
            </div>
          ))}
          <span className="ml-2 text-xs text-muted" aria-live="polite">{step}/{TOTAL_STEPS}</span>
        </nav>

        {/* ── Step Content (min-height to prevent layout shift) ── */}
        <div className="min-h-[420px]">

          {/* Step 1: いつ？ */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">📅 いつデートする？</h2>
              <p className="text-sm text-muted">決まっていなければ空欄でOK</p>

              {endDateStr && dateStr && endDateStr > dateStr ? (
                <>
                  <p className="text-sm text-interactive font-medium mb-4">
                    {(() => {
                      const start = new Date(dateStr);
                      const end = new Date(endDateStr);
                      const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return `🌙 ${nights}泊${nights + 1}日のプラン`;
                    })()}
                  </p>

                  {/* Day 1: 日付 + 合流時間 */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-interactive">Day 1</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">日付</label>
                        <input
                          type="date"
                          value={dateStr}
                          onChange={(e) => { setDateStr(e.target.value); if (!e.target.value) setEndDateStr(""); }}
                          min={today}
                          className={`w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light] ${dateStr ? 'text-foreground' : 'text-muted'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">合流時間</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          step={900}
                          className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day 2: 帰りの日 + 解散時間 */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-interactive">Day 2</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">帰りの日</label>
                        <input
                          type="date"
                          value={endDateStr}
                          onChange={(e) => setEndDateStr(e.target.value)}
                          min={dateStr}
                          className={`w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light] ${endDateStr ? 'text-foreground' : 'text-muted'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">解散時間</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          step={900}
                          className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">日付</label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => { setDateStr(e.target.value); if (!e.target.value) setEndDateStr(""); }}
                      min={today}
                      className={`w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light] ${dateStr ? 'text-foreground' : 'text-muted'}`}
                    />
                  </div>

                  {/* 帰りの日（宿泊プラン用） */}
                  {dateStr && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">帰りの日<span className="text-muted text-xs ml-1">（宿泊する場合）</span></label>
                      <input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                        min={dateStr}
                        className={`w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light] ${endDateStr ? 'text-foreground' : 'text-muted'}`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">合流時間</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step={900}
                        className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">解散時間</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step={900}
                        className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive [color-scheme:light]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: どこで？（都市選択 + エリア複数選択） */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">📍 どこでデートする？</h2>

              {/* 都市選択 */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">都市を選択</legend>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        setCityId(city.id);
                        setLocations([]);
                        setCustomLocation("");
                      }}
                      aria-pressed={cityId === city.id}
                      aria-label={`都市: ${city.name}`}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        cityId === city.id
                          ? "bg-interactive text-interactive-foreground border-interactive"
                          : "bg-surface text-foreground border-border hover:border-interactive/50"
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
                {selectedCity && (
                  <p className="mt-2 text-xs text-muted">{selectedCity.description}</p>
                )}
              </fieldset>

              {/* エリア選択 */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">
                  エリアを選択<span className="text-muted text-xs ml-1">（複数選択OK）</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {locationPresets.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleLocation(area)}
                      aria-pressed={locations.includes(area)}
                      aria-label={`エリア: ${area}`}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        locations.includes(area)
                          ? "bg-interactive text-interactive-foreground border-interactive"
                          : "bg-surface text-foreground border-border hover:border-interactive/50"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </fieldset>

              {locations.length > 0 && (
                <p className="text-sm text-interactive font-medium">
                  選択中: {locations.join(", ")}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  その他のエリア（任意）
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="例: 駅前周辺"
                  className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive"
                />
              </div>
            </div>
          )}

          {/* Step 3: 誰と？ */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">💑 誰とデートする？</h2>

              <div className="grid gap-3">
                {(Object.entries(relationshipLabels) as [Relationship, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRelationship(value)}
                      aria-pressed={relationship === value}
                      className={`w-full px-4 py-4 rounded-xl border text-left transition-colors ${
                        relationship === value
                          ? "bg-interactive-light border-interactive text-foreground"
                          : "bg-surface border-border text-foreground hover:border-interactive/50"
                      }`}
                    >
                      <span className="text-base font-medium">{label}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 4: 何をしたい？ */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">✨ 何をしたい？</h2>
              <p className="text-sm text-muted">複数選択OK（1つ以上選んでください）</p>

              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">やりたいこと</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(activityLabels) as [Activity, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleActivity(value)}
                        aria-pressed={activities.includes(value)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          activities.includes(value)
                            ? "bg-interactive text-interactive-foreground border-interactive"
                            : "bg-surface text-foreground border-border hover:border-interactive/50"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">雰囲気 *</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(moodLabels) as [Mood, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMood(value)}
                        aria-pressed={mood === value}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          mood === value
                            ? "bg-interactive text-interactive-foreground border-interactive"
                            : "bg-surface text-foreground border-border hover:border-interactive/50"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>
            </div>
          )}

          {/* Step 5: 詳細 */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">⚙️ 詳細設定</h2>

              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">予算 *</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(budgetLabels) as [Budget, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBudget(value)}
                        aria-pressed={budget === value}
                        className={`px-4 py-3 rounded-xl text-sm border transition-colors ${
                          budget === value
                            ? "bg-interactive-light border-interactive text-foreground"
                            : "bg-surface border-border text-foreground hover:border-interactive/50"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">
                  年齢確認 *
                  <span className="text-xs text-muted ml-1">
                    （アルコール・シーシャ提供店の推薦に必要）
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(ageGroupLabels) as [AgeGroup, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAgeGroup(value)}
                        aria-pressed={ageGroup === value}
                        className={`px-4 py-3 rounded-xl text-sm border transition-colors ${
                          ageGroup === value
                            ? "bg-interactive-light border-interactive text-foreground"
                            : "bg-surface border-border text-foreground hover:border-interactive/50"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  その他のリクエスト（任意）
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="例: 相手はカフェ好き、写真映えする場所がいい"
                  rows={3}
                  className="w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-interactive focus:ring-interactive resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 p-3 bg-rose/10 text-rose rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex justify-between items-center mt-8 mb-12">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-sm text-muted border border-border rounded-xl hover:bg-surface-alt transition-colors"
            >
              戻る
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="px-8 py-3 text-sm font-medium text-interactive-foreground bg-interactive rounded-xl hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  プラン生成中...
                </span>
              ) : (
                "プランを作成する"
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted mb-8">
          完全無料・登録不要で利用できます
        </p>
      </main>

      {/* Loading overlay with email signup */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-title"
        >
          <div className="max-w-sm mx-auto px-6 text-center">
            <div className="mb-6">
              <svg className="animate-spin h-10 w-10 mx-auto text-interactive" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="sr-only">読み込み中</span>
            </div>
            <h2 id="loading-title" className="text-xl font-bold mb-2">
              プランを生成しています...
            </h2>
            <p className="text-sm text-muted mb-8">
              AIがあなたにぴったりのデートプランを考えています
            </p>

            <div className="rounded-2xl border border-interactive/30 bg-interactive-light p-5">
              {emailRegistered ? (
                <p className="text-sm font-medium text-foreground">
                  ✅ 完成したらお送りします
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-3">
                    📧 完成したらメールで受け取る（任意）
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEmailSignup(); }}
                      placeholder="example@email.com"
                      className="flex-1 min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-interactive focus:ring-interactive focus:outline-none"
                    />
                    <button
                      onClick={handleEmailSignup}
                      disabled={emailSubmitting || !signupEmail.trim()}
                      className="shrink-0 rounded-xl bg-interactive px-4 py-2.5 text-sm font-medium text-interactive-foreground hover:opacity-90 transition-colors disabled:opacity-40"
                    >
                      {emailSubmitting ? "..." : "登録"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
