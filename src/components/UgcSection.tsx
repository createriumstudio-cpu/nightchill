"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface UgcPost {
  id: number;
  platform: string;
  postUrl: string;
  embedHtml: string | null;
  caption: string | null;
  featureSlug: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

function extractInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

function TweetEmbed({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tweetId = extractTweetId(postUrl);
    if (!tweetId || !containerRef.current) return;

    const renderTweet = () => {
      if (window.twttr?.widgets) {
        containerRef.current!.innerHTML = "";
        window.twttr.widgets
          .createTweet(tweetId, containerRef.current!, {
            theme: "dark",
            lang: "ja",
            dnt: true,
            align: "center",
          })
          .then((el: HTMLElement | undefined) => {
            if (el) {
              setLoaded(true);
            } else {
              setError(true);
            }
          })
          .catch(() => setError(true));
      }
    };

    if (window.twttr?.widgets) {
      renderTweet();
    } else {
      const checkInterval = setInterval(() => {
        if (window.twttr?.widgets) {
          clearInterval(checkInterval);
          renderTweet();
        }
      }, 500);
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!loaded) setError(true);
      }, 10000);
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [postUrl, loaded]);

  if (error) {
    return (
      <a href={postUrl} target="_blank" rel="noopener noreferrer"
        className="block p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center text-sm text-gray-400 hover:text-gray-200 transition-colors">
        投稿を見る →
      </a>
    );
  }

  return (
    <div className="min-h-[200px]">
      {!loaded && (
        <div className="flex items-center justify-center h-[200px] bg-gray-800/30 rounded-lg animate-pulse">
          <span className="text-gray-500 text-sm">読み込み中...</span>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

function InstagramEmbed({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const shortcode = extractInstagramId(postUrl);
    if (!shortcode) return;

    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    containerRef.current.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${postUrl}" data-instgrm-version="14"
        style="background:#000; border:0; border-radius:12px; max-width:540px; min-width:326px; padding:0; width:100%; margin: 0 auto;">
        <div style="padding:16px;">
          <a href="${postUrl}" target="_blank" rel="noopener noreferrer"
            style="color:#c9c8cd; font-size:14px; text-decoration:none;">
            Instagramで見る
          </a>
        </div>
      </blockquote>
    `;

    const tryProcess = () => {
      if (window.instgrm?.Embeds && containerRef.current) {
        window.instgrm.Embeds.process(containerRef.current);
        if (!cancelled) setLoaded(true);
        return true;
      }
      return false;
    };

    if (!tryProcess()) {
      pollInterval = setInterval(() => {
        if (cancelled) {
          clearInterval(pollInterval);
          return;
        }
        if (tryProcess()) {
          clearInterval(pollInterval);
        }
      }, 500);
      timeout = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (timeout) clearTimeout(timeout);
    };
  }, [postUrl]);

  return (
    <div className="min-h-[200px]">
      {!loaded && (
        <div className="flex items-center justify-center h-[200px] bg-gray-800/30 rounded-lg animate-pulse">
          <span className="text-gray-500 text-sm">読み込み中...</span>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

function TikTokEmbed({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const videoId = extractTikTokId(postUrl);
    if (!videoId) {
      const t = setTimeout(() => setHasError(true), 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;

    containerRef.current.innerHTML = `
      <blockquote class="tiktok-embed" cite="${postUrl}" data-video-id="${videoId}"
        style="max-width: 605px; min-width: 325px; margin: 0 auto;">
        <section>
          <a target="_blank" href="${postUrl}" rel="noopener noreferrer">TikTokで見る</a>
        </section>
      </blockquote>
    `;

    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      script.onload = () => { if (!cancelled) setLoaded(true); };
      script.onerror = () => { if (!cancelled) setHasError(true); };
      document.body.appendChild(script);
    }

    const timeout = setTimeout(() => {
      if (!cancelled) setLoaded(true);
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [postUrl]);

  if (hasError) {
    return (
      <a href={postUrl} target="_blank" rel="noopener noreferrer"
        className="block p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center text-sm text-gray-400 hover:text-gray-200 transition-colors">
        TikTokで見る →
      </a>
    );
  }

  return (
    <div className="min-h-[300px]">
      {!loaded && (
        <div className="flex items-center justify-center h-[300px] bg-gray-800/30 rounded-lg animate-pulse">
          <span className="text-gray-500 text-sm">読み込み中...</span>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

export default function UgcSection({ featureSlug }: { featureSlug: string }) {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ugc?featureSlug=${featureSlug}&status=approved`)
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [featureSlug]);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-white mb-4">
        📱 みんなの投稿
      </h2>

      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[200px] bg-gray-800/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id}>
              {(post.platform === "x" || post.platform === "twitter") ? (
                <TweetEmbed postUrl={post.postUrl} />
              ) : post.platform === "instagram" ? (
                <InstagramEmbed postUrl={post.postUrl} />
              ) : post.platform === "tiktok" ? (
                <TikTokEmbed postUrl={post.postUrl} />
              ) : (
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  投稿を見る →
                </a>
              )}
              {post.caption && (
                <p className="text-gray-500 text-xs mt-2 text-center">
                  {post.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          id: string,
          el: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | undefined>;
      };
    };
    instgrm?: {
      Embeds: {
        process: (container?: HTMLElement) => void;
      };
    };
  }
}
