"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialEmbedSection from "@/components/SocialEmbed";
import { type DatePlan, occasionLabels, moodLabels } from "@/lib/types";
import { getRelevantPosts, type UGCPost } from "@/lib/ugc-data";
import { decodePlan, buildShareUrl } from "@/lib/plan-encoder";
import type { VenueFactData } from "@/lib/google-places";

// ============================================================
// sessionStorage ヘルパー
// ============================================================
function loadPlanFromStorage(): DatePlan | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("futatabito-plan");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as DatePlan;
  } catch {
    sessionStorage.removeItem("futatabito-plan");
    return null;
  }
}

function loadLocationFromStorage(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("futatabito-location") || "";
}

// ============================================================
// URLハッシュからプランデータを取得
// ============================================================
function getPlanHashFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith("#plan=")) return null;
  return hash.slice(6);
}

// ============================================================
// テキスト変換
// ============================================================
function planToText(plan: DatePlan): string {
  const l: string[] = [];
  l.push(`【${plan.title}】`);
  l.push(`${occasionLabels[plan.occasion]} / ${moodLabels[plan.mood]}`);
  l.push("");
  l.push(plan.summary);
  l.push("");
  l.push("--- タイムライン ---");
  for (const item of plan.timeline) {
    l.push(`${item.time} ${item.activity}`);
    l.push(`  → ${item.tip}`);
  }
  l.push("");
  l.push("--- 服装アドバイス ---");
  l.push(plan.fashionAdvice);
  l.push("");
  l.push("--- 会話のネタ ---");
  for (const [i, topic] of plan.conversationTopics.entries()) {
    l.push(`${i + 1}. ${topic}`);
  }
  l.push("");
  l.push("--- 注意ポイント ---");
  for (const warning of plan.warnings) {
    l.push(`⚠ ${warning}`);
  }
  l.push("");
  l.push("futatabito - デート視点の東京カルチャーガイド");
  return l.join("\n");
}
// ============================================================
// 店舗情報カード
// ============================================================
function VenueCard({ venue, index }: { venue: VenueFactData; index: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Store Photo from Google Business Profile */}
      {venue.photoUrl && (
        <div className="relative h-48 w-full">
          <img
            src={venue.photoUrl}
            alt={`${venue.name} の店内写真`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {venue.rating !== null && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 backdrop-blur-sm">
              <span className="text-xs">⭐</span>
              <span className="text-sm font-semibold text-white">
                {venue.rating}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="font-semibold">{venue.name}</h3>
            </div>
            <p className="mt-1 text-sm text-muted">{venue.address}</p>
          </div>
          {venue.rating !== null && !venue.photoUrl && (
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-950">
              <span className="text-xs">⭐</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {venue.rating}
              </span>
            </div>
          )}
        </div>

        {venue.openingHours && venue.openingHours.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary">
              営業時間を見る
            </summary>
            <ul className="mt-2 space-y-1">
              {venue.openingHours.map((h, i) => (
                <li key={i} className="text-xs text-muted">{h}</li>
              ))}
            </ul>
          </details>
        )}

        {/* Reservation / Contact CTA */}
        <div className="mt-4 flex flex-wrap gap-2">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              予約・詳細を見る
            </a>
          )}
          {venue.phoneNumber && (
            <a
              href={`tel:${venue.phoneNumber}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              📞 電話で予約
            </a>
          )}
        </div>

        {venue.source === "fallback" && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ※ 詳細情報はGoogle Places API設定後に表示されます
          </p>
        )}
        {venue.source === "google_places" && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ Google Places APIから取得した最新情報
          </p>
        )}
      </div>
    </div>
  );
}
// ============================================================
// メインコンポーネント
// ============================================================
export default function ResultsPage() {
  const router = useRouter();
  const redirected = useRef(false);

  const [plan, setPlan] = useState<DatePlan | null>(loadPlanFromStorage);
  const [location, setLocation] = useState<string>(loadLocationFromStorage);
  const [isSharedView, setIsSharedView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [urlCopied, setUrlCopied] = useState(false);

  // URLハッシュからプランを読み込み
  useEffect(() => {
    const hash = getPlanHashFromUrl();
    if (!hash) return;
    let cancelled = false;
    decodePlan(hash).then((result) => {
      if (cancelled || !result) return;
      setPlan(result.plan);
      setLocation(result.location);
      setIsSharedView(true);
    });
    return () => { cancelled = true; };
  }, []);

  // シェアURL生成
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    buildShareUrl(plan, location || undefined).then((url) => {
      if (!cancelled) setShareUrl(url);
    });
    return () => { cancelled = true; };
  }, [plan, location]);

  const ugcPosts: UGCPost[] = useMemo(() => {
    if (!plan) return [];
    return getRelevantPosts(location, plan.occasion, 4);
  }, [plan, location]);

  useEffect(() => {
    if (!plan && !redirected.current && !getPlanHashFromUrl()) {
      redirected.current = true;
      router.push("/plan");
    }
  }, [plan, router]);

  const handleCopyText = useCallback(async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(planToText(plan));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = planToText(plan);
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [plan]);

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShareLine = useCallback(() => {
    if (!plan) return;
    const text = `${plan.title}\n\nfutatabitoでデートプランを作成しました！`;
    const lineUrl = shareUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(lineUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl]);

  const handleShareX = useCallback(() => {
    if (!plan) return;
    const text = `${plan.title}\n\nデートプランを作ってみた！\n#futatabito #デートプラン`;
    const xUrl = shareUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(xUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl]);
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

        {/* 共有プランバナー */}
        {isSharedView && (
          <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium text-primary">
              このプランは共有リンクから表示されています
            </p>
            <Link href="/plan" className="mt-2 inline-block text-xs text-muted underline hover:text-foreground">
              自分だけのプランを作る →
            </Link>
          </div>
        )}

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

        {/* Venue Info Section */}
        {plan.venues && plan.venues.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-bold">店舗情報</h2>
            <div className="space-y-4">
              {plan.venues.map((venue, i) => (
                <VenueCard key={venue.placeId || i} venue={venue} index={i} />
              ))}
            </div>

            {/* Walking Route */}
            {plan.walkingRoute && plan.venues.length >= 2 && (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚶</span>
                  <div>
                    <p className="font-semibold text-primary">
                      1軒目 → 2軒目: {plan.walkingRoute.durationText}
                    </p>
                    <p className="text-sm text-muted">
                      {plan.walkingRoute.distanceText} — {plan.walkingRoute.summary}
                    </p>
                  </div>
                </div>

                {plan.walkingRoute.source === "fallback" && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    ※ 正確なルートはGoogle Maps API設定後に表示されます
                  </p>
                )}
              </div>
            )}
          </section>
        )}
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
              <li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* UGC Social Embed Section */}
        {ugcPosts.length > 0 && (
          <SocialEmbedSection
            posts={ugcPosts}
            title="みんなのデート体験"
            subtitle={
              location
                ? `${location}エリアで話題のデートスポット`
                : "SNSで話題のデートスポット・体験をチェック"
            }
          />
        )}

        {/* Share */}
        <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-2 text-lg font-bold text-center">
            プランを保存・共有
          </h2>
          <p className="mb-5 text-center text-xs text-muted">
            リンクを共有すると、相手も同じプランを見られます
          </p>

          {shareUrl && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-background p-3">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 truncate bg-transparent text-xs text-muted outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopyUrl}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                {urlCopied ? "コピー済み ✓" : "URLをコピー"}
              </button>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              {copied ? "コピーしました！" : "テキストをコピー"}
            </button>
            <button
              onClick={handleShareLine}
              className="flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              LINEで共有
            </button>
            <button
              onClick={handleShareX}
              className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Xでシェア
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/plan"
            className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark"
          >
            {isSharedView ? "自分のプランを作成" : "別のプランを作成"}
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
