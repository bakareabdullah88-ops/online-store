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
function hostOf(url: string | undefined) {
  if (!url) return null;
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).host;
  } catch {
    return null;
  }
}

/**
 * Every address this site answers on: the configured one, plus the ones
 * Vercel gives each deployment (production domain, branch link, deployment
 * link). Sign-in works from whichever of them the person opened; Google
 * still has to list that address's /api/auth/callback/google.
 */
export function siteHosts(): string[] {
  const e = process.env;
  const hosts = [
    e.BETTER_AUTH_URL,
    e.NEXT_PUBLIC_APP_URL,
    e.VERCEL_PROJECT_PRODUCTION_URL,
    e.VERCEL_BRANCH_URL,
    e.VERCEL_URL,
  ].map(hostOf);
  return [...new Set(hosts.filter((h): h is string => !!h))];
}

function options() {
  const fallback = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const hosts = siteHosts();
  const local = (h: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h);
  return {
    appName: "Kamplug",
    advanced: { cookiePrefix: "kamplug-auth" },
    database: getPool(),
    baseURL: {
      allowedHosts: hosts,
      ...(fallback ? { fallback } : {}),
      protocol: "auto" as const,
    },
    trustedOrigins: hosts.map((h) => `${local(h) ? "http" : "https"}://${h}`),
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
