"use client";

import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { type DatePlan } from "@/lib/types";
import { decodePlan, buildShareUrl } from "@/lib/plan-encoder";
import type { VenueFactData } from "@/lib/google-places";
import { getCityById } from "@/lib/cities";

// Lazy load below-fold components for faster initial render
const ProductRecommendation = lazy(() => import("@/components/ProductRecommendation"));
const ReservationAffiliate = lazy(() => import("@/components/ReservationAffiliate"));
const PremiumBanner = lazy(() => import("@/components/PremiumBanner"));
const RouteMapEmbed = lazy(() => import("@/components/RouteMapEmbed"));

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
  l.push("futatabito - デート視点の東京カルチャーガイド");
  return l.join("\n");
}

// ============================================================
// 店舗写真の遅延読み込みフック
// ============================================================
interface PlacePhotoData {
  photoUri: string | null;
  attribution: string | null;
  attributionUri: string | null;
  googleMapsUri: string | null;
  placeId: string | null;
  mapEmbedUrl: string | null;
}

function useVenuePhoto(venueName: string | null, enabled: boolean, area?: string) {
  const [data, setData] = useState<PlacePhotoData | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !venueName || fetchedRef.current === venueName) return;
    fetchedRef.current = venueName;
    let cancelled = false;

    const params = new URLSearchParams({ q: venueName });
    if (area) params.set("area", area);
    fetch(`/api/place-photo?${params.toString()}`)
      .then(res => res.json())
      .then((json: PlacePhotoData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        // photo fetch failed — leave data as null
      });

    return () => { cancelled = true; };
  }, [venueName, enabled, area]);

  return { data };
}

// ============================================================
// 店舗情報カード（統合コンポーネント）
// ============================================================
const ALCOHOL_VENUE_TYPES = ["bar", "night_club", "liquor_store"];

function isAlcoholVenue(types: string[]): boolean {
  return types.some((t) => ALCOHOL_VENUE_TYPES.includes(t));
}

function VenueCard({
  venue,
  index,
  compact = false,
  area,
}: {
  venue: VenueFactData;
  index: number;
  compact?: boolean;
  area?: string;
}) {
  const gbpUrl = venue.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${venue.placeId}`;
  const showAgeBadge = isAlcoholVenue(venue.types);

  // 写真がない場合はクライアント側で取得を試みる
  const needsPhoto = !venue.photoUrl && venue.source === "google_places";
  const { data: lazyPhoto } = useVenuePhoto(
    needsPhoto ? venue.name : null,
    needsPhoto,
    area,
  );
  const photoUrl = venue.photoUrl || lazyPhoto?.photoUri || null;
  const photoAttribution = venue.photoHtmlAttribution
    || (lazyPhoto?.attribution && lazyPhoto?.attributionUri
      ? `<a href="${lazyPhoto.attributionUri}" target="_blank" rel="noopener noreferrer">${lazyPhoto.attribution}</a>`
      : lazyPhoto?.attribution)
    || null;

  return (
    <div className={`rounded-2xl border border-border bg-surface overflow-hidden ${compact ? "rounded-xl" : ""}`}>
      {/* Store Photo */}
      {photoUrl && (
        <a href={gbpUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={photoUrl}
              alt={`${venue.name} の写真`}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, 672px"
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
          {photoAttribution && (
            <p
              className="bg-black/60 px-3 py-1 text-[10px] text-white/80"
              dangerouslySetInnerHTML={{ __html: `Photo: ${photoAttribution}` }}
            />
          )}
        </a>
      )}

      {/* Age badge for venues without photo */}
      {!photoUrl && showAgeBadge && (
        <div className="bg-red-50 px-4 py-2 dark:bg-red-950">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">🔞 20歳以上対象</span>
        </div>
      )}

      <div className={compact ? "p-4" : "p-5"}>
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
          {venue.rating !== null && !photoUrl && (
            <div className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1">
              <span className="text-xs">⭐</span>
              <span className="text-sm font-semibold text-accent">
                {venue.rating}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {venue.googleMapsUrl && (
            <a
              href={venue.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
            >
              🗺️ 地図
            </a>
          )}
          {!compact && venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              予約・詳細を見る
            </a>
          )}
          {compact && venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
            >
              🌐 HP
            </a>
          )}
          {venue.phoneNumber && (
            <a
              href={`tel:${venue.phoneNumber}`}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
            >
              📞 {compact ? "電話" : "電話で予約"}
            </a>
          )}
        </div>

        {/* Google Maps Attribution */}
        {venue.source === "google_places" && (
          <p className="mt-3 text-[11px] text-muted">
            店舗情報提供: <span translate="no" className="font-normal" style={{ fontFamily: "Roboto, sans-serif" }}>Google Maps</span>
          </p>
        )}
        {venue.source === "fallback" && venue.name && (
          <div className="mt-2 flex gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + " " + venue.address.replace(/（.*$/, ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
            >
              Google Mapsで確認
            </a>
          </div>
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
// 未マッチ店舗のフォールバック表示
// ============================================================
function FallbackVenueCard({ venueName, index, area }: { venueName: string; index: number; area?: string }) {
  const { data } = useVenuePhoto(venueName, true, area);

  const photoUri = data?.photoUri || null;
  const attribution = data?.attribution || null;
  const attributionUri = data?.attributionUri || null;
  const googleMapsUri = data?.googleMapsUri || null;
  const mapEmbedUrl = data?.mapEmbedUrl || null;

  if (!photoUri && !mapEmbedUrl) return null;

  return (
    <>
      {photoUri && (
        <div className="mt-3 rounded-xl border border-border bg-surface overflow-hidden">
          <a href={googleMapsUri || "#"} target="_blank" rel="noopener noreferrer" className="block relative group">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={photoUri}
                alt={`${venueName} の写真`}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, 672px"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            </div>
            {attribution && (
              <p
                className="bg-black/60 px-3 py-1 text-[10px] text-white/80"
                dangerouslySetInnerHTML={{
                  __html: `Photo: ${attributionUri ? `<a href="${attributionUri}" target="_blank" rel="noopener noreferrer">${attribution}</a>` : attribution}`,
                }}
              />
            )}
          </a>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="font-semibold">{venueName}</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleMapsUri && (
                <a
                  href={googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-surface"
                >
                  🗺️ 地図
                </a>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted">
              店舗情報提供: <span translate="no" className="font-normal" style={{ fontFamily: "Roboto, sans-serif" }}>Google Maps</span>
            </p>
          </div>
        </div>
      )}

      {mapEmbedUrl && (
        <div className="mt-3">
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${venueName} - Google Maps`}
            />
          </div>
          {googleMapsUri && (
            <a
              href={googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-primary text-center hover:underline"
            >
              📍 Google Maps で詳細を見る
            </a>
          )}
        </div>
      )}
    </>
  );
}

// ============================================================
// 俯瞰マップ (Static Map API)
// ============================================================
function OverviewMap({ venues }: { venues: VenueFactData[] }) {
  const [mapError, setMapError] = useState(false);
  const validVenues = venues.filter(v => v.lat !== 0 && v.lng !== 0);
  if (validVenues.length === 0) return null;

  const allMarkersQuery = validVenues.map(v => `${v.lat},${v.lng}`).join("|");
  const overviewStaticUrl = `/api/static-map-overview?markers=${encodeURIComponent(allMarkersQuery)}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/${validVenues.map(v => `${v.lat},${v.lng}`).join("/")}`;

  return (
    <section className="mt-8 scroll-mt-28">
      <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
        🗺️ デートルート俯瞰マップ
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {mapError ? (
          <div className="flex flex-col items-center justify-center h-[300px] bg-surface text-center px-4">
            <p className="text-muted text-sm mb-3">地図を読み込めませんでした</p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              📍 Google Maps でルートを確認
            </a>
          </div>
        ) : (
          <div className="relative w-full h-[300px]">
            <Image
              src={overviewStaticUrl}
              alt="デートプラン全体の地図"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              onError={() => setMapError(true)}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {validVenues.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            {v.name}
          </span>
        ))}
      </div>
      {!mapError && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-sm text-primary hover:underline"
        >
          📍 Google Maps でルートを確認
        </a>
      )}
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
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const [planContext] = useState<{ occasion: string; mood: string; budget: string; city?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("futatabito-context");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });

  // メールが登録されていればプラン完成時にメール送信
  const emailSentRef = useRef(false);
  useEffect(() => {
    if (!plan || emailSentRef.current || isSharedView) return;
    const email = sessionStorage.getItem("futatabito-email");
    if (!email) return;
    emailSentRef.current = true;
    fetch("/api/send-plan-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem("futatabito-email");
      });
  }, [plan, isSharedView]);

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
    const timelineText = plan.timeline
      .filter(item => item.venue)
      .map(item => `${item.time} ${item.venue}`)
      .join(" → ");
    const text = `${plan.title}\n\n${timelineText}\n\nfutatabitoでデートプランを作成しました！`;
    const lineUrl = shareUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(lineUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl]);

  const handleSaveToHistory = useCallback(async () => {
    if (!plan || historySaved || historySaving) return;
    setHistorySaving(true);
    try {
      await fetch("/api/auth");
      const context = planContext || { occasion: "", mood: "", budget: "" };
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, context: { city: location || "tokyo", area: "", ...context } }),
      });
      if (res.ok) setHistorySaved(true);
    } catch {
      // silent fail
    } finally {
      setHistorySaving(false);
    }
  }, [plan, planContext, location, historySaved, historySaving]);

  const handleShareX = useCallback(() => {
    if (!plan) return;
    const cityId = planContext?.city || location || "";
    const cityData = getCityById(cityId);
    const cityName = cityData?.name || cityId;
    const text = cityName
      ? `ふたたびとで${cityName}のデートプランを作ったよ✨ #futatabito #デートプラン`
      : `ふたたびとでデートプランを作ったよ✨ #futatabito #デートプラン`;
    const xUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(xUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl, planContext, location]);

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">読み込み中...</p>
      </div>
    );
  }

  // Venue matching: timeline.venue -> VenueFactData (3段階マッチング)
  const tokenize = (s: string): string[] =>
    s.toLowerCase().split(/[\s\-・／/()（）,、。]+/).filter(t => t.length > 0);

  const findMatchingVenue = (venueName: string, positionIndex?: number): VenueFactData | null => {
    if (!plan?.venues || !venueName) return null;
    const lower = venueName.toLowerCase();

    // 1) includes チェック（完全一致含む）
    const includesMatch = plan.venues.find((v: VenueFactData) => {
      const vLower = v.name.toLowerCase();
      return vLower.includes(lower) || lower.includes(vLower);
    });
    if (includesMatch) return includesMatch;

    // 2) トークンマッチング: 共通ワード数 >= 2 かつ片方の50%以上
    const nameTokens = tokenize(venueName);
    const tokenMatch = plan.venues.find((v: VenueFactData) => {
      const vTokens = tokenize(v.name);
      const common = nameTokens.filter(t => vTokens.includes(t));
      return common.length >= 2 && (common.length / Math.min(nameTokens.length, vTokens.length)) >= 0.5;
    });
    if (tokenMatch) return tokenMatch;

    // 3) ポジションフォールバック: タイムラインでの出現順とvenues配列のindexで対応付け
    if (positionIndex !== undefined && positionIndex < plan.venues.length) {
      return plan.venues[positionIndex];
    }

    return null;
  };

  // 各タイムライン項目にvenueインデックスを割り当て
  const venueIndexMap = new Map<string, number>();
  let venueCounter = 0;
  for (const item of plan.timeline) {
    if (item.venue && !venueIndexMap.has(item.venue)) {
      venueIndexMap.set(item.venue, venueCounter++);
    }
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
          {(() => {
            const INITIAL_COUNT = 4;
            const hasMore = plan.timeline.length > INITIAL_COUNT;
            const visibleItems = timelineExpanded
              ? plan.timeline
              : plan.timeline.slice(0, INITIAL_COUNT);
            return (
              <>
                <div className="space-y-6">
                  {visibleItems.map((item, index) => {
                    const venueIdx = venueIndexMap.get(item.venue) ?? index;
                    const matchedVenue = findMatchingVenue(item.venue, venueIdx);
                    const isLastVisible = index === visibleItems.length - 1;
                    return (
                      <div key={index} className="relative">
                        {/* Timeline connector */}
                        {(!isLastVisible || (hasMore && !timelineExpanded)) && (
                          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex gap-4">
                          {/* Time badge */}
                          <div className="flex flex-col items-center">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                              {item.time.split(":")[0]}
                            </span>
                            <span className="text-xs text-muted mt-0.5">{item.time}</span>
                            {item.duration && (
                              <span className="text-xs text-muted/60 mt-0.5">{item.duration}</span>
                            )}
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

                            {/* Venue card (consolidated component) */}
                            {matchedVenue && (
                              <div className="mt-3">
                                <VenueCard venue={matchedVenue} index={venueIdx} compact area={location} />
                              </div>
                            )}

                            {/* Google Map 埋め込み */}
                            {matchedVenue && <VenueEmbed venue={matchedVenue} />}

                            {/* フォールバック: マッチしなかった場合にクライアント側で写真・マップ取得 */}
                            {!matchedVenue && item.venue && (
                              <FallbackVenueCard venueName={item.venue} index={venueIdx} area={location} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasMore && !timelineExpanded && (
                  <div className="relative mt-0">
                    {/* Gradient fade hint */}
                    <div className="pointer-events-none absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                    <button
                      onClick={() => setTimelineExpanded(true)}
                      className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
                    >
                      続きを見る（残り{plan.timeline.length - INITIAL_COUNT}件）
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-y-1"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {/* Overview Map - 全ヴェニュー俯瞰マップ */}
        {plan.venues && plan.venues.length > 0 && (
          <OverviewMap venues={plan.venues} />
        )}

        {/* Route Map Embed - 周辺マップ */}
        {plan.timeline && plan.timeline.length > 0 && (
          <Suspense fallback={null}>
          <RouteMapEmbed
            city={(() => {
              const cId = planContext?.city || location || "";
              const cData = getCityById(cId);
              return cData?.name || cId;
            })()}
            spots={plan.timeline
              .filter((item) => item.venue)
              .slice(0, 3)
              .map((item) => {
                const matched = findMatchingVenue(item.venue, venueIndexMap.get(item.venue) ?? 0);
                return {
                  name: item.venue,
                  address: matched?.address || undefined,
                };
              })}
          />
          </Suspense>
        )}

        {/* Product Recommendations - 文脈連動型商品レコメンド */}
        {planContext && !isSharedView && (
          <Suspense fallback={null}>
            <ProductRecommendation
              occasion={planContext.occasion}
              mood={planContext.mood}
              budget={planContext.budget}
            />
          </Suspense>
        )}

        {/* Reservation Affiliate - 予約アフィリエイトレコメンド */}
        {planContext && !isSharedView && (planContext.city || location) && (
          <Suspense fallback={null}>
            <ReservationAffiliate
              city={planContext.city || location}
              occasion={planContext.occasion}
              mood={planContext.mood}
            />
          </Suspense>
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
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {urlCopied ? "コピー済み ✓" : "URLをコピー"}
              </button>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center flex-wrap">
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
            <button
              onClick={() => window.print()}
              className="print-hidden flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              🖨️ プランを印刷
            </button>
          </div>
        </section>

        {/* Save to History */}
        {!isSharedView && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSaveToHistory}
              disabled={historySaved || historySaving}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                historySaved
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "border border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {historySaving ? "保存中..." : historySaved ? "履歴に保存しました ✓" : "📝 この履歴をマイページに保存"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/plan"
            className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark"
          >
            {isSharedView ? "自分のプランを作成" : "別のプランを作成"}
          </Link>
          <Link
            href="/mypage"
            className="rounded-full border border-border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-surface"
          >
            マイページ
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-surface"
          >
            トップに戻る
          </Link>
        </div>

        {/* Premium Banner — 共有ビューでは非表示 */}
        {!isSharedView && (
          <Suspense fallback={null}>
            <PremiumBanner />
          </Suspense>
        )}

      </main>
      <Footer />
    </div>
  );
}
