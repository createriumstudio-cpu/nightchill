"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SponsoredSpot {
  id: number;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  category: string;
  targetAreas: string[];
  isActive: boolean;
  labelJa: string;
  labelEn: string;
}

const CATEGORIES = ["restaurant", "hotel", "gift", "experience", "fashion", "transport", "other"];

const AREAS = [
  "omotesando-sophisticated-date",
  "ginza-luxury-date",
  "ebisu-night-date",
  "roppongi-premium-night",
  "nakameguro-canal-date",
  "daikanyama-stylish-date",
  "shibuya-casual-date",
];

export default function AdminSponsoredPage() {
  const [spots, setSpots] = useState<SponsoredSpot[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [labelJa, setLabelJa] = useState("おすすめ");
  const [labelEn, setLabelEn] = useState("Recommended");

  const fetchSpots = () => {
    fetch("/api/admin/sponsored")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSpots(d); });
  };

  useEffect(() => { fetchSpots(); }, []);

  const handleAdd = async () => {
    if (!title || !url) return;
    await fetch("/api/admin/sponsored", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, url, imageUrl: imageUrl || null,
        category, targetAreas: selectedAreas, labelJa, labelEn,
      }),
    });
    setTitle(""); setDescription(""); setUrl(""); setImageUrl("");
    setSelectedAreas([]); setLabelJa("おすすめ"); setLabelEn("Recommended");
    fetchSpots();
  };

  const toggleActive = async (id: number, current: boolean) => {
    await fetch(`/api/admin/sponsored/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchSpots();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/admin/sponsored/${id}`, { method: "DELETE" });
    fetchSpots();
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">PR スポット管理</h1>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">
            ← 管理画面に戻る
          </Link>
        </div>

        {/* Add Form */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">新規PR スポット追加</h2>
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル" className="w-full bg-gray-800 rounded px-3 py-2 text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="説明文" className="w-full bg-gray-800 rounded px-3 py-2 text-sm" rows={2} />
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (https://...)" className="w-full bg-gray-800 rounded px-3 py-2 text-sm" />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder="画像URL (任意)" className="w-full bg-gray-800 rounded px-3 py-2 text-sm" />
            <div className="flex gap-3">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-800 rounded px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={labelJa} onChange={(e) => setLabelJa(e.target.value)}
                placeholder="ラベル(日)" className="bg-gray-800 rounded px-3 py-2 text-sm w-32" />
              <input value={labelEn} onChange={(e) => setLabelEn(e.target.value)}
                placeholder="Label(EN)" className="bg-gray-800 rounded px-3 py-2 text-sm w-32" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">対象エリア（未選択＝全エリア）:</p>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <button key={a} onClick={() => toggleArea(a)}
                    className={`text-xs px-2 py-1 rounded ${selectedAreas.includes(a) ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                    {a.split("-")[0]}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium">
              追加
            </button>
          </div>
        </div>

        {/* Existing Spots */}
        <div className="space-y-3">
          {spots.map((s) => (
            <div key={s.id} className="bg-gray-900 rounded-xl p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${s.isActive ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                    {s.isActive ? "有効" : "無効"}
                  </span>
                  <span className="text-xs text-gray-500">{s.category}</span>
                </div>
                <h3 className="font-bold text-sm">{s.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{s.description}</p>
                <p className="text-xs text-orange-400 mt-1">{s.url}</p>
                {s.targetAreas && s.targetAreas.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">エリア: {(s.targetAreas as string[]).join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggleActive(s.id, s.isActive)}
                  className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">
                  {s.isActive ? "無効化" : "有効化"}
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="text-xs px-2 py-1 rounded bg-red-900 hover:bg-red-800 text-red-400">
                  削除
                </button>
              </div>
            </div>
          ))}
          {spots.length === 0 && (
            <p className="text-center text-gray-500 py-8">PRスポットがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
