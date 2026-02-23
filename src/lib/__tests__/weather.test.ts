import { getWeather, formatWeatherForPrompt } from "../weather";
import type { WeatherData } from "../weather";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("weather", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENWEATHERMAP_API_KEY;
  });

  describe("getWeather", () => {
    it("returns null when API key is not set", async () => {
      const result = await getWeather("渋谷");
      expect(result).toBeNull();
    });

    it("returns weather data for known Tokyo area", async () => {
      process.env.OPENWEATHERMAP_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weather: [{ main: "Clear", description: "快晴" }],
          main: { temp: 22.5, feels_like: 21.8, humidity: 45 },
        }),
      });

      const result = await getWeather("渋谷");

      expect(result).not.toBeNull();
      expect(result!.condition).toBe("晴れ");
      expect(result!.icon).toBe("☀️");
      expect(result!.temperature).toBe(23);
      expect(result!.humidity).toBe(45);
      expect(result!.advice).toContain("お出かけ日和");
    });

    it("returns rainy advice for rain condition", async () => {
      process.env.OPENWEATHERMAP_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weather: [{ main: "Rain", description: "小雨" }],
          main: { temp: 18, feels_like: 16, humidity: 80 },
        }),
      });

      const result = await getWeather("渋谷");

      expect(result).not.toBeNull();
      expect(result!.condition).toBe("雨");
      expect(result!.advice).toContain("屋内デートプラン");
    });

    it("returns null on API error", async () => {
      process.env.OPENWEATHERMAP_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await getWeather("渋谷");
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      process.env.OPENWEATHERMAP_API_KEY = "test-key";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await getWeather("渋谷");
      expect(result).toBeNull();
    });

    it("uses geocoding API for unknown areas", async () => {
      process.env.OPENWEATHERMAP_API_KEY = "test-key";

      // First call: geocoding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ lat: 35.68, lon: 139.77 }]),
      });
      // Second call: weather
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weather: [{ main: "Clouds", description: "曇り" }],
          main: { temp: 20, feels_like: 19, humidity: 60 },
        }),
      });

      const result = await getWeather("三鷹");

      expect(result).not.toBeNull();
      expect(result!.condition).toBe("曇り");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("formatWeatherForPrompt", () => {
    it("formats weather data correctly", () => {
      const weather: WeatherData = {
        condition: "晴れ",
        conditionCode: "Clear",
        temperature: 22,
        feelsLike: 21,
        humidity: 45,
        icon: "☀️",
        description: "快晴",
        advice: "お出かけ日和です！テラス席や公園散歩も楽しめます。",
      };

      const result = formatWeatherForPrompt(weather);

      expect(result).toContain("現在の天気情報");
      expect(result).toContain("☀️ 晴れ");
      expect(result).toContain("22°C");
      expect(result).toContain("体感 21°C");
      expect(result).toContain("45%");
      expect(result).toContain("天気を考慮したプラン");
    });
  });
});
