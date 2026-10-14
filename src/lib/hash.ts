/**
 * Password hashing with Web Crypto (PBKDF2-SHA-256). With the backend on, this runs on the
 * server and hashes never reach a browser; in `mock` mode it runs in the browser and is not a
 * security boundary. BACKEND-SEAM: raise the iteration count (or move to argon2) and rehash
 * on sign-in.
 */
const ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function randomSalt(bytes = 16) {
  const salt = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(salt);
  return toHex(salt);
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const key = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time-ish comparison (length is public). */
export async function verifyPassword(password: string, saltHex: string, expectedHex: string) {
  const actual = await hashPassword(password, saltHex);
  if (actual.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return diff === 0;
}
