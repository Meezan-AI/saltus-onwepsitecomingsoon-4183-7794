import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { QuoteDocument } from "../components/quote-document";
import { usePublicPlan } from "../queries/admin-event-plans"; import { planQuoteProps } from "../lib/event-plan-quote";

function PublicPlan({ token }: { token: string }) {
  const quote = usePublicPlan(token);

  if (quote.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }
  if (!quote.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center text-neutral-700">
        <img src="/images/logo-horizontal-trim.png" alt="Saltus ONE" className="mb-4 h-12 w-auto" />
        <p className="font-semibold">This quotation link isn't valid.</p>
        <p className="text-sm">Please contact Saltus ONE on +962 79 588 1811.</p>
      </div>
    );
  }

  return <QuoteDocument {...planQuoteProps(quote.data)} issued={new Date()} />;
}

/** Customer-facing quotation page, opened from the WhatsApp / email link. Not indexed. */
export default function EventPlanPublicPage() {
  const params = useParams<{ token: string }>();
  useEffect(() => {
    document.title = "Quotation — Saltus ONE";
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "robots";
      document.head.appendChild(m);
    }
    m.content = "noindex, nofollow";
  }, []);
  return <PublicPlan token={params.token} />;
}
