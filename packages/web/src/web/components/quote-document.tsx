import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { EMAIL, PHONE_DISPLAY, WEBSITE } from "../lib/contact";

/** Fixed terms printed on every quotation. */
export const QUOTE_TERMS = [
  "Prices are quoted in Jordanian Dinar (JOD) and include VAT where stated.",
  "This quotation is valid for 30 days from the date of issue.",
  "Payment terms: 50% advance upon approval, 50% on delivery.",
  "Delivery timeline starts from the date of receiving the signed approval and advance payment.",
  "Any scope added after approval is quoted separately.",
];

const ADDRESS = "Zainab Al-Asadiyah Street, Dahiat Al-Rasheed, Amman 11831, Jordan";
export const QUOTE_VALID_DAYS = 30;

/** Official registered company name, printed on every quotation. */
export const COMPANY_NAME_AR = "مسارات سالتوس لإدارة المعارض والفعاليات";
export const COMPANY_NAME_EN = "Saltus Pathways for Exhibitions and Events Management";

export function longDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

const money = (cents: number) => (cents / 1000).toFixed(3);

export interface QuoteDocLine {
  name: string;
  details?: string;
  note?: string;
  qty: number;
  unitCents: number | null;
  totalCents: number | null;
  /** Sale or rental; omitted for event-plan lines. */
  kind?: "sale" | "rent";
  period?: string;
}
export interface QuoteDocGroup {
  label?: string;
  lines: QuoteDocLine[];
}
export interface QuoteDocProps {
  reference: string;
  issued: Date;
  client: { name: string; company?: string | null; phone?: string | null; email?: string | null };
  /** The right-hand block under the header (event details, or the project / subject). */
  aside?: { heading: string; title?: string; rows: string[] };
  /** The Saltus ONE team member who issued the quote. */
  preparedBy?: { name?: string | null; phone?: string | null };
  groups: QuoteDocGroup[];
  totals: {
    label: string;
    subtotalCents: number;
    discountCents?: number;
    vatPercent?: number;
    vatCents?: number;
    totalCents: number;
    unpricedCount?: number;
  };
  notes?: string | null;
  notesLabel: string;
  /** Omit on the customer-facing page. */
  backHref?: string;
  backLabel?: string;
  /** Extra buttons next to Print (e.g. Edit). */
  actions?: ReactNode;
}

/** The printable A4 "Request a Quote" document. Used by both the event-plan quote and the hand-written quotes. */
export function QuoteDocument(p: QuoteDocProps) {
  const validUntil = new Date(p.issued.getTime() + QUOTE_VALID_DAYS * 24 * 60 * 60 * 1000);
  const t = p.totals;

  return (
    <div className="min-h-screen bg-neutral-200 py-3 text-neutral-900 print:bg-white print:py-0 sm:py-6" dir="ltr">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .fixed { display: none !important; }
          .qt-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-3 print:hidden">
        {p.backHref ? (
          <Link href={p.backHref} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black">
            <ArrowLeft size={16} /> {p.backLabel}
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {p.actions}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      <article className="mx-auto max-w-[210mm] bg-white p-4 shadow-lg print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex flex-col gap-4 border-b-4 border-[#FF6B00] pb-5 print:flex-row print:items-start print:justify-between sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <img src="/images/logo-horizontal-trim.png" alt="Saltus ONE" className="h-12 w-auto self-start sm:h-16" />
          <div className="sm:text-right print:text-right">
            <h1 className="text-2xl font-extrabold sm:text-3xl uppercase tracking-wide text-[#0b1f3a] whitespace-nowrap">Request a Quote</h1>
            <p className="mt-1 text-sm text-neutral-600">Ref: <b className="text-neutral-900">{p.reference}</b></p>
            <p className="text-sm text-neutral-600">Date: {longDate(p.issued)}</p>
            <p className="text-sm text-neutral-600">Valid until: {longDate(validUntil)}</p>
          </div>
        </header>

        <section className="qt-avoid mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Prepared for</h2>
            <p className="text-left mt-2 text-base font-semibold" dir="auto">{p.client.name}</p>
            {p.client.company && <p className="text-left text-sm text-neutral-700" dir="auto">{p.client.company}</p>}
            {p.client.phone && <p className="text-sm text-neutral-700" dir="ltr">{p.client.phone}</p>}
            {p.client.email && <p className="break-all text-sm text-neutral-700">{p.client.email}</p>}
          </div>
          {p.preparedBy && (p.preparedBy.name || p.preparedBy.phone) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">Prepared by</h2>
              <p className="text-left mt-2 text-base font-semibold" dir="auto">{p.preparedBy.name}</p>
              <p className="text-sm text-neutral-700">{COMPANY_NAME_EN}</p>
              <p className="text-left text-sm text-neutral-700" dir="auto">{COMPANY_NAME_AR}</p>
              {p.preparedBy.phone && <p className="text-sm text-neutral-700" dir="ltr">{p.preparedBy.phone}</p>}
            </div>
          )}
          {p.aside && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">{p.aside.heading}</h2>
              {p.aside.title && <p className="text-left mt-2 text-base font-semibold" dir="auto">{p.aside.title}</p>}
              {p.aside.rows.map((row) => (
                <p key={row} className="text-left text-sm text-neutral-700" dir="auto">{row}</p>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <MobileLines groups={p.groups} />
          <table className="hidden w-full border-collapse text-sm print:table sm:table">
            <thead>
              <tr className="bg-[#0b1f3a] text-left text-xs uppercase tracking-wide text-white">
                <th className="w-10 px-3 py-2">#</th>
                <th className="px-3 py-2">Description</th>
                <th className="w-16 px-3 py-2 text-right">Qty</th>
                <th className="w-28 px-3 py-2 text-right">Unit (JOD)</th>
                <th className="w-28 px-3 py-2 text-right">Total (JOD)</th>
              </tr>
            </thead>
            <tbody>
              {p.groups.map((g, gi) => (
                <GroupRows key={g.label ?? gi} group={g} offset={p.groups.slice(0, gi).reduce((n, x) => n + x.lines.length, 0)} />
              ))}
            </tbody>
          </table>

          <div className="qt-avoid mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
            {(t.discountCents || t.vatCents) ? (
              <>
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>{money(t.subtotalCents)}</span>
                </div>
                {t.discountCents ? (
                  <div className="flex justify-between text-neutral-700">
                    <span>Discount</span>
                    <span>− {money(t.discountCents)}</span>
                  </div>
                ) : null}
                {t.vatCents ? (
                  <div className="flex justify-between text-neutral-700">
                    <span>VAT ({t.vatPercent}%)</span>
                    <span>{money(t.vatCents)}</span>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex justify-between border-t-2 border-[#0b1f3a] pt-2 text-base font-bold">
              <span>{t.label}</span>
              <span>{money(t.totalCents)} JOD</span>
            </div>
            {t.unpricedCount ? (
              <p className="text-xs text-neutral-600">
                {t.unpricedCount} item{t.unpricedCount > 1 ? "s" : ""} marked “To be quoted” will be priced separately.
              </p>
            ) : null}
          </div>
        </section>

        {p.notes && (
          <section className="qt-avoid mt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B00]">{p.notesLabel}</h2>
            <p className="text-left mt-1 whitespace-pre-wrap text-sm text-neutral-700" dir="auto">{p.notes}</p>
          </section>
        )}

        <section className="qt-avoid mt-8 rounded-lg border border-neutral-300 p-4 sm:p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#0b1f3a]">Terms &amp; Conditions</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-neutral-700">
            {QUOTE_TERMS.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </section>

        <section className="qt-avoid mt-8 grid grid-cols-2 gap-6 text-xs sm:gap-10 text-neutral-600">
          <div>
            <div className="h-12 border-b border-neutral-400" />
            <p className="mt-1">Client approval (name, signature &amp; date)</p>
          </div>
          <div>
            <div className="h-12 border-b border-neutral-400" />
            <p className="mt-1">{COMPANY_NAME_EN}</p>
          </div>
        </section>

        <footer className="qt-avoid mt-10 border-t-4 border-[#0b1f3a] pt-3 text-center text-xs text-neutral-700">
          <p className="font-semibold text-[#0b1f3a]">{COMPANY_NAME_EN}</p>
          <p className="font-semibold text-[#0b1f3a]" dir="rtl">{COMPANY_NAME_AR}</p>
          <p className="mt-1">
            {WEBSITE} · {EMAIL} · <span dir="ltr">{PHONE_DISPLAY}</span>
          </p>
          <p>{ADDRESS}</p>
        </footer>
      </article>
    </div>
  );
}

function GroupRows({ group, offset }: { group: QuoteDocGroup; offset: number }) {
  return (
    <>
      {group.label && (
        <tr className="bg-neutral-100">
          <td colSpan={5} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">
            {group.label}
          </td>
        </tr>
      )}
      {group.lines.map((l, i) => (
        <tr key={i} className="qt-avoid border-b border-neutral-200 align-top">
          <td className="whitespace-nowrap px-3 py-2 text-neutral-500">{offset + i + 1}</td>
          <td className="px-3 py-2">
            <p className="text-left font-medium" dir="auto">
              {l.name}
              {l.kind && (
                <span
                  className={`ml-2 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide ${
                    l.kind === "rent" ? "bg-[#0b1f3a] text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {l.kind === "rent" ? `Rental${l.period ? ` · ${l.period}` : ""}` : "Sale"}
                </span>
              )}
            </p>
            {l.details && <p className="text-left whitespace-pre-wrap text-xs text-neutral-600" dir="auto">{l.details}</p>}
            {l.note && <p className="text-xs italic text-neutral-500">{l.note}</p>}
          </td>
          <td className="px-3 py-2 text-right">{l.qty}</td>
          <td className="px-3 py-2 text-right">{l.unitCents === null ? "—" : money(l.unitCents)}</td>
          <td className="px-3 py-2 text-right font-semibold">
            {l.totalCents === null ? <span className="text-xs font-medium text-neutral-500">To be quoted</span> : money(l.totalCents)}
          </td>
        </tr>
      ))}
    </>
  );
}

function KindBadge({ l }: { l: QuoteDocLine }) {
  if (!l.kind) return null;
  return (
    <span
      className={`ml-2 inline-block whitespace-nowrap rounded px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide ${
        l.kind === "rent" ? "bg-[#0b1f3a] text-white" : "bg-neutral-200 text-neutral-700"
      }`}
    >
      {l.kind === "rent" ? `Rental${l.period ? ` · ${l.period}` : ""}` : "Sale"}
    </span>
  );
}

/** Phone layout: one card per line instead of a five-column table. Hidden when printing. */
function MobileLines({ groups }: { groups: QuoteDocGroup[] }) {
  let n = 0;
  return (
    <div className="border-t-2 border-[#0b1f3a] sm:hidden print:hidden">
      {groups.map((g, gi) => (
        <div key={g.label ?? gi}>
          {g.label && (
            <p className="mt-3 bg-neutral-100 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">{g.label}</p>
          )}
          {g.lines.map((l, i) => {
            n += 1;
            return (
              <div key={i} className="border-b border-neutral-200 py-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 shrink-0 text-sm text-neutral-500">{n}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-left font-medium leading-snug" dir="auto">
                      {l.name}
                      <KindBadge l={l} />
                    </p>
                    {l.details && <p className="text-left mt-0.5 whitespace-pre-wrap text-xs text-neutral-600" dir="auto">{l.details}</p>}
                    {l.note && <p className="text-left mt-0.5 text-xs italic text-neutral-500" dir="auto">{l.note}</p>}
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-neutral-600">
                        {l.qty} × {l.unitCents === null ? "—" : money(l.unitCents)}
                      </span>
                      <span className="font-semibold">
                        {l.totalCents === null ? <span className="text-xs font-medium text-neutral-500">To be quoted</span> : `${money(l.totalCents)} JOD`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
