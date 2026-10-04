import { useEffect } from "react";
import { useLang } from "../i18n";

const SITE_URL = "https://saltus-one.com";
/** Stable identity for the one and only Saltus ONE Organization entity. */
const ORG_ID = `${SITE_URL}/#organization`;
/** Official branded company image (1200x630) — kept separate from `logo`. */
const ORG_IMAGE = `${SITE_URL}/og-image.png`;
const ORG_LOGO = `${SITE_URL}/images/logo-stacked.png`;
/** Verified official external profiles only — no site URL, no share links. */
const SAME_AS = [
  "https://www.facebook.com/saltusshop/about",
  "https://www.linkedin.com/company/saltus-one/",
  "https://www.youtube.com/@SaltusONE",
];
/** Confirmed registered business address. */
const ORG_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Zainab Al-Asadiyah Street, Dahiat Al-Rasheed",
  addressLocality: "Amman",
  addressRegion: "Amman Governorate",
  postalCode: "11831",
  addressCountry: { "@type": "Country", name: "JO" },
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

type MetaPage = "home" | "services" | "conferences" | "about" | "contact" | "portfolio" | "insights" | "businessCard";

/** Default branded 1200x630 card used when a page has no image of its own. */
const DEFAULT_SHARE_CARD = "/og-image.png";

/**
 * Social platforms need a light 1200x630 image. Every `/images/*.png` used on the
 * site has a pre-rendered branded card in `/og/*.jpg` (logo + contact strip), so map
 * page images onto that card and fall back to the main brand card.
 */
function shareCard(image?: string) {
  if (!image) return DEFAULT_SHARE_CARD;
  const match = /^\/images\/(.+)\.(png|jpe?g|webp)$/.exec(image);
  if (!match) return image;
  return `/og/${match[1]}.jpg`;
}

export function Seo({
  page,
  path,
  jsonLd,
  custom,
  noindex,
}: {
  /** Key into the i18n meta dictionary. Omit when passing `custom`. */
  page?: MetaPage;
  path: string;
  jsonLd?: unknown;
  /** Explicit meta for dynamic routes (service pages, articles). */
  custom?: { title: string; desc: string; keywords?: string; image?: string; type?: string };
  /** Utility pages (e.g. the personal vCard) that should not compete for organic rankings. */
  noindex?: boolean;
}) {
  const { lang, t } = useLang();
  const base = page ? t.meta[page] : t.meta.home;
  const title = custom?.title ?? base.title;
  const desc = custom?.desc ?? base.desc;
  const keywords = custom?.keywords ?? base.keywords;
  const image = `${SITE_URL}${shareCard(custom?.image)}`;
  const ogType = custom?.type ?? "website";
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
    upsertMeta("name", "author", "Saltus ONE");
    upsertMeta("property", "og:site_name", t.meta.siteName);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:locale", lang === "ar" ? "ar_JO" : "en_US");
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:secure_url", image);
    upsertMeta("property", "og:image:type", image.endsWith(".png") ? "image/png" : "image/jpeg");
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", title);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", url);
    // The ar/en toggle lives in localStorage, not in the URL, so this one URL
    // serves both languages — it must NOT declare itself as both hreflang="en"
    // and hreflang="ar" (that previously told Google the same URL was two
    // different language versions of itself, which is invalid). `x-default`
    // is the correct, Google-documented tag for a single URL that serves a
    // language picker/toggle instead of per-language URLs. Real per-language
    // "en"/"ar" alternates should only be added once /en/... and /ar/... (or
    // equivalent) URLs exist — see task notes for that follow-up.
    upsertLink("alternate", url, "x-default");

    // One canonical Organization entity for the whole site (@id keeps it single).
    // `sameAs` holds verified external profiles only — no site URL, no share links.
    upsertJsonLd("ld-organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORG_ID,
      name: "Saltus ONE",
      alternateName: "سالتوس ONE",
      url: `${SITE_URL}/`,
      logo: ORG_LOGO,
      image: ORG_IMAGE,
      description: t.meta.home.desc,
      foundingDate: "2000",
      telephone: "+962795881811",
      email: "info@saltus-one.com",
      address: ORG_ADDRESS,
      areaServed: ["Jordan", "Middle East"],
      knowsLanguage: ["ar", "en"],
      sameAs: SAME_AS,
    });

    upsertJsonLd("ld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Saltus ONE",
      alternateName: "سالتوس ONE",
      inLanguage: ["ar", "en"],
      publisher: { "@id": ORG_ID },
    });

    // Same company as the Organization above — linked by `parentOrganization`,
    // never a competing identity.
    upsertJsonLd("ld-localbusiness", {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "Saltus ONE",
      alternateName: "سالتوس ONE",
      image: ORG_IMAGE,
      logo: ORG_LOGO,
      url: `${SITE_URL}/`,
      telephone: "+962795881811",
      email: "info@saltus-one.com",
      priceRange: "$",
      description: t.meta.home.desc,
      parentOrganization: { "@id": ORG_ID },
      sameAs: SAME_AS,
      address: ORG_ADDRESS,
      geo: { "@type": "GeoCoordinates", latitude: 31.9539, longitude: 35.9106 },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          opens: "09:00",
          closes: "18:00",
        },
      ],
      areaServed: ["Jordan", "Middle East"],
      currenciesAccepted: "JOD",
    });

    if (jsonLd) {
      upsertJsonLd("ld-page", jsonLd);
    } else {
      document.getElementById("ld-page")?.remove();
    }
  }, [title, desc, keywords, url, lang, t, jsonLd, image, ogType]);

  return null;
}

export { SITE_URL, SAME_AS };
