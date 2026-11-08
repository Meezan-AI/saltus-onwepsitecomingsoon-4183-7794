import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminProducts } from "../queries/admin-products";
import { useAdminPlanItems, useCreatePlanItem, useRemovePlanItem, useUpdatePlanItem } from "../queries/admin-event-plans";

const GROUPS = [
  ["printed", "Conference printing"],
  ["gifts", "Gifts & promotional items"],
  ["venue", "Venue & exhibition setup"],
  ["services", "Services"],
] as const;
type GroupKey = (typeof GROUPS)[number][0];
const QTY_MODES = [
  ["attendees", "Per attendee (defaults to attendee count)"],
  ["one", "Counted quantity (defaults to 1)"],
  ["none", "No quantity (a service)"],
] as const;
type QtyMode = (typeof QTY_MODES)[number][0];

/** Editable spec group: values are kept as text lines "English | Arabic". */
interface SpecDraft {
  nameEn: string;
  nameAr: string;
  valuesText: string;
}

interface Draft {
  id?: number;
  groupKey: GroupKey;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  productId: string;
  qtyMode: QtyMode;
  unitEn: string;
  unitAr: string;
  specs: SpecDraft[];
  sortOrder: string;
  isActive: boolean;
}

const EMPTY: Draft = {
  groupKey: "printed",
  nameEn: "",
  nameAr: "",
  descEn: "",
  descAr: "",
  productId: "",
  qtyMode: "attendees",
  unitEn: "",
  unitAr: "",
  specs: [],
  sortOrder: "",
  isActive: true,
};

function parseValues(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [en, ...rest] = l.split("|");
      const ar = rest.join("|").trim();
      return { en: en.trim(), ar: ar || en.trim() };
    });
}

function ItemsContent() {
  const items = useAdminPlanItems();
  const products = useAdminProducts();
  const create = useCreatePlanItem();
  const update = useUpdatePlanItem();
  const remove = useRemovePlanItem();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  function edit(i: NonNullable<typeof items.data>[number]) {
    setError("");
    setDraft({
      id: i.id,
      groupKey: i.groupKey as GroupKey,
      nameEn: i.nameEn,
      nameAr: i.nameAr,
      descEn: i.descEn ?? "",
      descAr: i.descAr ?? "",
      productId: i.productId ? String(i.productId) : "",
      qtyMode: i.qtyMode as QtyMode,
      unitEn: i.unitEn ?? "",
      unitAr: i.unitAr ?? "",
      specs: i.specs.map((s) => ({
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        valuesText: s.values.map((v) => `${v.en} | ${v.ar}`).join("\n"),
      })),
      sortOrder: String(i.sortOrder),
      isActive: i.isActive,
    });
  }

  function save() {
    if (!draft) return;
    setError("");
    if (!draft.nameEn.trim() || !draft.nameAr.trim()) return setError("Both English and Arabic names are required.");
    const specs = [];
    for (const s of draft.specs) {
      const values = parseValues(s.valuesText);
      if (!s.nameEn.trim() || !s.nameAr.trim() || values.length === 0) {
        return setError("Each option group needs an English name, an Arabic name and at least one value.");
      }
      specs.push({ nameEn: s.nameEn.trim(), nameAr: s.nameAr.trim(), values });
    }
    const payload = {
      groupKey: draft.groupKey,
      nameEn: draft.nameEn.trim(),
      nameAr: draft.nameAr.trim(),
      descEn: draft.descEn.trim() || null,
      descAr: draft.descAr.trim() || null,
      productId: draft.productId ? Number(draft.productId) : null,
      qtyMode: draft.qtyMode,
      unitEn: draft.unitEn.trim() || null,
      unitAr: draft.unitAr.trim() || null,
      specs,
      sortOrder: draft.sortOrder.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(draft.sortOrder)) || 0),
      isActive: draft.isActive,
    };
    const opts = {
      onSuccess: () => setDraft(null),
      onError: (e: unknown) => setError(e instanceof Error ? e.message : "Couldn't save"),
    };
    if (draft.id) update.mutate({ ...payload, id: draft.id }, opts);
    else create.mutate(payload, opts);
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setSpec = (idx: number, patch: Partial<SpecDraft>) =>
    setDraft((d) => (d ? { ...d, specs: d.specs.map((s, i) => (i === idx ? { ...s, ...patch } : s)) } : d));
  const saving = create.isPending || update.isPending;

  return (
    <AdminLayout title="Planner Items">
      <p className="mb-4 max-w-3xl text-sm text-[#B9C2D0]">
        The checklist customers see in «جهّز مؤتمرك». Link an item to a marketplace product to take its prices from the catalog; items with no product
        are shown as “requires a quote”. Option choices (size, colour, paper...) never change the price.
      </p>

      {!draft && (
        <button
          type="button"
          onClick={() => {
            setError("");
            setDraft({ ...EMPTY });
          }}
          className="mb-6 flex items-center gap-1 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
        >
          <Plus size={14} /> Add item
        </button>
      )}

      {draft && (
        <Card className="mb-8">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{draft.id ? "Edit item" : "New item"}</CardTitle>
            <button type="button" onClick={() => setDraft(null)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Group</Label>
                <Select value={draft.groupKey} onChange={(e) => set("groupKey", e.target.value as GroupKey)}>
                  {GROUPS.map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Linked marketplace product (price source)</Label>
                <Select value={draft.productId} onChange={(e) => set("productId", e.target.value)}>
                  <option value="">None — requires a quote</option>
                  {(products.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.nameEn}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Name (English)</Label>
                <Input value={draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input dir="rtl" value={draft.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
              </div>
              <div>
                <Label>Description (English)</Label>
                <Input value={draft.descEn} onChange={(e) => set("descEn", e.target.value)} />
              </div>
              <div>
                <Label>Description (Arabic)</Label>
                <Input dir="rtl" value={draft.descAr} onChange={(e) => set("descAr", e.target.value)} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Select value={draft.qtyMode} onChange={(e) => set("qtyMode", e.target.value as QtyMode)}>
                  {QTY_MODES.map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit (English)</Label>
                  <Input placeholder="pcs" value={draft.unitEn} onChange={(e) => set("unitEn", e.target.value)} />
                </div>
                <div>
                  <Label>Unit (Arabic)</Label>
                  <Input dir="rtl" placeholder="قطعة" value={draft.unitAr} onChange={(e) => set("unitAr", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Sort order (blank = at the end)</Label>
                <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              </div>
              <label className="flex items-center gap-3 self-end pb-2 text-sm text-white">
                <Checkbox checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} />
                Visible to customers
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Options the customer can choose (size, colour, paper...)</Label>
                <button
                  type="button"
                  onClick={() => set("specs", [...draft.specs, { nameEn: "", nameAr: "", valuesText: "" }])}
                  className="flex items-center gap-1 text-xs font-semibold text-[#FF8A3D] hover:text-[#FF6B00]"
                >
                  <Plus size={12} /> Add option group
                </button>
              </div>
              {draft.specs.length === 0 && <p className="mt-2 text-xs text-white/40">No options. The customer only sets a quantity.</p>}
              <div className="mt-2 space-y-3">
                {draft.specs.map((s, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Group name (EN) e.g. Colour" value={s.nameEn} onChange={(e) => setSpec(idx, { nameEn: e.target.value })} />
                      <Input dir="rtl" placeholder="اسم المجموعة مثل: اللون" value={s.nameAr} onChange={(e) => setSpec(idx, { nameAr: e.target.value })} />
                      <button type="button" aria-label="Remove group" onClick={() => set("specs", draft.specs.filter((_, i) => i !== idx))} className="text-white/40 hover:text-red-300">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <Textarea
                      className="mt-2 font-mono text-xs"
                      dir="ltr"
                      placeholder={"One value per line: English | Arabic\nBlack | أسود\nNavy | كحلي"}
                      value={s.valuesText}
                      onChange={(e) => setSpec(idx, { valuesText: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-[#FF8A8A]">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />} Save
              </button>
              <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!draft && error && <p className="mb-3 text-sm text-[#FF8A8A]">{error}</p>}

      {items.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !items.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No items yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Price source</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.data.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs text-white/60">{GROUPS.find(([k]) => k === i.groupKey)?.[1] ?? i.groupKey}</TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{i.nameEn}</div>
                    <div className="text-xs text-white/50" dir="rtl">{i.nameAr}</div>
                  </TableCell>
                  <TableCell className="text-xs">{i.productName ?? <span className="text-white/40">Requires quote</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-white/60">{i.qtyMode}</TableCell>
                  <TableCell className="text-xs text-white/60">{i.specs.length ? i.specs.map((s) => s.nameEn).join(", ") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={i.isActive ? "green" : "neutral"}>{i.isActive ? "Yes" : "Hidden"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <button type="button" aria-label="Edit" onClick={() => edit(i)} className="text-white/50 hover:text-white">
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => {
                          if (!window.confirm(`Delete “${i.nameEn}”? Past requests keep their own copy.`)) return;
                          remove.mutate({ id: i.id }, { onError: (e) => setError(e instanceof Error ? e.message : "Couldn't delete") });
                        }}
                        className="text-white/40 hover:text-red-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminEventPlanItemsPage() {
  useEffect(() => {
    document.title = "Planner Items — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <ItemsContent />
    </AdminProtectedRoute>
  );
}
