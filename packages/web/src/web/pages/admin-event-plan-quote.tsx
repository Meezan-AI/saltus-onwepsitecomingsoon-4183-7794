import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { AdminProtectedRoute } from "../components/admin/admin-protected-route";
import { QuoteDocument } from "../components/quote-document";
import { useAdminPlan } from "../queries/admin-event-plans";
import { planQuoteProps } from "../lib/event-plan-quote";

function QuoteContent({ id }: { id: number }) {
  const plan = useAdminPlan(id);

  if (plan.isPending || !plan.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const r = plan.data;
  return (
    <QuoteDocument
      {...planQuoteProps(r)}
      issued={new Date()}
      backHref={`/admin/event-plans/${r.id}`}
      backLabel="Back to request"
    />
  );
}

export default function AdminEventPlanQuotePage() {
  const params = useParams<{ id: string }>();
  useEffect(() => {
    document.title = "Request a Quote — Saltus ONE";
  }, []);
  return (
    <AdminProtectedRoute>
      <QuoteContent id={Number(params.id)} />
    </AdminProtectedRoute>
  );
}
