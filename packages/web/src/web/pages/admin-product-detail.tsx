import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  useAdminProduct,
  useAddProductVariant,
  useRemoveProductImage,
  useRemoveProductVariant,
  useUpdateProduct,
  useUploadProductImage,
} from "../queries/admin-products";
import { useAdminCategories } from "../queries/admin-categories";
import {
  useCreateOptionGroup,
  useCreateOptionValue,
  useProductOptions,
  useRemoveOptionGroup,
  useRemoveOptionValue,
} from "../queries/admin-product-options";
import {
  useAdminSuppliers,
  useLinkSupplierProduct,
  useSupplierLinksForProduct,
  useUnlinkSupplierProduct,
} from "../queries/admin-suppliers";
import { formatCents } from "../lib/admin-format";
import { useMyPermissions } from "../queries/account";

function ProductBasicInfo({ product, categories }: { product: NonNullable<ReturnType<typeof useAdminProduct>["data"]>; categories: ReturnType<typeof useAdminCategories>["data"] }) {
  const update = useUpdateProduct();
  const [nameEn, setNameEn] = useState(product.nameEn);
  const [nameAr, setNameAr] = useState(product.nameAr);
  const [descriptionEn, setDescriptionEn] = useState(product.descriptionEn ?? "");
  const [descriptionAr, setDescriptionAr] = useState(product.descriptionAr ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ? String(product.categoryId) : "");
  const [fulfillmentType, setFulfillmentType] = useState(product.fulfillmentType);
  const [allowDirectPurchase, setAllowDirectPurchase] = useState(product.allowDirectPurchase);
  const [allowRfq, setAllowRfq] = useState(product.allowRfq);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Name (English)</Label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div>
            <Label>Name (Arabic)</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Description (English)</Label>
            <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
          </div>
          <div>
            <Label>Description (Arabic)</Label>
            <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Fulfillment</Label>
            <Select value={fulfillmentType} onChange={(e) => setFulfillmentType(e.target.value)}>
              <option value="delivery">Delivery</option>
              <option value="pickup_rental">Pickup / Rental</option>
              <option value="mixed_per_variant">Mixed (per variant)</option>
            </Select>
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={allowDirectPurchase} onChange={(e) => setAllowDirectPurchase(e.target.checked)} />
              Direct purchase
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={allowRfq} onChange={(e) => setAllowRfq(e.target.checked)} />
              RFQ
            </label>
          </div>
        </div>
        <button
          type="button"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: product.id,
              nameEn,
              nameAr,
              descriptionEn: descriptionEn || undefined,
              descriptionAr: descriptionAr || undefined,
              categoryId: categoryId ? Number(categoryId) : undefined,
              fulfillmentType: fulfillmentType as never,
              allowDirectPurchase,
              allowRfq,
            })
          }
          className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
        >
          {update.isPending && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </CardContent>
    </Card>
  );
}

function ImagesSection({ productId, images }: { productId: number; images: { id: number; url: string }[] }) {
  const upload = useUploadProductImage();
  const remove = useRemoveProductImage();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative size-24 overflow-hidden rounded-lg border border-white/10">
              <img src={img.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove.mutate({ id: img.id })}
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-white/40 hover:border-[#FF6B00] hover:text-[#FF8A3D]"
          >
            {upload.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-xs">Upload</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate({ productId, file });
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function VariantsSection({ productId, variants }: { productId: number; variants: { id: number; name: string; priceCents: number; stockQty: number | null; isActive: boolean }[] }) {
  const add = useAddProductVariant();
  const remove = useRemoveProductVariant();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {variants.filter((v) => v.isActive).map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
            <span className="font-medium text-white">{v.name}</span>
            <span className="text-white/60">{formatCents(v.priceCents)}</span>
            <span className="text-white/40">{v.stockQty == null ? "Unlimited" : `${v.stockQty} in stock`}</span>
            <button type="button" onClick={() => remove.mutate({ id: v.id })} className="text-white/40 hover:text-red-300">
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="flex flex-wrap items-end gap-2 pt-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          <Input placeholder="Price (JOD)" type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} className="w-32" />
          <Input placeholder="Stock (blank = ∞)" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-40" />
          <button
            type="button"
            disabled={!name || !price || add.isPending}
            onClick={() =>
              add.mutate(
                { productId, name, priceCents: Math.round(Number(price) * 1000), stockQty: stock ? Number(stock) : undefined },
                { onSuccess: () => { setName(""); setPrice(""); setStock(""); } },
              )
            }
            className="flex items-center gap-1 rounded-full bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function OptionsSection({ productId }: { productId: number }) {
  const groups = useProductOptions(productId);
  const createGroup = useCreateOptionGroup();
  const removeGroup = useRemoveOptionGroup();
  const createValue = useCreateOptionValue();
  const removeValue = useRemoveOptionValue();
  const [groupNameEn, setGroupNameEn] = useState("");
  const [groupNameAr, setGroupNameAr] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options (e.g. Color, Size)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.data?.map((group) => (
          <div key={group.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-white">{group.nameEn}</span>
              <button type="button" onClick={() => removeGroup.mutate({ id: group.id })} className="text-white/40 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.values.map((v) => (
                <Badge key={v.id} variant="neutral" className="cursor-pointer" onClick={() => removeValue.mutate({ id: v.id })}>
                  {v.valueEn} ×
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add value"
                value={valueDrafts[group.id] ?? ""}
                onChange={(e) => setValueDrafts({ ...valueDrafts, [group.id]: e.target.value })}
                className="h-8 w-40 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const value = valueDrafts[group.id];
                  if (!value) return;
                  createValue.mutate({ groupId: group.id, valueEn: value, valueAr: value }, { onSuccess: () => setValueDrafts({ ...valueDrafts, [group.id]: "" }) });
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                Add
              </button>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
          <Input placeholder="Group name (English)" value={groupNameEn} onChange={(e) => setGroupNameEn(e.target.value)} className="w-48" />
          <Input placeholder="Group name (Arabic)" value={groupNameAr} onChange={(e) => setGroupNameAr(e.target.value)} className="w-48" dir="rtl" />
          <button
            type="button"
            disabled={!groupNameEn || !groupNameAr || createGroup.isPending}
            onClick={() =>
              createGroup.mutate(
                { productId, nameEn: groupNameEn, nameAr: groupNameAr },
                { onSuccess: () => { setGroupNameEn(""); setGroupNameAr(""); } },
              )
            }
            className="flex items-center gap-1 rounded-full bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
          >
            <Plus size={13} /> Add Group
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SuppliersSection({ productId }: { productId: number }) {
  const links = useSupplierLinksForProduct(productId);
  const suppliers = useAdminSuppliers();
  const link = useLinkSupplierProduct();
  const unlink = useUnlinkSupplierProduct();
  const [supplierId, setSupplierId] = useState("");

  const linkedIds = new Set(links.data?.map((l) => l.supplierId));
  const available = suppliers.data?.filter((s) => s.isActive && !linkedIds.has(s.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.data?.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
            <span className="font-medium text-white">{l.supplier?.nameEn}</span>
            {l.isPreferred && <Badge variant="orange">Preferred</Badge>}
            <span className="text-white/60">{l.costPriceCents != null ? formatCents(l.costPriceCents) : "—"}</span>
            <button type="button" onClick={() => unlink.mutate({ id: l.id })} className="text-white/40 hover:text-red-300">
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="flex items-end gap-2 pt-2">
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-56">
            <option value="">Choose a supplier…</option>
            {available?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameEn}
              </option>
            ))}
          </Select>
          <button
            type="button"
            disabled={!supplierId || link.isPending}
            onClick={() => link.mutate({ productId, supplierId: Number(supplierId) }, { onSuccess: () => setSupplierId("") })}
            className="flex items-center gap-1 rounded-full bg-[#FF6B00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
          >
            <Plus size={13} /> Link
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductDetailContent({ id }: { id: number }) {
  const product = useAdminProduct(id);
  const categories = useAdminCategories();
  const { data: permissions } = useMyPermissions();
  // Supplier identity/cost/contact/notes are confidential: only show this
  // section to admins whose role actually holds manage_suppliers (manager,
  // accounting, super_admin) — a content_editor or sales admin never sees
  // it, matching the server-side gate on every suppliers.* endpoint.
  const canSeeSuppliers = (permissions ?? []).includes("manage_suppliers");

  if (product.isPending || !product.data) {
    return (
      <AdminLayout title="Product">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={product.data.nameEn}>
      <div className="space-y-6">
        <ProductBasicInfo product={product.data} categories={categories.data} />
        <ImagesSection productId={id} images={product.data.images} />
        <VariantsSection productId={id} variants={product.data.variants} />
        <OptionsSection productId={id} />
        {canSeeSuppliers && <SuppliersSection productId={id} />}
      </div>
    </AdminLayout>
  );
}

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  useEffect(() => {
    document.title = "Product — Admin — Saltus ONE";
  }, []);

  return (
    <AdminProtectedRoute>
      <ProductDetailContent id={id} />
    </AdminProtectedRoute>
  );
}
