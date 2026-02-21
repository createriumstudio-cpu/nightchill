"use client";

import { useEffect, useState, useRef, useCallback } from "react";

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

// Extract tweet ID from X/Twitter URLs
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
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

    // Load Twitter widgets.js if not already loaded
    if (!window.twttr) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = () => {
        renderTweet();
      };
      document.head.appendChild(script);
    } else {
      renderTweet();
    }
  }, [postUrl]);

  if (error) {
    return (
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        ポストを表示する →
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

// Instagram embed component
function InstagramEmbed({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use Instagram oEmbed blockquote approach
    containerRef.current.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${postUrl}" 
        style="background:#000; border:0; border-radius:8px; max-width:540px; min-width:326px; width:100%; margin:0 auto;">
      </blockquote>
    `;

    // Load Instagram embed.js if not already loaded
    if (!window.instgrm) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.head.appendChild(script);
    } else {
      window.instgrm.Embeds.process();
    }
  }, [postUrl]);

  return <div ref={containerRef} className="min-h-[200px]" />;
}

export default function UgcSection({ featureSlug }: { featureSlug: string }) {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/ugc?featureSlug=${encodeURIComponent(featureSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // Silently fail - UGC is non-critical
    } finally {
      setLoading(false);
    }
  }, [featureSlug]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Don't render section if no posts
  if (!loading && posts.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 pb-12">
      <h2 className="text-xl font-bold mb-2">みんなの投稿</h2>
      <p className="text-gray-400 text-sm mb-6">
        このエリアに関連するSNS投稿をピックアップしました
      </p>

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
              {post.platform === "x" || post.platform === "twitter" ? (
                <TweetEmbed postUrl={post.postUrl} />
              ) : post.platform === "instagram" ? (
                <InstagramEmbed postUrl={post.postUrl} />
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

// Extend Window for Twitter/Instagram widget types
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
        process: () => void;
      };
    };
  }
}
