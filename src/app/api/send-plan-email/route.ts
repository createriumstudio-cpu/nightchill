import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emailSignups } from "@/lib/schema";
import { sendPlanEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import type { DatePlan } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { email, plan } = (await request.json()) as {
      email: string;
      plan: DatePlan;
    };

    if (!email || !plan) {
      return NextResponse.json({ error: "email and plan required" }, { status: 400 });
    }

    const result = await sendPlanEmail(email, plan);

    const db = getDb();
    if (db) {
      await db
        .update(emailSignups)
        .set({
          planData: plan,
          status: result.success ? "sent" : "failed",
          sentAt: result.success ? new Date() : undefined,
        })
        .where(eq(emailSignups.email, email.trim().toLowerCase()));
    }

    return NextResponse.json({ ok: result.success });
  } catch {
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }
}
