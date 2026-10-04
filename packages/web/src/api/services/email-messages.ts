/**
 * Composed Saltus ONE transactional emails.
 *
 * Every message here is built on top of `renderBrandedEmail`, so the branding,
 * RTL handling and email-client compatibility live in exactly one place. Add new
 * message types (order confirmation, status update, approval, welcome, provider
 * notification) as additional builders in this file.
 */

import { renderBrandedEmail, SITE_URL, SUPPORT_EMAIL } from "./email-template";

export { SITE_URL, SUPPORT_EMAIL };

/**
 * Human-friendly reference for a lead, derived from the existing primary key.
 * No second ID system and no schema change: `SLT-<year>-<6-digit id>`.
 */
export function leadReference(id: number | string, createdAt?: Date | string | null): string {
  const date = createdAt ? new Date(createdAt) : new Date();
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  const numeric = String(id).replace(/\D/g, "") || "0";
  return `SLT-${year}-${numeric.padStart(6, "0")}`;
}

export interface LeadConfirmationInput {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  reference: string;
  lang?: "ar" | "en";
}

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

/** Customer-facing "we received your enquiry" confirmation. */
export function buildLeadConfirmationEmail(input: LeadConfirmationInput): ComposedEmail {
  const lang = input.lang === "en" ? "en" : "ar";

  if (lang === "en") {
    const { html, text } = renderBrandedEmail({
      lang: "en",
      preheader: `We received your request — reference ${input.reference}`,
      heading: "Your request has been received",
      subheading: "Thank you for contacting Saltus ONE.",
      paragraphs: [
        `Hello ${input.name},`,
        "Thank you for reaching out. We have received your request and our team is reviewing it. One of our specialists will contact you within one business day.",
      ],
      highlight: {
        label: "Reference number",
        value: input.reference,
        note: "Please quote this number in any follow-up so we can find your request instantly.",
      },
      details: {
        title: "Request summary",
        rows: [
          { label: "Name", value: input.name },
          { label: "Email", value: input.email },
          { label: "Phone", value: input.phone ?? undefined },
          { label: "Company", value: input.company ?? undefined },
          { label: "Service", value: input.interest ?? undefined },
          { label: "Reference", value: input.reference },
        ],
      },
      cta: { label: "Visit our website", url: SITE_URL },
      outro: [`If any detail above is incorrect, simply reply to this email and we will update it.`],
      signature: ["Saltus ONE", "Business & Professional Services Platform", SITE_URL],
    });

    return { subject: `Your request has been received – Saltus ONE`, html, text, replyTo: SUPPORT_EMAIL };
  }

  const { html, text } = renderBrandedEmail({
    lang: "ar",
    preheader: `تم استلام طلبك — الرقم المرجعي ${input.reference}`,
    heading: "تم استلام طلبك بنجاح",
    subheading: "شكراً لتواصلك مع Saltus ONE.",
    paragraphs: [
      `مرحباً ${input.name}،`,
      "شكراً لتواصلك معنا. تم استلام طلبك بنجاح وهو الآن قيد المراجعة من قبل فريقنا، وسيقوم أحد المختصين لدينا بالتواصل معك خلال يوم عمل واحد.",
    ],
    highlight: {
      label: "الرقم المرجعي",
      value: input.reference,
      note: "يرجى ذكر هذا الرقم عند أي متابعة ليتمكن فريقنا من الوصول إلى طلبك فوراً.",
    },
    details: {
      title: "تفاصيل الطلب",
      rows: [
        { label: "الاسم", value: input.name },
        { label: "البريد الإلكتروني", value: input.email },
        { label: "الهاتف", value: input.phone ?? undefined },
        { label: "الشركة", value: input.company ?? undefined },
        { label: "نوع الخدمة", value: input.interest ?? undefined },
        { label: "رقم الطلب", value: input.reference },
      ],
    },
    cta: { label: "زيارة الموقع الإلكتروني", url: SITE_URL },
    outro: ["إذا كان أي من التفاصيل أعلاه غير صحيح، يمكنك الرد على هذه الرسالة مباشرة وسنقوم بتحديثها."],
    signature: ["Saltus ONE", "منصة الأعمال والخدمات المهنية", SITE_URL],
  });

  return { subject: "تم استلام طلبك – Saltus ONE", html, text, replyTo: SUPPORT_EMAIL };
}
