"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProductRec {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  relevanceReason: string;
}

interface Props {
  occasion: string;
  mood: string;
  budget: string;
}

/**
 * デートプラン結果画面に表示するコンテキスト連動型商品レコメンド
 *
 * 原則: バナー広告ではなく、文脈に合致した自然なレコメンドのみ表示。
 * 商品がマッチしない場合はセクション自体を非表示にする。
 */
export default function ProductRecommendation({ occasion, mood, budget }: Props) {
  const [products, setProducts] = useState<ProductRec[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ occasion, mood, budget, limit: "2" });
    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {});
  }, [occasion, mood, budget]);

  if (products.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/30 p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        このデートにおすすめのアイテム
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-amber-500/50 hover:bg-gray-900/80"
          >
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <span className="text-2xl">🎁</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-amber-400/80 mb-1">
                {product.relevanceReason}
              </p>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                {product.name}
              </h4>
              {product.shortDescription && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {product.shortDescription}
                </p>
              )}
              <p className="text-sm font-bold text-amber-400 mt-1">
                &yen;{product.price.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
