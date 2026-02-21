import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://futatabito.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "futatabito - デート視点の東京カルチャーガイド",
    template: "%s | futatabito",
  },
  description:
    "「どこに行くか」ではなく「どうデートするか」。ふたりの時間を、もっとおもしろく。東京のデートスポット・カフェ・レストランを独自の視点で提案するカルチャーガイド。",
  keywords: [
    "デートプラン",
    "東京 デートガイド",
    "初デート 成功",
    "記念日 プラン",
    "デート カルチャー",
    "デート 服装",
    "デート 会話",
    "プロポーズ プラン",
    "futatabito",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "futatabito - デート視点の東京カルチャーガイド",
    description:
      "「どこに行くか」ではなく「どうデートするか」。ふたりの時間を、もっとおもしろく。東京デートのカルチャーガイド。",
    url: siteUrl,
    siteName: "futatabito",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "futatabito - デート視点の東京カルチャーガイド",
    description:
      "ふたりの時間を、もっとおもしろく。東京のデートスポットを独自の視点で提案。",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "futatabito",
    description:
      "デート視点で東京のカルチャースポットを提案するライフスタイルガイド",
    url: siteUrl,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
  };

  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
