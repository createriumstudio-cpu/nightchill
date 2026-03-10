"use client";

interface RouteMapEmbedProps {
  spots: Array<{ name: string; address?: string }>;
  city: string;
}

export default function RouteMapEmbed({ spots, city }: RouteMapEmbedProps) {
  if (!spots || spots.length === 0) return null;

  const firstSpot = spots[0];
  const query = firstSpot.address
    ? `${firstSpot.name} ${firstSpot.address}`
    : `${firstSpot.name} ${city}`;

  const encodedQuery = encodeURIComponent(query);
  const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&output=embed`;
  const mapsUrl = `https://maps.google.com/maps?q=${encodedQuery}`;

  return (
    <section className="mt-8 scroll-mt-28">
      <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
        📍 周辺マップ
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        <iframe
          src={embedUrl}
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${firstSpot.name} - Google Maps`}
        />
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-sm text-primary hover:underline"
      >
        Google マップで開く
      </a>
    </section>
  );
}
