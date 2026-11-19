import { eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { parseLines, planReference } from "../../services/event-plan";

/** The customer-facing event quotation page (/e/:token). The unguessable token is the only key; nothing internal is returned. */
export const publicEventPlan = {
  get: base.input(z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) })).handler(async ({ input }) => {
    const [row] = await db.select().from(schema.eventPlanRequests).where(eq(schema.eventPlanRequests.shareToken, input.token));
    if (!row) throw new ORPCError("NOT_FOUND");
    return {
      id: row.id,
      reference: planReference(row.id),
      eventType: row.eventType,
      eventName: row.eventName,
      eventDate: row.eventDate,
      eventDays: row.eventDays,
      setupDays: row.setupDays,
      city: row.city,
      venue: row.venue,
      attendees: row.attendees,
      contactName: row.contactName,
      company: row.company,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      notes: row.notes,
      estimatedTotalCents: row.estimatedTotalCents,
      unpricedCount: row.unpricedCount,
      lines: parseLines(row.itemsJson),
    };
  }),
};
