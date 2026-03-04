"use client";

import { useState, useCallback } from "react";
import type {
  SnsPlatform,
  SnsContentJson,
  InstagramContent,
  XContent,
  TikTokContent,
} from "@/lib/schema";

interface SnsContentGeneratorProps {
  slug: string;
}

const PLATFORM_LABELS: Record<SnsPlatform, { label: string; icon: string }> = {
  instagram: { label: "Instagram", icon: "📸" },
  x: { label: "X (Twitter)", icon: "𝕏" },
  tiktok: { label: "TikTok", icon: "🎵" },
};

const PLATFORMS: SnsPlatform[] = ["instagram", "x", "tiktok"];

export default function SnsContentGenerator({ slug }: SnsContentGeneratorProps) {
  const [contents, setContents] = useState<Record<SnsPlatform, SnsContentJson | null>>({
    instagram: null,
    x: null,
    tiktok: null,
  });
  const [activePlatform, setActivePlatform] = useState<SnsPlatform>("instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // 保存済みコンテンツを読み込み
  const loadExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/sns/${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const hasContent = Object.values(json.data).some((v: unknown) => v !== null);
        if (hasContent) {
          setContents(json.data);
          setGenerated(true);
        }
      }
    } catch {
      // 既存データなし — 無視
    }
  }, [slug]);

  // 生成ボタン押下
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    // まず既存データをチェック
    if (!generated) {
      await loadExisting();
    }

    try {
      const res = await fetch("/api/sns/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "生成に失敗しました");
      }

      const json = await res.json();
      if (json.success && json.data) {
        setContents(json.data);
        setGenerated(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // コピー
  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // コンテンツ表示
  const renderContent = () => {
    const content = contents[activePlatform];
    if (!content) return null;

    switch (activePlatform) {
      case "instagram":
        return <InstagramPreview content={content as InstagramContent} onCopy={handleCopy} copiedIndex={copiedIndex} />;
      case "x":
        return <XPreview content={content as XContent} onCopy={handleCopy} copiedIndex={copiedIndex} />;
      case "tiktok":
        return <TikTokPreview content={content as TikTokContent} onCopy={handleCopy} copiedIndex={copiedIndex} />;
    }
  };

  return (
    <div className="mt-12 bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h3 className="text-lg font-bold text-white mb-2">SNS投稿テキストを生成</h3>
      <p className="text-sm text-gray-400 mb-4">
        この特集記事をSNS投稿用テキストに変換します。生成されたテキストをコピーしてご利用ください。
      </p>

      {!generated ? (
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c9a96e] to-red-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                生成中...
              </>
            ) : (
              "SNS投稿を生成"
            )}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <>
          {/* Platform tabs */}
          <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activePlatform === p
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <span>{PLATFORM_LABELS[p].icon}</span>
                <span>{PLATFORM_LABELS[p].label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {renderContent()}

          {/* Regenerate */}
          <div className="mt-4 text-center">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              {loading ? "再生成中..." : "再生成する"}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Platform Preview Components
// ============================================================

function CopyButton({
  text,
  copyKey,
  onCopy,
  copiedIndex,
}: {
  text: string;
  copyKey: string;
  onCopy: (text: string, key: string) => void;
  copiedIndex: string | null;
}) {
  const isCopied = copiedIndex === copyKey;
  return (
    <button
      onClick={() => onCopy(text, copyKey)}
      className="text-xs text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1"
    >
      {isCopied ? "✓ コピー済み" : "📋 コピー"}
    </button>
  );
}

function InstagramPreview({
  content,
  onCopy,
  copiedIndex,
}: {
  content: InstagramContent;
  onCopy: (text: string, key: string) => void;
  copiedIndex: string | null;
}) {
  const fullText = content.slides.map((s) => s.text).join("\n\n---\n\n");
  const hashtagText = content.hashtags.map((h) => `#${h}`).join(" ");

  return (
    <div className="space-y-3">
      {content.slides.map((slide, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-orange-400 font-medium">
              スライド {i + 1}/{content.slides.length}
            </span>
            <CopyButton text={slide.text} copyKey={`ig-${i}`} onCopy={onCopy} copiedIndex={copiedIndex} />
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{slide.text}</p>
        </div>
      ))}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-blue-400 font-medium">ハッシュタグ</span>
          <CopyButton text={hashtagText} copyKey="ig-hashtags" onCopy={onCopy} copiedIndex={copiedIndex} />
        </div>
        <p className="text-sm text-gray-300">{hashtagText}</p>
      </div>
      <div className="text-right">
        <CopyButton
          text={fullText + "\n\n" + hashtagText}
          copyKey="ig-all"
          onCopy={onCopy}
          copiedIndex={copiedIndex}
        />
      </div>
    </div>
  );
}

function XPreview({
  content,
  onCopy,
  copiedIndex,
}: {
  content: XContent;
  onCopy: (text: string, key: string) => void;
  copiedIndex: string | null;
}) {
  return (
    <div className="space-y-3">
      {content.tweets.map((tweet, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-orange-400 font-medium">
              {i + 1}/{content.tweets.length}
            </span>
            <CopyButton text={tweet.text} copyKey={`x-${i}`} onCopy={onCopy} copiedIndex={copiedIndex} />
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{tweet.text}</p>
          <div className="mt-2 text-xs text-gray-500 text-right">{tweet.text.length}/280</div>
        </div>
      ))}
    </div>
  );
}

function TikTokPreview({
  content,
  onCopy,
  copiedIndex,
}: {
  content: TikTokContent;
  onCopy: (text: string, key: string) => void;
  copiedIndex: string | null;
}) {
  const fullScript = `【フック】\n${content.hook}\n\n【本編】\n${content.body}\n\n【CTA】\n${content.cta}`;

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-red-400 font-medium">🎬 フック（最初の3秒）</span>
          <CopyButton text={content.hook} copyKey="tt-hook" onCopy={onCopy} copiedIndex={copiedIndex} />
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{content.hook}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-orange-400 font-medium">📝 本編</span>
          <CopyButton text={content.body} copyKey="tt-body" onCopy={onCopy} copiedIndex={copiedIndex} />
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{content.body}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-green-400 font-medium">📣 CTA</span>
          <CopyButton text={content.cta} copyKey="tt-cta" onCopy={onCopy} copiedIndex={copiedIndex} />
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{content.cta}</p>
      </div>
      <div className="text-right">
        <CopyButton text={fullScript} copyKey="tt-all" onCopy={onCopy} copiedIndex={copiedIndex} />
      </div>
    </div>
  );
}
