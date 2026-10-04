import { PHONE_E164, EMAIL, WEBSITE, YOUTUBE_URL, FACEBOOK_URL } from "./contact";

/** Lightweight 256x256 logo used as the vCard PHOTO (base64-embedded for iOS/Android support). */
const VCARD_PHOTO_URL = "/images/logo-contact.png";

function fold(line: string) {
  // RFC 6350: lines longer than 75 octets are folded with CRLF + single space.
  if (line.length <= 74) return line;
  const parts: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    parts.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

async function photoBase64(): Promise<string | null> {
  try {
    const res = await fetch(VCARD_PHOTO_URL);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  } catch {
    return null;
  }
}

/**
 * Builds the Saltus ONE vCard 3.0 payload. The company logo is embedded as base64
 * when it can be fetched; if not, the card is still produced without a photo so
 * saving the contact never breaks.
 */
export async function buildSaltusVCard(): Promise<string> {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:;Saltus ONE;;;",
    "FN:Saltus ONE",
    "ORG:Saltus ONE",
    "TITLE:One Partner. All Digital Solutions.",
    `TEL;TYPE=WORK,VOICE:${PHONE_E164}`,
    `TEL;TYPE=CELL,VOICE:${PHONE_E164}`,
    `EMAIL;TYPE=INTERNET,WORK:${EMAIL}`,
    `URL:https://${WEBSITE}`,
    `URL:${YOUTUBE_URL}`,
    `URL:${FACEBOOK_URL}`,
    `X-SOCIALPROFILE;TYPE=facebook:${FACEBOOK_URL}`,
    `X-SOCIALPROFILE;TYPE=youtube:${YOUTUBE_URL}`,
    "ADR;TYPE=WORK:;;Amman;Amman;;;Jordan",
    `NOTE:WhatsApp: ${PHONE_E164}`,
    `REV:${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}`,
  ];

  const photo = await photoBase64();
  if (photo) lines.push(fold(`PHOTO;ENCODING=b;TYPE=PNG:${photo}`));

  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}

/** Triggers a .vcf download / "Add to Contacts" sheet on iOS, Android and desktop. */
export async function downloadSaltusVCard() {
  const vcard = await buildSaltusVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Saltus-ONE.vcf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
