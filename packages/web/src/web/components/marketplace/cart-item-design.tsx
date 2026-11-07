import { useRef, useState } from "react";
import { Check, FileUp, Loader2, Paperclip, PenTool, Clock, Ban, X } from "lucide-react";
import { useUploadCartDesignFiles } from "../../queries/cart";
import { useLang } from "../../i18n";

export type DesignMode = "own" | "request" | "none" | "later";
export type DesignFileMeta = { s3Key: string; fileName: string; mimeType?: string; sizeBytes?: number };
export type DesignChoice = { mode: DesignMode | null; brief: string; files: DesignFileMeta[] };

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".ai", ".psd", ".eps", ".svg"];
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

/** A choice is complete once a mode is picked (for "request" a brief is written, for "own" at least one file is attached). */
export function isDesignChoiceComplete(c: DesignChoice) {
  if (!c.mode) return false;
  if (c.mode === "request") return c.brief.trim().length > 0;
  if (c.mode === "own") return c.files.length > 0;
  return true;
}

const textareaClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

/**
 * Per-cart-line design step shown at checkout: upload own files, ask Saltus to
 * design it (brief + optional references), skip, or decide after ordering.
 * Controlled — the checkout page persists it via cart.setItemDesign on submit.
 */
export function CartItemDesign({
  cartItemId,
  title,
  value,
  onChange,
}: {
  cartItemId: number;
  title: string;
  value: DesignChoice;
  onChange: (next: DesignChoice) => void;
}) {
  const { t, dir } = useLang();
  const tx = t.checkout.design;
  const upload = useUploadCartDesignFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const options: { mode: DesignMode; label: string; desc: string; Icon: typeof FileUp }[] = [
    { mode: "own", label: tx.own, desc: tx.ownDesc, Icon: FileUp },
    { mode: "request", label: tx.request, desc: tx.requestDesc, Icon: PenTool },
    { mode: "none", label: tx.none, desc: tx.noneDesc, Icon: Ban },
    { mode: "later", label: tx.later, desc: tx.laterDesc, Icon: Clock },
  ];

  const showFiles = value.mode === "own" || value.mode === "request";

  async function handlePick(list: FileList | null) {
    if (!list || !list.length) return;
    const arr = Array.from(list);
    if (arr.some((f) => !ALLOWED_EXT.includes(f.name.slice(f.name.lastIndexOf(".")).toLowerCase()))) {
      setError(tx.errorType);
      return;
    }
    if (arr.some((f) => f.size > MAX_SIZE_BYTES)) {
      setError(tx.errorSize);
      return;
    }
    setError(null);
    try {
      const uploaded = await upload.mutateAsync({ cartItemId, files: arr });
      onChange({ ...value, files: [...value.files, ...uploaded].slice(0, 10) });
    } catch {
      setError(tx.errorGeneric);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4" dir={dir}>
      <p className="text-sm font-semibold text-white">{title}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map(({ mode, label, desc, Icon }) => {
          const active = value.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...value, mode })}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-xl border p-3 text-start transition-colors ${
                active ? "border-[#FF6B00] bg-[#FF6B00]/10" : "border-white/10 hover:border-white/25"
              }`}
            >
              <Icon size={16} className={`mt-0.5 flex-shrink-0 ${active ? "text-[#FF6B00]" : "text-white/50"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="block text-xs text-[#B9C2D0]/70">{desc}</span>
              </span>
              {active && <Check size={14} className="ms-auto mt-0.5 flex-shrink-0 text-[#FF6B00]" />}
            </button>
          );
        })}
      </div>

      {(value.mode === "own" || value.mode === "request") && (
        <div className="mt-3">
          <label className="text-xs font-semibold text-white/70">
            {value.mode === "request" ? tx.briefLabel : tx.briefOwnLabel}
          </label>
          <textarea
            dir={dir}
            value={value.brief}
            onChange={(e) => onChange({ ...value, brief: e.target.value })}
            placeholder={value.mode === "request" ? tx.briefPlaceholder : tx.briefOwnPlaceholder}
            rows={3}
            maxLength={3000}
            className={`${textareaClass} mt-1.5`}
          />
        </div>
      )}

      {showFiles && (
        <div className="mt-3">
          {value.files.length > 0 && (
            <div className="mb-2 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{tx.attached}</p>
              {value.files.map((f) => (
                <div
                  key={f.s3Key}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-[#B9C2D0]"
                >
                  <Paperclip size={12} className="flex-shrink-0 text-[#FF6B00]" />
                  <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
                  <button
                    type="button"
                    aria-label={tx.remove}
                    title={tx.remove}
                    onClick={() => onChange({ ...value, files: value.files.filter((x) => x.s3Key !== f.s3Key) })}
                    className="flex-shrink-0 text-white/40 hover:text-[#FF8A8A]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_EXT.join(",")}
            onChange={(e) => handlePick(e.target.files)}
            className="hidden"
            id={`cart-design-input-${cartItemId}`}
          />
          <label
            htmlFor={`cart-design-input-${cartItemId}`}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00] ${
              upload.isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            {upload.isPending ? tx.uploading : tx.chooseFiles}
          </label>
          <p className="mt-1.5 text-[11px] text-[#B9C2D0]/50">
            {value.mode === "request" ? tx.filesHintRequest : tx.filesHintOwn}
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-[#FF8A8A]">{error}</p>}
    </div>
  );
}
