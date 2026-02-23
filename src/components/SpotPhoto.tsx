"use client";

import { useState, useEffect } from "react";

interface SpotPhotoProps {
  spotName: string;
  area: string;
}

export function SpotPhoto({ spotName, area }: SpotPhotoProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = encodeURIComponent(`${spotName} ${area}`);
    fetch(`/api/place-photo?q=${query}`)
      .then((r) => r.json())
      .then((data) => {
        setPhotoUri(data.photoUri ?? null);
        setAttribution(data.attribution ?? null);
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
    return null; // Graceful fallback - don't show anything if no photo
  }

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUri}
        alt={`${spotName}の写真`}
        className="w-full h-full object-cover"
      />
      {attribution && (
        <div className="absolute bottom-1 right-2 text-xs text-white/70 bg-black/30 px-1 rounded">
          📷 {attribution} · <span translate="no">Google マップ</span>
        </div>
      )}
    </div>
  );
}
