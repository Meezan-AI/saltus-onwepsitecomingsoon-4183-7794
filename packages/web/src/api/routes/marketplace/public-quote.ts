import { eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { presentQuote } from "./admin/quotes";

/** The customer-facing quote page (/q/:token). The unguessable token is the only key; nothing internal is returned. */
export const publicQuote = {
  get: base.input(z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) })).handler(async ({ input }) => {
    const [row] = await db.select().from(schema.quotes).where(eq(schema.quotes.shareToken, input.token));
    if (!row) throw new ORPCError("NOT_FOUND");
    const q = presentQuote(row);
    return {
      reference: q.reference,
      issueDate: q.issueDate,
      customerName: q.customerName,
      company: q.company,
      phone: q.phone,
      email: q.email,
      subject: q.subject,
      notes: q.notes,
      preparedByName: q.preparedByName,
      preparedByPhone: q.preparedByPhone,
      lines: q.lines,
      subtotalCents: q.subtotalCents,
      discountCents: q.discountCents,
      vatPercent: q.vatPercent,
      vatCents: q.vatCents,
      totalCents: q.totalCents,
    };
  }),
};
