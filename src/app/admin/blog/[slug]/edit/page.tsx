"use client";

import { useEffect, useState, use } from "react";
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

interface BlogForm {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  city: string;
  heroImage: string;
  isPublished: boolean;
}

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BlogForm>({
    title: "",
    excerpt: "",
    content: "",
    category: "column",
    tags: "",
    city: "",
    heroImage: "",
    isPublished: false,
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setForm({
          title: data.title || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          category: data.category || "column",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          city: data.city || "",
          heroImage: data.hero_image || data.heroImage || "",
          isPublished: data.is_published ?? data.isPublished ?? false,
        });
      } catch {
        setError("記事の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

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
      const res = await fetch(`/api/admin/blog/${slug}`, {
        method: "PUT",
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
        throw new Error(data.error || "保存に失敗しました");
      }

      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
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
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="text-gray-400 hover:text-white"
        >
          &larr; 戻る
        </Link>
        <h1 className="text-xl font-bold">編集: {form.title || slug}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <p className="text-red-400 mb-4 bg-red-900/20 border border-red-800 rounded p-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {saving ? "保存中..." : "保存"}
          </button>
        </form>
      </main>
    </div>
  );
}
