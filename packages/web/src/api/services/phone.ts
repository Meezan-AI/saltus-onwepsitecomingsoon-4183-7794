/**
 * Normalises a phone / WhatsApp number to E.164 (`+9627XXXXXXXX`).
 * Local Jordanian formats (`079…`, `79…`) are assumed to be +962; anything
 * else must carry its own country code (`+` or `00` prefix).
 * Returns null when the input can't be a valid number.
 */
export function normalizePhone(raw: string): string | null {
  let s = raw.trim().replace(/[\s\-().‎‏]/g, "");
  if (!/^\+?\d+$/.test(s)) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (s.startsWith("+")) {
    /* already international */
  } else if (s.startsWith("962")) s = `+${s}`;
  else if (/^07\d{8}$/.test(s)) s = `+962${s.slice(1)}`;
  else if (/^7\d{8}$/.test(s)) s = `+962${s}`;
  else return null;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}
