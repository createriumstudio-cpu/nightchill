"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { type DatePlan } from "@/lib/types";
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
const ALCOHOL_VENUE_TYPES = ["bar", "night_club", "liquor_store"];

function isAlcoholVenue(types: string[]): boolean {
  return types.some((t) => ALCOHOL_VENUE_TYPES.includes(t));
}

function VenueCard({ venue, index }: { venue: VenueFactData; index: number }) {
  const gbpUrl = venue.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${venue.placeId}`;
  const showAgeBadge = isAlcoholVenue(venue.types);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Store Photo — clickable to Google Business Profile */}
      {venue.photoUrl && (
        <a href={gbpUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={venue.photoUrl}
              alt={`${venue.name} の店内写真`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            {venue.rating !== null && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 backdrop-blur-sm">
                <span className="text-xs">⭐</span>
                <span className="text-sm font-semibold text-white">
                  {venue.rating}
                </span>
              </div>
            )}
            {showAgeBadge && (
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-red-600/90 px-2 py-1 backdrop-blur-sm">
                <span className="text-xs font-bold text-white">🔞 20歳以上対象</span>
              </div>
            )}
          </div>
          {/* Photo Attribution (Required by Google Maps Platform Policy) */}
          {venue.photoHtmlAttribution && (
            <p
              className="bg-black/60 px-3 py-1 text-[10px] text-white/80"
              dangerouslySetInnerHTML={{ __html: `Photo: ${venue.photoHtmlAttribution}` }}
            />
          )}
        </a>
      )}

      {/* Age badge for venues without photo */}
      {!venue.photoUrl && showAgeBadge && (
        <div className="bg-red-50 px-4 py-2 dark:bg-red-950">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">🔞 20歳以上対象</span>
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

        {/* Google Maps Attribution (Required by Google Maps Platform Policy) */}
        {venue.source === "google_places" && (
          <p className="mt-3 text-[11px] text-muted">
            店舗情報提供: <span translate="no" className="font-normal" style={{ fontFamily: "Roboto, sans-serif" }}>Google Maps</span>
          </p>
        )}
        {venue.source === "fallback" && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ※ 詳細情報はGoogle Places API設定後に表示されます
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Google Business Profile 埋め込み (Maps Embed API)
// ============================================================
function VenueEmbed({ venue }: { venue: VenueFactData }) {
  const embedUrl = venue.mapEmbedUrl;
  const gbpUrl = venue.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${venue.placeId}`;
  
  if (!embedUrl) return null;

  return (
    <div className="mt-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          src={embedUrl}
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${venue.name} - Google Maps`}
        />
      </div>
      <a
        href={gbpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block text-xs text-primary text-center hover:underline"
      >
        📍 Google Maps で詳細を見る
      </a>
    </div>
  );
}

// ============================================================
// 俯瞰マップ (Static Map API - 全ヴェニューピン表示)
// ============================================================
function OverviewMap({ venues, area }: { venues: VenueFactData[]; area: string }) {
  const validVenues = venues.filter(v => v.lat !== 0 && v.lng !== 0);
  if (validVenues.length === 0) return null;

  const markers = validVenues
    .map((v, i) => `markers=color:red%7Clabel:${i + 1}%7C${v.lat},${v.lng}`)
    .join("&");
  
  const staticMapUrl = `/api/static-map-multi?${markers}&area=${encodeURIComponent(area)}`;
  
  // Fallback: use Google Maps Embed API with directions/search
  const center = validVenues.reduce(
    (acc, v) => ({ lat: acc.lat + v.lat / validVenues.length, lng: acc.lng + v.lng / validVenues.length }),
    { lat: 0, lng: 0 }
  );
  const markersParam = validVenues.map(v => `${v.lat},${v.lng}`).join("|");
  const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${typeof window !== "undefined" ? "" : ""}&center=${center.lat},${center.lng}&zoom=14`;

  // Use a static map with all markers via our proxy
  const allMarkersQuery = validVenues.map(v => `${v.lat},${v.lng}`).join("|");
  const overviewStaticUrl = `/api/static-map-overview?markers=${encodeURIComponent(allMarkersQuery)}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/${validVenues.map(v => `${v.lat},${v.lng}`).join("/")}`;

  return (
    <section className="mt-8 scroll-mt-28">
      <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
        🗺️ デートルート俯瞰マップ
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        <img
          src={overviewStaticUrl}
          alt="デートプラン全体の地図"
          className="w-full h-[300px] object-cover"
          loading="lazy"
          onError={(e) => {
            // Hide on error
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {validVenues.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {v.name}
          </span>
        ))}
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-center text-sm text-primary hover:underline"
      >
        📍 Google Maps でルートを確認
      </a>
    </section>
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

  // Venue matching: timeline.venue -> VenueFactData
  const findMatchingVenue = (venueName: string): VenueFactData | null => {
    if (!plan?.venues || !venueName) return null;
    const lower = venueName.toLowerCase();
    return plan.venues.find((v: VenueFactData) => {
      const vLower = v.name.toLowerCase();
      return vLower.includes(lower) || lower.includes(vLower);
    }) || null;
  };

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
        <div id="overview" className="text-center scroll-mt-32">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            </span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {plan.title}
          </h1>
          <p className="mt-3 text-muted">{plan.summary}</p>
        </div>

        {/* Timeline with integrated venue info */}
        <section id="timeline" className="mt-12 scroll-mt-28">
          <h2 className="mb-6 text-xl font-bold">タイムライン</h2>
          <div className="space-y-6">
            {plan.timeline.map((item, index) => {
              const matchedVenue = findMatchingVenue(item.venue);
              return (
                <div key={index} className="relative">
                  {/* Timeline connector */}
                  {index < plan.timeline.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="flex gap-4">
                    {/* Time badge */}
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {item.time.split(":")[0]}
                      </span>
                      <span className="text-xs text-muted mt-0.5">{item.time}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <h3 className="font-bold text-base">{item.activity}</h3>
                      {item.venue && (
                        <p className="text-sm text-primary font-medium mt-0.5">
                          {matchedVenue?.googleMapsUrl ? (
                            <a href={matchedVenue.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              📍 {item.venue}
                            </a>
                          ) : (
                            <>📍 {item.venue}</>
                          )}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted mt-1">{item.description}</p>
                      )}
                      {item.tip && (
                        <p className="text-xs italic text-muted/70 mt-1">💡 {item.tip}</p>
                      )}
                      {/* Embedded venue card */}
                      {matchedVenue && (
                        <div className="mt-3 rounded-xl border border-border bg-surface overflow-hidden">
                          {matchedVenue.photoUrl && (
                            <a href={matchedVenue.googleMapsUrl || "#"} target="_blank" rel="noopener noreferrer" className="block group">
                              <div className="relative h-48 w-full overflow-hidden">
                                <img
                                  src={matchedVenue.photoUrl}
                                  alt={matchedVenue.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                                {matchedVenue.rating && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 backdrop-blur-sm">
                                    <span className="text-xs">⭐</span>
                                    <span className="text-sm font-semibold text-white">{matchedVenue.rating}</span>
                                  </div>
                                )}
                              </div>
                            </a>
                          )}
                          <div className="p-4">
                            <p className="text-xs text-muted truncate">{matchedVenue.address}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {matchedVenue.googleMapsUrl && (
                                <a
                                  href={matchedVenue.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
                                >
                                  🗺️ 地図
                                </a>
                              )}
                              {matchedVenue.website && (
                                <a
                                  href={matchedVenue.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
                                >
                                  🌐 HP
                                </a>
                              )}
                              {matchedVenue.phoneNumber && (
                                <a
                                  href={`tel:${matchedVenue.phoneNumber}`}
                                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
                                >
                                  📞 電話
                                </a>
                              )}
                            </div>
                            {matchedVenue.source === "google_places" && (
                              <p className="mt-2 text-[11px] text-muted">
                                店舗情報提供: <span translate="no" className="font-normal" style={{ fontFamily: "Roboto, sans-serif" }}>Google Maps</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Google Map 埋め込み */}
                      {item.venue && (
                        matchedVenue && <VenueEmbed venue={matchedVenue} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Overview Map - 全ヴェニュー俯瞰マップ */}
        {plan.venues && plan.venues.length > 0 && (
          <OverviewMap venues={plan.venues} area={location} />
        )}

        {/* Fashion Advice */}
        <section id="advice" className="mt-12 scroll-mt-28 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-xl font-bold">服装アドバイス</h2>
          <p className="text-sm leading-relaxed text-muted">
            {plan.fashionAdvice}
          </p>
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
