/**
 * Resolves the collaboration WebSocket server URL for SolarDocs.
 *
 * Defaults to connecting to `/yjs` on the same host and port:
 * - Local development: ws://localhost:3000/yjs (or current host)
 * - Production on Railway: wss://your-domain.up.railway.app/yjs
 *
 * If NEXT_PUBLIC_YJS_WEBSOCKET_URL is explicitly set:
 * - If relative (e.g. '/yjs'): resolved against current window host.
 * - If absolute ws:// on an HTTPS page: automatically upgraded to wss://.
 */
export function getCollaborationWebSocketUrl(): string {
  const envUrl = (
    process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL ||
    process.env.NEXT_PUBLIC_COLLAB_WS_URL ||
    ""
  ).trim();

  // 1. If explicit environment variable is provided
  if (envUrl) {
    // Relative path (e.g. '/yjs')
    if (envUrl.startsWith("/")) {
      if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        return `${protocol}//${window.location.host}${envUrl}`;
      }
      return `ws://127.0.0.1:3000${envUrl}`;
    }

    // Absolute URL: upgrade ws:// to wss:// if browser is on HTTPS
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      envUrl.startsWith("ws://")
    ) {
      return envUrl.replace(/^ws:\/\//, "wss://");
    }

    return envUrl;
  }

  // 2. Default: Same-host single deployment on Railway and local dev via /yjs
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/yjs`;
  }

  // 3. Fallback for SSR / Node evaluation
  return "ws://127.0.0.1:3000/yjs";
}
