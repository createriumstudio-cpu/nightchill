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
    subtitle: "A refined couple's guide to Tokyo's most stylish boulevard",
    description: "Discover the perfect Omotesando date: trendy cafes, flagship boutiques, and hidden backstreet gems. A curated guide to Tokyo's chic avenue for couples.",
    area: "Omotesando",
  },
  "ginza-luxury-adult-date": {
    title: "Ginza Luxury Date Plan Guide",
    subtitle: "An elegant evening in Tokyo's most prestigious district",
    description: "Plan a luxurious Ginza date with world-class dining, art galleries, and sophisticated nightlife. The ultimate guide to an upscale Tokyo date experience.",
    area: "Ginza",
  },
  "ebisu-relaxed-gourmet-date": {
    title: "Ebisu Relaxed Gourmet Date Plan Guide",
    subtitle: "Laid-back foodie exploration in one of Tokyo's coolest neighborhoods",
    description: "Explore Ebisu's best restaurants, craft beer spots, and cozy cafes for a relaxed gourmet date. Your guide to a delicious Tokyo date experience.",
    area: "Ebisu",
  },
  "roppongi-art-night-date": {
    title: "Roppongi Art & Night Date Plan Guide",
    subtitle: "Art, culture, and nightlife in Tokyo's most cosmopolitan district",
    description: "Experience Roppongi's world-class art museums, stunning night views, and vibrant dining scene. A perfect date plan for art lovers and night owls.",
    area: "Roppongi",
  },
  "nakameguro-riverside-date": {
    title: "Nakameguro Riverside Date Plan Guide",
    subtitle: "A romantic stroll along the Meguro River with hidden gems",
    description: "Walk along Nakameguro's iconic riverside, discover indie shops, artisan cafes, and trendy galleries. A charming Tokyo date spot loved by locals.",
    area: "Nakameguro",
  },
  "daikanyama-art-culture-date": {
    title: "Daikanyama Art & Culture Date Plan Guide",
    subtitle: "Tokyo's Brooklyn: culture, design, and creative energy",
    description: "Explore Daikanyama's architectural wonders, bookstores, and designer boutiques. A sophisticated date plan in Tokyo's most creative neighborhood.",
    area: "Daikanyama",
  },
  "shimokitazawa-subculture-date": {
    title: "Shimokitazawa Subculture Date Plan Guide",
    subtitle: "Vintage shops, live music, and bohemian charm",
    description: "Dive into Shimokitazawa's vintage stores, theater scene, and indie culture. The ultimate date guide for couples who love Tokyo's alternative side.",
    area: "Shimokitazawa",
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
