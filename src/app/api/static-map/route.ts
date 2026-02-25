import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const center = encodeURIComponent(query);
  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=16&size=600x300&scale=2&maptype=roadmap&markers=color:red|${center}&key=${apiKey}&language=ja`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json({ error: "Map fetch failed" }, { status: 502 });
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
