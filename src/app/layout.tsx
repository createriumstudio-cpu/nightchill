import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nightchill - 成功確約型デートコンシェルジュ",
  description:
    "「どこに行くか」ではなく「どうデートするか」。nightchillがあなたの特別な夜を完璧にプロデュースします。",
  keywords: ["デート", "コンシェルジュ", "デートプラン", "nightchill"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
