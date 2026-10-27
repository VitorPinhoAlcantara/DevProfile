// Umami visitor stats. Links are tracked declaratively with `data-umami-event*`
// attributes; `track` covers what isn't a click, like a form that was sent.

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

/** Set in production only; without it the tracker script isn't rendered. */
export const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || undefined;

/** Path Caddy maps to Umami's script.js (see infra/caddy/Caddyfile). */
export const UMAMI_SCRIPT = '/m/p.js';

export function track(event: string, data?: Record<string, string>) {
  window.umami?.track(event, data);
}

/** Props that make a link report a click as `event`, with `data` as properties. */
export function trackClick(event: string, data: Record<string, string> = {}) {
  return {
    'data-umami-event': event,
    ...Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        `data-umami-event-${key}`,
        value,
      ]),
    ),
  };
}
