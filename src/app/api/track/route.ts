import { NextRequest, NextResponse } from "next/server";
import { logServerEvent } from "@/lib/serverEventLog";

/** Client-side events (e.g. course CTA clicks). No PII required. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const event = typeof body.event === "string" ? body.event.trim().slice(0, 80) : "";
    if (!event) {
      return NextResponse.json({ error: "event is required" }, { status: 400 });
    }
    const source =
      typeof body.source === "string" ? body.source.trim().slice(0, 120) : undefined;
    const path = typeof body.path === "string" ? body.path.trim().slice(0, 500) : undefined;

    await logServerEvent({
      type: "client_event",
      event,
      source,
      path,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
