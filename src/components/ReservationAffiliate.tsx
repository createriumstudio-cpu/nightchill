"use client";

import { useEffect, useState } from "react";
import { getProviderLabel } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/gtag";

interface AffiliateVenueData {
  id: number;
  name: string;
  description: string | null;
  category: string;
  area: string;
  city: string;
  imageUrl: string | null;
  priceRange: string | null;
  affiliateUrl: string;
  affiliateProvider: string;
  relevanceReason: string;
}

interface Props {
  city: string;
  occasion: string;
  mood: string;
}

/**
 * デートプラン結果画面に表示する予約アフィリエイトレコメンド
 *
 * 原則: バナー広告ではなく、文脈に合致した自然なレコメンドのみ表示。
 * 店舗がマッチしない場合はセクション自体を非表示にする。
 */
export default function ReservationAffiliate({ city, occasion, mood }: Props) {
  const [venues, setVenues] = useState<AffiliateVenueData[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ city, occasion, mood, limit: "2" });
    fetch(`/api/affiliate-venues?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVenues(data);
        }
      })
      .catch(() => {});
  }, [city, occasion, mood]);

  if (venues.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6">
      <h3 className="text-sm font-medium text-muted mb-4">
        このデートにおすすめのお店
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="group flex flex-col rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-accent/50 hover:shadow-md"
          >
            {venue.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venue.imageUrl}
                alt={venue.name}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="flex-1 p-4">
              <p className="text-xs text-accent mb-1">
                {venue.relevanceReason}
              </p>
              <h4 className="text-sm font-bold group-hover:text-accent transition-colors">
                {venue.name}
              </h4>
              {venue.description && (
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {venue.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted">{venue.area}</span>
                {venue.priceRange && (
                  <span className="text-xs text-accent/80">
                    {venue.priceRange}
                  </span>
                )}
              </div>
              <a
                href={venue.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-all hover:opacity-90"
                onClick={() =>
                  trackAffiliateClick(
                    venue.name,
                    venue.affiliateUrl,
                    "reservation_affiliate"
                  )
                }
              >
                {getProviderLabel(venue.affiliateProvider)}
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-muted text-center">
        PR: 提携店舗のご紹介です
      </p>
    </section>
  );
}
