"use client";

import Script from "next/script";

interface JsonLdProps {
  type?: "website" | "article" | "organization";
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export default function JsonLd({ type = "website", title, description, url, image }: JsonLdProps) {
  const siteUrl = "https://nightchill-sr5g.vercel.app";

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
      logo: `${siteUrl}/favicon.ico`,
      description: "デート視点の東京カルチャーガイド。ふたりの時間を、もっとおもしろく。",
      sameAs: [
        "https://x.com/nightchill_date",
        "https://www.instagram.com/nightchill_date",
      ],
    };
  } else if (type === "article") {
    data = {
      ...baseData,
      "@type": "Article",
      headline: title || "futatabito",
      description: description || "",
      url: url || siteUrl,
      image: image || `${siteUrl}/favicon.ico`,
      publisher: {
        "@type": "Organization",
        name: "futatabito",
        logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.ico` },
      },
    };
  } else {
    data = {
      ...baseData,
      "@type": "WebSite",
      name: "futatabito",
      url: siteUrl,
      description: description || "デート視点の東京カルチャーガイド。ふたりの時間を、もっとおもしろく。",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/chat?q={search_term_string}`,
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
