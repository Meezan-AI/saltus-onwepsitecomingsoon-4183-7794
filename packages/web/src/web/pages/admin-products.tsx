import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ImageOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminProducts, useCreateProduct, useRemoveProduct, useSetProductActive } from "../queries/admin-products";
import { useAdminCategories } from "../queries/admin-categories";
import { formatCents, titleCase } from "../lib/admin-format";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

function CreateProductDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateProduct();
  const categories = useAdminCategories();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("other");
  const [discount, setDiscount] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>New Product</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Name (English)</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <div>
          <Label>Name (Arabic)</Label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
        </div>
        <div>
          <Label>SKU</Label>
          <Input value="Generated automatically" disabled readOnly />
        </div>
        <div>
          <Label>Category (section)</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {["equipment", "printing", "gift", "service", "other"].map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Discount % (optional)</Label>
            <Input type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <p className="text-xs text-white/40">Add images and prices on the product page after creating it.</p>
        {create.error && <p className="text-sm text-red-300">{errorMessage(create.error)}</p>}
      </div>
      <DialogFooter>
        <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">
          Cancel
        </button>
        <button
          type="button"
          disabled={!nameEn || !nameAr || create.isPending}
          onClick={() =>
            create.mutate(
              {
                nameEn,
                nameAr,
                categoryId: categoryId ? Number(categoryId) : undefined,
                type: type as never,
                discountPercent: discount ? Math.min(100, Math.max(0, Math.round(Number(discount)))) : 0,
              },
              { onSuccess: onClose },
            )
          }
          className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending && <Loader2 size={14} className="animate-spin" />}
          Create
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function ProductsContent() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const setActive = useSetProductActive();
  const remove = useRemoveProduct();
  const [creating, setCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products.data ?? []).filter((p) => {
      if (categoryFilter === "none" ? p.categoryId !== null : categoryFilter && String(p.categoryId) !== categoryFilter) return false;
      if (q && !`${p.nameEn} ${p.nameAr} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products.data, categoryFilter, search]);

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}" permanently? This cannot be undone.`)) return;
    setNotice(null);
    remove.mutate(
      { id },
      {
        onSuccess: () => setNotice({ kind: "ok", text: `"${name}" deleted.` }),
        onError: (err) => setNotice({ kind: "error", text: `${errorMessage(err)} Use Archive instead.` }),
      },
    );
  }

  return (
    <AdminLayout title="Products">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <div className="w-48">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            <option value="none">No category</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ms-auto flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
        >
          <Plus size={15} /> New Product
        </button>
      </div>

      {notice && (
        <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${notice.kind === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>
          {notice.text}
        </p>
      )}

      {products.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !rows.length ? (
        <p className="text-sm text-[#B9C2D0]">No products found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="block size-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {p.coverImageUrl ? (
                        <img src={p.coverImageUrl} alt="" className="size-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-white/25">
                          <ImageOff size={16} />
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      {p.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">{p.sku}</TableCell>
                  <TableCell className="text-white/70">{p.categoryNameEn ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-white/80">
                    {p.minPriceCents != null ? formatCents(p.minPriceCents) : "—"}
                  </TableCell>
                  <TableCell>
                    {p.activeDiscountPercent > 0 ? <Badge variant="orange">-{p.activeDiscountPercent}%</Badge> : <span className="text-white/30">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "green" : "neutral"}>{p.isActive ? "Active" : "Archived"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white">
                        <Pencil size={13} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActive.mutate({ id: p.id, isActive: !p.isActive })}
                        className="text-xs font-semibold text-white/50 hover:text-white"
                      >
                        {p.isActive ? "Archive" : "Restore"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.nameEn)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-300/70 hover:text-red-300"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && <CreateProductDialog onClose={() => setCreating(false)} />}
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  useEffect(() => {
    document.title = "Products — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <ProductsContent />
    </AdminProtectedRoute>
  );
}
