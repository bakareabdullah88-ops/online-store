/**
 * Hashing for the invite list. Shared by the app (checking a login) and
 * scripts/add-member.mjs (creating one), so the two must stay identical.
 */
const EMAIL_PEPPER = "kiosk-access:v1:";

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/** SHA-256 of the normalised email, so the list never contains addresses in plain text. */
export async function emailHash(email: string): Promise<string> {
  const data = new TextEncoder().encode(EMAIL_PEPPER + normaliseEmail(email));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A readable random password: 4 groups of 4, no look-alike characters. */
export function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return chars.match(/.{4}/g)!.join("-");
}
