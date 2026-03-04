import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.isActive) {
    return NextResponse.json({ error: "Product not available" }, { status: 404 });
  }

  return NextResponse.json(product);
}
