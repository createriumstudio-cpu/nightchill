import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const markers = searchParams.get("markers");

  if (!markers) {
    return NextResponse.json({ error: "Missing markers" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Parse marker coordinates
  const coords = markers.split("|").map((c) => c.trim()).filter(Boolean);

  if (coords.length === 0) {
    return NextResponse.json({ error: "No valid markers" }, { status: 400 });
  }

  // Build markers params with numbered labels
  const markerParams = coords
    .map((coord, i) => {
      const label = String.fromCharCode(65 + (i % 26)); // A, B, C, ...
      return `markers=color:red%7Clabel:${label}%7C${coord}`;
    })
    .join("&");

  // Auto-fit all markers using visible parameter
  const visible = coords.join("|");
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=800x400&scale=2&maptype=roadmap&${markerParams}&visible=${encodeURIComponent(visible)}&key=${apiKey}&language=ja`;

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
