"use client";

import { useState } from "react";
import Image from "next/image";

interface SpotImageProps {
  spotName: string;
  area: string;
  genre: string;
  photoUrl?: string;
}

const genreIcons: Record<string, string> = {
  cafe: "☕",
  カフェ: "☕",
  restaurant: "🍽️",
  レストラン: "🍽️",
  イタリアン: "🍝",
  フレンチ: "🥐",
  和食: "🍣",
  中華: "🥟",
  焼肉: "🥩",
  ラーメン: "🍜",
  居酒屋: "🍶",
  バー: "🍸",
  bar: "🍸",
  park: "🌳",
  公園: "🌳",
  shrine: "⛩️",
  神社: "⛩️",
  寺: "🛕",
  temple: "🛕",
  museum: "🏛️",
  美術館: "🏛️",
  博物館: "🏛️",
  ショッピング: "🛍️",
  shopping: "🛍️",
  ホテル: "🏨",
  hotel: "🏨",
  パン: "🥖",
  スイーツ: "🍰",
  水族館: "🐠",
  動物園: "🦁",
  映画館: "🎬",
  温泉: "♨️",
  展望: "🌃",
};

function getGenreIcon(genre: string): string {
  const normalized = genre.toLowerCase();
  for (const [key, icon] of Object.entries(genreIcons)) {
    if (normalized.includes(key.toLowerCase())) return icon;
  }
  return "📍";
}

const gradients = [
  "from-rose-900/60 to-orange-900/40",
  "from-indigo-900/60 to-purple-900/40",
  "from-emerald-900/60 to-teal-900/40",
  "from-amber-900/60 to-red-900/40",
  "from-sky-900/60 to-blue-900/40",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function SpotImage({ spotName, genre, photoUrl }: SpotImageProps) {
  const [failed, setFailed] = useState(false);

  if (!photoUrl || failed) {
    const icon = getGenreIcon(genre);
    const gradient = getGradient(spotName);
    return (
      <div
        className={`w-full h-48 rounded-lg mb-4 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center`}
      >
        <span className="text-5xl mb-2">{icon}</span>
        <span className="text-sm text-white/60">{genre}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
      <Image
        src={photoUrl}
        alt={`${spotName}の写真`}
        className="object-cover"
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
