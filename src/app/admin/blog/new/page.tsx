"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { id: "tips", label: "デートのコツ" },
  { id: "seasonal", label: "季節のデート" },
  { id: "area-guide", label: "エリアガイド" },
  { id: "first-date", label: "初デート" },
  { id: "anniversary", label: "記念日" },
  { id: "column", label: "コラム" },
];

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    category: "column",
    tags: "",
    city: "",
    heroImage: "",
    isPublished: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          city: form.city || null,
          heroImage: form.heroImage || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "作成に失敗しました");
      }

      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="text-gray-400 hover:text-white"
        >
          &larr; 戻る
        </Link>
        <h1 className="text-xl font-bold">新規ブログ記事</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <p className="text-red-400 mb-4 bg-red-900/20 border border-red-800 rounded p-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Slug（URL用）
            </label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              pattern="[a-z0-9-]+"
              placeholder="date-tips-for-beginners"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              概要（一覧表示用）
            </label>
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              rows={2}
              placeholder="記事の概要を短く書いてください"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              本文（Markdown風: ## 見出し, - リスト, &gt; 引用）
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              required
              rows={15}
              placeholder={"## はじめに\n\n記事の本文をここに書きます。\n\n## セクション1\n\n段落ごとに空行で区切ってください。\n\n- リスト項目1\n- リスト項目2"}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                カテゴリ
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                都市（任意）
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="tokyo"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="初デート, カフェ, 会話術"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ヒーロー画像URL（任意）
            </label>
            <input
              name="heroImage"
              value={form.heroImage}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isPublished: e.target.checked }))
              }
              className="rounded"
            />
            <label htmlFor="isPublished" className="text-sm">
              公開する
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2 rounded text-sm font-medium"
          >
            {saving ? "保存中..." : "作成"}
          </button>
        </form>
      </main>
    </div>
  );
}
