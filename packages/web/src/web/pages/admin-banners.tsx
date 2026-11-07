import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import {
  useAdminBanners,
  useCreateBanner,
  useMoveBanner,
  useRemoveBanner,
  useUpdateBanner,
  useUploadBannerImage,
} from "../queries/admin-banners";
import { useAdminProducts } from "../queries/admin-products";
import { useAdminCategories } from "../queries/admin-categories";

type Banner = NonNullable<ReturnType<typeof useAdminBanners>["data"]>[number];
type LinkKind = "product" | "category" | "url" | "none";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

function BannerForm({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const upload = useUploadBannerImage();
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageKey, setImageKey] = useState(banner?.imageKey ?? "");
  const [preview, setPreview] = useState(banner?.imageUrl ?? "");
  const [titleEn, setTitleEn] = useState(banner?.titleEn ?? "");
  const [titleAr, setTitleAr] = useState(banner?.titleAr ?? "");
  const [subtitleEn, setSubtitleEn] = useState(banner?.subtitleEn ?? "");
  const [subtitleAr, setSubtitleAr] = useState(banner?.subtitleAr ?? "");
  const [badgeEn, setBadgeEn] = useState(banner?.badgeEn ?? "");
  const [badgeAr, setBadgeAr] = useState(banner?.badgeAr ?? "");
  const [ctaEn, setCtaEn] = useState(banner?.ctaEn ?? "");
  const [ctaAr, setCtaAr] = useState(banner?.ctaAr ?? "");
  const [linkKind, setLinkKind] = useState<LinkKind>(
    banner?.productId ? "product" : banner?.categoryId ? "category" : banner?.linkUrl ? "url" : "product",
  );
  const [productId, setProductId] = useState(banner?.productId ? String(banner.productId) : "");
  const [categoryId, setCategoryId] = useState(banner?.categoryId ? String(banner.categoryId) : "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);

  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error ?? upload.error;
  const hasTitle = titleEn.trim() && titleAr.trim();

  function save() {
    const payload = {
      imageKey,
      titleEn: titleEn.trim(),
      titleAr: titleAr.trim(),
      subtitleEn: subtitleEn.trim() || null,
      subtitleAr: subtitleAr.trim() || null,
      badgeEn: badgeEn.trim() || null,
      badgeAr: badgeAr.trim() || null,
      ctaEn: ctaEn.trim() || null,
      ctaAr: ctaAr.trim() || null,
      productId: linkKind === "product" && productId ? Number(productId) : null,
      categoryId: linkKind === "category" && categoryId ? Number(categoryId) : null,
      linkUrl: linkKind === "url" ? linkUrl.trim() || null : null,
      isActive,
    };
    if (banner) update.mutate({ id: banner.id, ...payload }, { onSuccess: onClose });
    else create.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Card className="mb-6 border-[#FF6B00]/40">
      <CardHeader>
        <CardTitle>{banner ? "Edit slide" : "New slide"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div>
            <Label>Image (4:3 works best)</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/25 bg-white/[0.03] text-white/40 hover:border-[#FF6B00] hover:text-[#FF8A3D]"
            >
              {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs">
                  <Upload size={20} /> Upload image
                </span>
              )}
              {upload.isPending && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="animate-spin text-[#FF6B00]" />
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  upload.mutate(file, {
                    onSuccess: ({ key, previewUrl }) => {
                      setImageKey(key);
                      setPreview(previewUrl);
                    },
                  });
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Title (English)</Label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Summer sale on mugs" />
              </div>
              <div>
                <Label>Title (Arabic)</Label>
                <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
              </div>
              <div>
                <Label>Subtitle (English)</Label>
                <Input value={subtitleEn} onChange={(e) => setSubtitleEn(e.target.value)} />
              </div>
              <div>
                <Label>Subtitle (Arabic)</Label>
                <Input value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} dir="rtl" />
              </div>
              <div>
                <Label>Badge (English, optional)</Label>
                <Input value={badgeEn} onChange={(e) => setBadgeEn(e.target.value)} placeholder="Limited offer" />
              </div>
              <div>
                <Label>Badge (Arabic, optional)</Label>
                <Input value={badgeAr} onChange={(e) => setBadgeAr(e.target.value)} dir="rtl" />
              </div>
              <div>
                <Label>Button text (English)</Label>
                <Input value={ctaEn} onChange={(e) => setCtaEn(e.target.value)} placeholder="Shop now" />
              </div>
              <div>
                <Label>Button text (Arabic)</Label>
                <Input value={ctaAr} onChange={(e) => setCtaAr(e.target.value)} dir="rtl" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Clicking the slide opens</Label>
                <Select value={linkKind} onChange={(e) => setLinkKind(e.target.value as LinkKind)}>
                  <option value="product">A product page</option>
                  <option value="category">A category</option>
                  <option value="url">A custom link</option>
                  <option value="none">Nothing</option>
                </Select>
              </div>
              <div>
                {linkKind === "product" && (
                  <>
                    <Label>Product</Label>
                    <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                      <option value="">Choose a product…</option>
                      {products.data
                        ?.filter((p) => p.isActive || String(p.id) === productId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameEn}
                          </option>
                        ))}
                    </Select>
                  </>
                )}
                {linkKind === "category" && (
                  <>
                    <Label>Category</Label>
                    <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                      <option value="">Choose a category…</option>
                      {categories.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn}
                        </option>
                      ))}
                    </Select>
                  </>
                )}
                {linkKind === "url" && (
                  <>
                    <Label>Link (/path or https://…)</Label>
                    <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/marketplace" />
                  </>
                )}
              </div>
            </div>
            {linkKind === "product" && (
              <p className="text-xs text-white/40">The product's discount (if any) shows automatically as a "% OFF" chip on the slide.</p>
            )}
            <label className="flex items-center gap-2 text-sm text-white/80">
              <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Show this slide on the store
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-300">{errorMessage(error)}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={
              saving ||
              upload.isPending ||
              !imageKey ||
              !hasTitle ||
              (linkKind === "product" && !productId) ||
              (linkKind === "category" && !categoryId) ||
              (linkKind === "url" && !linkUrl.trim())
            }
            onClick={save}
            className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {banner ? "Save changes" : "Add slide"}
          </button>
          <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">
            Cancel
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function BannersContent() {
  const banners = useAdminBanners();
  const update = useUpdateBanner();
  const remove = useRemoveBanner();
  const move = useMoveBanner();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);

  const rows = banners.data ?? [];

  return (
    <AdminLayout title="Hero Slides">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[#B9C2D0]">
          These slides rotate at the top of the marketplace. Each one links to a product, a category or any page. The order below is the order shoppers see.
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
          >
            <Plus size={15} /> New slide
          </button>
        )}
      </div>

      {editing && (
        <BannerForm key={editing === "new" ? "new" : editing.id} banner={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      {banners.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#B9C2D0]">No slides yet — the marketplace shows its default header.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((b, i) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <img src={b.imageUrl} alt="" className="aspect-[4/3] w-28 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{b.titleEn}</p>
                <p className="truncate text-left text-sm text-white/50" dir="rtl">
                  {b.titleAr}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {b.productName
                    ? `Product: ${b.productName}`
                    : b.categoryName
                      ? `Category: ${b.categoryName}`
                      : b.linkUrl
                        ? `Link: ${b.linkUrl}`
                        : "Not clickable"}
                </p>
              </div>
              <Badge variant={b.isActive ? "green" : "neutral"}>{b.isActive ? "Visible" : "Hidden"}</Badge>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={i === 0 || move.isPending}
                  onClick={() => move.mutate({ id: b.id, direction: "up" })}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-25"
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={i === rows.length - 1 || move.isPending}
                  onClick={() => move.mutate({ id: b.id, direction: "down" })}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-25"
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => update.mutate({ id: b.id, isActive: !b.isActive })}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label={b.isActive ? "Hide slide" : "Show slide"}
                >
                  {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(b)}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label="Edit slide"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this slide?")) remove.mutate({ id: b.id });
                  }}
                  className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Delete slide"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminBannersPage() {
  useEffect(() => {
    document.title = "Hero Slides — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <BannersContent />
    </AdminProtectedRoute>
  );
}
