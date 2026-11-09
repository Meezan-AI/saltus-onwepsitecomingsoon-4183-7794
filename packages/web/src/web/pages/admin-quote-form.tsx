import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAdminQuote, useCreateQuote, useUpdateQuote } from "../queries/admin-quotes";
import { useMe } from "../queries/account";
import { formatCents } from "../lib/admin-format";

interface LineDraft {
  description: string;
  details: string;
  qty: string;
  unit: string; // JOD, e.g. "12.500"
  kind: "sale" | "rent";
  period: string;
}

const emptyLine = (): LineDraft => ({ description: "", details: "", qty: "1", unit: "", kind: "sale", period: "" });
const ISSUER_KEY = "saltus-quote-issuer";

/** The last person who issued a quote on this browser, so staff don't retype their name and phone. */
function savedIssuer(): { name: string; phone: string } {
  try {
    const v = JSON.parse(localStorage.getItem(ISSUER_KEY) ?? "{}");
    return { name: typeof v.name === "string" ? v.name : "", phone: typeof v.phone === "string" ? v.phone : "" };
  } catch {
    return { name: "", phone: "" };
  }
}
const today = () => new Date().toISOString().slice(0, 10);

/** "12.5" → 12500 fils. Returns null for anything that is not a non-negative number. */
function jodToFils(value: string): number | null {
  const n = Number(value.trim().replace(",", "."));
  if (value.trim() === "" || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1000);
}

interface Draft {
  customerName: string;
  company: string;
  phone: string;
  email: string;
  subject: string;
  issueDate: string;
  lines: LineDraft[];
  discount: string;
  vatPercent: string;
  notes: string;
  preparedByName: string;
  preparedByPhone: string;
}

const blank = (): Draft => {
  const issuer = savedIssuer();
  return {
    customerName: "", company: "", phone: "", email: "", subject: "", issueDate: today(),
    lines: [emptyLine()], discount: "", vatPercent: "0", notes: "",
    preparedByName: issuer.name, preparedByPhone: issuer.phone,
  };
};

function FormContent({ editId, fromId, clientOfId }: { editId?: number; fromId?: number; clientOfId?: number }) {
  const sourceId = editId ?? fromId ?? clientOfId;
  const me = useMe();
  const source = useAdminQuote(sourceId);
  const create = useCreateQuote();
  const update = useUpdateQuote();
  const [, navigate] = useLocation();
  const [d, setD] = useState<Draft>(blank);
  const [loaded, setLoaded] = useState(!sourceId);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState("");

  // Pre-fill when editing, or when duplicating an earlier quote for a repeat client.
  useEffect(() => {
    if (!sourceId || loaded || !source.data) return;
    const q = source.data;
    const issuer = savedIssuer();
    const client = { customerName: q.customerName, company: q.company ?? "", phone: q.phone ?? "", email: q.email ?? "" };
    if (clientOfId) {
      // "New quote for this client": keep the client, start with empty items.
      setD((p) => ({ ...p, ...client }));
    } else {
      setD({
        ...client,
        subject: q.subject ?? "",
        issueDate: editId ? q.issueDate : today(),
        lines: q.lines.map((l) => ({ description: l.description, details: l.details, qty: String(l.qty), unit: (l.unitCents / 1000).toFixed(3), kind: l.kind, period: l.period })),
        discount: q.discountCents ? (q.discountCents / 1000).toFixed(3) : "",
        vatPercent: String(q.vatPercent),
        notes: q.notes ?? "",
        // A duplicate is issued by whoever is making it now; an edit keeps the original issuer.
        preparedByName: editId ? (q.preparedByName ?? "") : issuer.name || (q.preparedByName ?? ""),
        preparedByPhone: editId ? (q.preparedByPhone ?? "") : issuer.phone || (q.preparedByPhone ?? ""),
      });
    }
    setLoaded(true);
  }, [sourceId, editId, clientOfId, loaded, source.data]);

  // New quote with no remembered issuer: suggest the signed-in user's name.
  useEffect(() => {
    const name = me.data?.name;
    if (!editId && name) setD((p) => (p.preparedByName ? p : { ...p, preparedByName: name }));
  }, [me.data?.name, editId]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setLine = (i: number, patch: Partial<LineDraft>) => setD((p) => ({ ...p, lines: p.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const parsedLines = d.lines.map((l) => {
    const qty = Number(l.qty);
    const unit = jodToFils(l.unit);
    return { ok: l.description.trim() !== "" && Number.isInteger(qty) && qty >= 1 && unit !== null, qty, unit: unit ?? 0 };
  });
  const totals = useMemo(() => {
    const subtotal = parsedLines.reduce((s, l) => s + (l.ok ? l.qty * l.unit : 0), 0);
    const discount = Math.min(jodToFils(d.discount || "0") ?? 0, subtotal);
    const vat = Math.round(((subtotal - discount) * (Number(d.vatPercent) || 0)) / 100);
    return { subtotal, discount, vat, total: subtotal - discount + vat };
  }, [parsedLines, d.discount, d.vatPercent]);

  const nameMissing = d.customerName.trim() === "";
  const noLines = !parsedLines.some((l) => l.ok);
  const emailBad = d.email.trim() !== "" && !/^\S+@\S+\.\S+$/.test(d.email.trim());
  const issuerNameMissing = d.preparedByName.trim() === "";
  const issuerPhoneMissing = d.preparedByPhone.trim().length < 5;
  const invalidClass = (bad: boolean) => (showErrors && bad ? "border-red-400 bg-red-500/10" : "");

  async function save() {
    setServerError("");
    if (nameMissing || noLines || emailBad || issuerNameMissing || issuerPhoneMissing || parsedLines.some((l, i) => !l.ok && (d.lines[i].description.trim() || d.lines[i].unit.trim()))) {
      setShowErrors(true);
      return;
    }
    const payload = {
      customerName: d.customerName.trim(),
      company: d.company.trim(),
      phone: d.phone.trim(),
      email: d.email.trim(),
      subject: d.subject.trim(),
      issueDate: d.issueDate || today(),
      lines: d.lines
        .map((l, i) => ({ l, p: parsedLines[i] }))
        .filter(({ p }) => p.ok)
        .map(({ l, p }) => ({ description: l.description.trim(), details: l.details.trim(), qty: p.qty, unitCents: p.unit, kind: l.kind, period: l.kind === "rent" ? l.period.trim() : "" })),
      discountCents: totals.discount,
      vatPercent: Number(d.vatPercent) || 0,
      notes: d.notes.trim(),
      preparedByName: d.preparedByName.trim(),
      preparedByPhone: d.preparedByPhone.trim(),
    };
    try {
      localStorage.setItem(ISSUER_KEY, JSON.stringify({ name: payload.preparedByName, phone: payload.preparedByPhone }));
      const saved = editId ? await update.mutateAsync({ id: editId, ...payload }) : await create.mutateAsync(payload);
      navigate(`/admin/quotes/${saved.id}`);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not save the quote.");
    }
  }

  if (!loaded) return <Loader2 className="animate-spin text-[#FF6B00]" />;
  const busy = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issued by (Saltus ONE)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Your name *</Label>
            <Input value={d.preparedByName} onChange={(e) => set("preparedByName", e.target.value)} className={invalidClass(issuerNameMissing)} />
            {showErrors && issuerNameMissing && <p className="mt-1 text-xs text-red-300">Required</p>}
          </div>
          <div>
            <Label>Your phone *</Label>
            <Input value={d.preparedByPhone} onChange={(e) => set("preparedByPhone", e.target.value)} dir="ltr" placeholder="+962 7X XXX XXXX" className={invalidClass(issuerPhoneMissing)} />
            {showErrors && issuerPhoneMissing && <p className="mt-1 text-xs text-red-300">Required</p>}
          </div>
          <p className="text-xs text-white/40 sm:col-span-2">Printed on the quote as “Prepared by”. Remembered on this browser for your next quote.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Client name *</Label>
            <Input value={d.customerName} onChange={(e) => set("customerName", e.target.value)} className={invalidClass(nameMissing)} />
            {showErrors && nameMissing && <p className="mt-1 text-xs text-red-300">Required</p>}
          </div>
          <div>
            <Label>Company</Label>
            <Input value={d.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div>
            <Label>Phone / WhatsApp</Label>
            <Input value={d.phone} onChange={(e) => set("phone", e.target.value)} dir="ltr" placeholder="+962 7X XXX XXXX" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={d.email} onChange={(e) => set("email", e.target.value)} dir="ltr" className={invalidClass(emailBad)} />
            {showErrors && emailBad && <p className="mt-1 text-xs text-red-300">Enter a valid email</p>}
          </div>
          <div>
            <Label>Subject / project (optional)</Label>
            <Input value={d.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Annual conference printing" />
          </div>
          <div>
            <Label>Quote date</Label>
            <Input type="date" value={d.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
            <p className="mt-1 text-xs text-white/40">Valid for 30 days from this date.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.lines.map((l, i) => {
            const p = parsedLines[i];
            const touched = l.description.trim() !== "" || l.unit.trim() !== "";
            const bad = showErrors && !p.ok && (touched || (i === 0 && noLines));
            return (
              <div key={i} className={`rounded-xl border p-3 ${bad ? "border-red-400/70" : "border-white/10"}`}>
                <div className="grid gap-3 sm:grid-cols-[1fr_90px_130px_130px_auto]">
                  <div>
                    <Label>Description *</Label>
                    <Input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="e.g. Roll-up banner 85×200" />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                  </div>
                  <div>
                    <Label>Unit price (JOD) *</Label>
                    <Input value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} inputMode="decimal" dir="ltr" placeholder="0.000" />
                  </div>
                  <div>
                    <Label>Line total</Label>
                    <div className="flex h-10 items-center text-sm font-semibold text-white">{p.ok ? formatCents(p.qty * p.unit) : "—"}</div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      aria-label="Remove line"
                      disabled={d.lines.length === 1}
                      onClick={() => setD((s) => ({ ...s, lines: s.lines.filter((_, j) => j !== i) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-red-300 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[170px_1fr_1fr]">
                  <div>
                    <Label>Sale or rental</Label>
                    <select
                      value={l.kind}
                      onChange={(e) => setLine(i, { kind: e.target.value as "sale" | "rent" })}
                      className="h-10 w-full rounded-lg border border-white/15 bg-[#0b1f3a] px-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    >
                      <option value="sale">Sale</option>
                      <option value="rent">Rental</option>
                    </select>
                  </div>
                  <div>
                    <Label>{l.kind === "rent" ? "Rental period" : "Details (optional)"}</Label>
                    {l.kind === "rent" ? (
                      <Input value={l.period} onChange={(e) => setLine(i, { period: e.target.value })} placeholder="e.g. 3 days" />
                    ) : (
                      <Input value={l.details} onChange={(e) => setLine(i, { details: e.target.value })} placeholder="Size, paper, finishing…" />
                    )}
                  </div>
                  <div>
                    <Label>{l.kind === "rent" ? "Details (optional)" : " "}</Label>
                    {l.kind === "rent" ? (
                      <Input value={l.details} onChange={(e) => setLine(i, { details: e.target.value })} placeholder="Size, setup, finishing…" />
                    ) : null}
                  </div>
                </div>
                {bad && <p className="mt-2 text-xs text-red-300">Add a description, a whole-number quantity and a price.</p>}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setD((s) => ({ ...s, lines: [...s.lines, emptyLine()] }))}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-[#FF6B00] hover:text-[#FF8A3D]"
          >
            <Plus size={16} /> Add item
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals &amp; notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label>Discount (JOD, optional)</Label>
              <Input value={d.discount} onChange={(e) => set("discount", e.target.value)} inputMode="decimal" dir="ltr" placeholder="0.000" />
            </div>
            <div>
              <Label>VAT</Label>
              <select
                value={d.vatPercent}
                onChange={(e) => set("vatPercent", e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-[#0b1f3a] px-3 text-sm text-white outline-none focus:border-[#FF6B00]"
              >
                <option value="0">No VAT line (prices as stated)</option>
                <option value="16">Add 16% VAT</option>
              </select>
            </div>
            <div>
              <Label>Notes (printed on the quote)</Label>
              <Textarea rows={4} value={d.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2 self-start rounded-xl border border-white/10 p-4 text-sm">
            <div className="flex justify-between text-white/70"><span>Subtotal</span><span>{formatCents(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="flex justify-between text-white/70"><span>Discount</span><span>− {formatCents(totals.discount)}</span></div>}
            {totals.vat > 0 && <div className="flex justify-between text-white/70"><span>VAT ({d.vatPercent}%)</span><span>{formatCents(totals.vat)}</span></div>}
            <div className="flex justify-between border-t border-white/15 pt-2 text-base font-bold text-white"><span>Total</span><span>{formatCents(totals.total)}</span></div>
          </div>
        </CardContent>
      </Card>

      {serverError && <p className="text-sm text-red-300">{serverError}</p>}
      {showErrors && (nameMissing || noLines || emailBad || issuerNameMissing || issuerPhoneMissing) && <p className="text-sm text-red-300">Please fix the highlighted fields.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} {editId ? "Save changes" : "Create quote"} &amp; preview
        </button>
        <Link href={editId ? `/admin/quotes/${editId}` : "/admin/quotes"} className="text-sm text-white/60 hover:text-white">
          Cancel
        </Link>
      </div>
    </div>
  );
}

export default function AdminQuoteFormPage() {
  const params = useParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : undefined;
  const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
  const fromId = !editId && fromParam ? Number(fromParam) || undefined : undefined;
  const clientParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("clientOf") : null;
  const clientOfId = !editId && !fromId && clientParam ? Number(clientParam) || undefined : undefined;
  useEffect(() => {
    document.title = `${editId ? "Edit quote" : "New quote"} — Admin — Saltus ONE`;
  }, [editId]);
  return (
    <AdminProtectedRoute>
      <AdminLayout title={editId ? "Edit quote" : "New quote"}>
        <FormContent key={`${editId ?? "new"}-${fromId ?? ""}-${clientOfId ?? ""}`} editId={editId} fromId={fromId} clientOfId={clientOfId} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
