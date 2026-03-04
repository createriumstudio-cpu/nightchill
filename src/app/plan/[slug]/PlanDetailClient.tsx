"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { type DatePlan } from "@/lib/types";
import type { VenueFactData } from "@/lib/google-places";

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

function useVenuePhoto(venueName: string | null, enabled: boolean) {
  const [data, setData] = useState<PlacePhotoData | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !venueName || fetchedRef.current === venueName) return;
    fetchedRef.current = venueName;
    let cancelled = false;

    fetch(`/api/place-photo?q=${encodeURIComponent(venueName)}`)
      .then((res) => res.json())
      .then((json: PlacePhotoData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [venueName, enabled]);

  return { data };
}

// ============================================================
// 店舗情報カード
// ============================================================
const ALCOHOL_VENUE_TYPES = ["bar", "night_club", "liquor_store"];

function isAlcoholVenue(types: string[]): boolean {
  return types.some((t) => ALCOHOL_VENUE_TYPES.includes(t));
}

function VenueCard({
  venue,
  index,
  compact = false,
}: {
  venue: VenueFactData;
  index: number;
  compact?: boolean;
}) {
  const gbpUrl =
    venue.googleMapsUrl ||
    `https://www.google.com/maps/place/?q=place_id:${venue.placeId}`;
  const showAgeBadge = isAlcoholVenue(venue.types);

  const needsPhoto = !venue.photoUrl && venue.source === "google_places";
  const { data: lazyPhoto } = useVenuePhoto(
    needsPhoto ? venue.name : null,
    needsPhoto,
  );
  const photoUrl = venue.photoUrl || lazyPhoto?.photoUri || null;
  const photoAttribution =
    venue.photoHtmlAttribution ||
    (lazyPhoto?.attribution && lazyPhoto?.attributionUri
      ? `<a href="${lazyPhoto.attributionUri}" target="_blank" rel="noopener noreferrer">${lazyPhoto.attribution}</a>`
      : lazyPhoto?.attribution) ||
    null;

  return (
    <div
      className={`rounded-2xl border border-border bg-surface overflow-hidden ${compact ? "rounded-xl" : ""}`}
    >
      {photoUrl && (
        <a
          href={gbpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative group"
        >
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
                <span className="text-xs font-bold text-white">
                  🔞 20歳以上対象
                </span>
              </div>
            )}
          </div>
          {photoAttribution && (
            <p
              className="bg-black/60 px-3 py-1 text-[10px] text-white/80"
              dangerouslySetInnerHTML={{
                __html: `Photo: ${photoAttribution}`,
              }}
            />
          )}
        </a>
      )}

      {!photoUrl && showAgeBadge && (
        <div className="bg-red-50 px-4 py-2 dark:bg-red-950">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">
            🔞 20歳以上対象
          </span>
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
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-950">
              <span className="text-xs">⭐</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {venue.rating}
              </span>
            </div>
          )}
        </div>

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
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
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

        {venue.source === "google_places" && (
          <p className="mt-3 text-[11px] text-muted">
            店舗情報提供:{" "}
            <span
              translate="no"
              className="font-normal"
              style={{ fontFamily: "Roboto, sans-serif" }}
            >
              Google Maps
            </span>
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
// Google Business Profile 埋め込み
// ============================================================
function VenueEmbed({ venue }: { venue: VenueFactData }) {
  const embedUrl = venue.mapEmbedUrl;
  const gbpUrl =
    venue.googleMapsUrl ||
    `https://www.google.com/maps/place/?q=place_id:${venue.placeId}`;

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
function FallbackVenueCard({
  venueName,
  index,
}: {
  venueName: string;
  index: number;
}) {
  const { data } = useVenuePhoto(venueName, true);

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
          <a
            href={googleMapsUri || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative group"
          >
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
              店舗情報提供:{" "}
              <span
                translate="no"
                className="font-normal"
                style={{ fontFamily: "Roboto, sans-serif" }}
              >
                Google Maps
              </span>
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
// 俯瞰マップ
// ============================================================
function OverviewMap({ venues }: { venues: VenueFactData[] }) {
  const [mapError, setMapError] = useState(false);
  const validVenues = venues.filter((v) => v.lat !== 0 && v.lng !== 0);
  if (validVenues.length === 0) return null;

  const allMarkersQuery = validVenues
    .map((v) => `${v.lat},${v.lng}`)
    .join("|");
  const overviewStaticUrl = `/api/static-map-overview?markers=${encodeURIComponent(allMarkersQuery)}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/${validVenues.map((v) => `${v.lat},${v.lng}`).join("/")}`;

  return (
    <section className="mt-8 scroll-mt-28">
      <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
        🗺️ デートルート俯瞰マップ
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {mapError ? (
          <div className="flex flex-col items-center justify-center h-[300px] bg-surface text-center px-4">
            <p className="text-muted text-sm mb-3">
              地図を読み込めませんでした
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs text-muted"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
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
// SVG アイコン
// ============================================================
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ============================================================
// トースト通知コンポーネント
// ============================================================
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-toast-in">
      <div className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg">
        <CheckIcon className="h-4 w-4" />
        {message}
      </div>
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function PlanDetailClient({
  plan,
  slug,
}: {
  plan: DatePlan;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/plan/${slug}` : "";
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }, []);

  const handleCopyText = useCallback(async () => {
    await copyToClipboard(planToText(plan));
    setCopied(true);
    showToast("プランをコピーしました");
    setTimeout(() => setCopied(false), 2500);
  }, [plan, copyToClipboard, showToast]);

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
    setUrlCopied(true);
    showToast("URLをコピーしました");
    setTimeout(() => setUrlCopied(false), 2500);
  }, [shareUrl, copyToClipboard, showToast]);

  const handleShareLine = useCallback(() => {
    const timelineText = plan.timeline
      .filter((item) => item.venue)
      .map((item) => `${item.time} ${item.venue}`)
      .join(" → ");
    const text = `${plan.title}\n\n${timelineText}\n\nfutatabitoでデートプランを作成しました！`;
    const lineUrl =
      shareUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(lineUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl]);

  const handleShareX = useCallback(() => {
    const text = `${plan.title}\n\nデートプランを作ってみた！\n#futatabito #デートプラン`;
    const xUrl =
      shareUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(xUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plan, shareUrl]);

  const handleShareFacebook = useCallback(() => {
    const fbUrl =
      shareUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    const timelineText = plan.timeline
      .filter((item) => item.venue)
      .map((item) => `${item.time} ${item.venue}`)
      .join(" → ");
    try {
      await navigator.share({
        title: plan.title,
        text: `${plan.title}\n${timelineText}`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share failed — silently ignore
    }
  }, [plan, shareUrl]);

  // Venue matching: timeline.venue -> VenueFactData (3段階マッチング)
  const tokenize = (s: string): string[] =>
    s
      .toLowerCase()
      .split(/[\s\-・／/()（）,、。]+/)
      .filter((t) => t.length > 0);

  const findMatchingVenue = (
    venueName: string,
    positionIndex?: number,
  ): VenueFactData | null => {
    if (!plan?.venues || !venueName) return null;
    const lower = venueName.toLowerCase();

    const includesMatch = plan.venues.find((v: VenueFactData) => {
      const vLower = v.name.toLowerCase();
      return vLower.includes(lower) || lower.includes(vLower);
    });
    if (includesMatch) return includesMatch;

    const nameTokens = tokenize(venueName);
    const tokenMatch = plan.venues.find((v: VenueFactData) => {
      const vTokens = tokenize(v.name);
      const common = nameTokens.filter((t) => vTokens.includes(t));
      return (
        common.length >= 2 &&
        common.length / Math.min(nameTokens.length, vTokens.length) >= 0.5
      );
    });
    if (tokenMatch) return tokenMatch;

    if (positionIndex !== undefined && positionIndex < plan.venues.length) {
      return plan.venues[positionIndex];
    }

    return null;
  };

  const venueIndexMap = new Map<string, number>();
  let venueCounter = 0;
  for (const item of plan.timeline) {
    if (item.venue && !venueIndexMap.has(item.venue)) {
      venueIndexMap.set(item.venue, venueCounter++);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-28 pb-16">
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
                      {(!isLastVisible ||
                        (hasMore && !timelineExpanded)) && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                            {item.time.split(":")[0]}
                          </span>
                          <span className="text-xs text-muted mt-0.5">
                            {item.time}
                          </span>
                          {item.duration && (
                            <span className="text-xs text-muted/60 mt-0.5">
                              {item.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-bold text-base">
                            {item.activity}
                          </h3>
                          {item.venue && (
                            <p className="text-sm text-primary font-medium mt-0.5">
                              {matchedVenue?.googleMapsUrl ? (
                                <a
                                  href={matchedVenue.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  📍 {item.venue}
                                </a>
                              ) : (
                                <>📍 {item.venue}</>
                              )}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-muted mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.tip && (
                            <p className="text-xs italic text-muted/70 mt-1">
                              💡 {item.tip}
                            </p>
                          )}

                          {matchedVenue && (
                            <div className="mt-3">
                              <VenueCard
                                venue={matchedVenue}
                                index={venueIdx}
                                compact
                              />
                            </div>
                          )}
                          {matchedVenue && <VenueEmbed venue={matchedVenue} />}
                          {!matchedVenue && item.venue && (
                            <FallbackVenueCard
                              venueName={item.venue}
                              index={venueIdx}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMore && !timelineExpanded && (
                <button
                  onClick={() => setTimelineExpanded(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  続きを見る（残り{plan.timeline.length - INITIAL_COUNT}件）
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </>
          );
        })()}
      </section>

      {/* Overview Map */}
      {plan.venues && plan.venues.length > 0 && (
        <OverviewMap venues={plan.venues} />
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
            <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 truncate bg-transparent text-xs text-muted outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyUrl}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-dark hover:shadow-md active:scale-95"
            >
              {urlCopied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" />
                  コピー済み
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" />
                  URLをコピー
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleCopyText}
            className="group flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md active:scale-95"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CopyIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            )}
            {copied ? "コピーしました！" : "テキストをコピー"}
          </button>
          <button
            onClick={handleShareLine}
            className="group flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#05b34c] hover:shadow-md hover:shadow-[#06C755]/25 active:scale-95"
          >
            <LineIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            LINE
          </button>
          <button
            onClick={handleShareX}
            className="group flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all duration-200 hover:opacity-90 hover:shadow-md hover:shadow-foreground/25 active:scale-95"
          >
            <XIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            X
          </button>
          <button
            onClick={handleShareFacebook}
            className="group flex items-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#166fe5] hover:shadow-md hover:shadow-[#1877F2]/25 active:scale-95"
          >
            <FacebookIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Facebook
          </button>
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="group flex items-center gap-2 rounded-full border border-primary bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10 hover:shadow-md active:scale-95 sm:hidden"
            >
              <ShareIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              その他で共有
            </button>
          )}
        </div>
      </section>

      {/* Toast notification */}
      <Toast message={toastMessage} visible={toastVisible} />

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
  );
}
