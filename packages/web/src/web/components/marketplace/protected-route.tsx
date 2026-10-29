import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useSession } from "../../queries/account";
import { Nav } from "../nav";
import { Footer } from "../footer";

/**
 * Gates account/cart/checkout/RFQ pages behind a signed-in session.
 * While the session is resolving, or once we know there isn't one, this
 * renders a loading shell and redirects to /account/login with a `redirect`
 * back to the page the customer was trying to reach.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isPending && !session) {
      navigate(`/account/login?redirect=${encodeURIComponent(location)}`, { replace: true });
    }
  }, [isPending, session, location, navigate]);

  if (isPending || !session) {
    return (
      <div className="min-h-[100svh] bg-[#0b1f3a]">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center pt-32">
          <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
        </div>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
