"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  shortDescription: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number | null;
  isActive: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setProduct)
      .catch(() => setError("商品が見つかりませんでした"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePurchase = async () => {
    if (!product) return;
    setPurchasing(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "購入処理に失敗しました");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
          <p className="text-gray-400">読み込み中...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-400">{error || "商品が見つかりませんでした"}</p>
          <button
            onClick={() => router.push("/products")}
            className="text-accent hover:text-accent-light text-sm"
          >
            商品一覧に戻る
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <div className="grid gap-8 md:grid-cols-2">
            {/* 商品画像 */}
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="h-64 bg-gradient-to-r from-amber-500/10 to-gray-900/10 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
            </div>

            {/* 商品情報 */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-accent mb-6">
                &yen;{product.price.toLocaleString()}
                <span className="text-sm text-gray-500 ml-2">税込</span>
              </p>

              {product.shortDescription && (
                <p className="text-gray-300 mb-6">
                  {product.shortDescription}
                </p>
              )}

              {product.stock !== null && product.stock <= 0 && (
                <p className="text-red-400 text-sm mb-4">現在在庫切れです</p>
              )}

              <button
                onClick={handlePurchase}
                disabled={purchasing || (product.stock !== null && product.stock <= 0)}
                className="w-full rounded-full bg-accent px-8 py-4 text-lg font-bold text-accent-foreground transition-all hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? "処理中..." : "購入する"}
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                Stripeの安全な決済画面に移動します
              </p>
            </div>
          </div>

          {/* 商品説明 */}
          <div className="mt-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-4">商品について</h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
