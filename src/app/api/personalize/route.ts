import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-auth";
import { getPersonalizedSuggestions } from "@/lib/personalize";

/** GET /api/personalize — Get personalized suggestions for the user */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({
      suggestions: null,
      message: "ユーザーが見つかりません",
    });
  }

  const suggestions = await getPersonalizedSuggestions(user.id);
  return NextResponse.json({ suggestions });
}
