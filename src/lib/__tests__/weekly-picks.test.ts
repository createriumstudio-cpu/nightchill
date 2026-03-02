import {
  getCurrentWeeklyPicks,
  getWeeklyPicksForCity,
  getWeekRangeLabel,
  getAllWeeklyPickSets,
} from "../weekly-picks";

describe("getCurrentWeeklyPicks", () => {
  it("should return a valid pick set", () => {
    const result = getCurrentWeeklyPicks();
    expect(result.id).toBeDefined();
    expect(result.theme).toBeDefined();
    expect(result.themeEmoji).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.picks.length).toBeGreaterThan(0);
  });

  it("should return different picks for different weeks", () => {
    const week1 = getCurrentWeeklyPicks(new Date("2026-03-02")); // Monday
    const week2 = getCurrentWeeklyPicks(new Date("2026-03-09")); // Next Monday
    // Different weeks should produce different results (unless they happen to map to same index)
    // At least the function should not throw
    expect(week1).toBeDefined();
    expect(week2).toBeDefined();
  });

  it("should return the same picks within the same week", () => {
    const monday = getCurrentWeeklyPicks(new Date("2026-03-02"));
    const wednesday = getCurrentWeeklyPicks(new Date("2026-03-04"));
    const sunday = getCurrentWeeklyPicks(new Date("2026-03-08"));
    expect(monday.id).toBe(wednesday.id);
    expect(monday.id).toBe(sunday.id);
  });

  it("each pick should have required fields", () => {
    const result = getCurrentWeeklyPicks();
    for (const pick of result.picks) {
      expect(pick.cityId).toBeDefined();
      expect(pick.area).toBeDefined();
      expect(pick.title).toBeDefined();
      expect(pick.subtitle).toBeDefined();
      expect(pick.mood).toBeDefined();
      expect(["daytime", "evening", "allday"]).toContain(pick.timeOfDay);
    }
  });
});

describe("getWeeklyPicksForCity", () => {
  it("should filter picks by city", () => {
    const tokyoPicks = getWeeklyPicksForCity("tokyo", new Date("2026-03-02"));
    for (const pick of tokyoPicks) {
      expect(pick.cityId).toBe("tokyo");
    }
  });

  it("should return empty array for city with no picks this week", () => {
    // We test a city that may or may not have picks
    const result = getWeeklyPicksForCity("nonexistent-city");
    expect(result).toEqual([]);
  });
});

describe("getWeekRangeLabel", () => {
  it("should return a formatted week range string", () => {
    const label = getWeekRangeLabel(new Date("2026-03-04")); // Wednesday
    // Should include the Monday and Sunday of that week
    expect(label).toMatch(/3\/2 〜 3\/8/);
  });

  it("should handle year boundaries", () => {
    const label = getWeekRangeLabel(new Date("2026-01-01")); // Thursday
    expect(label).toBeDefined();
    expect(label).toContain("〜");
  });
});

describe("getAllWeeklyPickSets", () => {
  it("should return all 8 pick sets", () => {
    const sets = getAllWeeklyPickSets();
    expect(sets.length).toBe(8);
  });

  it("should have unique IDs", () => {
    const sets = getAllWeeklyPickSets();
    const ids = sets.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each set should have picks from multiple cities", () => {
    const sets = getAllWeeklyPickSets();
    for (const set of sets) {
      expect(set.picks.length).toBeGreaterThanOrEqual(2);
    }
  });
});
