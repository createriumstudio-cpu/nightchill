// DB モジュールをモック（@neondatabase/serverless の TextDecoder 問題を回避）
jest.mock("../db", () => ({
  getDb: jest.fn(() => null),
}));

import {
  generateTemplateBlogPost,
  searchSpotsForBlog,
  generateBlogPostWithAI,
  saveBlogPostAsDraft,
  runBlogBatch,
  type GeneratedBlogPost,
  type BlogCategory,
} from "../blog-generator";
import type { CityData } from "../cities";

// ── テストデータ ──

const mockCity: CityData = {
  id: "tokyo",
  name: "東京",
  searchName: "東京",
  description: "トレンドとカルチャーが交差する首都",
  heroImage: "/images/cities/tokyo.png",
  areas: ["渋谷", "新宿", "表参道"],
};

const mockPlaces = [
  {
    id: "place-1",
    displayName: { text: "テストカフェ渋谷", languageCode: "ja" },
    formattedAddress: "東京都渋谷区神南1-1-1",
    location: { latitude: 35.6612, longitude: 139.701 },
    rating: 4.5,
    types: ["cafe", "food"],
    photos: [{ name: "places/photo-1" }],
    googleMapsUri: "https://maps.google.com/?cid=123",
    editorialSummary: { text: "おしゃれなカフェ" },
  },
  {
    id: "place-2",
    displayName: { text: "テストレストラン新宿", languageCode: "ja" },
    formattedAddress: "東京都新宿区歌舞伎町1-1-1",
    location: { latitude: 35.6938, longitude: 139.7034 },
    rating: 4.2,
    types: ["restaurant"],
    photos: [],
    googleMapsUri: "https://maps.google.com/?cid=456",
  },
];

// ============================================================
// generateTemplateBlogPost
// ============================================================

describe("generateTemplateBlogPost", () => {
  it("should generate a blog post with correct structure", () => {
    const post = generateTemplateBlogPost(mockCity, "date-plan", mockPlaces);

    expect(post.slug).toMatch(/^tokyo-date-plan-\d{8}$/);
    expect(post.title).toContain("東京");
    expect(post.excerpt).toContain("東京");
    expect(post.content).toContain("テストカフェ渋谷");
    expect(post.category).toBe("date-plan");
    expect(post.tags).toContain("東京");
    expect(post.tags).toContain("デート");
    expect(post.city).toBe("tokyo");
  });

  it("should include spot information in content", () => {
    const post = generateTemplateBlogPost(mockCity, "spot-guide", mockPlaces);

    expect(post.content).toContain("テストカフェ渋谷");
    expect(post.content).toContain("東京都渋谷区神南1-1-1");
    expect(post.content).toContain("★4.5");
  });

  it("should handle spots without editorial summary", () => {
    const post = generateTemplateBlogPost(mockCity, "date-plan", mockPlaces);

    expect(post.content).toContain("テストレストラン新宿");
    expect(post.content).toContain("東京で人気のテストレストラン新宿");
  });

  it("should handle empty spots array", () => {
    const post = generateTemplateBlogPost(mockCity, "seasonal-event", []);

    expect(post.slug).toMatch(/^tokyo-seasonal-event-\d{8}$/);
    expect(post.title).toContain("東京");
    expect(post.content).toBeTruthy();
  });

  it("should generate correct slug for each category", () => {
    const categories: BlogCategory[] = ["date-plan", "spot-guide", "seasonal-event"];
    for (const cat of categories) {
      const post = generateTemplateBlogPost(mockCity, cat, mockPlaces);
      expect(post.slug).toContain(cat);
      expect(post.category).toBe(cat);
    }
  });

  it("should limit spots to 5 in content", () => {
    const manySpots = Array.from({ length: 10 }, (_, i) => ({
      id: `place-${i}`,
      displayName: { text: `スポット${i}`, languageCode: "ja" },
      formattedAddress: `住所${i}`,
      rating: 4.0,
      types: ["restaurant"],
      photos: [],
    }));

    const post = generateTemplateBlogPost(mockCity, "date-plan", manySpots);

    expect(post.content).toContain("スポット0");
    expect(post.content).toContain("スポット4");
    expect(post.content).not.toContain("スポット5");
  });
});

// ============================================================
// searchSpotsForBlog
// ============================================================

describe("searchSpotsForBlog", () => {
  it("should return empty array when GOOGLE_PLACES_API_KEY not set", async () => {
    const originalKey = process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_PLACES_API_KEY;

    const spots = await searchSpotsForBlog(mockCity, "date-plan");
    expect(spots).toEqual([]);

    if (originalKey) process.env.GOOGLE_PLACES_API_KEY = originalKey;
  });
});

// ============================================================
// generateBlogPostWithAI
// ============================================================

describe("generateBlogPostWithAI", () => {
  it("should fallback to template when ANTHROPIC_API_KEY not set", async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const post = await generateBlogPostWithAI(mockCity, "date-plan", mockPlaces);
    expect(post).not.toBeNull();
    expect(post!.slug).toMatch(/^tokyo-date-plan-\d{8}$/);
    expect(post!.title).toContain("東京");

    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  });
});

// ============================================================
// saveBlogPostAsDraft
// ============================================================

describe("saveBlogPostAsDraft", () => {
  it("should return error when database not available", async () => {
    const mockPost: GeneratedBlogPost = {
      slug: "test-slug",
      title: "Test Title",
      excerpt: "Test excerpt",
      content: "Test content",
      category: "date-plan",
      tags: ["test"],
      city: "tokyo",
    };

    const result = await saveBlogPostAsDraft(mockPost);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Database not available");
  });
});

// ============================================================
// runBlogBatch
// ============================================================

describe("runBlogBatch", () => {
  it("should return results array", async () => {
    const originalPlacesKey = process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_PLACES_API_KEY;

    const result = await runBlogBatch();

    expect(result).toHaveProperty("results");
    expect(Array.isArray(result.results)).toBe(true);
    for (const r of result.results) {
      expect(r).toHaveProperty("city");
      expect(r).toHaveProperty("category");
      expect(r).toHaveProperty("success");
    }

    if (originalPlacesKey) process.env.GOOGLE_PLACES_API_KEY = originalPlacesKey;
  }, 30000);
});
