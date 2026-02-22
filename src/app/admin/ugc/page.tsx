"use client";

import { useCallback, useEffect, useState } from "react";
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

interface Feature {
  slug: string;
  title: string;
  area: string;
}

// Auto-detect platform from URL
function detectPlatform(url: string): string {
  if (/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url)) return "x";
  if (/instagram\.com\/(?:p|reel|reels)\//.test(url)) return "instagram";
  if (/tiktok\.com\/@[^/]+\/video\/\d+/.test(url)) return "tiktok";
  return "";
}

// Platform display names and colors
const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  x: { label: "X (Twitter)", color: "bg-gray-700", icon: "𝕏" },
  twitter: { label: "X (Twitter)", color: "bg-gray-700", icon: "𝕏" },
  instagram: { label: "Instagram", color: "bg-gradient-to-r from-purple-600 to-pink-500", icon: "📷" },
  tiktok: { label: "TikTok", color: "bg-gray-900", icon: "🎵" },
};

export default function AdminUgcPage() {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newUrl, setNewUrl] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newFeatureSlug, setNewFeatureSlug] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/ugc?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch features for dropdown
  useEffect(() => {
    fetch("/api/admin/features")
      .then((res) => res.json())
      .then((data) => setFeatures(data))
      .catch(() => setFeatures([]));
  }, []);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (newUrl) {
      const detected = detectPlatform(newUrl);
      if (detected) {
        setNewPlatform(detected);
        setShowPreview(true);
      }
    } else {
      setShowPreview(false);
    }
  }, [newUrl]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/ugc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch {
      // handle silently
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm("この投稿を削除しますか？")) return;
    try {
      const res = await fetch(`/api/admin/ugc/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch {
      // handle silently
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newPlatform) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/ugc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          postUrl: newUrl,
          featureSlug: newFeatureSlug || null,
          caption: newCaption || null,
          status: "approved",
        }),
      });
      if (res.ok) {
        setNewUrl("");
        setNewPlatform("");
        setNewFeatureSlug("");
        setNewCaption("");
        setShowAddForm(false);
        setShowPreview(false);
        fetchPosts();
      }
    } catch {
      // handle silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">UGC管理</h1>
            <p className="text-gray-400 text-sm mt-1">
              URLを貼り付けるだけ — プラットフォーム自動判別・プレビュー付き
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/admin" className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              ← 管理画面
            </a>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 font-medium"
            >
              {showAddForm ? "✕ 閉じる" : "＋ 投稿を追加"}
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">📋 投稿を追加</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL Input - Main field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  投稿URL（貼り付けるだけでOK）
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://x.com/... / https://www.instagram.com/p/... / https://www.tiktok.com/@.../video/..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {newPlatform && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${platformConfig[newPlatform]?.color || "bg-gray-700"} text-white`}>
                      {platformConfig[newPlatform]?.icon} {platformConfig[newPlatform]?.label}
                    </span>
                    <span className="text-green-400 text-xs">✓ プラットフォーム自動検出</span>
                  </div>
                )}
              </div>

              {/* Feature Slug Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  エリア（特集記事）
                </label>
                <select
                  value={newFeatureSlug}
                  onChange={(e) => setNewFeatureSlug(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  <option value="">エリアを選択...</option>
                  {features.map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.title} ({f.area})
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  キャプション（任意）
                </label>
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="表示用の補足テキスト"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                />
              </div>

              {/* Live Preview */}
              {showPreview && newUrl && newPlatform && (
                <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">👁 プレビュー</h3>
                  <EmbedPreview url={newUrl} platform={newPlatform} />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !newUrl || !newPlatform}
                className="w-full px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "追加中..." : "投稿を追加（承認済みとして保存）"}
              </button>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {["all", "approved", "pending", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {s === "all" ? "すべて" : s === "approved" ? "承認済み" : s === "pending" ? "保留中" : "却下"}
            </button>
          ))}
          <span className="text-gray-500 text-sm ml-2 self-center">
            {posts.length}件
          </span>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            投稿がありません
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${platformConfig[post.platform]?.color || "bg-gray-700"} text-white`}>
                        {platformConfig[post.platform]?.icon || "🔗"} {platformConfig[post.platform]?.label || post.platform}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        post.status === "approved"
                          ? "bg-green-900/50 text-green-400"
                          : post.status === "pending"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-red-900/50 text-red-400"
                      }`}>
                        {post.status === "approved" ? "承認済み" : post.status === "pending" ? "保留中" : "却下"}
                      </span>
                      {post.featureSlug && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                          📍 {post.featureSlug}
                        </span>
                      )}
                    </div>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline truncate block"
                    >
                      {post.postUrl}
                    </a>
                    {post.caption && (
                      <p className="text-xs text-gray-500 mt-1">{post.caption}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {post.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(post.id, "approved")}
                        className="px-2 py-1 bg-green-800 rounded text-xs hover:bg-green-700"
                      >
                        承認
                      </button>
                    )}
                    {post.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(post.id, "rejected")}
                        className="px-2 py-1 bg-red-800 rounded text-xs hover:bg-red-700"
                      >
                        却下
                      </button>
                    )}
                    <button
                      onClick={() => deletePost(post.id)}
                      className="px-2 py-1 bg-gray-800 rounded text-xs hover:bg-gray-700 text-gray-400"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Embed Preview Component for admin form
function EmbedPreview({ url, platform }: { url: string; platform: string }) {
  if (platform === "x" || platform === "twitter") {
    return <TwitterPreview url={url} />;
  }
  if (platform === "instagram") {
    return <InstagramPreview url={url} />;
  }
  if (platform === "tiktok") {
    return <TikTokPreview url={url} />;
  }
  return <p className="text-gray-500 text-sm">プレビューを表示できません</p>;
}

function TwitterPreview({ url }: { url: string }) {
  return (
    <div className="max-w-[550px] mx-auto">
      <blockquote className="twitter-tweet" data-theme="dark" data-lang="ja">
        <a href={url}>ツイートを読み込み中...</a>
      </blockquote>
    </div>
  );
}

function InstagramPreview({ url }: { url: string }) {
  return (
    <div className="max-w-[540px] mx-auto">
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm mb-2">Instagram投稿</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline break-all">
          {url}
        </a>
        <p className="text-gray-500 text-xs mt-2">※プレビューは保存後にフロントエンドで表示されます</p>
      </div>
    </div>
  );
}

function TikTokPreview({ url }: { url: string }) {
  return (
    <div className="max-w-[540px] mx-auto">
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm mb-2">🎵 TikTok動画</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline break-all">
          {url}
        </a>
        <p className="text-gray-500 text-xs mt-2">※プレビューは保存後にフロントエンドで表示されます</p>
      </div>
    </div>
  );
}

// Window types are declared in UgcSection.tsx
