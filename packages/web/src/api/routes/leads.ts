import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { sendEmail } from "../services/email";
import { buildLeadConfirmationEmail, leadReference } from "../services/email-messages";
import { deskRouting, resolveDesk } from "../services/email-routing";

/** Window in which an identical re-submission is treated as a duplicate click. */
const DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

const leadInput = z.object({
  name: z.string().min(2).max(120),
  company: z.string().max(160).optional(),
  email: z.string().email().max(160),
  phone: z.string().max(60).optional(),
  interest: z.string().max(80).optional(),
  message: z.string().max(4000).optional(),
  lang: z.enum(["en", "ar"]).optional(),
  page: z.string().max(200).optional(),
  /** Which desk should receive the enquiry. Derived from page/interest when omitted. */
  desk: z.enum(["contact", "events"]).optional(),
});

/** Bare address out of a `Name <addr@host>` sender/recipient string, lowercased. */
function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function row(label: string, value?: string) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px;background:#f4f6f9;font-weight:600;white-space:nowrap">${label}</td><td style="padding:6px 12px">${value.replace(/</g, "&lt;")}</td></tr>`;
}

export const leads = {
  create: base.input(leadInput).handler(async ({ input }) => {
    // `desk` is routing metadata only — it is not a column on the leads table.
    const { desk: requestedDesk, ...record } = input;
    const desk = resolveDesk({ desk: requestedDesk, page: record.page, interest: record.interest });
    const routing = deskRouting(desk);

    // Duplicate-submission guard: a second identical submit from the same
    // address within the window is a double click / retry, not a new enquiry.
    // It is acknowledged with the original reference and no second email.
    const [recent] = await db
      .select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.email, record.email),
          gt(schema.leads.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS)),
        ),
      )
      .orderBy(desc(schema.leads.id))
      .limit(1);

    if (recent && (recent.message ?? "") === (record.message ?? "") && recent.name === record.name) {
      console.info(`[leads] duplicate submission ignored for ${record.email} — returning lead #${recent.id}`);
      return {
        ok: true,
        id: recent.id,
        reference: leadReference(recent.id, recent.createdAt),
        confirmationSent: false,
        emailed: recent.emailed,
        duplicate: true,
        emailError: recent.emailed ? undefined : "not_emailed",
      };
    }

    const [lead] = await db.insert(schema.leads).values(record).returning();

    // Same reference the customer sees, so support can match the two emails.
    const reference = lead ? leadReference(lead.id, lead.createdAt) : "—";

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
      <h2 style="color:#0b1f3a;margin:0 0 4px">New website enquiry</h2>
      <p style="margin:0 0 16px;color:#64748b">Submitted via saltus-one.com</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${row("Reference", reference)}
        ${row("Name", input.name)}
        ${row("Company", input.company)}
        ${row("Email", input.email)}
        ${row("Phone", input.phone)}
        ${row("Interest", input.interest)}
        ${row("Language", input.lang)}
        ${row("Page", input.page)}
        ${row("Desk", desk)}
        ${row("Message", input.message)}
      </table>
    </div>`;

    const delivery = await sendEmail({
      from: routing.from,
      to: routing.to,
      subject: `${desk === "events" ? "New events enquiry" : "New enquiry"} — ${input.name}${input.interest ? ` (${input.interest})` : ""}`,
      text: [
        `Reference: ${reference}`,
        `Desk: ${desk}`,
        `Name: ${input.name}`,
        input.company ? `Company: ${input.company}` : "",
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : "",
        input.interest ? `Interest: ${input.interest}` : "",
        input.page ? `Page: ${input.page}` : "",
        "",
        input.message ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
      html,
      replyTo: input.email,
    });

    if (delivery.sent && lead) {
      await db.update(schema.leads).set({ emailed: true }).where(eq(schema.leads.id, lead.id));
    } else if (lead) {
      // The lead is safely stored, so the visitor still gets a success response.
      // Log loudly so a failed notification is never silent for the operator.
      console.error(
        `[leads] lead #${lead.id} (${input.name} <${input.email}>) saved but NOT emailed to ${routing.to} — ${delivery.reason ?? "unknown"}. Recover it with: bun run leads:list`,
      );
    }

    // Customer confirmation. Strictly best-effort: it runs after the lead is
    // stored and after the internal notification, and any failure here is
    // logged only — it can never fail the submission or the internal email.
    let confirmationSent = false;
    if (lead && input.email.trim().toLowerCase() !== extractAddress(routing.to)) {
      try {
        const confirmation = buildLeadConfirmationEmail({
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          interest: input.interest,
          reference,
          lang: input.lang,
        });

        const result = await sendEmail({
          from: routing.from,
          to: input.email,
          subject: confirmation.subject,
          html: confirmation.html,
          text: confirmation.text,
          replyTo: confirmation.replyTo,
        });

        confirmationSent = result.sent;
        if (!result.sent) {
          console.error(
            `[leads] confirmation for lead #${lead.id} (${reference}) NOT sent to ${input.email} — ${result.reason ?? "unknown"}. The lead is stored and the internal notification is unaffected.`,
          );
        }
      } catch (err) {
        console.error(
          `[leads] confirmation for lead #${lead.id} (${reference}) threw unexpectedly: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      ok: true,
      id: lead?.id ?? null,
      reference,
      confirmationSent,
      duplicate: false,
      emailed: delivery.sent,
      emailError: delivery.sent ? undefined : (delivery.reason ?? "unknown"),
    };
  }),
};
