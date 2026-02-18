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
      sessionStorage.setItem("nightchill-plan", JSON.stringify(plan));
      sessionStorage.setItem("nightchill-location", location || "東京");
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
