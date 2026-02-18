/**
 * Contextual PR（文脈連動型PR）フレームワーク
 *
 * 大原則: PRは常時表示しない。AIが「ユーザーの課題解決に100%合致する」
 * と判断した箇所にのみ自然に挿入する。
 *
 * PR挿入のON/OFF切替が可能な設計。
 */

import type { Occasion, Mood } from "./types";

export interface PRItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  category: PRCategory;
  targetOccasions: Occasion[];
  targetMoods: Mood[];
  targetAreas: string[];
  priority: number;
  isActive: boolean;
}

export type PRCategory =
  | "restaurant"
  | "hotel"
  | "gift"
  | "experience"
  | "fashion"
  | "transport"
  | "other";

export interface PRInsertionResult {
  item: PRItem;
  insertionPoint: string;
  reason: string;
}

export interface ContextualPRConfig {
  enabled: boolean;
  maxInsertions: number;
  minRelevanceScore: number;
}

// デフォルト設定: PR挿入はOFF
const DEFAULT_CONFIG: ContextualPRConfig = {
  enabled: false,
  maxInsertions: 1,
  minRelevanceScore: 0.8,
};

// PR在庫（将来的にはDB/CMSから取得）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PR_INVENTORY: PRItem[] = [
  // Phase 2以降でCMS連携時にここにPRデータが入る
  // 現時点では空配列（PR表示なし）
];

/**
 * 設定を取得（環境変数でON/OFF制御可能）
 */
export function getPRConfig(): ContextualPRConfig {
  const envEnabled = process.env.CONTEXTUAL_PR_ENABLED;
  return {
    ...DEFAULT_CONFIG,
    enabled: envEnabled === "true",
  };
}

/**
 * 文脈に合致するPRを検索
 *
 * @param occasion - デートのシチュエーション
 * @param mood - 雰囲気
 * @param area - エリア
 * @param config - PR設定
 * @returns 合致するPRアイテムの配列（空配列 = 挿入なし）
 */
export function findRelevantPR(
  occasion: Occasion,
  mood: Mood,
  area: string,
  config: ContextualPRConfig = getPRConfig(),
): PRItem[] {
  if (!config.enabled) {
    return [];
  }

  return PR_INVENTORY
    .filter((item) => item.isActive)
    .filter((item) => {
      const occasionMatch =
        item.targetOccasions.length === 0 ||
        item.targetOccasions.includes(occasion);
      const moodMatch =
        item.targetMoods.length === 0 || item.targetMoods.includes(mood);
      const areaMatch =
        item.targetAreas.length === 0 ||
        item.targetAreas.some((a) =>
          area.toLowerCase().includes(a.toLowerCase()),
        );
      return occasionMatch && moodMatch && areaMatch;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, config.maxInsertions);
}

/**
 * PR情報をAIプロンプト用テキストに変換
 * AIに「文脈に100%合致する場合のみ」自然な形で言及させる
 */
export function formatPRForPrompt(items: PRItem[]): string {
  if (items.length === 0) {
    return "";
  }

  const parts: string[] = [];
  parts.push("【参考情報 — 文脈に100%合致する場合のみ自然に言及可】");
  for (const item of items) {
    parts.push(`- ${item.title}: ${item.description} (${item.url})`);
  }
  parts.push("※ 上記は強制表示ではない。ユーザーの体験を損なう場合は絶対に言及しないこと。");

  return parts.join("\n");
}
