"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { UGCPost } from "@/lib/ugc-data";

/**
 * X (Twitter) 埋め込みウィジェットの読み込み
 * 公式の widgets.js を使用して合法的に埋め込み
 */
function loadTwitterWidgets(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as Record<string, unknown>).twttr) {
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

/**
 * Instagram 埋め込みウィジェットの読み込み
 * 公式の embed.js を使用
 */
function loadInstagramEmbed(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as Record<string, unknown>).instgrm) {
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

interface SocialEmbedCardProps {
  post: UGCPost;
}

/**
 * 単一のSNS投稿埋め込みカード
 * プラットフォームの公式埋め込み機能を使用
 */
function SocialEmbedCard({ post }: SocialEmbedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const embed = async () => {
      if (!containerRef.current) return;

      try {
        if (post.platform === "x") {
          await loadTwitterWidgets();
          const twttr = (window as Record<string, unknown>).twttr as {
            widgets: { createTweet: (id: string, el: HTMLElement, opts: Record<string, unknown>) => Promise<unknown> };
          } | undefined;
          if (twttr?.widgets) {
            const tweetId = post.embedUrl.split("/status/")[1]?.split("?")[0];
            if (tweetId && tweetId !== "example1" && tweetId !== "example3" && tweetId !== "example5") {
              containerRef.current.innerHTML = "";
              await twttr.widgets.createTweet(tweetId, containerRef.current, {
                theme: "dark",
                lang: "ja",
                dnt: true,
              });
              setLoaded(true);
            } else {
              setError(true);
            }
          }
        } else if (post.platform === "instagram") {
          await loadInstagramEmbed();
          const instgrm = (window as Record<string, unknown>).instgrm as {
            Embeds: { process: () => void };
          } | undefined;
          if (instgrm?.Embeds) {
            instgrm.Embeds.process();
            setLoaded(true);
          } else {
            setError(true);
          }
        }
      } catch {
        setError(true);
      }
    };

    embed();
  }, [post]);

  // フォールバック: 埋め込みが読み込めない場合のプレースホルダー
  if (error || !loaded) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3">
          <span className="mt-1 text-lg">
            {post.platform === "x" ? "𝕏" : "📸"}
          </span>
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-muted">
              {post.summary}
            </p>
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
            <a
              href={post.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-primary hover:underline"
            >
              {post.platform === "x" ? "Xで見る →" : "Instagramで見る →"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-border bg-surface overflow-hidden"
    />
  );
}

interface SocialEmbedSectionProps {
  posts: UGCPost[];
  title?: string;
  subtitle?: string;
}

/**
 * SNS投稿埋め込みセクション
 * 複数の投稿をグリッド表示
 */
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
          <div key={post.id} className="min-w-[300px] max-w-[350px] snap-start flex-shrink-0">
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
