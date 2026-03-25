/** Fire-and-forget analytics for client-only events (course clicks, etc.). */

export function trackClientEvent(event: string, source?: string): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    event,
    source,
    path: window.location.pathname,
  });
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
