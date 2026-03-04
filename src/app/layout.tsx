import { Noto_Sans_JP } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://futatabito.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a1a2e" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
};

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: {
    default: "futatabito - デートプランAI | 全国10都市対応",
    template: "%s | futatabito",
  },
  description:
    "デートの\"どこ行く？\"を30秒で解決。全国10都市対応、実在店舗のみ、毎週更新。お店選び・時間配分・移動ルートまでAIがまるっと提案するデートプランナー。",
  keywords: [
    "デートプラン",
    "デートガイド",
    "初デート 成功",
    "記念日 プラン",
    "デート カルチャー",
    "東京 デート",
    "大阪 デート",
    "京都 デート",
    "プロポーズ プラン",
    "futatabito",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "futatabito - デートプランAI | 全国10都市対応",
    description:
      "デートの\"どこ行く？\"を30秒で解決。全国10都市対応、実在店舗のみ、毎週更新。お店選び・時間配分・移動ルートまでAIがまるっと提案するデートプランナー。",
    url: siteUrl,
    siteName: "futatabito",
    locale: "ja_JP",
    type: "website",
      images: [{ url: "/api/og", width: 1200, height: 630, alt: "futatabito" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
    title: "futatabito - デートプランAI | 全国10都市対応",
    description:
      "デートの\"どこ行く？\"を30秒で解決。お店選び・時間配分・移動ルートまでAIがまるっと提案。",
    site: "@nightchill_date",
    creator: "@nightchill_date",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      ja: siteUrl,
      en: `${siteUrl}/en`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webAppLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "futatabito",
    alternateName: "ふたたびと",
    description:
      "デートの\"どこ行く？\"を30秒で解決。全国10都市対応、実在店舗のみ、毎週更新。お店選び・時間配分・移動ルートまでAIがまるっと提案するデートプランナー。",
    url: siteUrl,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "ja",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    publisher: {
      "@type": "Organization",
      name: "futatabito",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/plan?city={city}`,
      },
      "query-input": "required name=city",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "100",
      bestRating: "5",
    },
  };

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "futatabito",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/api/og`,
      width: 1200,
      height: 630,
    },
    sameAs: [
      "https://x.com/nightchill_date",
    ],
  };

  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </head>
      <body className={`antialiased ${notoSansJP.className}`}>{children}
          <Analytics /></body>
    </html>
  );
}
