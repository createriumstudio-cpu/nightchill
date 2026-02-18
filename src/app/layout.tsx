import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nightchill.app";

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
    default: "nightchill - 成功確約型デートコンシェルジュ",
    template: "%s | nightchill",
  },
  description:
    "「どこに行くか」ではなく「どうデートするか」。AIがあなたのデートを成功に導く具体的なプラン・服装・会話術を提案。初デートから記念日、プロポーズまで対応。",
  keywords: [
    "デートプラン",
    "デート コンシェルジュ",
    "初デート 成功",
    "記念日 プラン",
    "デート AI",
    "デート 服装",
    "デート 会話",
    "プロポーズ プラン",
    "nightchill",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "nightchill - 成功確約型デートコンシェルジュ",
    description:
      "「どこに行くか」ではなく「どうデートするか」。AIがあなたのデートを成功に導く具体的なプランを提案します。",
    url: siteUrl,
    siteName: "nightchill",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "nightchill - 成功確約型デートコンシェルジュ",
    description:
      "AIがあなたのデートを成功に導く。服装・会話・タイムラインを完璧にプロデュース。",
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
    name: "nightchill",
    description:
      "AIがデートを成功に導く具体的なプラン・服装・会話術を提案するデートコンシェルジュサービス",
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
