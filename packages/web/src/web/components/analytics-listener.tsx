import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackEvent } from "../lib/analytics";

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const DOWNLOAD_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip)$/i;

let ga4Loaded = false;

function gtag(...args: unknown[]) {
  window.dataLayer!.push(args);
}

/**
 * Loads gtag.js and configures GA4. Guarded two ways:
 * - `ga4Loaded` covers repeat mounts within the same page load (StrictMode's
 *   dev-only double-invoke).
 * - The DOM check covers the prerendered snapshot case: `scripts/prerender.ts`
 *   captures `document.documentElement.outerHTML` after this component's
 *   mount effect has already run once, so a static snapshot built with
 *   VITE_GA4_MEASUREMENT_ID set already has the gtag.js <script> tag baked
 *   in. On a real visit the browser loads that baked-in tag, then React
 *   hydrates and this effect runs again on a fresh module scope (`ga4Loaded`
 *   resets) — without this check it would inject a second <script> tag.
 * `send_page_view: false` because page views are sent explicitly below, on
 * both the initial render and every later route change, instead of relying
 * on gtag's automatic (and SPA-navigation-unaware) initial page_view.
 */
function loadGa4(id: string) {
  if (ga4Loaded) return;
  ga4Loaded = true;
  window.dataLayer = window.dataLayer ?? [];
  const alreadyPresent = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
  if (!alreadyPresent) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
  }
  gtag("js", new Date());
  // anonymize_ip / no PII: this template never passes names, emails, phone
  // numbers or message text into any event — see lib/analytics.ts.
  gtag("config", id, { anonymize_ip: true, send_page_view: false });
}

/**
 * Guards against sending the same page_view twice in a row. In practice
 * this fires exactly once per effect run — but hydrating the prerendered
 * markup commits this component's mount effect, and `location` never
 * changes value between that commit and the next, so without this guard
 * a second identical page_view would still go out. Keyed on path only, not
 * time: a later, genuine revisit of the same path only ever happens after
 * `location` has changed away and back, which this guard does not block.
 */
let lastSentPath: string | null = null;

/**
 * Sends one page_view for `path`. `page_title` is read from `document.title`,
 * but that's only correct for the FIRST paint of a path — every other route
 * is lazy-loaded (see app.tsx), and its <Seo> component (which sets the real
 * title) only commits once that route's chunk has finished fetching, in a
 * later React pass than this one. So wait for that commit: observe <title>
 * for the mutation Seo's effect causes, and send once it fires — with a
 * timeout fallback so a slow/absent chunk never swallows the pageview.
 */
function sendPageView(path: string) {
  if (lastSentPath === path) return;
  lastSentPath = path;

  const fire = () => {
    gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  };

  const titleEl = document.querySelector("title");
  if (!titleEl) {
    fire();
    return;
  }

  let sent = false;
  const settle = () => {
    if (sent) return;
    sent = true;
    observer.disconnect();
    fire();
  };
  const observer = new MutationObserver(settle);
  observer.observe(titleEl, { childList: true });
  // Covers routes whose <Seo> title already matches (no mutation fires) and
  // any route with no <Seo> at all.
  setTimeout(settle, 300);
}

/**
 * Site-wide conversion tracking. One mount in app.tsx covers every page via
 * event delegation, so individual components don't each need wiring:
 * - click_phone / click_whatsapp / click_email — any tel:/wa.me//mailto: link
 * - file_download — any link to a document (catalog, brochure, etc.)
 * - service_cta_click — any element with `data-analytics-cta="<slug>"`
 * - contact_page_view — on navigating to /contact
 * `generate_lead` / `form_start` fire from lead-form.tsx itself, where the
 * actual submit/success state lives.
 */
export function AnalyticsListener() {
  const [location] = useLocation();

  // Loads gtag.js once, then sends an explicit page_view on this effect's
  // every run — the initial mount (whatever route was landed on) and every
  // later `location` change (wouter's client-side navigation, which gtag's
  // own automatic page_view does not see since no full page load happens).
  useEffect(() => {
    if (!GA4_ID) return;
    loadGa4(GA4_ID);
    sendPageView(location);
  }, [location]);

  useEffect(() => {
    if (location === "/contact") trackEvent("contact_page_view", { page: location });
  }, [location]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      const cta = target?.closest("[data-analytics-cta]") as HTMLElement | null;

      if (cta) {
        trackEvent("service_cta_click", { cta: cta.dataset.analyticsCta, page: location });
      }

      if (!link) return;
      const href = link.getAttribute("href") ?? "";

      if (href.startsWith("tel:")) {
        trackEvent("click_phone", { page: location });
      } else if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
        trackEvent("click_whatsapp", { page: location });
      } else if (href.startsWith("mailto:")) {
        trackEvent("click_email", { page: location });
      } else if (DOWNLOAD_EXT.test(href) || link.hasAttribute("download")) {
        trackEvent("file_download", { file: href.split("/").pop(), page: location });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [location]);

  return null;
}
