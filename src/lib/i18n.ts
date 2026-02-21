export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill-sr5g.vercel.app";

export interface FeatureTranslation {
  title: string;
  subtitle: string;
  description: string;
  area: string;
}

export const featureTranslations: Record<string, FeatureTranslation> = {
  "omotesando-sophisticated-date": {
    title: "Omotesando Sophisticated Date Plan Guide",
    subtitle: "A refined couple\'s guide to Tokyo\'s most stylish boulevard",
    description: "Discover the perfect Omotesando date: trendy cafes, flagship boutiques, and hidden backstreet gems. A curated guide for couples.",
    area: "Omotesando",
  },
  "ginza-luxury-date": {
    title: "Ginza Luxury Date Guide",
    subtitle: "An elegant evening in Tokyo\'s most prestigious district",
    description: "Plan a luxurious Ginza date with world-class dining, art galleries, and sophisticated nightlife. The ultimate upscale Tokyo date.",
    area: "Ginza",
  },
  "ebisu-night-date": {
    title: "Ebisu Night Date Guide",
    subtitle: "From Italian dining to stylish bars in one of Tokyo\'s coolest neighborhoods",
    description: "Explore Ebisu\'s best restaurants and bars for a memorable night date. Your guide to a delicious Tokyo evening experience.",
    area: "Ebisu",
  },
  "roppongi-premium-night": {
    title: "Roppongi Premium Night Date",
    subtitle: "Stunning night views and refined dining in Tokyo\'s most cosmopolitan district",
    description: "Experience Roppongi\'s premium lounges, Tokyo Tower views, and vibrant dining scene. A perfect date plan for a special night out.",
    area: "Roppongi",
  },
  "nakameguro-canal-date": {
    title: "Nakameguro Canal Date Plan",
    subtitle: "A romantic stroll along the Meguro River with hidden gems",
    description: "Walk along Nakameguro\'s iconic canal, discover cafes, bistros, and charming galleries. A Tokyo date spot loved by locals.",
    area: "Nakameguro",
  },
  "daikanyama-stylish-date": {
    title: "Daikanyama Stylish Date Plan",
    subtitle: "Vintage shops, terrace cafes, and creative energy",
    description: "Explore Daikanyama\'s architectural wonders, bookstores, and designer boutiques. A sophisticated date in Tokyo\'s most creative area.",
    area: "Daikanyama",
  },
  "shibuya-casual-date": {
    title: "Shibuya Casual Date Plan",
    subtitle: "Relaxed vibes and hidden gems in Tokyo\'s most energetic district",
    description: "Discover Shibuya\'s best casual date spots: specialty coffee, cozy hideaways, and the city\'s vibrant street culture.",
    area: "Shibuya",
  },
};

export const uiTranslations = {
  ja: {
    siteName: "futatabito",
    tagline: "デート視点の東京カルチャーガイド",
    catchphrase: "ふたりの時間を、もっとおもしろく。",
    features: "特集",
    backToFeatures: "← 特集一覧に戻る",
    spots: "スポット",
    ugcTitle: "みんなの投稿",
    about: "について",
    privacy: "プライバシー",
    language: "English",
    dateGuide: "デートプラン",
    viewDetails: "詳しく見る",
  },
  en: {
    siteName: "futatabito",
    tagline: "Tokyo Culture Guide for Date Planning",
    catchphrase: "Make your time together more exciting.",
    features: "Features",
    backToFeatures: "← Back to Features",
    spots: "Spots",
    ugcTitle: "Community Posts",
    about: "About",
    privacy: "Privacy",
    language: "日本語",
    dateGuide: "Date Plans",
    viewDetails: "View Details",
  },
};
