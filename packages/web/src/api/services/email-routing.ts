/**
 * Routing table for website form notifications.
 *
 * Each website form belongs to a "desk". A desk defines who the notification is
 * sent FROM (always a Saltus ONE address on the Resend-verified domain) and who
 * it is delivered TO. The visitor's address is never used as the sender — it is
 * only ever set as Reply-To by the caller.
 */

export type FormDesk = "contact" | "events";

export interface DeskRouting {
  /** Sender shown in the mailbox. Must be a Saltus ONE address, never the visitor's. */
  from: string;
  /** Internal mailbox that receives the enquiry. */
  to: string;
}

const CONTACT_FROM = process.env.RESEND_FROM ?? "Saltus ONE <info@saltus-one.com>";
const CONTACT_TO = process.env.LEADS_NOTIFY_EMAIL ?? "info@saltus-one.com";
const EVENTS_FROM = process.env.RESEND_FROM_EVENTS ?? "Saltus ONE <events@saltus-one.com>";
const EVENTS_TO = process.env.EVENTS_NOTIFY_EMAIL ?? "events@saltus-one.com";

const DESKS: Record<FormDesk, DeskRouting> = {
  contact: { from: CONTACT_FROM, to: CONTACT_TO },
  events: { from: EVENTS_FROM, to: EVENTS_TO },
};

/** Pages and interests that belong to the events / conferences & exhibitions desk. */
const EVENTS_PAGE_PATTERN = /conferences|exhibition|events?\b/i;
const EVENTS_INTEREST_PATTERN = /conference|exhibition|event|معرض|معارض|مؤتمر|مؤتمرات|فعالي/i;

/**
 * Picks the desk for a submission. An explicit `desk` from the form always wins;
 * otherwise it is derived from the page the form was submitted on and the
 * selected interest, so the conferences & exhibitions enquiries reach the events
 * mailbox even when the form itself does not declare a desk.
 */
export function resolveDesk(input: { desk?: FormDesk; page?: string | null; interest?: string | null }): FormDesk {
  if (input.desk) return input.desk;
  if (input.page && EVENTS_PAGE_PATTERN.test(input.page)) return "events";
  if (input.interest && EVENTS_INTEREST_PATTERN.test(input.interest)) return "events";
  return "contact";
}

export function deskRouting(desk: FormDesk): DeskRouting {
  return DESKS[desk];
}
