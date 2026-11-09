import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, MessageCircle } from "lucide-react";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useMarkQuoteSent, useSendQuoteEmail } from "../queries/admin-quotes";
import { formatDateTime } from "../lib/admin-format";

type Lang = "ar" | "en";

interface SendableQuote {
  id: number;
  reference: string;
  email: string | null;
  phone: string | null;
  phoneE164: string | null;
  lastSentAt: Date | string | null;
  lastSentVia: string | null;
  lastSentTo: string | null;
  messages: Record<Lang, string>;
}

/** wa.me wants digits only, with the country code. Jordanian local numbers (07…) get 962. */
function whatsappDigits(raw: string): string {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1).replace(/\D/g, "");
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (/^07\d{8}$/.test(d)) return `962${d.slice(1)}`;
  if (/^7\d{8}$/.test(d)) return `962${d}`;
  return d;
}

const REASONS: Record<string, string> = {
  missing_key: "Email isn't set up on the server (no Resend API key).",
  invalid_key: "The email service rejected the server's API key.",
  domain_not_verified: "The sender domain isn't verified in Resend yet.",
  provider_error: "The email service refused the message.",
  network_error: "Couldn't reach the email service. Try again.",
};

const tabClass = (on: boolean) =>
  `inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    on ? "bg-[#FF6B00] text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
  }`;
const langClass = (on: boolean) =>
  `rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-white text-[#0b1f3a]" : "bg-white/10 text-white/70 hover:bg-white/20"}`;

export function QuoteSendDialog({ quote, open, onOpenChange }: { quote: SendableQuote; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [tab, setTab] = useState<"whatsapp" | "email">("whatsapp");
  const [lang, setLang] = useState<Lang>("ar");
  const [phone, setPhone] = useState(quote.phoneE164 ?? quote.phone ?? "");
  const [message, setMessage] = useState(quote.messages.ar);
  const [email, setEmail] = useState(quote.email ?? "");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const sendEmail = useSendQuoteEmail();
  const markSent = useMarkQuoteSent();

  useEffect(() => {
    if (open) setResult(null);
  }, [open, tab]);

  const pickLang = (l: Lang) => {
    setLang(l);
    setMessage(quote.messages[l]);
  };

  function openWhatsApp() {
    const digits = whatsappDigits(phone);
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
    markSent.mutate({ id: quote.id, via: "whatsapp", to: digits || undefined });
    setResult({ ok: true, text: "WhatsApp opened with the message — press Send there to deliver it." });
  }

  async function sendByEmail() {
    setResult(null);
    try {
      const r = await sendEmail.mutateAsync({ id: quote.id, to: email.trim(), lang, note: note.trim() || undefined });
      setResult(r.sent ? { ok: true, text: `Email sent to ${email.trim()}.` } : { ok: false, text: REASONS[r.reason ?? "provider_error"] ?? "The email could not be sent." });
    } catch {
      setResult({ ok: false, text: "Enter a valid email address." });
    }
  }

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Send {quote.reference}</DialogTitle>
        {quote.lastSentAt && (
          <p className="mt-1 text-xs text-white/50">
            Last sent by {quote.lastSentVia === "email" ? "email" : "WhatsApp"}
            {quote.lastSentTo ? ` to ${quote.lastSentTo}` : ""} · {formatDateTime(quote.lastSentAt)}
          </p>
        )}
      </DialogHeader>

      <div className="flex gap-2">
        <button type="button" className={tabClass(tab === "whatsapp")} onClick={() => setTab("whatsapp")}>
          <MessageCircle size={16} /> WhatsApp
        </button>
        <button type="button" className={tabClass(tab === "email")} onClick={() => setTab("email")}>
          <Mail size={16} /> Email
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
        Message language
        <button type="button" className={langClass(lang === "ar")} onClick={() => pickLang("ar")}>العربية</button>
        <button type="button" className={langClass(lang === "en")} onClick={() => pickLang("en")}>English</button>
      </div>

      {tab === "whatsapp" ? (
        <div className="mt-4 space-y-4">
          <div>
            <Label>Customer WhatsApp number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+962 7X XXX XXXX" />
            {!whatsappDigits(phone) && <p className="mt-1 text-xs text-white/40">Leave empty to pick the contact inside WhatsApp.</p>}
          </div>
          <div>
            <Label>Message (you can edit it)</Label>
            <Textarea rows={9} value={message} onChange={(e) => setMessage(e.target.value)} dir="auto" />
          </div>
          <p className="text-xs text-white/40">This opens WhatsApp with the message and quote link ready — you press Send in WhatsApp.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <Label>Customer email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label>Extra note (optional)</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} dir="auto" />
          </div>
          <p className="text-xs text-white/40">Sends a branded Saltus ONE email with the quote number, total and a “View quotation” button.</p>
        </div>
      )}

      {result && (
        <p className={`mt-4 flex items-start gap-2 text-sm ${result.ok ? "text-emerald-300" : "text-red-300"}`}>
          {result.ok && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />} {result.text}
        </p>
      )}

      <DialogFooter>
        <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-white/60 hover:text-white">Close</button>
        {tab === "whatsapp" ? (
          <button type="button" onClick={openWhatsApp} className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
            <MessageCircle size={16} /> Open WhatsApp
          </button>
        ) : (
          <button
            type="button"
            onClick={sendByEmail}
            disabled={!emailOk || sendEmail.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF8A3D] disabled:opacity-50"
          >
            {sendEmail.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Send email
          </button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
