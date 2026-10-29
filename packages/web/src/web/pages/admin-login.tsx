import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { authClient } from "../lib/auth";
import { useMe, useSession } from "../queries/account";
import { BrandWordmark } from "../components/brand-wordmark";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

/** Separate from /account/login — same Better Auth session, but this always lands on /admin, not a customer page. */
export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { data: session } = useSession();
  const { data: me } = useMe();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Admin Login — Saltus ONE";
  }, []);

  useEffect(() => {
    if (session && me?.role === "admin") navigate("/admin", { replace: true });
  }, [session, me, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError("Invalid email or password.");
      return;
    }
    navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#0b1f3a] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <BrandWordmark className="text-xl" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-[#FF8A8A]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
