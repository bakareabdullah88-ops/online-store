const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** Random, URL-safe id with a readable prefix, e.g. `o_k3m9x2…`. */
export function newId(prefix: string, length = 12) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `${prefix}_${s}`;
}

/** Human-friendly order code (no ambiguous characters). */
export function orderCode(prefix: string, rand: () => number = Math.random) {
  const chars = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(rand() * chars.length)];
  return `${prefix}-${s}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
