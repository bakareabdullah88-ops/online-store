/**
 * Who can log in while Kamplug is invite-only.
 *
 * To add someone: open Account → Members as an admin and create a login, or run
 * `node scripts/add-member.mjs "Full Name" email@example.com`. Either gives you the
 * password to hand over and an entry to paste below. The login works once the
 * site redeploys (about a minute after the change is pushed).
 *
 * Only hashes are stored: a SHA-256 of the email and a PBKDF2 hash of the password.
 * BACKEND-SEAM: with real auth this list moves to the server (invite-only sign-up).
 */
export type Role = "admin" | "member";

export type AccessEntry = {
  /** Stable id; the account's user id is `u_${id}`. */
  id: string;
  /** Starting display name; people can change it in Settings. */
  name: string;
  role: Role;
  emailHash: string;
  salt: string;
  passwordHash: string;
  /** YYYY-MM-DD */
  addedAt: string;
};

export const accessList: AccessEntry[] = [
  {
    id: "fa7b73471e92",
    name: "Kamplug Admin",
    role: "admin",
    emailHash: "1b0417f8fead0cfd2c5ef967c2eff5046a79928558c742f4f01be2bb5155cb0b",
    salt: "722fc9542ac2ed5011cdd0a0e3c2d4e7",
    passwordHash: "50261b27444e31337b8f1195952d90f533b207a9e92bdfa52b8076019ee4b2d5",
    addedAt: "2026-10-13",
  },
];

export const userIdFor = (entry: Pick<AccessEntry, "id">) => `u_${entry.id}`;
