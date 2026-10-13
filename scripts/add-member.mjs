// Usage: node scripts/add-member.mjs "Full Name" email@example.com [member|admin]
// Prints a login (email + generated password) to hand to the person, and the
// entry to paste into src/config/access.ts. Only hashes go into the code.
import { webcrypto as crypto } from "node:crypto";

const [name, email, role = "member"] = process.argv.slice(2);
if (!name || !email || !["member", "admin"].includes(role)) {
  console.error('Usage: node scripts/add-member.mjs "Full Name" email@example.com [member|admin]');
  process.exit(1);
}
const hex = (buf) => Buffer.from(buf).toString("hex");
const normal = email.trim().toLowerCase();
const emailHash = hex(
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kiosk-access:v1:" + normal)),
);
const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const rnd = crypto.getRandomValues(new Uint8Array(16));
const password = Array.from(rnd, (b) => alphabet[b % alphabet.length])
  .join("")
  .match(/.{4}/g)
  .join("-");
const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);
const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", hash: "SHA-256", salt: Buffer.from(salt, "hex"), iterations: 100_000 },
  key,
  256,
);
const entry = {
  id: hex(crypto.getRandomValues(new Uint8Array(6))),
  name,
  role,
  emailHash,
  salt,
  passwordHash: hex(bits),
  addedAt: new Date().toISOString().slice(0, 10),
};
console.log(`\nLogin for ${name}\n  Email:    ${normal}\n  Password: ${password}\n`);
console.log("Add this to accessList in src/config/access.ts:\n");
console.log(`  ${JSON.stringify(entry, null, 2).replace(/\n/g, "\n  ")},\n`);
