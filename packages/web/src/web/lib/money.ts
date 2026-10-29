/** Marketplace prices are stored as integer cents/fils (e.g. 45000 = 45.000 JOD). */
export function formatPriceCents(cents: number, currency = "JOD") {
  const amount = cents / 1000;
  // JOD conventionally shows 3 decimal places (fils).
  const decimals = currency === "JOD" ? 3 : 2;
  return `${amount.toFixed(decimals)} ${currency}`;
}
