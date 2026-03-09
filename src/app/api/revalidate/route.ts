import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path } = body;

    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (!revalidateSecret) {
      return NextResponse.json(
        { error: "REVALIDATE_SECRET is not configured" },
        { status: 500 },
      );
    }

    if (secret !== revalidateSecret) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 },
      );
    }

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid path parameter" },
        { status: 400 },
      );
    }

    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
