import { useState } from "react";
import { useCreateAddress } from "../../queries/addresses";
import { useLang } from "../../i18n";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#FF6B00] focus:bg-white/[0.07]";

type AddressFormStrings = {
  labelField: string;
  recipientName: string;
  phone: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  setDefault: string;
  save: string;
  saving: string;
  cancel: string;
};

export function AddressForm({
  strings,
  onSaved,
  onCancel,
}: {
  strings: AddressFormStrings;
  onSaved: (addressId: number) => void;
  onCancel?: () => void;
}) {
  const { dir } = useLang();
  const createAddress = useCreateAddress();
  const [form, setForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    isDefault: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createAddress.mutateAsync({
      label: form.label || undefined,
      recipientName: form.recipientName,
      phone: form.phone,
      city: form.city,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      isDefault: form.isDefault,
    });
    if (result) onSaved(result.id);
  }

  return (
    <form onSubmit={handleSubmit} dir={dir} className="space-y-3">
      <input
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        placeholder={strings.labelField}
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.recipientName}
          onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
          placeholder={strings.recipientName}
          className={inputClass}
        />
        <input
          required
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder={strings.phone}
          className={inputClass}
        />
      </div>
      <input
        required
        value={form.city}
        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        placeholder={strings.city}
        className={inputClass}
      />
      <input
        required
        value={form.addressLine1}
        onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
        placeholder={strings.addressLine1}
        className={inputClass}
      />
      <input
        value={form.addressLine2}
        onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
        placeholder={strings.addressLine2}
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-sm text-[#B9C2D0]">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="h-4 w-4 rounded border-white/30 bg-transparent accent-[#FF6B00]"
        />
        {strings.setDefault}
      </label>

      {createAddress.isError && (
        <p className="text-xs text-[#FF8A8A]">{(createAddress.error as Error)?.message}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={createAddress.isPending}
          className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF8A3D] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createAddress.isPending ? strings.saving : strings.save}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {strings.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
