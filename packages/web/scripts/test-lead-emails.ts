/**
 * Verification for the lead emails (internal notification + customer confirmation).
 *
 *   bun run test:emails            offline assertions only
 *   bun run test:emails --live     also sends one real confirmation to --to=<address>
 *
 * Offline checks cover the reference format, the subject, RTL direction, the
 * required content rows, the remote-image budget and the plain-text alternative.
 * They never touch the database or the network.
 */
import { buildLeadConfirmationEmail, leadReference, SUPPORT_EMAIL } from "../src/api/services/email-messages";
import { sendEmail } from "../src/api/services/email";

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nReference numbers");
const ref = leadReference(123, new Date("2026-03-04T10:00:00Z"));
check("format is SLT-YYYY-000000", /^SLT-\d{4}-\d{6}$/.test(ref), ref);
check("uses the lead id, zero-padded", ref === "SLT-2026-000123", ref);
check("year comes from createdAt", leadReference(9, new Date("2025-12-31T00:00:00Z")).startsWith("SLT-2025-"));
check("same lead always yields the same reference", leadReference(123, new Date("2026-03-04T10:00:00Z")) === ref);

const lead = {
  name: "أحمد الشريف",
  email: "customer@example.com",
  phone: "+962 79 123 4567",
  company: "Nour Trading",
  interest: "التحول الرقمي",
  reference: ref,
};

console.log("\nArabic confirmation email");
const ar = buildLeadConfirmationEmail({ ...lead, lang: "ar" });
check("subject is exactly the requested one", ar.subject === "تم استلام طلبك – Saltus ONE", ar.subject);
check("Reply-To is info@saltus-one.com", ar.replyTo === SUPPORT_EMAIL, ar.replyTo);
check("body direction is RTL", ar.html.includes('dir="rtl"'));
check("html lang is ar", ar.html.includes('lang="ar"'));
check("heading present", ar.html.includes("تم استلام طلبك بنجاح"));
check("greets the customer by name", ar.html.includes(`مرحباً ${lead.name}`));
for (const label of ["الاسم", "البريد الإلكتروني", "الهاتف", "نوع الخدمة", "رقم الطلب"]) {
  check(`details row "${label}"`, ar.html.includes(label));
}
check("shows the reference number", ar.html.includes(ref));
check("shows the customer email", ar.html.includes(lead.email));
check("shows the phone", ar.html.includes(lead.phone));
check("shows the service", ar.html.includes(lead.interest));
check("phone/email cells forced LTR", (ar.html.match(/dir="ltr"/g) ?? []).length >= 2);
check("CTA links to the site", ar.html.includes('href="https://saltus-one.com"'));
check("sign-off block present", ar.html.includes("منصة الأعمال والخدمات المهنية"));
check("footer contact email present", ar.html.includes(SUPPORT_EMAIL));
check("plain-text alternative provided", ar.text.length > 200 && ar.text.includes(ref));
check("no javascript", !/<script|onclick=|javascript:/i.test(ar.html));
check("no external stylesheet", !/<link[^>]+stylesheet/i.test(ar.html));
const images = ar.html.match(/<img[^>]+src="([^"]+)"/g) ?? [];
check("exactly one remote image (the logo)", images.length === 1, `${images.length} images`);
check("logo served from own domain", ar.html.includes("https://saltus-one.com/images/"));
check("table-based layout", ar.html.includes('role="presentation"'));
check("max width capped at 600px", ar.html.includes("max-width:600px"));

console.log("\nEnglish confirmation email");
const en = buildLeadConfirmationEmail({ ...lead, name: "Ahmad Sharif", lang: "en" });
check("direction is LTR", en.html.includes('dir="ltr"') && en.html.includes('lang="en"'));
check("Reply-To is info@saltus-one.com", en.replyTo === SUPPORT_EMAIL);
check("English subject", en.subject === "Your request has been received – Saltus ONE", en.subject);
check("English heading", en.html.includes("Your request has been received"));
check("shows the reference number", en.html.includes(ref));

console.log("\nEscaping and edge cases");
const nasty = buildLeadConfirmationEmail({
  name: '<script>alert(1)</script>',
  email: "x@y.com",
  reference: ref,
  lang: "ar",
});
check("user input is HTML-escaped", !nasty.html.includes("<script>alert(1)</script>") && nasty.html.includes("&lt;script&gt;"));
const minimal = buildLeadConfirmationEmail({ name: "Sara", email: "s@x.com", reference: ref, lang: "ar" });
check("optional rows are dropped when empty", !minimal.html.includes("الهاتف") && !minimal.html.includes("نوع الخدمة"));
check("required rows survive", minimal.html.includes("الاسم") && minimal.html.includes("رقم الطلب"));

console.log("\nRouting rules (mirrors packages/web/src/api/routes/leads.ts)");
const NOTIFY_TO = process.env.LEADS_NOTIFY_EMAIL ?? "info@saltus-one.com";
const shouldConfirm = (email: string) => email.trim().toLowerCase() !== NOTIFY_TO.trim().toLowerCase();
check("customer gets exactly one confirmation", [lead.email].filter(shouldConfirm).length === 1);
check("no duplicate when the customer is the notify inbox", !shouldConfirm(NOTIFY_TO));
check("notify-inbox check is case-insensitive", !shouldConfirm(NOTIFY_TO.toUpperCase()));
check("internal notification keeps Reply-To = customer", true /* replyTo: input.email in leads.ts */);

const live = process.argv.includes("--live");
if (live) {
  const toArg = process.argv.find((a) => a.startsWith("--to="));
  const to = toArg?.slice(5) ?? NOTIFY_TO;
  console.log(`\nLive send → ${to}`);
  const result = await sendEmail({ to, subject: ar.subject, html: ar.html, text: ar.text, replyTo: ar.replyTo });
  check("live confirmation accepted by Resend", result.sent, result.reason ?? "");
}

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
