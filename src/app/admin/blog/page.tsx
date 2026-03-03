"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface BlogPostItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  city: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  tips: "デートのコツ",
  seasonal: "季節のデート",
  "area-guide": "エリアガイド",
  "first-date": "初デート",
  anniversary: "記念日",
  column: "コラム",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data);
    } catch {
      setError("ブログ記事の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleToggle = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/blog/${slug}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to toggle");
      await fetchPosts();
    } catch {
      alert("公開状態の変更に失敗しました");
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/blog/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchPosts();
    } catch {
      alert("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            &larr; 管理画面
          </Link>
          <h1 className="text-xl font-bold">ブログ記事管理</h1>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium"
        >
          + 新規記事
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">
          ブログ記事一覧（{posts.length}件）
        </h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{p.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.isPublished
                          ? "bg-green-900 text-green-300"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {p.isPublished ? "公開" : "下書き"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300">
                      {CATEGORY_LABELS[p.category] || p.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {p.slug}
                    {p.city && ` · ${p.city}`}
                    {p.createdAt &&
                      ` · ${new Date(p.createdAt).toLocaleDateString("ja-JP")}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleToggle(p.slug)}
                  className={`text-xs px-3 py-1.5 rounded ${
                    p.isPublished
                      ? "bg-yellow-900 hover:bg-yellow-800 text-yellow-300"
                      : "bg-green-900 hover:bg-green-800 text-green-300"
                  }`}
                >
                  {p.isPublished ? "非公開にする" : "公開する"}
                </button>
                <Link
                  href={`/admin/blog/${p.slug}/edit`}
                  className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  編集
                </Link>
                <a
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  プレビュー
                </a>
                <button
                  onClick={() => handleDelete(p.slug, p.title)}
                  className="text-xs px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-red-300"
                >
                  削除
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <p>まだブログ記事がありません</p>
              <Link
                href="/admin/blog/new"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
              >
                最初の記事を作成する →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
