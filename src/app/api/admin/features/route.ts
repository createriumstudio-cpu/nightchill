import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { promises as fs } from "fs";
import path from "path";
import type { FeaturedArticle } from "@/lib/features";

const DATA_PATH = path.join(process.cwd(), "src", "data", "features.json");

async function readFeatures(): Promise<FeaturedArticle[]> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeFeatures(data: FeaturedArticle[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * GET /api/admin/features — 全特集を取得
 */
export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const features = await readFeatures();
  return NextResponse.json(features);
}

/**
 * POST /api/admin/features — 新しい特集を追加
 */
export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body: FeaturedArticle = await request.json();

    if (!body.slug || !body.title) {
      return NextResponse.json(
        { error: "slug と title は必須です" },
        { status: 400 }
      );
    }

    const features = await readFeatures();

    // slug の重複チェック
    if (features.some((f) => f.slug === body.slug)) {
      return NextResponse.json(
        { error: "この slug は既に使われています" },
        { status: 409 }
      );
    }

    // デフォルト値を設定
    const now = new Date().toISOString().split("T")[0];
    const newFeature: FeaturedArticle = {
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle || "",
      description: body.description || "",
      area: body.area || "",
      tags: body.tags || [],
      publishedAt: body.publishedAt || now,
      updatedAt: now,
      heroEmoji: body.heroEmoji || "📍",
      heroImage: body.heroImage || "",
      spots: body.spots || [],
    };

    features.push(newFeature);
    await writeFeatures(features);

    return NextResponse.json(newFeature, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストが不正です" },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/admin/features — 特集を更新（slug で識別）
 */
export async function PUT(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body: FeaturedArticle = await request.json();

    if (!body.slug) {
      return NextResponse.json(
        { error: "slug は必須です" },
        { status: 400 }
      );
    }

    const features = await readFeatures();
    const index = features.findIndex((f) => f.slug === body.slug);

    if (index === -1) {
      return NextResponse.json(
        { error: "特集が見つかりません" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().split("T")[0];
    features[index] = {
      ...features[index],
      ...body,
      updatedAt: now,
    };

    await writeFeatures(features);

    return NextResponse.json(features[index]);
  } catch {
    return NextResponse.json(
      { error: "リクエストが不正です" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/features — 特集を削除（slug をクエリパラメータで指定）
 */
export async function DELETE(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug は必須です" },
      { status: 400 }
    );
  }

  const features = await readFeatures();
  const index = features.findIndex((f) => f.slug === slug);

  if (index === -1) {
    return NextResponse.json(
      { error: "特集が見つかりません" },
      { status: 404 }
    );
  }

  features.splice(index, 1);
  await writeFeatures(features);

  return NextResponse.json({ success: true });
}
