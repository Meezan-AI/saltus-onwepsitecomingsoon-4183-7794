# Email delivery fix — scratchpad (2026-09-06)

## Diagnosis (evidence, not guesses)
- Resend IS integrated: `packages/web/src/api/services/email.ts` + `routes/leads.ts` (oRPC `leads.create`).
- Env present locally AND in production: RESEND_API_KEY (re_…, send-only key), RESEND_FROM="Saltus ONE <info@saltus-one.com>", LEADS_NOTIFY_EMAIL=info@saltus-one.com.
- Direct Resend API test: HTTP 200, id 247d0cf7-2776-4014-b2fe-a4452c5bf4c5 → key valid, domain verified, From authorized.
- PROD test POST https://saltus-one.com/api/rpc/leads/create → `{"ok":true,"id":24,"emailed":true}` → prod has env + Resend accepts.
- DB (`bun run leads:list`): 9 old leads NOT EMAILED (Aug 16, before key was configured); all recent ones emailed ✓.
- DNS (Cloudflare DoH):
  - `saltus-one.com` TXT → ONLY google-site-verification. **NO SPF record at root.**
  - `_dmarc` → `v=DMARC1; p=none;` (no rua, no alignment enforcement)
  - `resend._domainkey.saltus-one.com` → present (DKIM ok)
  - `send.saltus-one.com` → SPF include:amazonses.com + MX feedback-smtp.ap-northeast-1.amazonses.com (Resend MAIL FROM subdomain ok)
  - MX root → smtp.google.com (Workspace)
- ⇒ ROOT CAUSE = inbound/deliverability, not app code: mail is sent externally (Resend/SES) with From = an internal Google Workspace employee address (info@) TO the same mailbox, while the root domain publishes NO SPF. Google Workspace's default anti-spoofing ("protect against spoofing of employee names / domain") sends such mail to spam/quarantine → never seen in the inbox. Plus the 9 Aug-16 leads that were genuinely never emailed (missing key at the time).

## Forms inventory
- `components/lead-form.tsx` (the only form) → used on `/` (index.tsx), `/services/:slug` (service.tsx), `/insights/:slug` (insight.tsx).
- `/contact` and `/conferences-exhibitions` → NO form, contact cards + mailto only (ContactSection).
- Backend: `leads.create` → insert lead → internal notification → visitor confirmation (best-effort).

## Changes being made
1. `services/email.ts` — per-message `from` override. [DONE]
2. NEW `services/email-routing.ts` — contact vs events desk (from/to per form type). [ ]
3. `routes/leads.ts` — formType input + derivation (page/interest), routed from/to, dedupe window, logging. [ ]
4. `components/lead-form.tsx` — duplicate-submit guard, success only when provider accepted, fallback notice. [ ]
5. i18n types/ar/en — `pendingMsg` string. [ ]
6. `.env` + `.env.template` — EVENTS_NOTIFY_EMAIL, RESEND_FROM_EVENTS. [ ]
7. `bun run build` + retest prod after redeploy by user. [ ]

## DNS actions for the user (they must do in Cloudflare / Workspace)
- Add root SPF TXT: `v=spf1 include:_spf.google.com include:amazonses.com ~all`
- Tighten DMARC later: `v=DMARC1; p=none; rua=mailto:dmarc@saltus-one.com;`
- Google Admin → Gmail → Spam/Safety: allowlist Resend/SES or add info@/events@ inbound gateway exception so self-domain mail isn't quarantined.
