import { Check, Minus, Plus } from "lucide-react";
import { useLang } from "../../i18n";
import { formatPriceCents } from "../../lib/money";
import { rentalMultiplier } from "../../../api/lib/event-plan-pricing";
import type { PlannerItem } from "../../queries/event-plan";
import type { Pick } from "../../lib/event-plan-lines";
import { buildLines } from "../../lib/event-plan-lines";

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07] [&>option]:bg-[#0b1f3a]";

function unitSuffix(rentalUnit: string | null, t: ReturnType<typeof useLang>["t"]) {
  if (rentalUnit === "day") return t.eventPlanner.item.perDay;
  if (rentalUnit === "week") return t.eventPlanner.item.perWeek;
  if (rentalUnit === "event") return t.eventPlanner.item.perEvent;
  return "";
}

interface Props {
  item: PlannerItem;
  pick: Pick | undefined;
  attendees: number;
  eventDays: number;
  onToggle: () => void;
  onChange: (next: Pick) => void;
}

/** One tickable item: checkbox + price hint; once ticked, its options, quantity and note open underneath. */
export function ItemCard({ item, pick, attendees, eventDays, onToggle, onChange }: Props) {
  const { t, lang } = useLang();
  const name = lang === "ar" ? item.nameAr : item.nameEn;
  const desc = lang === "ar" ? item.descAr : item.descEn;
  const unit = lang === "ar" ? item.unitAr : item.unitEn;
  const checked = Boolean(pick);
  const cheapest = item.variants[0] ? [...item.variants].sort((a, b) => a.salePriceCents - b.salePriceCents)[0] : null;
  const line = pick ? buildLines([item], { [item.id]: pick }, eventDays)[0] : null;

  return (
    <div
      className={`glass-card overflow-hidden rounded-2xl border transition-colors ${
        checked ? "border-[#FF6B00]/70" : "border-transparent"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-4 text-start sm:p-5"
      >
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
            checked ? "border-[#FF6B00] bg-[#FF6B00]" : "border-white/30 bg-white/[0.04]"
          }`}
        >
          {checked && <Check size={15} className="text-white" strokeWidth={3} />}
        </span>
        {item.imageUrl && (
          <img src={item.imageUrl} alt="" loading="lazy" className="hidden size-16 shrink-0 rounded-lg object-cover sm:block" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-white">{name}</span>
          {desc && <span className="mt-1 block text-xs leading-relaxed text-[#B9C2D0]">{desc}</span>}
        </span>
        <span className="shrink-0 text-end text-xs">
          {cheapest ? (
            <>
              <span className="block text-white/50">{t.eventPlanner.item.from}</span>
              <span className="block text-sm font-bold text-[#FF8A3D]">
                {formatPriceCents(cheapest.salePriceCents, cheapest.currency)}
              </span>
              {unitSuffix(cheapest.rentalUnit, t) && <span className="block text-white/50">{unitSuffix(cheapest.rentalUnit, t)}</span>}
            </>
          ) : (
            <span className="inline-block max-w-[7rem] rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-[#B9C2D0]">
              {t.eventPlanner.item.requiresQuote}
            </span>
          )}
        </span>
      </button>

      {pick && (
        <div className="space-y-4 border-t border-white/10 bg-white/[0.02] p-4 sm:p-5">
          {item.variants.length > 1 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.eventPlanner.item.optionLabel}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {item.variants.map((v) => {
                  const on = (pick.variantId ?? item.variants[0].id) === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onChange({ ...pick, variantId: v.id })}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm text-start transition-colors ${
                        on ? "border-[#FF6B00] bg-white/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/30"
                      }`}
                    >
                      <span className="text-white">{v.name}</span>
                      <span className="shrink-0 text-xs text-[#FF8A3D]">
                        {formatPriceCents(v.salePriceCents, v.currency)}
                        {unitSuffix(v.rentalUnit, t) && <span className="text-white/50"> {unitSuffix(v.rentalUnit, t)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {item.variants.length === 1 && (
            <p className="text-xs text-[#B9C2D0]">
              {item.variants[0].name} —{" "}
              <span className="text-[#FF8A3D]">{formatPriceCents(item.variants[0].salePriceCents, item.variants[0].currency)}</span>{" "}
              {unitSuffix(item.variants[0].rentalUnit, t)}
            </p>
          )}

          {item.specs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.specs.map((spec, gi) => (
                <label key={gi} className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {lang === "ar" ? spec.nameAr : spec.nameEn}
                  </span>
                  <select
                    value={pick.specs[gi] ?? ""}
                    onChange={(e) => {
                      const next = { ...pick.specs };
                      if (e.target.value === "") delete next[gi];
                      else next[gi] = Number(e.target.value);
                      onChange({ ...pick, specs: next });
                    }}
                    className={`${fieldClass} mt-1.5`}
                  >
                    <option value="">—</option>
                    {spec.values.map((v, vi) => (
                      <option key={vi} value={vi}>
                        {lang === "ar" ? v.ar : v.en}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          {item.qtyMode !== "none" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {t.eventPlanner.item.qtyLabel}
                {unit ? ` (${unit})` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex w-fit items-center gap-1 rounded-full border border-white/15 px-1.5 py-1">
                  <button
                    type="button"
                    aria-label="-"
                    onClick={() => onChange({ ...pick, qty: Math.max(1, pick.qty - 1) })}
                    className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={pick.qty}
                    onChange={(e) => onChange({ ...pick, qty: Math.max(1, Math.min(1_000_000, Math.trunc(Number(e.target.value)) || 1)) })}
                    className="w-20 bg-transparent text-center text-sm font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => onChange({ ...pick, qty: pick.qty + 1 })}
                    className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {item.qtyMode === "attendees" && attendees > 0 && pick.qty !== attendees && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...pick, qty: attendees })}
                    className="rounded-full border border-[#FF6B00]/50 px-3 py-1.5 text-xs font-medium text-[#FF8A3D] transition-colors hover:bg-[#FF6B00]/10"
                  >
                    {t.eventPlanner.item.useAttendees.replace("{n}", String(attendees))}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#B9C2D0]">{t.eventPlanner.item.serviceNote}</p>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{t.eventPlanner.item.noteLabel}</span>
            <input
              value={pick.note}
              maxLength={300}
              onChange={(e) => onChange({ ...pick, note: e.target.value })}
              placeholder={t.eventPlanner.item.notePlaceholder}
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          {line && (
            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm">
              <span className="text-[#B9C2D0]">{t.eventPlanner.item.lineTotal}</span>
              {line.price.totalCents === null ? (
                <span className="text-xs font-medium text-[#B9C2D0]">{t.eventPlanner.item.lineQuote}</span>
              ) : (
                <span className="text-end">
                  <span className="font-bold text-white">{formatPriceCents(line.price.totalCents, line.variant?.currency)}</span>
                  {line.price.multiplier > 1 && (
                    <span className="block text-[11px] text-white/50">
                      × {rentalMultiplier(line.variant?.rentalUnit ?? null, eventDays)}{" "}
                      {line.variant?.rentalUnit === "week" ? t.eventPlanner.item.weeks : t.eventPlanner.item.days}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
