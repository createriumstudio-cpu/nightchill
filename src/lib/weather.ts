/**
 * Weather API integration using OpenWeatherMap
 * Provides current weather data for date plan generation
 */

export interface WeatherData {
  /** Weather condition (e.g., "晴れ", "曇り", "雨") */
  condition: string;
  /** Weather condition in English for icon mapping */
  conditionCode: string;
  /** Temperature in Celsius */
  temperature: number;
  /** "Feels like" temperature in Celsius */
  feelsLike: number;
  /** Humidity percentage */
  humidity: number;
  /** Weather icon emoji */
  icon: string;
  /** Short weather description */
  description: string;
  /** Weather-based date advice */
  advice: string;
}

// Map OpenWeatherMap condition codes to Japanese + emoji
const WEATHER_MAP: Record<string, { ja: string; icon: string }> = {
  Clear: { ja: "晴れ", icon: "☀️" },
  Clouds: { ja: "曇り", icon: "☁️" },
  Rain: { ja: "雨", icon: "🌧️" },
  Drizzle: { ja: "小雨", icon: "🌦️" },
  Thunderstorm: { ja: "雷雨", icon: "⛈️" },
  Snow: { ja: "雪", icon: "❄️" },
  Mist: { ja: "霧", icon: "🌫️" },
  Haze: { ja: "もや", icon: "🌫️" },
  Fog: { ja: "霧", icon: "🌫️" },
};

function getWeatherAdvice(conditionCode: string, temp: number): string {
  if (conditionCode === "Rain" || conditionCode === "Drizzle" || conditionCode === "Thunderstorm") {
    return "雨の予報です。屋内デートプランを中心に、折りたたみ傘を忘れずに。";
  }
  if (conditionCode === "Snow") {
    return "雪の予報です。暖かい屋内スポットを中心に、滑りにくい靴を履きましょう。";
  }
  if (temp >= 33) {
    return "猛暑日です。涼しい屋内スポットを中心に、こまめに水分補給しましょう。";
  }
  if (temp >= 28) {
    return "暑い一日です。日中は屋内を中心に、夕方からの外出がおすすめです。";
  }
  if (temp <= 5) {
    return "寒い日です。暖かい服装で、温かいカフェやレストランを中心に。";
  }
  if (conditionCode === "Clear") {
    return "お出かけ日和です！テラス席や公園散歩も楽しめます。";
  }
  return "過ごしやすい天気です。屋内外どちらも楽しめます。";
}

/**
 * Geocode area name to coordinates using OpenWeatherMap Geocoding API
 */
async function geocodeArea(area: string, apiKey: string): Promise<{ lat: number; lon: number } | null> {
  // Default areas in Tokyo
  const TOKYO_AREAS: Record<string, { lat: number; lon: number }> = {
    "東京": { lat: 35.6762, lon: 139.6503 },
    "渋谷": { lat: 35.6580, lon: 139.7016 },
    "新宿": { lat: 35.6938, lon: 139.7034 },
    "銀座": { lat: 35.6717, lon: 139.7649 },
    "表参道": { lat: 35.6654, lon: 139.7121 },
    "池袋": { lat: 35.7295, lon: 139.7109 },
    "六本木": { lat: 35.6628, lon: 139.7313 },
    "恵比寿": { lat: 35.6467, lon: 139.7101 },
    "代官山": { lat: 35.6487, lon: 139.7031 },
    "中目黒": { lat: 35.6440, lon: 139.6989 },
    "下北沢": { lat: 35.6613, lon: 139.6680 },
    "吉祥寺": { lat: 35.7035, lon: 139.5796 },
    "お台場": { lat: 35.6268, lon: 139.7753 },
    "浅草": { lat: 35.7148, lon: 139.7967 },
    "横浜": { lat: 35.4437, lon: 139.6380 },
    "鎌倉": { lat: 35.3192, lon: 139.5467 },
  };

  // Check known areas first
  for (const [name, coords] of Object.entries(TOKYO_AREAS)) {
    if (area.includes(name)) {
      return coords;
    }
  }

  // Fall back to Geocoding API
  try {
    const query = area.includes("東京") || area.includes("Japan") ? area : `${area}, Tokyo, Japan`;
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
  } catch (err) {
    console.error("Geocoding failed:", err);
  }

  // Default to central Tokyo
  return TOKYO_AREAS["東京"];
}

/**
 * Fetch current weather for an area
 * Returns null if API key is not configured or request fails
 */
export async function getWeather(area: string): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.log("OPENWEATHERMAP_API_KEY not configured, skipping weather data");
    return null;
  }

  try {
    const coords = await geocodeArea(area, apiKey);
    if (!coords) return null;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=ja&appid=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      console.error(`Weather API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const mainCondition = data.weather?.[0]?.main || "Clear";
    const mapped = WEATHER_MAP[mainCondition] || { ja: mainCondition, icon: "🌤️" };
    const temp = Math.round(data.main?.temp ?? 20);
    const feelsLike = Math.round(data.main?.feels_like ?? temp);
    const humidity = data.main?.humidity ?? 50;

    return {
      condition: mapped.ja,
      conditionCode: mainCondition,
      temperature: temp,
      feelsLike,
      humidity,
      icon: mapped.icon,
      description: data.weather?.[0]?.description || mapped.ja,
      advice: getWeatherAdvice(mainCondition, temp),
    };
  } catch (err) {
    console.error("Weather API fetch failed:", err);
    return null;
  }
}

/**
 * Format weather data for AI prompt injection
 */
export function formatWeatherForPrompt(weather: WeatherData): string {
  return [
    "=== 現在の天気情報 ===",
    `天気: ${weather.icon} ${weather.condition}（${weather.description}）`,
    `気温: ${weather.temperature}°C（体感 ${weather.feelsLike}°C）`,
    `湿度: ${weather.humidity}%`,
    `アドバイス: ${weather.advice}`,
    "※ 天気を考慮したプランを提案してください（雨なら屋内中心、晴れならテラスや散歩も含めるなど）",
  ].join("\n");
}
