import { NextRequest, NextResponse } from "next/server";
import { logServerEvent } from "@/lib/serverEventLog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { rating, message } = body as { rating?: number; message?: string };

    const r = typeof rating === "number" ? Math.min(5, Math.max(1, Math.round(rating))) : undefined;
    if (r === undefined) {
      return NextResponse.json({ error: "Rating (1–5) is required" }, { status: 400 });
    }

    const text = typeof message === "string" ? message.trim().slice(0, 2000) : "";

    await logServerEvent({
      type: "product_feedback",
      rating: r,
      message: text || undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
