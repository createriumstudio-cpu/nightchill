"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { type DatePlan, occasionLabels, moodLabels } from "@/lib/types";

function loadPlanFromStorage(): DatePlan | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("nightchill-plan");
  if (!stored) return null;
  return JSON.parse(stored) as DatePlan;
}

export default function ResultsPage() {
  const router = useRouter();
  const [plan] = useState<DatePlan | null>(loadPlanFromStorage);
  const redirected = useRef(false);

  useEffect(() => {
    if (!plan && !redirected.current) {
      redirected.current = true;
      router.push("/plan");
    }
  }, [plan, router]);

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
        {/* Title */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {occasionLabels[plan.occasion]}
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {moodLabels[plan.mood]}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {plan.title}
          </h1>
          <p className="mt-3 text-muted">{plan.summary}</p>
        </div>

        {/* Timeline */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">タイムライン</h2>
          <div className="space-y-6">
            {plan.timeline.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {item.time.split(":")[0]}
                  </span>
                  {index < plan.timeline.length - 1 && (
                    <div className="mt-2 h-full w-px bg-border" />
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 flex-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{item.activity}</h3>
                    <span className="text-sm text-muted">{item.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fashion Advice */}
        <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-xl font-bold">服装アドバイス</h2>
          <p className="text-sm leading-relaxed text-muted">
            {plan.fashionAdvice}
          </p>
        </section>

        {/* Conversation Topics */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold">会話のネタ</h2>
          <ul className="space-y-3">
            {plan.conversationTopics.map((topic, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted">{topic}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Warnings */}
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="mb-4 text-xl font-bold text-amber-900 dark:text-amber-200">
            注意ポイント
          </h2>
          <ul className="space-y-2">
            {plan.warnings.map((warning, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300"
              >
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/plan"
            className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark"
          >
            別のプランを作成
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-surface"
          >
            トップに戻る
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
