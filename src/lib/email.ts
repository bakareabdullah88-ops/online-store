/** Emails compare case-insensitively and without surrounding spaces. */
export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}
