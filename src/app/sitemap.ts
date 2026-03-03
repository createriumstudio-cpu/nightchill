import type { MetadataRoute } from "next";
import { CITY_IDS } from "@/lib/cities";
import { getAllPublishedSlugs } from "@/lib/blog";
import { getRecentPlanSlugs } from "@/lib/plans";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      lastModified: new Date("2026-02-28"),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          ja: baseUrl,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-03-03"),
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
    lastModified: new Date("2026-02-28"),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    alternates: {
      languages: {
        ja: `${baseUrl}/features/${slug}`,
        en: `${baseUrl}/en/features/${slug}`,
      },
    },
  }));

  // Blog posts
  const blogSlugs = await getAllPublishedSlugs();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // English pages
  const enStaticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          ja: baseUrl,
          en: `${baseUrl}/en`,
        },
      },
    },
  ];

  const enFeaturePages: MetadataRoute.Sitemap = features.map((slug) => ({
    url: `${baseUrl}/en/features/${slug}`,
    lastModified: new Date("2026-02-28"),
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: {
      languages: {
        ja: `${baseUrl}/features/${slug}`,
        en: `${baseUrl}/en/features/${slug}`,
      },
    },
  }));

  // City landing pages
  const cityPages: MetadataRoute.Sitemap = CITY_IDS.map((id) => ({
    url: `${baseUrl}/${id}`,
    lastModified: new Date("2026-03-02"),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // City features pages
  const cityFeaturesPages: MetadataRoute.Sitemap = CITY_IDS.map((id) => ({
    url: `${baseUrl}/${id}/features`,
    lastModified: new Date("2026-03-03"),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Saved plan pages
  const planSlugs = await getRecentPlanSlugs(100);
  const planPages: MetadataRoute.Sitemap = planSlugs.map((slug) => ({
    url: `${baseUrl}/plan/${slug}`,
    changeFrequency: "never" as const,
    priority: 0.4,
  }));

  return [
    ...staticPages,
    ...cityPages,
    ...cityFeaturesPages,
    ...featurePages,
    ...blogPages,
    ...planPages,
    ...enStaticPages,
    ...enFeaturePages,
  ];
}
