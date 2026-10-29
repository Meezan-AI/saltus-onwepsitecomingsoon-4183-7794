import { useRef, useState } from "react";
import { Loader2, Paperclip, UploadCloud } from "lucide-react";
import { useDesignFileUrl, useDesignFiles, useUploadDesignFiles } from "../../queries/designs";
import { useLang } from "../../i18n";

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".ai", ".psd", ".eps", ".svg"];
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

function isAllowedFile(file: File) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ALLOWED_EXT.includes(ext);
}

/**
 * Design upload → review UI for one order item (report section 8, Phase 3).
 * Supports several files per submission (e.g. a t-shirt's front + back artwork),
 * all grouped under one version and reviewed together by the admin.
 */
export function DesignUploader({ orderItemId, designStatus }: { orderItemId: number; designStatus: string }) {
  const { t, dir } = useLang();
  const tx = t.account.designUpload;
  const filesQuery = useDesignFiles(orderItemId);
  const upload = useUploadDesignFiles();
  const getUrl = useDesignFileUrl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (designStatus === "not_required") {
    return <p className="mt-3 text-xs text-[#B9C2D0]/70">{tx.notRequiredNotice}</p>;
  }

  const files = filesQuery.data ?? [];
  const latestVersion = files.length ? Math.max(...files.map((f) => f.version)) : 0;
  const latestFiles = files.filter((f) => f.version === latestVersion);
  const reviewerNote = latestFiles.find((f) => f.reviewerNote)?.reviewerNote;
  const canUpload = ["pending_upload", "changes_requested"].includes(designStatus);

  function handlePick(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    const badType = arr.some((f) => !isAllowedFile(f));
    const badSize = arr.some((f) => f.size > MAX_SIZE_BYTES);
    if (badType) {
      setValidationError(tx.errorType);
      setSelected([]);
      return;
    }
    if (badSize) {
      setValidationError(tx.errorSize);
      setSelected([]);
      return;
    }
    setValidationError(null);
    setSelected(arr);
  }

  async function handleUpload() {
    if (!selected.length) return;
    try {
      await upload.mutateAsync({ orderItemId, files: selected });
      setSelected([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // surfaced via upload.isError below
    }
  }

  async function handleView(designFileId: number) {
    const { url } = await getUrl.mutateAsync({ designFileId });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{tx.title}</p>

      {designStatus === "submitted" || designStatus === "in_review" ? (
        <p className="mt-2 text-xs text-[#B9C2D0]/80">{tx.waitingReview}</p>
      ) : null}
      {designStatus === "approved" ? <p className="mt-2 text-xs text-[#6FE3A3]">{tx.approvedNotice}</p> : null}
      {designStatus === "changes_requested" ? (
        <div className="mt-2">
          <p className="text-xs text-[#FF8A8A]">{tx.changesRequestedNotice}</p>
          {reviewerNote && (
            <p className="mt-1 text-xs text-[#B9C2D0]/80">
              <span className="font-semibold text-white/80">{tx.reviewerNoteLabel}:</span> {reviewerNote}
            </p>
          )}
        </div>
      ) : null}

      {latestFiles.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {tx.uploadedFiles} ({tx.version} {latestVersion})
          </p>
          {latestFiles.map((f) => (
            <button
              key={f.id}
              onClick={() => handleView(f.id)}
              disabled={getUrl.isPending}
              className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-start text-xs text-[#B9C2D0] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Paperclip size={12} className="flex-shrink-0 text-[#FF6B00]" />
              <span className="truncate">{f.fileName}</span>
            </button>
          ))}
        </div>
      )}

      {canUpload && (
        <div className="mt-3" dir={dir}>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_EXT.join(",")}
            onChange={(e) => handlePick(e.target.files)}
            className="hidden"
            id={`design-file-input-${orderItemId}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`design-file-input-${orderItemId}`}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00]"
            >
              <UploadCloud size={14} />
              {designStatus === "changes_requested" ? tx.reupload : tx.chooseFiles}
            </label>
            {selected.length > 0 && (
              <>
                <span className="text-xs text-[#B9C2D0]/70">
                  {selected.length} {tx.filesSelected}
                </span>
                <button
                  onClick={handleUpload}
                  disabled={upload.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {upload.isPending && <Loader2 size={12} className="animate-spin" />}
                  {upload.isPending ? tx.uploading : tx.upload}
                </button>
              </>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-[#B9C2D0]/50">
            {tx.allowedTypes} — {tx.maxSize}
          </p>
          {(validationError || upload.isError) && (
            <p className="mt-1.5 text-xs text-[#FF8A8A]">{validationError || tx.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
