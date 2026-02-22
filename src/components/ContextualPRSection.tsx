"use client";

import { useEffect, useState } from "react";
import SponsoredSpotCard from "./SponsoredSpotCard";

interface SponsoredSpot {
  id: number;
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  category: string;
  labelJa?: string | null;
  labelEn?: string | null;
}

interface Props {
  area: string;
  locale?: "ja" | "en";
}

export default function ContextualPRSection({ area, locale = "ja" }: Props) {
  const [spots, setSpots] = useState<SponsoredSpot[]>([]);

  useEffect(() => {
    fetch(`/api/sponsored?area=${encodeURIComponent(area)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSpots(data.slice(0, 2));
        }
      })
      .catch(() => {});
  }, [area]);

  if (spots.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <div className="grid gap-4 md:grid-cols-2">
        {spots.map((spot) => (
          <SponsoredSpotCard key={spot.id} spot={spot} locale={locale} />
        ))}
      </div>
    </section>
  );
}
