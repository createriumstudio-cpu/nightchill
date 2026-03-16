"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

function ProductSkeleton() {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6 animate-pulse">
      <div className="h-4 w-48 rounded bg-muted/20 mb-4" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="w-16 h-16 rounded-lg bg-muted/20 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-muted/20" />
              <div className="h-4 w-full rounded bg-muted/20" />
              <div className="h-3 w-16 rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * デートプラン結果画面に表示するコンテキスト連動型商品レコメンド
 *
 * 原則: バナー広告ではなく、文脈に合致した自然なレコメンドのみ表示。
 * 商品がマッチしない場合はセクション自体を非表示にする。
 */
export default function ProductRecommendation({ occasion, mood, budget }: Props) {
  const [products, setProducts] = useState<ProductRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ occasion, mood, budget, limit: "2" });
    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [occasion, mood, budget]);

  if (loading) return <ProductSkeleton />;
  if (products.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6">
      <h3 className="text-sm font-medium text-muted mb-4">
        このデートにおすすめのアイテム
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/50 hover:shadow-md"
          >
            {product.imageUrl ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <span className="text-2xl">🎁</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-accent mb-1">
                {product.relevanceReason}
              </p>
              <h4 className="text-sm font-bold group-hover:text-accent transition-colors truncate">
                {product.name}
              </h4>
              {product.shortDescription && (
                <p className="text-xs text-muted mt-1 line-clamp-1">
                  {product.shortDescription}
                </p>
              )}
              <p className="text-sm font-bold text-accent mt-1">
                &yen;{product.price.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
