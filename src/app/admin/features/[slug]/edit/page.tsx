"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SpotForm {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
}

interface FeatureForm {
  title: string;
  subtitle: string;
  description: string;
  area: string;
  tags: string;
  heroEmoji: string;
  heroImage: string;
  isPublished: boolean;
  spots: SpotForm[];
}

export default function EditFeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FeatureForm>({
    title: "",
    subtitle: "",
    description: "",
    area: "",
    tags: "",
    heroEmoji: "",
    heroImage: "",
    isPublished: true,
    spots: [],
  });

  useEffect(() => {
    const fetchFeature = async () => {
      try {
        const res = await fetch(`/api/admin/features/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          area: data.area || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          heroEmoji: data.heroEmoji || "",
          heroImage: data.heroImage || "",
          isPublished: data.isPublished ?? true,
          spots: (data.spots || []).map((s: SpotForm) => ({
            name: s.name || "",
            area: s.area || "",
            genre: s.genre || "",
            description: s.description || "",
            tip: s.tip || "",
          })),
        });
      } catch {
        setError("記事の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchFeature();
  }, [slug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpotChange = (
    index: number,
    field: keyof SpotForm,
    value: string
  ) => {
    setForm((prev) => {
      const spots = [...prev.spots];
      spots[index] = { ...spots[index], [field]: value };
      return { ...prev, spots };
    });
  };

  const addSpot = () => {
    setForm((prev) => ({
      ...prev,
      spots: [
        ...prev.spots,
        { name: "", area: "", genre: "", description: "", tip: "" },
      ],
    }));
  };

  const removeSpot = (index: number) => {
    setForm((prev) => ({
      ...prev,
      spots: prev.spots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/features/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      router.push("/admin");
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
        <Link href="/admin" className="text-gray-400 hover:text-white">
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
            <label className="block text-sm font-medium mb-1">サブタイトル</label>
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">説明文</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">エリア</label>
              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ヒーロー絵文字</label>
              <input
                name="heroEmoji"
                value={form.heroEmoji}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">タグ（カンマ区切り）</label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ヒーロー画像URL</label>
            <input
              name="heroImage"
              value={form.heroImage}
              onChange={handleChange}
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

          {/* Spots Section */}
          <div className="border-t border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">スポット一覧</h2>
              <button
                type="button"
                onClick={addSpot}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded"
              >
                + スポット追加
              </button>
            </div>

            {form.spots.map((spot, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">
                    スポット {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSpot(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    削除
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    value={spot.name}
                    onChange={(e) => handleSpotChange(i, "name", e.target.value)}
                    placeholder="店名"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={spot.area}
                      onChange={(e) =>
                        handleSpotChange(i, "area", e.target.value)
                      }
                      placeholder="エリア"
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
                    />
                    <input
                      value={spot.genre}
                      onChange={(e) =>
                        handleSpotChange(i, "genre", e.target.value)
                      }
                      placeholder="ジャンル"
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                  <textarea
                    value={spot.description}
                    onChange={(e) =>
                      handleSpotChange(i, "description", e.target.value)
                    }
                    placeholder="説明"
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
                  />
                  <input
                    value={spot.tip}
                    onChange={(e) => handleSpotChange(i, "tip", e.target.value)}
                    placeholder="デートTip"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
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
