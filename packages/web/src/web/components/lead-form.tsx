import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Phone, Send } from "lucide-react";
import { useCreateLead } from "../queries/leads";
import { useLang } from "../i18n";
import { PHONE_DISPLAY, PHONE_TEL } from "../lib/contact";
import { trackEvent } from "../lib/analytics";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50";

export function LeadForm({
  defaultInterest,
  title,
  desc,
}: {
  defaultInterest?: string;
  title?: string;
  desc?: string;
}) {
  const { t, lang } = useLang();
  const createLead = useCreateLead();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  // The enquiry reached us but the notification email was not accepted by the
  // provider — the visitor is told to call instead of silently assuming success.
  const [pending, setPending] = useState(false);
  // Fires `form_start` once per form instance, on the visitor's first keystroke/choice.
  const startedRef = useRef(false);

  const onFormInteract = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("form_start", { page: typeof window !== "undefined" ? window.location.pathname : undefined });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Guard against double submits (double click, Enter twice): the mutation is
    // already in flight or the form was already submitted successfully.
    if (createLead.isPending || done) return;
    setError(false);
    setPending(false);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => {
      const v = fd.get(k);
      const s = typeof v === "string" ? v.trim() : "";
      return s.length > 0 ? s : undefined;
    };

    createLead.mutate(
      {
        name: get("name") ?? "",
        company: get("company"),
        email: get("email") ?? "",
        phone: get("phone"),
        interest: get("interest"),
        message: get("message"),
        lang,
        page: typeof window !== "undefined" ? window.location.pathname : undefined,
      },
      {
        onSuccess: (res) => {
          // Success is only claimed once the email service accepted the message.
          setPending(!res.emailed);
          setDone(true);
          // No name/email/phone/message in the event — see lib/analytics.ts.
          trackEvent("generate_lead", {
            interest: get("interest"),
            page: typeof window !== "undefined" ? window.location.pathname : undefined,
          });
        },
        onError: () => setError(true),
      },
    );
  };

  if (done) {
    return (
      <div className="glass-card flex flex-col items-center rounded-3xl px-8 py-16 text-center">
        <CheckCircle2 size={54} className="text-[#FF6B00]" />
        <h3 className="font-display mt-5 text-2xl font-bold text-white">{t.form.successTitle}</h3>
        <p className="mt-3 max-w-sm text-[#B9C2D0]">{pending ? t.form.pendingMsg : t.form.successMsg}</p>
        <a
          href={PHONE_TEL}
          dir="ltr"
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <Phone size={15} />
          {PHONE_DISPLAY}
        </a>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-7 sm:p-9">
      <h3 className="font-display text-2xl font-bold text-white">{title ?? t.form.title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-[#B9C2D0]">{desc ?? t.form.desc}</p>

      <form onSubmit={onSubmit} onChangeCapture={onFormInteract} className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="lf-name">
            {t.form.name} *
          </label>
          <input id="lf-name" name="name" required minLength={2} placeholder={t.form.namePh} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="lf-company">
            {t.form.company}
          </label>
          <input id="lf-company" name="company" placeholder={t.form.companyPh} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="lf-email">
            {t.form.email} *
          </label>
          <input
            id="lf-email"
            name="email"
            type="email"
            required
            dir="ltr"
            placeholder={t.form.emailPh}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lf-phone">
            {t.form.phone}
          </label>
          <input id="lf-phone" name="phone" dir="ltr" placeholder={t.form.phonePh} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="lf-interest">
            {t.form.interest}
          </label>
          <select
            id="lf-interest"
            name="interest"
            defaultValue={defaultInterest ?? ""}
            className={`${inputClass} appearance-none [&>option]:bg-[#0b1f3a]`}
          >
            <option value="">{t.form.interestPh}</option>
            {t.form.interestOptions.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="lf-message">
            {t.form.message}
          </label>
          <textarea
            id="lf-message"
            name="message"
            rows={4}
            placeholder={t.form.messagePh}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <p className="sm:col-span-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {t.form.errorMsg}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={createLead.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {createLead.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {createLead.isPending ? t.form.sending : t.form.submit}
          </button>
          <span className="text-xs text-white/35">
            {t.form.orCall}{" "}
            <a href={PHONE_TEL} dir="ltr" className="font-semibold text-[#FF6B00]">
              {PHONE_DISPLAY}
            </a>
          </span>
        </div>
        <p className="text-xs text-white/30 sm:col-span-2">{t.form.privacy}</p>
      </form>
    </div>
  );
}
