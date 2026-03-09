import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emailSignups } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      await db.insert(emailSignups).values({
        email: trimmed,
        status: "pending",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
