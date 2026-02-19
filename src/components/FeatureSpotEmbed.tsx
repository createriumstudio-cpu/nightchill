"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotEmbed } from "@/lib/features";

function loadInstagramEmbed(): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).instgrm) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function loadTikTokEmbed(): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).tiktokEmbed) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).tiktokEmbed = true;
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export default function FeatureSpotEmbed({ embed }: { embed: SpotEmbed }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (embed.platform === "instagram") {
          await loadInstagramEmbed();
          if (cancelled) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const instgrm = (window as any).instgrm;
          if (instgrm?.Embeds?.process) {
            instgrm.Embeds.process();
          }
        } else if (embed.platform === "tiktok") {
          await loadTikTokEmbed();
        }

        if (!cancelled) setLoaded(true);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [embed.platform, embed.url]);

  if (error) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {embed.platform === "instagram" ? "📸" : "🎵"}
          </span>
          <div>
            <div className="text-sm font-medium text-gray-200">
              {embed.caption}
            </div>
            <div className="text-xs text-gray-500">
              {embed.platform === "instagram" ? "Instagram" : "TikTok"}
              で見る →
            </div>
          </div>
        </div>
      </a>
    );
  }

  if (embed.platform === "instagram") {
    return (
      <div ref={containerRef} className="max-w-[540px] mx-auto">
        {!loaded && (
          <div className="bg-gray-800 rounded-xl p-8 text-center animate-pulse">
            <span className="text-2xl">📸</span>
            <p className="text-sm text-gray-500 mt-2">Instagram 読み込み中...</p>
          </div>
        )}
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={embed.url}
          style={{
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "12px",
            margin: "0 auto",
            maxWidth: "540px",
            width: "100%",
          }}
        >
          <a href={embed.url} target="_blank" rel="noopener noreferrer">
            {embed.caption}
          </a>
        </blockquote>
      </div>
    );
  }

  // TikTok embed
  const tiktokVideoId = embed.url.match(/video\/(\d+)/)?.[1] || "";

  return (
    <div className="max-w-[340px] mx-auto">
      {!loaded && (
        <div className="bg-gray-800 rounded-xl p-8 text-center animate-pulse">
          <span className="text-2xl">🎵</span>
          <p className="text-sm text-gray-500 mt-2">TikTok 読み込み中...</p>
        </div>
      )}
      {tiktokVideoId ? (
        <blockquote
          className="tiktok-embed"
          cite={embed.url}
          data-video-id={tiktokVideoId}
          style={{ maxWidth: "340px" }}
        >
          <a href={embed.url} target="_blank" rel="noopener noreferrer">
            {embed.caption}
          </a>
        </blockquote>
      ) : (
        <a
          href={embed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors text-center"
        >
          <span className="text-2xl">🎵</span>
          <p className="text-sm text-gray-300 mt-2">{embed.caption}</p>
          <p className="text-xs text-gray-500 mt-1">TikTokで見る →</p>
        </a>
      )}
    </div>
  );
}
