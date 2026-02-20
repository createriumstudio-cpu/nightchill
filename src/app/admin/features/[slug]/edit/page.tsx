"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SpotEmbed {
  platform: "instagram" | "tiktok";
  url: string;
  caption: string;
}

interface FeaturedSpot {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
  instagramHashtag: string;
  tiktokHashtag: string;
  embeds: SpotEmbed[];
}

interface FeatureData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  area: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  heroEmoji: string;
  heroImage: string;
  spots: FeaturedSpot[];
}

export default function EditFeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [feature, setFeature] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/features")
      .then((res) => {
        if (!res.ok) throw new Error("認証エラー");
        return res.json();
      })
      .then((data: FeatureData[]) => {
        const found = data.find((f) => f.slug === slug);
        if (found) {
          setFeature(found);
        } else {
          setError("特集が見つかりません");
        }
      })
      .catch(() => setError("データの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!feature) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feature),
      });

      if (res.ok) {
        setSuccess("保存しました");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FeatureData, value: string | string[]) => {
    if (!feature) return;
    setFeature({ ...feature, [field]: value });
  };

  const updateSpot = (index: number, field: keyof FeaturedSpot, value: string | SpotEmbed[]) => {
    if (!feature) return;
    const spots = [...feature.spots];
    spots[index] = { ...spots[index], [field]: value };
    setFeature({ ...feature, spots });
  };

  const addSpot = () => {
    if (!feature) return;
    const newSpot: FeaturedSpot = {
      name: "",
      area: feature.area,
      genre: "",
      description: "",
      tip: "",
      instagramHashtag: "",
      tiktokHashtag: "",
      embeds: [],
    };
    setFeature({ ...feature, spots: [...feature.spots, newSpot] });
  };

  const removeSpot = (index: number) => {
    if (!feature) return;
    const spots = feature.spots.filter((_, i) => i !== index);
    setFeature({ ...feature, spots });
  };

  const addEmbed = (spotIndex: number) => {
    if (!feature) return;
    const spots = [...feature.spots];
    spots[spotIndex] = {
      ...spots[spotIndex],
      embeds: [...spots[spotIndex].embeds, { platform: "instagram", url: "", caption: "" }],
    };
    setFeature({ ...feature, spots });
  };

  const updateEmbed = (spotIndex: number, embedIndex: number, field: keyof SpotEmbed, value: string) => {
    if (!feature) return;
    const spots = [...feature.spots];
    const embeds = [...spots[spotIndex].embeds];
    embeds[embedIndex] = { ...embeds[embedIndex], [field]: value };
    spots[spotIndex] = { ...spots[spotIndex], embeds };
    setFeature({ ...feature, spots });
  };

  const removeEmbed = (spotIndex: number, embedIndex: number) => {
    if (!feature) return;
    const spots = [...feature.spots];
    spots[spotIndex] = {
      ...spots[spotIndex],
      embeds: spots[spotIndex].embeds.filter((_, i) => i !== embedIndex),
    };
    setFeature({ ...feature, spots });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "特集が見つかりません"}</p>
          <Link href="/admin" className="text-orange-400 hover:underline">
            管理画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-zinc-400 hover:text-white">
              ← 戻る
            </Link>
            <h1 className="text-lg font-bold">特集を編集</h1>
          </div>
          <div className="flex items-center gap-3">
            {success && <span className="text-green-400 text-sm">{success}</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* 基本情報 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2">基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">タイトル</label>
              <input
                value={feature.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">slug（URL）</label>
              <input
                value={feature.slug}
                disabled
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">サブタイトル</label>
            <input
              value={feature.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">説明文</label>
            <textarea
              value={feature.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">エリア</label>
              <input
                value={feature.area}
                onChange={(e) => updateField("area", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">絵文字</label>
              <input
                value={feature.heroEmoji}
                onChange={(e) => updateField("heroEmoji", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">タグ（カンマ区切り）</label>
              <input
                value={feature.tags.join(", ")}
                onChange={(e) => updateField("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">ヒーロー画像URL</label>
            <input
              value={feature.heroImage || ""}
              onChange={(e) => updateField("heroImage", e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
              placeholder="https://..."
            />
          </div>
        </section>

        {/* スポット一覧 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-lg font-semibold">スポット（{feature.spots.length}件）</h2>
            <button
              onClick={addSpot}
              className="px-4 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              + スポット追加
            </button>
          </div>

          {feature.spots.map((spot, spotIndex) => (
            <div key={spotIndex} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-orange-400">スポット {spotIndex + 1}</h3>
                <button
                  onClick={() => removeSpot(spotIndex)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  削除
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">店名</label>
                  <input
                    value={spot.name}
                    onChange={(e) => updateSpot(spotIndex, "name", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">エリア</label>
                  <input
                    value={spot.area}
                    onChange={(e) => updateSpot(spotIndex, "area", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">ジャンル</label>
                  <input
                    value={spot.genre}
                    onChange={(e) => updateSpot(spotIndex, "genre", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">説明</label>
                <textarea
                  value={spot.description}
                  onChange={(e) => updateSpot(spotIndex, "description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">デートTIP</label>
                <textarea
                  value={spot.tip}
                  onChange={(e) => updateSpot(spotIndex, "tip", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>

              {/* SNS Embeds */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">SNS埋め込み（{spot.embeds.length}件）</span>
                  <button
                    onClick={() => addEmbed(spotIndex)}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    + 追加
                  </button>
                </div>
                {spot.embeds.map((embed, embedIndex) => (
                  <div key={embedIndex} className="flex gap-2 mb-2 items-start">
                    <select
                      value={embed.platform}
                      onChange={(e) => updateEmbed(spotIndex, embedIndex, "platform", e.target.value)}
                      className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                    <input
                      value={embed.url}
                      onChange={(e) => updateEmbed(spotIndex, embedIndex, "url", e.target.value)}
                      placeholder="投稿URL"
                      className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                    <input
                      value={embed.caption}
                      onChange={(e) => updateEmbed(spotIndex, embedIndex, "caption", e.target.value)}
                      placeholder="キャプション"
                      className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => removeEmbed(spotIndex, embedIndex)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 rounded-lg font-medium transition-colors"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </main>
    </div>
  );
}
