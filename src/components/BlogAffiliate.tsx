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
  tags: string[];
  category: string;
  /** 都市ID（例: "tokyo"）。未指定時は "tokyo" をデフォルト使用 */
  city?: string;
}

function inferOccasion(tags: string[]): string {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes("anniversary") || t.includes("記念日")) return "anniversary";
    if (t.includes("proposal") || t.includes("プロポーズ")) return "proposal";
    if (t.includes("first-date") || t.includes("初デート")) return "first-date";
  }
  return "anniversary";
}

function inferMood(tags: string[]): string {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes("luxury") || t.includes("高級")) return "romantic";
    if (t.includes("casual") || t.includes("カジュアル")) return "casual";
  }
  return "romantic";
}

export default function BlogAffiliate({ tags, category, city = "tokyo" }: Props) {
  const [venues, setVenues] = useState<AffiliateVenueData[]>([]);

  useEffect(() => {
    const occasion = inferOccasion(tags);
    const mood = inferMood(tags);
    const params = new URLSearchParams({
      city,
      occasion,
      mood,
      limit: "2",
    });
    fetch(`/api/affiliate-venues?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVenues(data);
        }
      })
      .catch(() => {});
  }, [tags, category, city]);

  if (venues.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/30 p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        この記事に関連するおすすめのお店
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="group flex flex-col rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden transition-all hover:border-amber-500/50 hover:bg-gray-900/80"
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
              <p className="text-xs text-amber-400/80 mb-1">
                {venue.relevanceReason}
              </p>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                {venue.name}
              </h4>
              {venue.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {venue.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{venue.area}</span>
                {venue.priceRange && (
                  <span className="text-xs text-amber-400/70">
                    {venue.priceRange}
                  </span>
                )}
              </div>
              <a
                href={venue.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-amber-400"
                onClick={() =>
                  trackAffiliateClick(
                    venue.name,
                    venue.affiliateUrl,
                    "blog_affiliate"
                  )
                }
              >
                {getProviderLabel(venue.affiliateProvider)}
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-gray-600 text-center">
        PR: 提携店舗のご紹介です
      </p>
    </section>
  );
}
