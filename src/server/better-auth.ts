import "server-only";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { getPool } from "./pg";

/**
 * Better Auth does the "Continue with Google" part: the redirect to Google,
 * checking what comes back, and its own short-lived session. Kamplug then
 * takes the verified email and signs the person in with its own session
 * (see google.ts). Email and password stay with Kamplug's own sign-in.
 */
function options() {
  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  return {
    appName: "Kamplug",
    advanced: { cookiePrefix: "kamplug-auth" },
    database: getPool(),
    ...(appUrl ? { baseURL: appUrl } : {}),
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL, process.env.BETTER_AUTH_URL].filter(
      (x): x is string => !!x,
    ),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        // Always show the account chooser, so a shared laptop doesn't pick the last person.
        prompt: "select_account" as const,
      },
    },
  };
}

const REQUIRED = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

/** Settings Google sign-in needs that this deployment doesn't have (names only). */
export function missingGoogleSettings(): string[] {
  return REQUIRED.filter(
    (k) => !process.env[k] && !(k === "DATABASE_URL" && process.env.POSTGRES_URL),
  );
}

export function googleConfigured() {
  return missingGoogleSettings().length === 0;
}

type Auth = ReturnType<typeof betterAuth<ReturnType<typeof options>>>;
let auth: Auth | null = null;
let migrated: Promise<void> | null = null;

/** Better Auth, with its tables (user, session, account, verification) created on first use. */
export async function getAuth(): Promise<Auth> {
  auth ??= betterAuth(options());
  migrated ??= getMigrations(options())
    .then((m) => m.runMigrations())
    .catch((e) => {
      migrated = null;
      throw e;
    });
  await migrated;
  return auth;
}
