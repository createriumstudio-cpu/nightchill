/**
 * UGC (User Generated Content) データ管理
 *
 * SNS上のデート関連投稿を公式埋め込み機能で合法的に表示するためのデータ。
 * X (Twitter) と Instagram の公式 oEmbed / embed を利用。
 */

export type SocialPlatform = "x" | "instagram";

export interface UGCPost {
  id: string;
  platform: SocialPlatform;
  embedUrl: string;
  summary: string;
  areas: string[];
  occasions: string[];
  tags: string[];
  curatedAt: string;
}

export const curatedPosts: UGCPost[] = [
  {
    id: "ugc-001",
    platform: "x",
    embedUrl: "https://x.com/nightchill_date/status/example1",
    summary: "渋谷の隠れ家バーで特別な夜を過ごした記録。雰囲気最高でした。",
    areas: ["渋谷", "東京"],
    occasions: ["first-date", "casual"],
    tags: ["バー", "渋谷", "夜デート", "隠れ家"],
    curatedAt: "2026-02-19",
  },
  {
    id: "ugc-002",
    platform: "instagram",
    embedUrl: "https://www.instagram.com/p/example2/",
    summary: "銀座の夜景レストランで記念日ディナー。サプライズケーキに感動。",
    areas: ["銀座", "東京"],
    occasions: ["anniversary", "birthday"],
    tags: ["レストラン", "銀座", "記念日", "夜景"],
    curatedAt: "2026-02-19",
  },
  {
    id: "ugc-003",
    platform: "x",
    embedUrl: "https://x.com/nightchill_date/status/example3",
    summary: "横浜みなとみらいの散歩デートが最高だった話。海風が気持ちいい。",
    areas: ["横浜", "みなとみらい"],
    occasions: ["casual", "first-date"],
    tags: ["散歩", "横浜", "みなとみらい", "海"],
    curatedAt: "2026-02-19",
  },
  {
    id: "ugc-004",
    platform: "instagram",
    embedUrl: "https://www.instagram.com/p/example4/",
    summary: "表参道のカフェ巡りデート。フォトジェニックなスイーツがたくさん。",
    areas: ["表参道", "東京"],
    occasions: ["casual", "first-date"],
    tags: ["カフェ", "表参道", "スイーツ", "おしゃれ"],
    curatedAt: "2026-02-19",
  },
  {
    id: "ugc-005",
    platform: "x",
    embedUrl: "https://x.com/nightchill_date/status/example5",
    summary: "恵比寿のイタリアンで誕生日サプライズ。店員さんも協力してくれた。",
    areas: ["恵比寿", "東京"],
    occasions: ["birthday", "anniversary"],
    tags: ["イタリアン", "恵比寿", "誕生日", "サプライズ"],
    curatedAt: "2026-02-19",
  },
  {
    id: "ugc-006",
    platform: "instagram",
    embedUrl: "https://www.instagram.com/p/example6/",
    summary: "六本木のルーフトップバーからの東京タワー。プロポーズにぴったり。",
    areas: ["六本木", "東京"],
    occasions: ["proposal", "anniversary"],
    tags: ["ルーフトップ", "六本木", "東京タワー", "夜景"],
    curatedAt: "2026-02-19",
  },
];

export function getRelevantPosts(
  area?: string,
  occasion?: string,
  limit: number = 3
): UGCPost[] {
  let filtered = [...curatedPosts];
  if (area) {
    const normalizedArea = area.toLowerCase();
    const areaMatched = filtered.filter(
      (post) =>
        post.areas.some((a) => a.toLowerCase().includes(normalizedArea)) ||
        post.tags.some((t) => t.toLowerCase().includes(normalizedArea))
    );
    if (areaMatched.length > 0) filtered = areaMatched;
  }
  if (occasion) {
    const occasionMatched = filtered.filter((post) =>
      post.occasions.includes(occasion)
    );
    if (occasionMatched.length > 0) filtered = occasionMatched;
  }
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export function normalizeEmbedUrl(
  url: string,
  platform: SocialPlatform
): string {
  if (platform === "x") return url.replace("twitter.com", "x.com");
  if (platform === "instagram") {
    const base = url.endsWith("/") ? url : url + "/";
    return base + "embed/";
  }
  return url;
}
