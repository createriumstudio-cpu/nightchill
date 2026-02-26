"use client";

import { useEffect, useState } from "react";

interface SpotPhotoProps {
  spotName: string;
  area: string;
}

export function SpotPhoto({ spotName, area }: SpotPhotoProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [attributionUri, setAttributionUri] = useState<string | null>(null);
  const [googleMapsUri, setGoogleMapsUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = encodeURIComponent(`${spotName} ${area}`);
    fetch(`/api/place-photo?v=2&q=${query}`)
      .then((r) => r.json())
      .then((data) => {
        setPhotoUri(data.photoUri ?? null);
        setAttribution(data.attribution ?? null);
        setAttributionUri(data.attributionUri ?? null);
        setGoogleMapsUri(data.googleMapsUri ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spotName, area]);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">写真を読み込み中...</span>
      </div>
    );
  }

  if (error || !photoUri) {
    return null; // Graceful fallback – don't show anything if no photo
  }

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUri}
        alt={`${spotName}の写真`}
        className="w-full h-full object-cover"
      />
      {/* Attribution overlay – compliant with Google Maps Platform policies */}
      <div className="absolute bottom-1 right-2 text-xs text-white/70 bg-black/30 px-1 rounded">
        {attribution && attributionUri ? (
          <>
            📷{" "}
            <a
              href={attributionUri}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              {attribution}
            </a>
            {" · "}
          </>
        ) : attribution ? (
          <>📷 {attribution} · </>
        ) : null}
        {googleMapsUri ? (
          <a
            href={googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            <span translate="no">Google Maps</span>
          </a>
        ) : (
          <span translate="no">Google Maps</span>
        )}
      </div>
    </div>
  );
}
