import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "../components/admin/admin-layout";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  useDesignFilesForItem,
  useDesignReviewQueue,
  useMarkDesignNotRequired,
  useReviewDesign,
} from "../queries/admin-design-reviews";
import { useDesignFileUrl } from "../queries/designs";
import { statusVariant, titleCase } from "../lib/admin-format";

function ReviewDialog({ orderItemId, onClose }: { orderItemId: number; onClose: () => void }) {
  const files = useDesignFilesForItem(orderItemId);
  const review = useReviewDesign();
  const fileUrl = useDesignFileUrl();
  const [note, setNote] = useState("");

  async function openFile(designFileId: number) {
    const { url } = await fileUrl.mutateAsync({ designFileId });
    window.open(url, "_blank", "noopener");
  }

  const latestVersion = files.data?.[0]?.version ?? 1;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Review Design — Order Item #{orderItemId}</DialogTitle>
      </DialogHeader>

      {files.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !files.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">No files uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {files.data
            .filter((f) => f.version === latestVersion)
            .map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => openFile(f.id)}
                className="block w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-[#FF8A3D] hover:bg-white/[0.06]"
              >
                {f.fileName} <span className="text-white/40">(v{f.version})</span>
              </button>
            ))}
        </div>
      )}

      <div className="mt-4">
        <Textarea placeholder="Reviewer note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <DialogFooter>
        <button
          type="button"
          disabled={review.isPending}
          onClick={() =>
            review.mutate(
              { orderItemId, version: latestVersion, decision: "changes_requested", reviewerNote: note || undefined },
              { onSuccess: onClose },
            )
          }
          className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20 disabled:opacity-50"
        >
          Request Changes
        </button>
        <button
          type="button"
          disabled={review.isPending}
          onClick={() =>
            review.mutate(
              { orderItemId, version: latestVersion, decision: "approved", reviewerNote: note || undefined },
              { onSuccess: onClose },
            )
          }
          className="rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
        >
          Approve
        </button>
      </DialogFooter>
    </Dialog>
  );
}

function DesignReviewsContent() {
  const queue = useDesignReviewQueue();
  const markNotRequired = useMarkDesignNotRequired();
  const [reviewing, setReviewing] = useState<number | null>(null);

  return (
    <AdminLayout title="Design Reviews">
      {queue.isPending ? (
        <Loader2 className="animate-spin text-[#FF6B00]" />
      ) : !queue.data?.length ? (
        <p className="text-sm text-[#B9C2D0]">Nothing waiting for review.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Design Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.order?.orderNumber}</TableCell>
                  <TableCell>{item.product?.nameEn}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.designStatus)}>{titleCase(item.designStatus)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewing(item.id)}
                        className="rounded-full bg-[#FF6B00] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FF8A3D]"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled={markNotRequired.isPending}
                        onClick={() => markNotRequired.mutate({ orderItemId: item.id })}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50"
                      >
                        Not Required
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {reviewing != null && <ReviewDialog orderItemId={reviewing} onClose={() => setReviewing(null)} />}
    </AdminLayout>
  );
}

export default function AdminDesignReviewsPage() {
  useEffect(() => {
    document.title = "Design Reviews — Admin — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <DesignReviewsContent />
    </AdminProtectedRoute>
  );
}
