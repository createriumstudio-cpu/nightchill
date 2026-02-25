"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const TOTAL_STEPS = 5;

export default function PlanPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  // Step
  const [step, setStep] = useState(1);

  // Step 1: いつ？
  const [dateStr, setDateStr] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Step 2: どこで？
  const [location, setLocation] = useState("");

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

  // ステップ切り替え時に画面トップへスクロール
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const toggleActivity = (a: Activity) => {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return true; // 日時は任意
      case 2: return location.trim().length > 0;
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

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateStr,
          startTime,
          endTime,
          location,
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
      sessionStorage.setItem("datePlan", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 今日の日付 (min用)
  const today = new Date().toISOString().split("T")[0];

  const locationPresets = [
    "渋谷", "新宿", "表参道", "銀座", "六本木",
    "恵比寿", "代官山", "中目黒", "下北沢", "浅草",
    "お台場", "池袋", "吉祥寺",
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-lg font-bold text-gray-900">
            futa<span className="text-orange-500">tabito</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8" ref={formRef}>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          デートプランを作成
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          あなたの理想のデートを教えてください。AIが最適なプランを提案します。
        </p>

        {/* ── Progress Bar ── */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-2 w-8 sm:w-12 rounded-full transition-colors ${
                  s <= step ? "bg-orange-500" : "bg-gray-200"
                }`}
              />
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400">{step}/{TOTAL_STEPS}</span>
        </div>

        {/* ── Step Content (min-height to prevent layout shift) ── */}
        <div className="min-h-[420px]">

          {/* Step 1: いつ？ */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">📅 いつデートする？</h2>
              <p className="text-sm text-gray-500">決まっていなければ空欄でOK</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  min={today}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">合流時間</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">解散時間</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: どこで？ */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold">📍 どこでデートする？</h2>
              <p className="text-sm text-gray-500">エリアを選ぶか、自由に入力してください</p>

              <div className="flex flex-wrap gap-2">
                {locationPresets.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setLocation(area)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      location === area
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  または自由入力
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: 横浜みなとみらい、決まってない"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
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
                      className={`w-full px-4 py-4 rounded-xl border text-left transition-colors ${
                        relationship === value
                          ? "bg-orange-50 border-orange-500 text-orange-700"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-300"
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
              <p className="text-sm text-gray-500">複数選択OK（1つ以上選んでください）</p>

              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">やりたいこと</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(activityLabels) as [Activity, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleActivity(value)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          activities.includes(value)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">雰囲気 *</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(moodLabels) as [Mood, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMood(value)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          mood === value
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
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
                <legend className="text-sm font-medium text-gray-700 mb-2">予算 *</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(budgetLabels) as [Budget, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBudget(value)}
                        className={`px-4 py-3 rounded-xl text-sm border transition-colors ${
                          budget === value
                            ? "bg-orange-50 border-orange-500 text-orange-700"
                            : "bg-white border-gray-300 text-gray-700 hover:border-orange-300"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">
                  年齢確認 *
                  <span className="text-xs text-gray-400 ml-1">
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
                        className={`px-4 py-3 rounded-xl text-sm border transition-colors ${
                          ageGroup === value
                            ? "bg-orange-50 border-orange-500 text-orange-700"
                            : "bg-white border-gray-300 text-gray-700 hover:border-orange-300"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </fieldset>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  その他のリクエスト（任意）
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="例: 相手はカフェ好き、写真映えする場所がいい"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex justify-between items-center mt-8 mb-12">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
              className="px-8 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="px-8 py-3 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

        <p className="text-center text-xs text-gray-400 mb-8">
          完全無料・登録不要で利用できます
        </p>
      </main>
    </div>
  );
}
