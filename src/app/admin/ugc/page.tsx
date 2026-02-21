"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function AdminUgcPage() {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: "x",
    postUrl: "",
    caption: "",
    featureSlug: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const url =
        statusFilter === "all"
          ? "/api/admin/ugc"
          : `/api/admin/ugc?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: "Basic " + btoa("admin:taas1111") },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/ugc/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("admin:taas1111"),
        },
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
        headers: { Authorization: "Basic " + btoa("admin:taas1111") },
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch {
      // handle silently
    }
  };

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/ugc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("admin:taas1111"),
        },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setNewPost({ platform: "x", postUrl: "", caption: "", featureSlug: "" });
        setShowAddForm(false);
        fetchPosts();
      }
    } catch {
      // handle silently
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300",
      approved: "bg-green-500/20 text-green-300",
      rejected: "bg-red-500/20 text-red-300",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-300"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-gray-400 text-sm hover:text-white">
            ← 管理画面に戻る
          </Link>
          <h1 className="text-2xl font-bold mt-2">UGC 管理</h1>
          <p className="text-gray-400 text-sm">SNS投稿の追加・承認・管理</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {showAddForm ? "キャンセル" : "＋ 投稿を追加"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={addPost}
          className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800"
        >
          <h2 className="text-lg font-bold mb-4">新しいUGC投稿を追加</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                プラットフォーム
              </label>
              <select
                value={newPost.platform}
                onChange={(e) =>
                  setNewPost({ ...newPost, platform: e.target.value })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="x">X (Twitter)</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                関連エリア (feature slug)
              </label>
              <input
                type="text"
                value={newPost.featureSlug}
                onChange={(e) =>
                  setNewPost({ ...newPost, featureSlug: e.target.value })
                }
                placeholder="omotesando-sophisticated-date"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">投稿URL</label>
            <input
              type="url"
              value={newPost.postUrl}
              onChange={(e) =>
                setNewPost({ ...newPost, postUrl: e.target.value })
              }
              placeholder="https://x.com/username/status/123456789"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              キャプション（任意）
            </label>
            <input
              type="text"
              value={newPost.caption}
              onChange={(e) =>
                setNewPost({ ...newPost, caption: e.target.value })
              }
              placeholder="表参道エリアのおしゃれカフェ紹介"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "追加中..." : "追加する"}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              statusFilter === s
                ? "bg-orange-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {s === "all" ? "すべて" : s}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-gray-400">読み込み中...</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          UGC投稿がありません
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(post.status)}
                  <span className="text-xs text-gray-500 uppercase">
                    {post.platform}
                  </span>
                  {post.featureSlug && (
                    <span className="text-xs text-gray-600">
                      {post.featureSlug}
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
              </div>
              <div className="flex gap-2 shrink-0">
                {post.status !== "approved" && (
                  <button
                    onClick={() => updateStatus(post.id, "approved")}
                    className="px-3 py-1 bg-green-600/20 text-green-300 rounded text-xs hover:bg-green-600/40 transition-colors"
                  >
                    承認
                  </button>
                )}
                {post.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(post.id, "rejected")}
                    className="px-3 py-1 bg-red-600/20 text-red-300 rounded text-xs hover:bg-red-600/40 transition-colors"
                  >
                    却下
                  </button>
                )}
                {post.status !== "pending" && (
                  <button
                    onClick={() => updateStatus(post.id, "pending")}
                    className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs hover:bg-yellow-600/40 transition-colors"
                  >
                    保留
                  </button>
                )}
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-3 py-1 bg-gray-700 text-gray-400 rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
