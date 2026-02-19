/**
 * 特集ページデータ管理
 *
 * 手打ちで管理するキュレーション型の特集記事データ。
 * 各特集にはスポット情報とSNS埋め込みURLを紐付ける。
 *
 * 新しい特集を追加する方法:
 * 1. featuredArticles 配列に新しいオブジェクトを追加
 * 2. slug はURL用のユニークな文字列（英数字+ハイフン）
 * 3. spots[] にお店情報と実際のInstagram/TikTok投稿URLを設定
 * 4. embeds[] のURLは公式embed対応のもののみ使用すること
 */

export type EmbedPlatform = "instagram" | "tiktok";

export interface SpotEmbed {
  platform: EmbedPlatform;
  url: string;
  caption: string;
}

export interface FeaturedSpot {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
  instagramHashtag?: string;
  tiktokHashtag?: string;
  embeds: SpotEmbed[];
}

export interface FeaturedArticle {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  area: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  heroEmoji: string;
  spots: FeaturedSpot[];
}

/**
 * 特集記事データ（手打ち管理）
 *
 * ※ embeds[].url にはInstagramの投稿URL or TikTokの動画URLを入れる
 *   現時点ではサンプルURLを設定。実際の投稿URLに差し替えてください。
 */
export const featuredArticles: FeaturedArticle[] = [
  {
    slug: "ebisu-night-date",
    title: "恵比寿ナイトデート完全ガイド",
    subtitle: "イタリアンからバーへ。大人の夜を演出する2軒の名店",
    description:
      "恵比寿は落ち着いた大人のデートにぴったりのエリア。駅徒歩5分圏内に名店が集まり、1軒目のディナーから2軒目のバーまで歩いて回れるのが魅力。今回は実際にデートで使えるイタリアンとバーの組み合わせを、SNSの口コミとともに紹介します。",
    area: "恵比寿",
    tags: ["恵比寿", "ナイトデート", "イタリアン", "バー", "初デート"],
    publishedAt: "2026-02-20",
    updatedAt: "2026-02-20",
    heroEmoji: "🌙",
    spots: [
      {
        name: "AELU&BRODO",
        area: "恵比寿",
        genre: "イタリアン",
        description:
          "グランベル恵比寿III 3Fにある隠れ家イタリアン。カウンター席からの夜景が魅力で、初デートの1軒目に最適。パスタと自然派ワインのペアリングが人気。",
        tip: "カウンター席をリクエストすると自然に横並びになれる。18時台は比較的空いているので予約は18:00〜18:30がおすすめ。",
        instagramHashtag: "AELU&BRODO",
        tiktokHashtag: "恵比寿イタリアン",
        embeds: [
          {
            platform: "instagram",
            url: "https://www.instagram.com/reel/DHfHWviyKAe/",
            caption: "AELU&BRODOのパスタとワイン",
          },
        ],
      },
      {
        name: "MUSE BAR 恵比寿駅前本店",
        area: "恵比寿",
        genre: "バー",
        description:
          "恵比寿駅徒歩1分のムーディーなバー。カクテルの種類が豊富で、2軒目にぴったり。個室もあり、ゆっくり話したいデートに最適。",
        tip: "20時開店なので、ディナーを19:30頃に切り上げて移動するとちょうどいい。カクテルは季節のフルーツ系がハズレなし。",
        instagramHashtag: "MUSEBAR恵比寿",
        tiktokHashtag: "恵比寿バー",
        embeds: [
          {
            platform: "instagram",
            url: "https://www.instagram.com/reel/C3QqKZmPHnN/",
            caption: "MUSE BARの雰囲気",
          },
        ],
      },
    ],
  },
  {
    slug: "shibuya-casual-date",
    title: "渋谷カジュアルデートプラン",
    subtitle: "気取らない雰囲気で距離が縮まる、渋谷の穴場2選",
    description:
      "渋谷といえば若者の街のイメージですが、実は大人が楽しめる穴場スポットも豊富。駅から少し離れるだけで、落ち着いたカフェやワインバーが見つかります。カジュアルだけど特別感のあるデートコースを紹介。",
    area: "渋谷",
    tags: ["渋谷", "カジュアル", "カフェ", "ワインバー", "穴場"],
    publishedAt: "2026-02-20",
    updatedAt: "2026-02-20",
    heroEmoji: "☕",
    spots: [
      {
        name: "ABOUT LIFE COFFEE BREWERS",
        area: "渋谷",
        genre: "カフェ",
        description:
          "渋谷のスペシャルティコーヒー専門店。スタンディング中心のカジュアルな空間で、コーヒー好き同士の会話が弾む。",
        tip: "テイクアウトして近くの公園で飲むのも◎。「何が好き？」から始まるコーヒートークが自然な会話のきっかけに。",
        instagramHashtag: "ABOUTLIFECOFFEE",
        tiktokHashtag: "渋谷カフェ",
        embeds: [],
      },
      {
        name: "FUGLEN TOKYO",
        area: "渋谷（富ヶ谷）",
        genre: "カフェ&バー",
        description:
          "昼はカフェ、夜はカクテルバーに変身するノルウェー発の人気店。北欧ヴィンテージ家具に囲まれた空間がおしゃれ。",
        tip: "夕方のゴールデンタイム（17時〜19時）は混雑前でカフェとバーの両方を楽しめる。窓際席がおすすめ。",
        instagramHashtag: "FUGLENTOKYO",
        tiktokHashtag: "富ヶ谷カフェ",
        embeds: [],
      },
    ],
  },
];

/**
 * 全特集を取得
 */
export function getAllFeatures(): FeaturedArticle[] {
  return featuredArticles;
}

/**
 * slugで特集を取得
 */
export function getFeatureBySlug(slug: string): FeaturedArticle | undefined {
  return featuredArticles.find((a) => a.slug === slug);
}

/**
 * エリアで関連特集を取得
 */
export function getFeaturesByArea(area: string, limit = 3): FeaturedArticle[] {
  const normalized = area.toLowerCase();
  return featuredArticles
    .filter(
      (a) =>
        a.area.toLowerCase().includes(normalized) ||
        a.tags.some((t) => t.toLowerCase().includes(normalized)),
    )
    .slice(0, limit);
}
