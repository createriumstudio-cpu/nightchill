import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getActiveProducts } from "@/lib/products";
import Link from "next/link";

export const metadata: Metadata = {
  title: "デートをもっと楽しくするアイテム | futatabito",
  description:
    "futatabitoがセレクトした、デートの成功率を上げるアイテムをご紹介。ブレスケア、会話カード、ギフトなど。",
};

export const revalidate = 3600; // ISR: 1時間

export default async function ProductsPage() {
  const productList = await getActiveProducts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              デートをもっと楽しくするアイテム
            </h1>
            <p className="text-gray-400 text-lg">
              futatabitoがセレクトした、デートの成功率を上げるアイテム
            </p>
          </div>

          {productList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                現在、商品を準備中です。お楽しみに！
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productList.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden transition-all hover:border-amber-500/50 hover:bg-gray-900/80"
                >
                  {product.imageUrl ? (
                    <div className="relative h-48 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-r from-amber-500/10 to-gray-900/10 flex items-center justify-center">
                      <span className="text-4xl">🎁</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h2>
                    {product.shortDescription && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}
                    <p className="text-xl font-bold text-amber-400">
                      &yen;{product.price.toLocaleString()}
                      <span className="text-xs text-gray-500 ml-1">税込</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
