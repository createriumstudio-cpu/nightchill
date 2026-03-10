"use client";

import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://futatabito.com";

interface JsonLdProps {
  type?: "website" | "article" | "organization";
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export default function JsonLd({ type = "website", title, description, url, image, datePublished, dateModified }: JsonLdProps) {
  const baseData = {
    "@context": "https://schema.org",
  };

  let data;

  if (type === "organization") {
    data = {
      ...baseData,
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
      },
      description: "デートの\"どこ行く？\"を30秒で解決。全国10都市対応のデートプランAI。",
      sameAs: [],
    };
  } else if (type === "article") {
    data = {
      ...baseData,
      "@type": "Article",
      headline: title || "futatabito",
      description: description || "",
      url: url || siteUrl,
      image: image || `${siteUrl}/api/og`,
      inLanguage: "ja",
      ...(datePublished && { datePublished }),
      ...(dateModified && { dateModified }),
      author: {
        "@type": "Organization",
        name: "futatabito",
        url: siteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "futatabito",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/api/og`,
          width: 1200,
          height: 630,
        },
      },
    };
  } else {
    data = {
      ...baseData,
      "@type": "WebSite",
      name: "futatabito",
      url: siteUrl,
      description: description || "デートの\"どこ行く？\"を30秒で解決。全国10都市対応のデートプランAI。",
      inLanguage: "ja",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/plan?city={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  }

  return (
    <Script
      id={`json-ld-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}
