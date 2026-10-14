import { getAuth, missingGoogleSettings } from "@/server/better-auth";

/** Better Auth's routes: /api/auth/sign-in/social, /api/auth/callback/google, … */
async function handle(req: Request) {
  // Say exactly what's wrong instead of a bare 500, so the sign-in button can show it.
  const missing = missingGoogleSettings();
  if (missing.length) {
    return Response.json(
      { message: `Google sign-in isn't set up on this site yet. Missing: ${missing.join(", ")}.` },
      { status: 503 },
    );
  }
  try {
    return await (await getAuth()).handler(req);
  } catch (e) {
    console.error("[auth] Better Auth failed", e);
    return Response.json(
      { message: "Google sign-in couldn't reach the database. Check DATABASE_URL." },
      { status: 503 },
    );
  }
}

export const GET = handle;
export const POST = handle;
