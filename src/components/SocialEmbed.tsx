"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { UGCPost } from "@/lib/ugc-data";

function loadTwitterWidgets(): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).twttr) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function ensureInstagramScript(): void {
  if (document.querySelector('script[src*="instagram.com/embed.js"]')) return;
  const script = document.createElement("script");
  script.src = "https://www.instagram.com/embed.js";
  script.async = true;
  document.head.appendChild(script);
}

function isExampleUrl(url: string): boolean {
  return /example\d/.test(url);
}

interface SocialEmbedCardProps {
  post: UGCPost;
}

function SocialEmbedCard({ post }: SocialEmbedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isExample = isExampleUrl(post.embedUrl);

  useEffect(() => {
    if (isExample) return;
    let cancelled = false;
    const embed = async () => {
      if (!containerRef.current) return;
      try {
        if (post.platform === "x") {
          await loadTwitterWidgets();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const twttr = (window as any).twttr as
            | {
                widgets: {
                  createTweet: (
                    id: string,
                    el: HTMLElement,
                    opts: Record<string, unknown>,
                  ) => Promise<unknown>;
                };
              }
            | undefined;
          if (twttr?.widgets) {
            const tweetId = post.embedUrl.split("/status/")[1]?.split("?")[0];
            if (tweetId) {
              containerRef.current.innerHTML = "";
              await twttr.widgets.createTweet(tweetId, containerRef.current, {
                theme: "dark",
                lang: "ja",
                dnt: true,
              });
              if (!cancelled) setLoaded(true);
            } else {
              if (!cancelled) setError(true);
            }
          }
        } else if (post.platform === "instagram") {
          ensureInstagramScript();
          if (containerRef.current) {
            const permalink = post.embedUrl;
            containerRef.current.innerHTML =
              '<blockquote class="instagram-media"' +
              ' data-instgrm-captioned' +
              ' data-instgrm-permalink="' + permalink + '"' +
              ' data-instgrm-version="14"' +
              ' style="max-width:540px;width:100%;"><a href="' +
              permalink + '">Instagram投稿を表示</a></blockquote>';
          }

          let processed = false;
          const tryProcess = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const instgrm = (window as any).instgrm as
              | { Embeds: { process: (container?: HTMLElement) => void } }
              | undefined;
            if (instgrm?.Embeds && containerRef.current) {
              instgrm.Embeds.process(containerRef.current);
              processed = true;
              if (!cancelled) setLoaded(true);
              return true;
            }
            return false;
          };

          if (!tryProcess()) {
            const pollInterval = setInterval(() => {
              if (cancelled) {
                clearInterval(pollInterval);
                return;
              }
              if (tryProcess()) {
                clearInterval(pollInterval);
              }
            }, 500);
            setTimeout(() => {
              clearInterval(pollInterval);
              if (!cancelled && !processed) setError(true);
            }, 10000);
          }
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    embed();
    return () => {
      cancelled = true;
    };
  }, [post, isExample]);

  const fallback = (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-lg">
          {post.platform === "x" ? "𝕏" : "📸"}
        </span>
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-muted">{post.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
          {!isExample && (
            <a
              href={post.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-primary hover:underline"
            >
              {post.platform === "x" ? "Xで見る →" : "Instagramで見る →"}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (isExample || error) return fallback;

  return (
    <>
      <div
        ref={containerRef}
        className="rounded-2xl border border-border bg-surface overflow-hidden"
        style={{ display: loaded ? "block" : "none" }}
      />
      {!loaded && fallback}
    </>
  );
}

interface SocialEmbedSectionProps {
  posts: UGCPost[];
  title?: string;
  subtitle?: string;
}

export default function SocialEmbedSection({
  posts,
  title = "みんなのデート体験",
  subtitle = "SNSで話題のデートスポット・体験をチェック",
}: SocialEmbedSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface"
            aria-label="前へスクロール"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface"
            aria-label="次へスクロール"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="min-w-[300px] max-w-[350px] snap-start flex-shrink-0"
          >
            <SocialEmbedCard post={post} />
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        ※ 各投稿はプラットフォームの公式埋め込み機能を使用しています
      </p>
    </section>
  );
}
