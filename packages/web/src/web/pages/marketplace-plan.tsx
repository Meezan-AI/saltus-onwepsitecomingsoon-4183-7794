import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, MessageCircle, Pencil } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ItemCard } from "../components/event-planner/item-card";
import { useEventPlanCatalog, useSubmitEventPlan } from "../queries/event-plan";
import { useSession } from "../queries/account";
import { useLang } from "../i18n";
import { PHONE_E164 } from "../lib/contact";
import { formatPriceCents } from "../lib/money";
import { GROUPS, buildLines, defaultPick, totalsOf, type Pick, type PlannerGroup } from "../lib/event-plan-lines";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07] [&>option]:bg-[#0b1f3a]";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-white/60";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function looksLikePhone(value: string) {
  return /^\+?\d{8,15}$/.test(value.replace(/[\s\-().]/g, ""));
}

const EVENT_TYPES = ["conference", "exhibition", "launch", "meeting", "other"] as const;
type EventType = (typeof EVENT_TYPES)[number];

/** step index: 0 event, 1-4 groups, 5 review, 6 contact */
const STEP_KEYS = ["event", "printed", "gifts", "venue", "services", "review", "contact"] as const;
const LAST = STEP_KEYS.length - 1;

function clampInt(v: string, min: number, max: number) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function MarketplacePlanPage() {
  const { t, lang, dir } = useLang();
  const p = t.eventPlanner;
  const catalog = useEventPlanCatalog();
  const { data: session } = useSession();
  const submit = useSubmitEventPlan();
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType | "">("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDays, setEventDays] = useState(1);
  const [setupDays, setSetupDays] = useState(0);
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [attendees, setAttendees] = useState(100);
  const [picks, setPicks] = useState<Record<number, Pick>>({});

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const accountEmail = session?.user?.email ?? "";
  const accountName = session?.user?.name ?? "";
  useEffect(() => {
    if (accountEmail && !emailTouched) setEmail(accountEmail);
  }, [accountEmail, emailTouched]);
  useEffect(() => {
    if (accountName) setName((n) => n || accountName);
  }, [accountName]);

  const items = catalog.data ?? [];
  const lines = useMemo(() => buildLines(items, picks, eventDays), [items, picks, eventDays]);
  const totals = useMemo(() => totalsOf(lines), [lines]);
  const currency = lines.find((l) => l.variant)?.variant?.currency ?? "JOD";

  function go(next: number) {
    setError(null);
    setStep(next);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function eventValid() {
    return Boolean(eventType && eventDate && city.trim() && attendees >= 1 && eventDays >= 1);
  }

  // Once the missing fields are filled, drop the warning so it doesn't linger.
  useEffect(() => {
    if (step === 0 && showMissing && eventType && eventDate && city.trim() && attendees >= 1) {
      setError(null);
      setShowMissing(false);
    }
  }, [step, showMissing, eventType, eventDate, city, attendees]);

  function next() {
    if (step === 0 && !eventValid()) {
      setShowMissing(true);
      setError(p.event.missing);
      requestAnimationFrame(() =>
        document.querySelector("[data-missing='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    if (step === 5 && lines.length === 0) return setError(p.review.needItems);
    go(Math.min(LAST, step + 1));
  }

  function toggle(itemId: number) {
    setPicks((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _drop, ...rest } = prev;
        return rest;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return prev;
      return { ...prev, [itemId]: defaultPick(item, attendees) };
    });
  }

  function reset() {
    setPicks({});
    setEventType("");
    setEventName("");
    setEventDate("");
    setEventDays(1);
    setSetupDays(0);
    setCity("");
    setVenue("");
    setNotes("");
    setDone(null);
    go(0);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError(p.contact.needName);
    if (!phone.trim() && !email.trim()) return setError(p.contact.needContact);
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setError(p.contact.badEmail);
    if (phone.trim() && !looksLikePhone(phone)) return setError(p.contact.badPhone);
    if (!eventType || lines.length === 0) return setError(p.review.needItems);
    try {
      const res = await submit.mutateAsync({
        eventType,
        eventName: eventName.trim() || undefined,
        eventDate,
        eventDays,
        setupDays,
        city: city.trim(),
        venue: venue.trim() || undefined,
        attendees,
        contactName: name.trim(),
        company: company.trim() || undefined,
        contactPhone: phone.trim(),
        contactEmail: email.trim(),
        notes: notes.trim() || undefined,
        lang,
        website: website || undefined,
        lines: lines.map((l) => ({
          itemId: l.item.id,
          qty: l.item.qtyMode === "none" ? 1 : l.pick.qty,
          variantId: l.variant?.id,
          specs: Object.entries(l.pick.specs).map(([g, v]) => ({ group: Number(g), value: Number(v) })),
          note: l.pick.note.trim() || undefined,
        })),
      });
      setDone({ reference: res.reference });
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError(p.contact.error);
    }
  }

  const miss = (bad: boolean) => showMissing && bad;
  const invalidClass = "!border-red-400/70";
  const reqMark = <span className="text-[#FF6B00]"> *</span>;
  const reqText = (bad: boolean) =>
    miss(bad) ? <span className="mt-1 block text-[11px] font-medium text-red-300">{p.event.fieldRequired}</span> : null;

  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const specText = (l: (typeof lines)[number]) =>
    Object.entries(l.pick.specs)
      .flatMap(([g, v]) => {
        const spec = l.item.specs[Number(g)];
        const val = spec?.values[Number(v)];
        return spec && val ? [`${lang === "ar" ? spec.nameAr : spec.nameEn}: ${lang === "ar" ? val.ar : val.en}`] : [];
      })
      .join(" · ");

  const shell = (children: React.ReactNode) => (
    <div className="min-h-[100svh] bg-[#0b1f3a]" dir={dir}>
      <Seo path="/marketplace/plan" custom={p.meta} />
      <Nav />
      <section className="pt-36 pb-24 sm:pt-40">
        <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28 px-5 sm:px-6">
          {children}
        </div>
      </section>
      <Footer />
    </div>
  );

  // ---------- success ----------
  if (done) {
    const waText = `${p.success.waIntro}\n${p.success.reference}: ${done.reference}`;
    return shell(
      <div className="glass-card rounded-3xl p-8 text-center sm:p-12">
        <CheckCircle2 size={56} className="mx-auto text-[#FF6B00]" />
        <h1 className="font-display mt-5 text-3xl font-extrabold text-white">{p.success.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#B9C2D0]">{p.success.desc}</p>
        <div className="mx-auto mt-6 w-fit rounded-2xl border border-[#FF6B00]/40 bg-white/[0.04] px-8 py-4">
          <p className="text-xs uppercase tracking-wide text-white/50">{p.success.reference}</p>
          <p dir="ltr" className="mt-1 font-mono text-2xl font-bold text-[#FF8A3D]">{done.reference}</p>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${PHONE_E164.replace("+", "")}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={16} />
            {p.success.whatsapp}
          </a>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {p.success.another}
          </button>
          <Link href="/marketplace" className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]">
            {p.success.back}
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/40">{p.success.whatsappHint}</p>
      </div>,
    );
  }

  // ---------- progress ----------
  const progress = (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">
          {p.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(STEP_KEYS.length))}
        </span>
        <span className="font-semibold text-white">{p.steps[STEP_KEYS[step]]}</span>
      </div>
      <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEP_KEYS.length} aria-valuenow={step + 1}>
        {STEP_KEYS.map((k, i) => (
          <button
            key={k}
            type="button"
            aria-label={p.steps[k]}
            disabled={i > step}
            onClick={() => go(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#FF6B00]" : "bg-white/15"} ${i < step ? "cursor-pointer hover:bg-[#FF8A3D]" : ""}`}
          />
        ))}
      </div>
      <div className="mt-2 hidden justify-between text-[11px] text-white/40 sm:flex">
        {STEP_KEYS.map((k, i) => (
          <span key={k} className={i === step ? "text-white" : ""}>{p.steps[k]}</span>
        ))}
      </div>
    </div>
  );

  // ---------- body per step ----------
  let body: React.ReactNode;
  if (catalog.isLoading) {
    body = (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-[#B9C2D0]">
        <Loader2 className="animate-spin text-[#FF6B00]" /> {p.loading}
      </div>
    );
  } else if (catalog.isError) {
    body = <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{p.loadError}</p>;
  } else if (step === 0) {
    body = (
      <div className="glass-card space-y-5 rounded-3xl p-5 sm:p-8">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{p.event.title}</h2>
          <p className="mt-1 text-sm text-[#B9C2D0]">{p.event.desc}</p>
        </div>
        <div>
          <span className={labelClass}>{p.event.typeLabel}{reqMark}</span>
          <div data-missing={miss(!eventType)} className={`mt-2 flex flex-wrap gap-2 rounded-2xl ${miss(!eventType) ? "border border-red-400/70 p-2" : ""}`}>
            {EVENT_TYPES.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setEventType(k)}
                aria-pressed={eventType === k}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  eventType === k ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-white/15 text-white/80 hover:border-white/40"
                }`}
              >
                {p.event.types[k]}
              </button>
            ))}
          </div>
          {reqText(!eventType)}
        </div>
        <label className="block">
          <span className={labelClass}>{p.event.nameLabel}</span>
          <input className={`${inputClass} mt-1.5`} value={eventName} maxLength={160} placeholder={p.event.namePlaceholder} onChange={(e) => setEventName(e.target.value)} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{p.event.dateLabel}{reqMark}</span>
            <input type="date" dir="ltr" data-missing={miss(!eventDate)} className={`${inputClass} mt-1.5 text-start ${miss(!eventDate) ? invalidClass : ""}`} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            {reqText(!eventDate)}
          </label>
          <label className="block">
            <span className={labelClass}>{p.event.attendeesLabel}{reqMark}</span>
            <input type="number" inputMode="numeric" min={1} className={`${inputClass} mt-1.5`} value={attendees} onChange={(e) => setAttendees(clampInt(e.target.value, 1, 1_000_000))} />
          </label>
          <label className="block">
            <span className={labelClass}>{p.event.daysLabel}</span>
            <input type="number" inputMode="numeric" min={1} max={60} className={`${inputClass} mt-1.5`} value={eventDays} onChange={(e) => setEventDays(clampInt(e.target.value, 1, 60))} />
            <span className="mt-1 block text-[11px] text-white/40">{p.event.daysHint}</span>
          </label>
          <label className="block">
            <span className={labelClass}>{p.event.setupLabel}</span>
            <input type="number" inputMode="numeric" min={0} max={60} className={`${inputClass} mt-1.5`} value={setupDays} onChange={(e) => setSetupDays(clampInt(e.target.value, 0, 60))} />
            <span className="mt-1 block text-[11px] text-white/40">{p.event.setupHint}</span>
          </label>
          <label className="block">
            <span className={labelClass}>{p.event.cityLabel}{reqMark}</span>
            <input data-missing={miss(!city.trim())} className={`${inputClass} mt-1.5 ${miss(!city.trim()) ? invalidClass : ""}`} value={city} maxLength={80} placeholder={p.event.cityPlaceholder} onChange={(e) => setCity(e.target.value)} />
            {reqText(!city.trim())}
          </label>
          <label className="block">
            <span className={labelClass}>{p.event.venueLabel}</span>
            <input className={`${inputClass} mt-1.5`} value={venue} maxLength={200} placeholder={p.event.venuePlaceholder} onChange={(e) => setVenue(e.target.value)} />
          </label>
        </div>
      </div>
    );
  } else if (step >= 1 && step <= 4) {
    const g: PlannerGroup = GROUPS[step - 1];
    const groupItems = items.filter((i) => i.groupKey === g);
    const count = groupItems.filter((i) => picks[i.id]).length;
    body = (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{p.groups[g].title}</h2>
          <p className="mt-1 text-sm text-[#B9C2D0]">{p.groups[g].desc}</p>
          <p className="mt-2 text-xs text-[#FF8A3D]">{count > 0 ? p.item.selected.replace("{n}", String(count)) : p.item.skipGroup}</p>
        </div>
        {groupItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            pick={picks[item.id]}
            attendees={attendees}
            eventDays={eventDays}
            onToggle={() => toggle(item.id)}
            onChange={(n) => setPicks((prev) => ({ ...prev, [item.id]: n }))}
          />
        ))}
      </div>
    );
  } else if (step === 5) {
    body = (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{p.review.title}</h2>
          <p className="mt-1 text-sm text-[#B9C2D0]">{p.review.desc}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#FF6B00]">{p.review.eventBox}</h3>
            <button type="button" onClick={() => go(0)} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
              <Pencil size={12} /> {p.review.edit}
            </button>
          </div>
          <p className="mt-2 text-base font-semibold text-white">
            {p.event.types[eventType || "other"]}
            {eventName && ` — ${eventName}`}
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              [p.event.dateLabel, eventDate],
              [p.event.cityLabel, city],
              ...(venue ? [[p.event.venueLabel.replace(/ \(.*\)$/, ""), venue]] : []),
              [p.review.attendees, String(attendees)],
              [p.review.eventDays, String(eventDays)],
              [p.review.setupDays, String(setupDays)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
                <dt className="text-white/50">{k}</dt>
                <dd className="text-white" dir="auto">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#FF6B00]">{p.review.itemsBox}</h3>
          {lines.length === 0 && <p className="mt-3 text-sm text-[#B9C2D0]">{p.review.empty}</p>}
          {GROUPS.map((g, gi) => {
            const gl = lines.filter((l) => l.item.groupKey === g);
            if (gl.length === 0) return null;
            return (
              <div key={g} className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{p.groups[g].title}</h4>
                  <button type="button" onClick={() => go(gi + 1)} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
                    <Pencil size={12} /> {p.review.edit}
                  </button>
                </div>
                <ul className="mt-2 divide-y divide-white/5">
                  {gl.map((l) => {
                    const spec = specText(l);
                    return (
                      <li key={l.item.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-white">{lang === "ar" ? l.item.nameAr : l.item.nameEn}</p>
                          {l.variant && l.item.variants.length > 1 && <p className="text-xs text-[#B9C2D0]">{l.variant.name}</p>}
                          {spec && <p className="text-xs text-[#B9C2D0]">{spec}</p>}
                          {l.pick.note && <p className="text-xs italic text-white/50">“{l.pick.note}”</p>}
                          {l.item.qtyMode !== "none" && (
                            <p className="text-xs text-white/50">
                              {p.review.qty}: {l.pick.qty}
                              {l.price.unitCents !== null && ` × ${formatPriceCents(l.price.unitCents, l.variant?.currency)}`}
                              {l.price.multiplier > 1 && ` × ${l.price.multiplier}`}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-end">
                          {l.price.totalCents === null ? (
                            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-[#B9C2D0]">{p.review.quote}</span>
                          ) : (
                            <span className="font-bold text-white">{formatPriceCents(l.price.totalCents, l.variant?.currency)}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {lines.length > 0 && (
            <div className="mt-5 rounded-xl bg-white/[0.05] p-4">
              {totals.estimatedTotalCents === null ? (
                <p className="text-sm text-[#B9C2D0]">{p.review.estimateNone}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#B9C2D0]">
                      {totals.unpricedCount > 0 ? p.review.estimatePartial : p.review.estimateAll}
                    </span>
                    <span className="text-lg font-extrabold text-[#FF8A3D]">{formatPriceCents(totals.estimatedTotalCents, currency)}</span>
                  </div>
                  {totals.unpricedCount > 0 && (
                    <p className="mt-2 text-xs text-[#B9C2D0]">{p.review.partialNote.replace("{n}", String(totals.unpricedCount))}</p>
                  )}
                </>
              )}
              <p className="mt-3 text-xs leading-relaxed text-white/50">{p.review.disclaimer}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{p.review.humanNote}</p>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    body = (
      <form onSubmit={send} className="glass-card space-y-5 rounded-3xl p-5 sm:p-8" noValidate>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{p.contact.title}</h2>
          <p className="mt-1 text-sm text-[#B9C2D0]">{p.contact.desc}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{p.contact.name}</span>
            <input className={`${inputClass} mt-1.5`} value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{p.contact.company}</span>
            <input className={`${inputClass} mt-1.5`} value={company} maxLength={160} autoComplete="organization" onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{p.contact.phone}</span>
            <input dir="ltr" type="tel" className={`${inputClass} mt-1.5 text-start`} value={phone} maxLength={40} autoComplete="tel" placeholder={p.contact.phonePlaceholder} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>{p.contact.email}</span>
            <input
              dir="ltr"
              type="email"
              className={`${inputClass} mt-1.5 text-start`}
              value={email}
              maxLength={160}
              autoComplete="email"
              onChange={(e) => {
                setEmailTouched(true);
                setEmail(e.target.value);
              }}
            />
          </label>
        </div>
        <label className="block">
          <span className={labelClass}>{p.contact.notes}</span>
          <textarea className={`${inputClass} mt-1.5 min-h-28`} value={notes} maxLength={3000} placeholder={p.contact.notesPlaceholder} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {/* honeypot: hidden from people */}
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <p className="text-xs leading-relaxed text-white/50">{p.review.disclaimer}</p>
        {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:opacity-60"
        >
          {submit.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {submit.isPending ? p.contact.submitting : p.contact.submit}
        </button>
      </form>
    );
  }

  return shell(
    <>
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00] hover:text-[#FF8A3D]">
        <BackIcon size={14} /> {p.success.back}
      </Link>
      <span className="mt-6 block text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">{p.eyebrow}</span>
      <h1 className="font-display mt-2 text-3xl font-extrabold text-white sm:text-4xl">{p.title}</h1>
      <p className="mt-2 mb-8 max-w-xl text-sm leading-relaxed text-[#B9C2D0]">{p.desc}</p>
      {progress}
      {body}
      {error && step !== LAST && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}
      {!catalog.isLoading && !catalog.isError && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:invisible"
          >
            <BackIcon size={16} /> {p.back}
          </button>
          {step < LAST && (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D]"
            >
              {step === 4 ? p.reviewBtn : p.next} <NextIcon size={16} />
            </button>
          )}
        </div>
      )}
    </>,
  );
}
