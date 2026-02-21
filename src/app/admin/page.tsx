"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Feature {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  area: string;
  heroEmoji: string;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/features");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFeatures(data);
    } catch {
      setError("特集記事の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleToggle = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/features/${slug}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to toggle");
      await fetchFeatures();
    } catch {
      alert("公開状態の変更に失敗しました");
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/features/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchFeatures();
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
        <h1 className="text-xl font-bold">futatabito 管理画面</h1>
        <Link
          href="/admin/features/new"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium"
        >
          + 新規作成
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">
          特集記事一覧（{features.length}件）
        </h2>

        {error && (
          <p className="text-red-400 mb-4">{error}</p>
        )}

        <div className="space-y-3">
          {features.map((f) => (
            <div
              key={f.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{f.heroEmoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{f.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        f.isPublished
                          ? "bg-green-900 text-green-300"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {f.isPublished ? "公開" : "非公開"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {f.area} · {f.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleToggle(f.slug)}
                  className={`text-xs px-3 py-1.5 rounded ${
                    f.isPublished
                      ? "bg-yellow-900 hover:bg-yellow-800 text-yellow-300"
                      : "bg-green-900 hover:bg-green-800 text-green-300"
                  }`}
                >
                  {f.isPublished ? "非公開にする" : "公開する"}
                </button>
                <Link
                  href={`/admin/features/${f.slug}/edit`}
                  className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  編集
                </Link>
                <a
                  href={`/features/${f.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  プレビュー
                </a>
                <button
                  onClick={() => handleDelete(f.slug, f.title)}
                  className="text-xs px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-red-300"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
