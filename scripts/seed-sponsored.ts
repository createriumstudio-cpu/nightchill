import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sponsoredSpots } from "../src/lib/schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const spots = [
    {
      title: "Maison Cacao 表参道",
      description: "表参道の隠れ家ショコラトリー。デートの手土産にぴったりのアロマ生チョコレート。",
      url: "https://maisoncacao.com",
      imageUrl: "",
      category: "gourmet",
      targetAreas: ["表参道"],
      priority: 1,
      isActive: true,
      labelJa: "おすすめ",
      labelEn: "Recommended",
    },
    {
      title: "TRUNK(HOTEL)",
      description: "渋谷のソーシャライジングホテル。デートの特別なディナーに最適なルーフトップレストラン。",
      url: "https://trunk-hotel.com",
      imageUrl: "",
      category: "hotel",
      targetAreas: ["渋谷"],
      priority: 1,
      isActive: true,
      labelJa: "注目",
      labelEn: "Featured",
    },
    {
      title: "THE AOYAMA GRAND HOTEL",
      description: "青山・六本木エリアの上質なホテルダイニング。記念日デートにおすすめ。",
      url: "https://aoyamagrand.com",
      imageUrl: "",
      category: "hotel",
      targetAreas: ["六本木"],
      priority: 2,
      isActive: true,
      labelJa: "おすすめ",
      labelEn: "Recommended",
    },
    {
      title: "Artizan 代官山",
      description: "代官山のクラフトカクテルバー。こだわりのカクテルと洗練された空間でゆったり過ごせる。",
      url: "https://example.com/artizan",
      imageUrl: "",
      category: "bar",
      targetAreas: ["代官山"],
      priority: 1,
      isActive: true,
      labelJa: "おすすめ",
      labelEn: "Recommended",
    },
    {
      title: "中目黒 蔦屋書店",
      description: "本とコーヒーを楽しむ知的デートスポット。目黒川沿いの散歩コースにも最適。",
      url: "https://store.tsite.jp/nakameguro/",
      imageUrl: "",
      category: "culture",
      targetAreas: ["中目黒"],
      priority: 1,
      isActive: true,
      labelJa: "注目",
      labelEn: "Featured",
    },
    {
      title: "銀座 SIX ルーフガーデン",
      description: "銀座のランドマークから望む東京の夜景。無料で楽しめるデートスポット。",
      url: "https://ginza6.tokyo",
      imageUrl: "",
      category: "spot",
      targetAreas: ["銀座"],
      priority: 1,
      isActive: true,
      labelJa: "おすすめ",
      labelEn: "Recommended",
    },
    {
      title: "恵比寿横丁",
      description: "大人のデートにぴったりの恵比寿横丁。個性豊かな飲食店が軒を連ねるナイトスポット。",
      url: "https://example.com/ebisu-yokocho",
      imageUrl: "",
      category: "gourmet",
      targetAreas: ["恵比寿"],
      priority: 1,
      isActive: true,
      labelJa: "注目",
      labelEn: "Featured",
    },
  ];

  for (const spot of spots) {
    await db.insert(sponsoredSpots).values(spot);
    console.log("Inserted:", spot.title);
  }

  console.log("\nAll seed data inserted!");
}

seed().catch(console.error);
