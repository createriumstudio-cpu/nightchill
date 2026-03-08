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

              {endDateStr && dateStr && endDateStr > dateStr ? (
                <>
                  <p className="text-sm text-orange-600 font-medium mb-4">
                    {(() => {
                      const start = new Date(dateStr);
                      const end = new Date(endDateStr);
                      const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return `🌙 ${nights}泊${nights + 1}日のプラン`;
                    })()}
                  </p>

                  {/* Day 1: 日付 + 合流時間 */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-orange-600">Day 1</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                        <input
                          type="date"
                          value={dateStr}
                          onChange={(e) => { setDateStr(e.target.value); if (!e.target.value) setEndDateStr(""); }}
                          min={today}
                          className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">合流時間</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day 2: 帰りの日 + 解散時間 */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-orange-600">Day 2</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">帰りの日</label>
                        <input
                          type="date"
                          value={endDateStr}
                          onChange={(e) => setEndDateStr(e.target.value)}
                          min={dateStr}
                          className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">解散時間</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => { setDateStr(e.target.value); if (!e.target.value) setEndDateStr(""); }}
                      min={today}
                      className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  {/* 帰りの日（宿泊プラン用） */}
                  {dateStr && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">帰りの日<span className="text-gray-400 text-xs ml-1">（宿泊する場合）</span></label>
                      <input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                        min={dateStr}
                        className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">合流時間</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">解散時間</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
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
                <legend className="text-sm font-medium text-gray-700 mb-2">都市を選択</legend>
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
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        cityId === city.id
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
                {selectedCity && (
                  <p className="mt-2 text-xs text-gray-400">{selectedCity.description}</p>
                )}
              </fieldset>

              {/* エリア選択 */}
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">
                  エリアを選択<span className="text-gray-400 text-xs ml-1">（複数選択OK）</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {locationPresets.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleLocation(area)}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        locations.includes(area)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </fieldset>

              {locations.length > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  選択中: {locations.join(", ")}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  その他のエリア（任意）
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="例: 駅前周辺"
                  className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500"
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
                  className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-orange-500 focus:ring-orange-500 resize-none"
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
