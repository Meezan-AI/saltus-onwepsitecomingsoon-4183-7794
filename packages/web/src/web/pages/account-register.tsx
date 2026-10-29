import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Loader2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { authClient } from "../lib/auth";
import { useLang } from "../i18n";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

export default function AccountRegisterPage() {
  const { t, dir } = useLang();
  const [, navigate] = useLocation();
  const search = useSearch();
  const redirect = new URLSearchParams(search).get("redirect") || "/account/orders";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<"none" | "exists" | "generic">("none");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorKind("none");
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });
    setSubmitting(false);
    if (signUpError) {
      setErrorKind(signUpError.status === 422 ? "exists" : "generic");
      return;
    }
    navigate(redirect, { replace: true });
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/account/register" custom={t.account.register.meta} />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-md px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.account.register.eyebrow}
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white">{t.account.register.title}</h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.register.desc}</p>

          <form onSubmit={handleSubmit} dir={dir} className="mt-8 space-y-4">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.account.register.nameLabel}
              className={inputClass}
              autoComplete="name"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.account.register.emailLabel}
              className={inputClass}
              autoComplete="email"
            />
            <div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.account.register.passwordLabel}
                className={inputClass}
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-xs text-[#B9C2D0]/60">{t.account.register.passwordHint}</p>
            </div>

            {errorKind !== "none" && (
              <p className="text-sm text-[#FF8A8A]">
                {errorKind === "exists" ? t.account.register.errorExists : t.account.register.error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? t.account.register.submitting : t.account.register.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#B9C2D0]">
            {t.account.register.haveAccount}{" "}
            <Link
              href={`/account/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-[#FF6B00] hover:text-[#FF8A3D]"
            >
              {t.account.register.loginLink}
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
