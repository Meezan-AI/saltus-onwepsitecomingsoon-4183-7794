/**
 * Conversion event tracking (GA4-compatible dataLayer events).
 *
 * This only ever pushes event *names and non-personal params* (service slug,
 * page path, language) — never a visitor's name, email, phone number or
 * message text. See AnalyticsListener for where each event fires.
 *
 * GA4 itself is loaded (gtag.js) only when VITE_GA4_MEASUREMENT_ID is set in
 * the root .env — until then these calls still push to window.dataLayer so
 * the event plumbing is ready and testable, but nothing is sent anywhere.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "generate_lead"
  | "form_start"
  | "click_phone"
  | "click_whatsapp"
  | "click_email"
  | "file_download"
  | "service_cta_click"
  | "contact_page_view";

export function trackEvent(name: AnalyticsEvent, params: Record<string, string | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) clean[k] = v;
  }
  window.dataLayer.push({ event: name, ...clean });
}
