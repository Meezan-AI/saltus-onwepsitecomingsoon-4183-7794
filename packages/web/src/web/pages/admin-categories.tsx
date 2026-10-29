import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminCategories, useCreateCategory, useDeleteCategory } from "../queries/admin-categories";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CategoriesContent() {
  const categories = useAdminCategories();
  const create = useCreateCategory();
  const remove = useDeleteCategory();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [error, setError] = useState("");

  return (
    <AdminLayout title="Categories">
      <div className="mb-6 flex flex-wrap items-end gap-2">
        <Input placeholder="Name (English)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-52" />
        <Input placeholder="Name (Arabic)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-52" dir="rtl" />
        <button
          type="button"
          disabled={!nameEn || !nameAr || create.isPending}
          onClick={() =>
            create.mutate(
              { nameEn, nameAr, slug: slugify(nameEn) },
              { onSuccess: () => { setNameEn(""); setNameAr(""); } },
            )
          }
          className="flex items-center gap-1 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-[#FF8A8A]">{error}</p>}

      {categories.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !categories.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No categories yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-white">{c.nameEn}</TableCell>
                  <TableCell dir="rtl">{c.nameAr}</TableCell>
                  <TableCell className="text-white/50">{c.slug}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() =>
                        remove.mutate({ id: c.id }, { onError: (e) => setError(e instanceof Error ? e.message : "Couldn't delete") })
                      }
                      className="text-white/40 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
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

export default function AdminCategoriesPage() {
  useEffect(() => {
    document.title = "Categories — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <CategoriesContent />
    </AdminProtectedRoute>
  );
}
