/**
 * Saltus ONE branded email template.
 *
 * A single reusable HTML layout for every transactional email the platform sends
 * (enquiry confirmation, status updates, approvals, welcome messages, provider
 * notifications). Callers supply content blocks; this module owns the branding,
 * responsive behaviour and RTL handling.
 *
 * Email-client constraints respected here:
 * - table-based layout (no flexbox/grid — Outlook ignores them)
 * - inline CSS only (no <style> dependency, no classes, no JavaScript)
 * - a single remote image (the logo), served from the site's own domain
 * - mobile-first widths with a 600px cap and fluid cells
 */

/** Brand palette — mirrors the website's Tailwind theme. */
const BRAND = {
  navy: "#0B1F3A",
  deepNavy: "#060F1F",
  orange: "#FF6B00",
  orangeSoft: "#FFF3EA",
  muted: "#B9C2D0",
  body: "#334155",
  heading: "#0B1F3A",
  border: "#E2E8F0",
  canvas: "#F1F4F8",
  cardAlt: "#F8FAFC",
} as const;

/** Arabic-safe stack: Tahoma renders Arabic correctly in Outlook and Windows clients. */
const FONT = "'Segoe UI', Tahoma, Arial, Helvetica, sans-serif";

export const SITE_URL = "https://saltus-one.com";
export const SUPPORT_EMAIL = "info@saltus-one.com";
export const SUPPORT_PHONE = "+962 79 588 1811";

/**
 * Logo shown in the email header. Points at an asset that already exists in
 * `packages/web/public/images` and is served from the live domain, so no new
 * external image dependency is introduced.
 */
export const EMAIL_LOGO_URL = `${SITE_URL}/images/logo-stacked.png`;

export interface DetailRow {
  label: string;
  value?: string | null;
}

export interface BrandedEmailOptions {
  /** Drives text direction and alignment. */
  lang: "ar" | "en";
  /** Inbox preview line, hidden inside the body. */
  preheader: string;
  /** Main headline in the coloured hero band. */
  heading: string;
  /** Optional smaller line under the headline. */
  subheading?: string;
  /** Body paragraphs rendered above the detail card. */
  paragraphs?: string[];
  /** Emphasised reference/《highlight》card. */
  highlight?: { label: string; value: string; note?: string };
  /** Titled table of key/value rows; empty values are dropped. */
  details?: { title: string; rows: DetailRow[] };
  /** Primary call-to-action button. */
  cta?: { label: string; url: string };
  /** Paragraphs rendered after the details, before the signature. */
  outro?: string[];
  /** Sign-off lines, e.g. company name and tagline. */
  signature?: string[];
}

/** Escapes user-supplied values before they are inlined into the HTML body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Builds the Saltus ONE HTML email plus a plain-text alternative. */
export function renderBrandedEmail(options: BrandedEmailOptions): { html: string; text: string } {
  const { lang, preheader, heading, subheading, paragraphs = [], highlight, details, cta, outro = [], signature = [] } = options;

  const rtl = lang === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const startSide = rtl ? "right" : "left";

  const detailRows = (details?.rows ?? []).filter((r): r is Required<DetailRow> => Boolean(r.value));

  const paragraphHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:${FONT};font-size:16px;line-height:1.85;color:${BRAND.body};text-align:${align};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const highlightHtml = highlight
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 26px;">
        <tr>
          <td style="background-color:${BRAND.orangeSoft};border-${startSide}:4px solid ${BRAND.orange};border-radius:10px;padding:18px 22px;">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:.6px;color:${BRAND.orange};text-align:${align};text-transform:uppercase;">${escapeHtml(highlight.label)}</p>
            <p style="margin:0;font-family:'Courier New',Consolas,monospace;font-size:24px;font-weight:bold;letter-spacing:1.5px;color:${BRAND.navy};text-align:${align};" dir="ltr">${escapeHtml(highlight.value)}</p>
            ${
              highlight.note
                ? `<p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:#7C8899;text-align:${align};">${escapeHtml(highlight.note)}</p>`
                : ""
            }
          </td>
        </tr>
      </table>`
    : "";

  const detailsHtml =
    detailRows.length > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;border:1px solid ${BRAND.border};border-radius:10px;border-collapse:separate;overflow:hidden;">
          ${
            details?.title
              ? `<tr><td colspan="2" style="background-color:${BRAND.navy};padding:13px 20px;font-family:${FONT};font-size:14px;font-weight:600;letter-spacing:.4px;color:#FFFFFF;text-align:${align};">${escapeHtml(details.title)}</td></tr>`
              : ""
          }
          ${detailRows
            .map((r, i) => {
              const bg = i % 2 === 0 ? "#FFFFFF" : BRAND.cardAlt;
              // Phone numbers and emails must stay LTR even inside an RTL email.
              const ltr = /^[\s+\d()./-]+$/.test(r.value) || /@/.test(r.value);
              return `<tr>
                <td width="38%" style="background-color:${bg};padding:12px 20px;font-family:${FONT};font-size:14px;font-weight:600;color:${BRAND.heading};text-align:${align};border-bottom:1px solid ${BRAND.border};vertical-align:top;">${escapeHtml(r.label)}</td>
                <td style="background-color:${bg};padding:12px 20px;font-family:${FONT};font-size:14px;line-height:1.7;color:${BRAND.body};text-align:${align};border-bottom:1px solid ${BRAND.border};vertical-align:top;"${ltr ? ` dir="ltr"` : ""}>${escapeHtml(r.value)}</td>
              </tr>`;
            })
            .join("")}
        </table>`
      : "";

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(cta.url)}" target="_blank" rel="noopener" style="display:inline-block;background-color:${BRAND.orange};color:#FFFFFF;font-family:${FONT};font-size:16px;font-weight:600;text-decoration:none;padding:14px 38px;border-radius:8px;mso-padding-alt:0;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const outroHtml = outro
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:${FONT};font-size:16px;line-height:1.85;color:${BRAND.body};text-align:${align};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const signatureHtml =
    signature.length > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 0;border-top:1px solid ${BRAND.border};">
          <tr><td style="padding:20px 0 0;">
            ${signature
              .map(
                (line, i) =>
                  `<p style="margin:0 0 4px;font-family:${FONT};font-size:${i === 0 ? "16px" : "14px"};font-weight:${i === 0 ? "700" : "400"};line-height:1.7;color:${i === 0 ? BRAND.heading : "#64748B"};text-align:${align};">${escapeHtml(line)}</p>`,
              )
              .join("")}
          </td></tr>
        </table>`
      : "";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(heading)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" dir="${dir}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.canvas};">
  <tr>
    <td align="center" style="padding:28px 14px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(11,31,58,0.07);">

        <tr>
          <td align="center" style="background-color:${BRAND.navy};padding:34px 24px 28px;border-bottom:4px solid ${BRAND.orange};">
            <img src="${EMAIL_LOGO_URL}" width="104" alt="Saltus ONE" style="display:block;width:104px;max-width:104px;height:auto;border:0;outline:none;text-decoration:none;" />
            <p style="margin:14px 0 0;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">SALTUS ONE</p>
          </td>
        </tr>

        <tr>
          <td style="padding:34px 30px 8px;">
            <h1 style="margin:0 0 ${subheading ? "8px" : "20px"};font-family:${FONT};font-size:24px;line-height:1.45;font-weight:700;color:${BRAND.heading};text-align:${align};">${escapeHtml(heading)}</h1>
            ${
              subheading
                ? `<p style="margin:0 0 22px;font-family:${FONT};font-size:15px;line-height:1.7;color:#64748B;text-align:${align};">${escapeHtml(subheading)}</p>`
                : ""
            }
            ${paragraphHtml}
            ${highlightHtml}
            ${detailsHtml}
            ${ctaHtml}
            ${outroHtml}
            ${signatureHtml}
          </td>
        </tr>

        <tr><td style="padding:0 30px;"><div style="height:22px;"></div></td></tr>

        <tr>
          <td align="center" style="background-color:${BRAND.deepNavy};padding:26px 24px;">
            <p style="margin:0 0 4px;font-family:${FONT};font-size:15px;font-weight:700;letter-spacing:1px;color:#FFFFFF;">Saltus ONE</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted};">منصة الأعمال والخدمات المهنية</p>
            <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.9;color:${BRAND.muted};" dir="ltr">
              <a href="${SITE_URL}" target="_blank" rel="noopener" style="color:#FFFFFF;text-decoration:none;">www.saltus-one.com</a>
              &nbsp;·&nbsp;
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#FFFFFF;text-decoration:none;">${SUPPORT_EMAIL}</a>
            </p>
            <p style="margin:0;font-family:${FONT};font-size:13px;color:${BRAND.muted};" dir="ltr">${SUPPORT_PHONE}</p>
          </td>
        </tr>

      </table>

      <p style="margin:16px 0 0;font-family:${FONT};font-size:11px;line-height:1.6;color:#93A0B4;text-align:center;">© ${new Date().getFullYear()} Saltus ONE. ${rtl ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>

    </td>
  </tr>
</table>
</body>
</html>`;

  const textParts = [
    heading,
    subheading ?? "",
    "",
    ...paragraphs,
    "",
    highlight ? `${highlight.label}: ${highlight.value}` : "",
    "",
    details?.title ?? "",
    ...detailRows.map((r) => `- ${r.label}: ${r.value}`),
    "",
    cta ? `${cta.label}: ${cta.url}` : "",
    "",
    ...outro,
    "",
    ...signature,
    "",
    "Saltus ONE — منصة الأعمال والخدمات المهنية",
    `${SITE_URL} · ${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`,
  ];

  const text = textParts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { html, text };
}
