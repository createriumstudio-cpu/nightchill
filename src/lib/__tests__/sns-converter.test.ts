import {
  generateSnsContent,
  saveSnsContent,
  getSnsContentsBySlug,
  convertAndSave,
} from "../sns-converter";
import type { FeaturedArticle } from "../features";

// Mock dependencies
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

jest.mock("../env", () => ({
  env: () => ({
    ANTHROPIC_API_KEY: "test-key",
    ANTHROPIC_MODEL: "claude-sonnet-4-6",
    NEXT_PUBLIC_SITE_URL: "https://test.com",
  }),
}));

jest.mock("../db", () => ({
  getDb: jest.fn(),
}));

import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db";

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

const mockArticle: FeaturedArticle = {
  slug: "shibuya-date-guide",
  title: "渋谷デートスポットガイド",
  subtitle: "渋谷の隠れ家デート",
  description: "渋谷エリアのおすすめデートスポットを紹介",
  area: "渋谷",
  tags: ["渋谷", "ディナー", "カフェ"],
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  heroEmoji: "🌃",
  spots: [
    {
      name: "テストカフェ",
      area: "渋谷",
      genre: "カフェ",
      description: "おしゃれなカフェ",
      tip: "窓際の席がおすすめ",
    },
    {
      name: "テストバー",
      area: "渋谷",
      genre: "バー",
      description: "落ち着いたバー",
      tip: "カクテルが人気",
    },
  ],
};

const mockAIResponse = {
  instagram: {
    slides: [
      { text: "渋谷デートなら、ここは外せない！" },
      { text: "まずはテストカフェでまったり" },
    ],
    hashtags: ["渋谷デート", "カフェ巡り"],
  },
  x: {
    tweets: [
      { text: "渋谷デートのおすすめルート" },
      { text: "テストカフェ→テストバーの流れが最高" },
    ],
  },
  tiktok: {
    hook: "渋谷デートで失敗しない方法、知ってる？",
    body: "まず最初に行くのはテストカフェ。窓際の席がおすすめ。",
    cta: "保存して次のデートで使ってね！",
  },
};

describe("sns-converter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSnsContent", () => {
    it("should generate SNS content from article using Claude API", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockAIResponse),
          },
        ],
      });

      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await generateSnsContent(mockArticle);

      expect(result.instagram.slides).toHaveLength(2);
      expect(result.instagram.hashtags).toContain("渋谷デート");
      expect(result.x.tweets).toHaveLength(2);
      expect(result.tiktok.hook).toBeTruthy();
      expect(result.tiktok.body).toBeTruthy();
      expect(result.tiktok.cta).toBeTruthy();
    });

    it("should handle JSON wrapped in code blocks", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: "```json\n" + JSON.stringify(mockAIResponse) + "\n```",
          },
        ],
      });

      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await generateSnsContent(mockArticle);

      expect(result.instagram.slides.length).toBeGreaterThan(0);
      expect(result.x.tweets.length).toBeGreaterThan(0);
    });

    it("should throw on invalid AI response", async () => {
      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: "no json here" }],
          }),
        },
      }));

      await expect(generateSnsContent(mockArticle)).rejects.toThrow(
        "AI response did not contain valid JSON",
      );
    });

    it("should throw on missing required fields", async () => {
      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [
              { type: "text", text: JSON.stringify({ instagram: { slides: null }, x: {}, tiktok: {} }) },
            ],
          }),
        },
      }));

      await expect(generateSnsContent(mockArticle)).rejects.toThrow(
        "AI response missing required fields",
      );
    });
  });

  describe("getSnsContentsBySlug", () => {
    it("should return empty results when DB is not available", async () => {
      mockGetDb.mockReturnValue(null);

      const result = await getSnsContentsBySlug("test-slug");

      expect(result).toEqual({
        instagram: null,
        x: null,
        tiktok: null,
      });
    });

    it("should return saved contents from DB", async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 1,
              featureSlug: "test-slug",
              platform: "instagram",
              content: mockAIResponse.instagram,
            },
            {
              id: 2,
              featureSlug: "test-slug",
              platform: "x",
              content: mockAIResponse.x,
            },
          ]),
        }),
      });

      mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

      const result = await getSnsContentsBySlug("test-slug");

      expect(result.instagram).toEqual(mockAIResponse.instagram);
      expect(result.x).toEqual(mockAIResponse.x);
      expect(result.tiktok).toBeNull();
    });
  });

  describe("saveSnsContent", () => {
    it("should throw when DB is not available", async () => {
      mockGetDb.mockReturnValue(null);

      await expect(
        saveSnsContent("test-slug", "instagram", mockAIResponse.instagram),
      ).rejects.toThrow("Database not available");
    });

    it("should insert new record when no existing record", async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockGetDb.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      } as unknown as ReturnType<typeof getDb>);

      await saveSnsContent("test-slug", "instagram", mockAIResponse.instagram);

      expect(mockInsert).toHaveBeenCalled();
    });

    it("should update existing record", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { id: 1, featureSlug: "test-slug", platform: "instagram" },
          ]),
        }),
      });

      mockGetDb.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      } as unknown as ReturnType<typeof getDb>);

      await saveSnsContent("test-slug", "instagram", mockAIResponse.instagram);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("convertAndSave", () => {
    it("should generate and save all platforms", async () => {
      // Mock AI generation
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          { type: "text", text: JSON.stringify(mockAIResponse) },
        ],
      });

      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      // Mock DB operations
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockGetDb.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      } as unknown as ReturnType<typeof getDb>);

      const result = await convertAndSave(mockArticle);

      expect(result.instagram).toBeTruthy();
      expect(result.x).toBeTruthy();
      expect(result.tiktok).toBeTruthy();
      // 3 platforms saved
      expect(mockInsert).toHaveBeenCalledTimes(3);
    });
  });
});
