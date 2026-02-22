import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sponsoredSpots } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Check if contextual PR is enabled
  if (process.env.CONTEXTUAL_PR_ENABLED !== "true") {
    return NextResponse.json([]);
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json([]);
  }

  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");

  try {
    const results = await db
      .select()
      .from(sponsoredSpots)
      .where(eq(sponsoredSpots.isActive, true))
      .orderBy(sponsoredSpots.priority);

    // Filter by area if provided
    const filtered = area
      ? results.filter((s) => {
          const areas = s.targetAreas as string[] | null;
          return !areas || areas.length === 0 || areas.includes(area);
        })
      : results;

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([]);
  }
}
