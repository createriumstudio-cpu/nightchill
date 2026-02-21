import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nightchill-sr5g.vercel.app";

  const features = [
    "ebisu-night-date",
    "shibuya-casual-date",
    "omotesando-sophisticated-date",
    "roppongi-premium-night",
    "ginza-luxury-date",
    "nakameguro-canal-date",
    "daikanyama-stylish-date",
  ];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/plan`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-02-21"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const featurePages: MetadataRoute.Sitemap = features.map((slug) => ({
    url: `${baseUrl}/features/${slug}`,
    lastModified: new Date("2026-02-21"),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...featurePages];
}
