import { generateSlug, savePlan, getPlanBySlug, getRecentPlanSlugs } from "../plans";
import type { DatePlan } from "../types";

// Mock the db module
jest.mock("../db", () => ({
  getDb: jest.fn(),
}));

import { getDb } from "../db";

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

const mockPlan: DatePlan = {
  id: "test-plan-1",
  title: "渋谷デートプラン",
  summary: "渋谷エリアで楽しむ半日デート",
  timeline: [
    {
      time: "12:00",
      duration: "60分",
      activity: "ランチ",
      venue: "テストカフェ",
      description: "おしゃれなカフェでランチ",
      tip: "予約がおすすめ",
    },
    {
      time: "14:00",
      duration: "90分",
      activity: "ショッピング",
      venue: "渋谷109",
      description: "トレンドショッピング",
      tip: "3階がおすすめ",
    },
  ],
  fashionAdvice: "カジュアルな服装で",
  warnings: [],
};

describe("generateSlug", () => {
  it("should generate a URL-safe string", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should generate 8-character slugs", () => {
    const slug = generateSlug();
    expect(slug.length).toBe(8);
  });

  it("should generate unique slugs", () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      slugs.add(generateSlug());
    }
    expect(slugs.size).toBe(100);
  });
});

describe("savePlan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when database is not configured", async () => {
    mockGetDb.mockReturnValue(null);
    const result = await savePlan(mockPlan, "tokyo", "渋谷");
    expect(result).toBeNull();
  });

  it("should save plan and return slug on success", async () => {
    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });
    mockGetDb.mockReturnValue({ insert: mockInsert } as unknown as ReturnType<typeof getDb>);

    const slug = await savePlan(mockPlan, "tokyo", "渋谷");
    expect(slug).not.toBeNull();
    expect(typeof slug).toBe("string");
    expect(slug!.length).toBe(8);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should retry on unique constraint violation", async () => {
    let callCount = 0;
    const mockValues = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error("unique constraint violation");
      }
      return Promise.resolve(undefined);
    });
    const mockInsert = jest.fn().mockReturnValue({
      values: mockValues,
    });
    mockGetDb.mockReturnValue({ insert: mockInsert } as unknown as ReturnType<typeof getDb>);

    const slug = await savePlan(mockPlan, "tokyo", "渋谷");
    expect(slug).not.toBeNull();
    expect(callCount).toBe(2);
  });

  it("should return null on non-unique error", async () => {
    const mockValues = jest.fn().mockRejectedValue(new Error("connection failed"));
    const mockInsert = jest.fn().mockReturnValue({
      values: mockValues,
    });
    mockGetDb.mockReturnValue({ insert: mockInsert } as unknown as ReturnType<typeof getDb>);

    const slug = await savePlan(mockPlan, "tokyo", "渋谷");
    expect(slug).toBeNull();
  });
});

describe("getPlanBySlug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when database is not configured", async () => {
    mockGetDb.mockReturnValue(null);
    const result = await getPlanBySlug("abc12345");
    expect(result).toBeNull();
  });

  it("should return null when slug not found", async () => {
    const mockWhere = jest.fn().mockResolvedValue([]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

    const result = await getPlanBySlug("notfound");
    expect(result).toBeNull();
  });

  it("should return plan data when slug found", async () => {
    const dbRow = {
      id: 1,
      slug: "abc12345",
      title: "渋谷デートプラン",
      content: {
        id: "test-plan-1",
        title: "渋谷デートプラン",
        summary: "渋谷エリアで楽しむ半日デート",
        timeline: mockPlan.timeline,
        fashionAdvice: "カジュアルな服装で",
        warnings: [],
      },
      city: "tokyo",
      location: "渋谷",
      createdAt: new Date("2026-03-03"),
    };
    const mockWhere = jest.fn().mockResolvedValue([dbRow]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

    const result = await getPlanBySlug("abc12345");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("abc12345");
    expect(result!.title).toBe("渋谷デートプラン");
    expect(result!.plan.timeline).toHaveLength(2);
    expect(result!.city).toBe("tokyo");
    expect(result!.location).toBe("渋谷");
  });
});

describe("getRecentPlanSlugs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when database is not configured", async () => {
    mockGetDb.mockReturnValue(null);
    const result = await getRecentPlanSlugs();
    expect(result).toEqual([]);
  });

  it("should return slugs on success", async () => {
    const mockLimit = jest.fn().mockResolvedValue([
      { slug: "slug1" },
      { slug: "slug2" },
    ]);
    const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    mockGetDb.mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof getDb>);

    const result = await getRecentPlanSlugs(10);
    expect(result).toEqual(["slug1", "slug2"]);
  });
});
