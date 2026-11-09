import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";
import { computeQuoteTotals, parseQuoteLines, quoteLineSchema, quoteReference } from "../../../services/quote";

const optional = (max: number) => z.string().trim().max(max).nullable().optional();

const quoteInput = z.object({
  customerName: z.string().trim().min(1).max(120),
  company: optional(120),
  phone: optional(40),
  email: z.string().trim().email().max(160).or(z.literal("")).nullable().optional(),
  subject: optional(200),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(quoteLineSchema).min(1).max(100),
  discountCents: z.number().int().min(0).max(1_000_000_000).default(0),
  vatPercent: z.number().int().min(0).max(100).default(0),
  notes: optional(2000),
});

function toRow(input: z.infer<typeof quoteInput>) {
  const { lines, ...rest } = input;
  return {
    ...rest,
    company: rest.company || null,
    phone: rest.phone || null,
    email: rest.email || null,
    subject: rest.subject || null,
    notes: rest.notes || null,
    linesJson: JSON.stringify(lines),
  };
}

function present(row: typeof schema.quotes.$inferSelect) {
  const { linesJson, ...rest } = row;
  const lines = parseQuoteLines(linesJson);
  return { ...rest, reference: quoteReference(row.id), lines, ...computeQuoteTotals(lines, row.discountCents, row.vatPercent) };
}

/** Admin → Quotes: hand-written quotations. Same permission as RFQs and event plans. */
export const quotes = {
  list: requirePermission("manage_rfqs").handler(async () => {
    const rows = await db.select().from(schema.quotes).orderBy(desc(schema.quotes.id));
    return rows.map((r) => {
      const { lines, ...rest } = present(r);
      return { ...rest, itemCount: lines.length };
    });
  }),

  get: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const [row] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, input.id));
      if (!row) throw new ORPCError("NOT_FOUND");
      return present(row);
    }),

  create: requirePermission("manage_rfqs")
    .input(quoteInput)
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(schema.quotes)
        .values({ ...toRow(input), createdBy: context.user.id })
        .returning();
      return present(row);
    }),

  update: requirePermission("manage_rfqs")
    .input(quoteInput.extend({ id: z.number().int() }))
    .handler(async ({ input }) => {
      const { id, ...rest } = input;
      const [row] = await db.update(schema.quotes).set(toRow(rest)).where(eq(schema.quotes.id, id)).returning();
      if (!row) throw new ORPCError("NOT_FOUND");
      return present(row);
    }),

  remove: requirePermission("manage_rfqs")
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input }) => {
      await db.delete(schema.quotes).where(eq(schema.quotes.id, input.id));
      return { ok: true };
    }),
};
