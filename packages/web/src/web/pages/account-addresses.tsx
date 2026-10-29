import { useState } from "react";
import { Loader2, MapPinOff, Trash2 } from "lucide-react";
import { Seo } from "../components/seo";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";
import { ProtectedRoute } from "../components/marketplace/protected-route";
import { AddressForm } from "../components/marketplace/address-form";
import { useAddresses, useDeleteAddress } from "../queries/addresses";
import { useLang } from "../i18n";

function AddressesContent() {
  const { t, dir } = useLang();
  const addressesQuery = useAddresses();
  const deleteAddress = useDeleteAddress();
  const [adding, setAdding] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

  const addresses = addressesQuery.data ?? [];

  async function handleDelete(id: number) {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      return;
    }
    await deleteAddress.mutateAsync({ id });
    setConfirmingDeleteId(null);
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a]">
      <Seo path="/account/addresses" custom={t.account.addresses.meta} noindex />
      <Nav />
      <section className="bg-[#0b1f3a] pt-40 pb-24">
        <div className="mx-auto max-w-2xl px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            {t.account.addresses.eyebrow}
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            {t.account.addresses.title}
          </h1>
          <p className="mt-2 text-sm text-[#B9C2D0]">{t.account.addresses.desc}</p>

          {addressesQuery.isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-[#FF6B00]" />
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {addresses.length === 0 && !adding && (
                <div className="glass-card rounded-2xl px-6 py-16 text-center">
                  <MapPinOff size={32} className="mx-auto text-white/20" />
                  <p className="mt-4 text-sm text-[#B9C2D0]">{t.account.addresses.empty}</p>
                </div>
              )}

              {addresses.map((address) => (
                <div key={address.id} className="glass-card flex items-start justify-between gap-4 rounded-2xl p-5" dir={dir}>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-white">
                      {address.label ? `${address.label} — ` : ""}
                      {address.recipientName}
                      {address.isDefault && (
                        <span className="rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#FF8A3D]">
                          {t.account.addresses.defaultBadge}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-[#B9C2D0]/80">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                    </p>
                    <p dir="ltr" className="mt-1 text-sm text-[#B9C2D0]/60">
                      {address.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deleteAddress.isPending}
                    aria-label={t.account.addresses.delete}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                      confirmingDeleteId === address.id
                        ? "bg-[#FF4D4D]/20 text-[#FF8A8A]"
                        : "text-white/40 hover:bg-white/10 hover:text-[#FF8A8A]"
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {adding ? (
                <div className="glass-card rounded-2xl p-6">
                  <AddressForm
                    strings={t.account.addresses}
                    onSaved={() => setAdding(false)}
                    onCancel={() => setAdding(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t.account.addresses.addNew}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AccountAddressesPage() {
  return (
    <ProtectedRoute>
      <AddressesContent />
    </ProtectedRoute>
  );
}
