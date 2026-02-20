"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewFeaturePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [heroEmoji, setHeroEmoji] = useState("📍");
  const [tags, setTags] = useState("");

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u3000-\u9fff]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug || generateSlug(title),
          title,
          subtitle,
          description,
          area,
          heroEmoji,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          spots: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/features/${data.slug}/edit`);
      } else {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-zinc-400 hover:text-white">
            ← 戻る
          </Link>
          <h1 className="text-lg font-bold">新しい特集を作成</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">タイトル *</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(generateSlug(e.target.value));
              }}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="例: 表参道ナイトデート完全ガイド"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">slug（URL用ID）*</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="例: omotesando-night-date"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">
              /features/{slug || "..."} としてアクセスされます
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">サブタイトル</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="例: 洗練されたディナーからバーへの完璧な動線"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">説明文</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="この特集の概要を入力..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">エリア</label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                placeholder="例: 表参道"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">絵文字</label>
              <input
                value={heroEmoji}
                onChange={(e) => setHeroEmoji(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">タグ（カンマ区切り）</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="例: 表参道, ナイトデート, イタリアン"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "作成中..." : "特集を作成してスポットを追加する"}
          </button>
        </form>
      </main>
    </div>
  );
}
