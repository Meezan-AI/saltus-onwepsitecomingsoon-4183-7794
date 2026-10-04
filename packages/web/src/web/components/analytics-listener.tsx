import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackEvent } from "../lib/analytics";

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const DOWNLOAD_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip)$/i;

let ga4Loaded = false;

function loadGa4(id: string) {
  if (ga4Loaded) return;
  ga4Loaded = true;
  window.dataLayer = window.dataLayer ?? [];
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  // anonymize_ip / no PII: this template never passes names, emails, phone
  // numbers or message text into any event — see lib/analytics.ts.
  gtag("config", id, { anonymize_ip: true });
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

  useEffect(() => {
    if (GA4_ID) loadGa4(GA4_ID);
  }, []);

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
