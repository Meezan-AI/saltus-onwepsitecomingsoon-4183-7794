/**
 * Lead maintenance CLI.
 *
 *   bun run leads:list             list every stored enquiry and its email status
 *   bun run leads:resend           email every enquiry that was never delivered
 *   bun run leads:resend 3 4 5     email only those specific enquiry ids
 *
 * Run from the repo root so the .env file is picked up.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/api/database";
import * as schema from "../src/api/database/schema";
import { sendEmail } from "../src/api/services/email";

const NOTIFY_TO = process.env.LEADS_NOTIFY_EMAIL ?? "info@saltus-one.com";
const mode = process.argv[2] === "resend" ? "resend" : "list";
/** Optional explicit ids after the mode, e.g. `resend 3 4 5`. */
const onlyIds = new Set(
  process.argv
    .slice(3)
    .map((a) => Number.parseInt(a, 10))
    .filter((n) => Number.isFinite(n)),
);

function esc(v: string) {
  return v.replace(/</g, "&lt;");
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px;background:#f4f6f9;font-weight:600;white-space:nowrap">${label}</td><td style="padding:6px 12px">${esc(value)}</td></tr>`;
}

const leads = await db.select().from(schema.leads);

if (mode === "list") {
  console.log(`\n${leads.length} enquiry(ies) stored:\n`);
  for (const l of leads) {
    console.log(
      [
        `#${l.id}`,
        l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
        l.name,
        l.email,
        l.phone ?? "-",
        l.interest ?? "-",
        l.emailed ? "emailed ✓" : "NOT EMAILED ✗",
      ].join("  |  "),
    );
    if (l.message) console.log(`      ${l.message.replace(/\n/g, " ")}`);
  }
  const pending = leads.filter((l) => !l.emailed).length;
  console.log(`\n${pending} pending delivery. Run \`bun run leads:resend\` to send them.\n`);
  process.exit(0);
}

const pending =
  onlyIds.size > 0 ? leads.filter((l) => onlyIds.has(l.id)) : leads.filter((l) => !l.emailed);

if (pending.length === 0) {
  console.log(
    onlyIds.size > 0
      ? `No enquiry matched id(s): ${[...onlyIds].join(", ")}`
      : "Nothing to resend — every enquiry has already been emailed.",
  );
  process.exit(0);
}

console.log(`Resending ${pending.length} enquiry(ies) to ${NOTIFY_TO}…\n`);
let ok = 0;

for (const l of pending) {
  const created = l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
      <h2 style="color:#0b1f3a;margin:0 0 4px">Website enquiry (recovered)</h2>
      <p style="margin:0 0 16px;color:#64748b">Originally submitted ${created} via saltus-one.com</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${row("Name", l.name)}
        ${row("Company", l.company)}
        ${row("Email", l.email)}
        ${row("Phone", l.phone)}
        ${row("Interest", l.interest)}
        ${row("Language", l.lang)}
        ${row("Page", l.page)}
        ${row("Submitted", created)}
        ${row("Message", l.message)}
      </table>
    </div>`;

  const result = await sendEmail({
    to: NOTIFY_TO,
    subject: `Website enquiry — ${l.name}${l.interest ? ` (${l.interest})` : ""}`,
    text: [
      `Submitted: ${created}`,
      `Name: ${l.name}`,
      l.company ? `Company: ${l.company}` : "",
      `Email: ${l.email}`,
      l.phone ? `Phone: ${l.phone}` : "",
      l.interest ? `Interest: ${l.interest}` : "",
      l.page ? `Page: ${l.page}` : "",
      "",
      l.message ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
    html,
    replyTo: l.email,
  });

  if (result.sent) {
    await db.update(schema.leads).set({ emailed: true }).where(eq(schema.leads.id, l.id));
    console.log(`  ✓ #${l.id} ${l.name} <${l.email}>`);
    ok++;
  } else {
    console.error(`  ✗ #${l.id} ${l.name} — ${result.reason}: ${result.detail ?? ""}`);
  }
}

console.log(`\nDone: ${ok}/${pending.length} delivered.`);
process.exit(ok === pending.length ? 0 : 1);
