"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        ご購入ありがとうございます！
      </h1>

      {orderNumber && (
        <p className="text-gray-400 mb-2">
          注文番号: <span className="text-accent font-mono">{orderNumber}</span>
        </p>
      )}

      <p className="text-gray-400 mb-8">
        確認メールをお送りしました。商品の発送準備が整い次第、改めてご連絡いたします。
      </p>

      <div className="flex flex-col items-center gap-4">
        <Link
          href="/products"
          className="rounded-full border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-amber-500/50 hover:text-white"
        >
          他のアイテムを見る
        </Link>
        <Link
          href="/plan"
          className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-light"
        >
          デートプランを作成
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
