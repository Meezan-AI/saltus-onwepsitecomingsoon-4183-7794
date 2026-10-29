import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAdminSuppliers, useCreateSupplier, useSetSupplierActive } from "../queries/admin-suppliers";

function CreateSupplierDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateSupplier();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>New Supplier</DialogTitle>
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
          <Label>Contact Name</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
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
              { nameEn, nameAr, contactName: contactName || undefined, email: email || undefined, phone: phone || undefined },
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

function SuppliersContent() {
  const suppliers = useAdminSuppliers();
  const setActive = useSetSupplierActive();
  const [creating, setCreating] = useState(false);

  return (
    <AdminLayout title="Suppliers">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D]"
        >
          <Plus size={15} /> New Supplier
        </button>
      </div>

      {suppliers.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !suppliers.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No suppliers yet.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-white">{s.nameEn}</TableCell>
                  <TableCell>{s.contactName ?? "—"}</TableCell>
                  <TableCell>{s.email ?? "—"}</TableCell>
                  <TableCell>{s.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "green" : "neutral"}>{s.isActive ? "Active" : "Archived"}</Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setActive.mutate({ id: s.id, isActive: !s.isActive })}
                      className="text-xs font-semibold text-white/50 hover:text-white"
                    >
                      {s.isActive ? "Archive" : "Restore"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && <CreateSupplierDialog onClose={() => setCreating(false)} />}
    </AdminLayout>
  );
}

export default function AdminSuppliersPage() {
  useEffect(() => {
    document.title = "Suppliers — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <SuppliersContent />
    </AdminProtectedRoute>
  );
}
