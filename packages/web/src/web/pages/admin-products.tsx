import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, Plus } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminProducts, useCreateProduct, useSetProductActive } from "../queries/admin-products";
import { useAdminCategories } from "../queries/admin-categories";
import { titleCase } from "../lib/admin-format";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CreateProductDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateProduct();
  const categories = useAdminCategories();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("other");

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
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </Select>
        </div>
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
      </div>
      <DialogFooter>
        <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">
          Cancel
        </button>
        <button
          type="button"
          disabled={!nameEn || !nameAr || !sku || create.isPending}
          onClick={() =>
            create.mutate(
              {
                nameEn,
                nameAr,
                sku,
                slug: slugify(nameEn),
                categoryId: categoryId ? Number(categoryId) : undefined,
                type: type as never,
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
  const setActive = useSetProductActive();
  const [creating, setCreating] = useState(false);

  return (
    <AdminLayout title="Products">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
        >
          <Plus size={15} /> New Product
        </button>
      </div>

      {products.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !products.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No products yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-white hover:text-[#FF8A3D]">
                      {p.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">{p.sku}</TableCell>
                  <TableCell>{titleCase(p.type)}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "green" : "neutral"}>{p.isActive ? "Active" : "Archived"}</Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setActive.mutate({ id: p.id, isActive: !p.isActive })}
                      className="text-xs font-semibold text-white/50 hover:text-white"
                    >
                      {p.isActive ? "Archive" : "Restore"}
                    </button>
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
