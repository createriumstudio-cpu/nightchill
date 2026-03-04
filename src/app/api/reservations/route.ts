import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reservations, partnerVenues } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateReservationNumber } from "@/lib/stripe";

/**
 * POST /api/reservations — 予約作成
 *
 * Body: {
 *   venueId, date, time, partySize?,
 *   customerName, customerEmail, customerPhone?, specialRequests?,
 *   planSlug?
 * }
 */
export async function POST(request: NextRequest) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const {
    venueId,
    date,
    time,
    partySize = 2,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    planSlug,
  } = body;

  // バリデーション
  if (!venueId || !date || !time || !customerName || !customerEmail) {
    return NextResponse.json(
      { error: "venueId, date, time, customerName, customerEmail are required" },
      { status: 400 },
    );
  }

  // 日付フォーマットチェック
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD format" },
      { status: 400 },
    );
  }

  // 時刻フォーマットチェック
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json(
      { error: "time must be HH:MM format" },
      { status: 400 },
    );
  }

  // 提携店舗存在チェック
  const venue = await db
    .select()
    .from(partnerVenues)
    .where(eq(partnerVenues.id, Number(venueId)))
    .limit(1);

  if (venue.length === 0 || !venue[0].isActive) {
    return NextResponse.json(
      { error: "Venue not found or unavailable" },
      { status: 404 },
    );
  }

  const reservationNumber = generateReservationNumber();

  const result = await db
    .insert(reservations)
    .values({
      reservationNumber,
      venueId: Number(venueId),
      date,
      time,
      partySize: Number(partySize),
      customerName: String(customerName).slice(0, 200),
      customerEmail: String(customerEmail).slice(0, 255),
      customerPhone: customerPhone ? String(customerPhone).slice(0, 30) : null,
      specialRequests: specialRequests ? String(specialRequests).slice(0, 1000) : null,
      planSlug: planSlug || null,
      status: "pending",
    })
    .returning();

  return NextResponse.json(
    {
      reservationNumber,
      status: "pending",
      venue: venue[0].name,
      date,
      time,
      id: result[0].id,
    },
    { status: 201 },
  );
}
