/**
 * Optional server-side event log for leads, feedback, and CTA clicks.
 * - Always emits a structured line to stdout (visible in Vercel/host logs).
 * - If LEADS_WEBHOOK_URL is set, POSTs the same JSON payload to your URL (e.g. Zapier, Make, Supabase).
 */

export type AppServerEvent = {
  type: string;
  [key: string]: unknown;
};

export async function logServerEvent(event: AppServerEvent): Promise<void> {
  const payload = { ...event, ts: new Date().toISOString() };
  const line = JSON.stringify(payload);
  if (process.env.NODE_ENV !== "test") {
    console.info("[AppEvent]", line);
  }

  const url = process.env.LEADS_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: line,
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch {
    // Never fail the user-facing request because the webhook failed
  }
}
