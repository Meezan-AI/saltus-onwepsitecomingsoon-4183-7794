import { Resend } from "resend";

/** Sender address. Must be on a domain verified in Resend, otherwise sends are rejected. */
const FROM = process.env.RESEND_FROM ?? "Saltus ONE Website <onboarding@resend.dev>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  /**
   * Sender address for this specific message (e.g. the events desk sends as
   * events@saltus-one.com). Must be on a Resend-verified domain. Falls back to
   * RESEND_FROM when omitted. A visitor's address must NEVER be passed here —
   * use `replyTo` for that.
   */
  from?: string;
  /** At least one of `text` or `html` must be provided. */
  text?: string;
  html?: string;
  replyTo?: string;
}

type FailureReason = "missing_key" | "invalid_key" | "domain_not_verified" | "provider_error" | "network_error";

export interface SendEmailResult {
  sent: boolean;
  /** Machine-readable failure cause, for logging and diagnostics. */
  reason?: FailureReason;
  detail?: string;
}

/** Maps a raw Resend error message onto a stable reason code. */
function classify(message: string): FailureReason {
  const m = message.toLowerCase();
  if (m.includes("api key")) return "invalid_key";
  if (m.includes("domain") && (m.includes("verif") || m.includes("not found"))) return "domain_not_verified";
  return "provider_error";
}

/** Actionable hint printed alongside a failure so the cause is obvious in the logs. */
const HINTS: Record<FailureReason, string> = {
  missing_key: "Set RESEND_API_KEY in .env — create one at https://resend.com/api-keys (starts with 're_').",
  invalid_key: "RESEND_API_KEY is rejected by Resend. It must be an API key from https://resend.com/api-keys starting with 're_' — not a DKIM/DNS record.",
  domain_not_verified: `The sender domain in RESEND_FROM (${FROM}) is not verified in Resend. Verify it at https://resend.com/domains, or temporarily use 'onboarding@resend.dev'.`,
  provider_error: "Resend rejected the request. See the detail above.",
  network_error: "Could not reach the Resend API. Check outbound network access.",
};

/**
 * Sends a transactional email through Resend.
 *
 * Never throws — delivery is best-effort so a failed notification can never lose
 * a lead that was already persisted. The returned `reason` tells the caller why
 * a send failed so it can be logged, retried, or surfaced to an operator.
 */
export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailOptions): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] skipped "${subject}" — missing_key. ${HINTS.missing_key}`);
    return { sent: false, reason: "missing_key" };
  }

  try {
    const resend = new Resend(key);
    const recipients = Array.isArray(to) ? to : [to];
    // Resend's types require a content field to be present, so branch on what we have.
    const { data, error } = await resend.emails.send(
      html !== undefined
        ? { from: FROM, to: recipients, subject, html, text, replyTo }
        : { from: FROM, to: recipients, subject, text: text ?? "", replyTo },
    );

    if (error) {
      const reason = classify(error.message);
      console.error(`[email] failed "${subject}" — ${reason}: ${error.message}\n  → ${HINTS[reason]}`);
      return { sent: false, reason, detail: error.message };
    }

    console.info(`[email] sent "${subject}" to ${Array.isArray(to) ? to.join(", ") : to} (id: ${data?.id ?? "n/a"})`);
    return { sent: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[email] network_error "${subject}": ${detail}\n  → ${HINTS.network_error}`);
    return { sent: false, reason: "network_error", detail };
  }
}
