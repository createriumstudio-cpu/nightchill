"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

function CancelContent() {
  const searchParams = useSearchParams();
  const productSlug = searchParams.get("product");

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="text-6xl mb-6">🛒</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        お支払いがキャンセルされました
      </h1>

      <p className="text-gray-400 mb-8">
        お支払い手続きがキャンセルされました。カートの内容は失われていません。
      </p>

      <div className="flex flex-col items-center gap-4">
        {productSlug && (
          <Link
            href={`/products/${productSlug}`}
            className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-light"
          >
            商品ページに戻る
          </Link>
        )}
        <Link
          href="/products"
          className="rounded-full border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-amber-500/50 hover:text-white"
        >
          商品一覧に戻る
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
          <CancelContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
