import { NextResponse } from "next/server";
import { getSnsContentsBySlug } from "@/lib/sns-converter";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 },
      );
    }

    const data = await getSnsContentsBySlug(slug);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("SNS fetch error:", error);
    return NextResponse.json(
      { error: "SNSコンテンツの取得に失敗しました" },
      { status: 500 },
    );
  }
}
