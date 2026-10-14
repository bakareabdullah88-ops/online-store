import "server-only";
import { isServiceError } from "@/services/errors";
import { signInWithVerifiedEmail } from "@/services/mock/auth";
import { safeNext } from "@/lib/safe-next";
import { getAuth, googleConfigured } from "./better-auth";
import { endSession, sessionUser, startSession } from "./session";
import { runCall } from "./store";

function redirect(req: Request, to: string, cookies: string[] = []) {
  const headers = new Headers({
    location: new URL(to, req.url).toString(),
    "cache-control": "no-store",
  });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(null, { status: 303, headers });
}

/**
 * GET /api/session/google?next=… : where Google sends people back to, via
 * Better Auth. Takes the verified email from Better Auth's session, signs the
 * person in to Kamplug (creating the account on first visit), then ends the
 * Better Auth session: from here on Kamplug's own cookie is the sign-in.
 */
export async function handleGoogleFinish(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const fail = (reason: string) =>
    redirect(req, `/login?error=${reason}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  if (!googleConfigured()) return fail("google_unavailable");

  const auth = await getAuth();
  const found = await auth.api.getSession({ headers: req.headers });
  // Ends Better Auth's own session whatever happens next.
  const signOut = async () => {
    if (!found) return [];
    const res = await auth.api.signOut({ headers: req.headers, asResponse: true });
    return res.headers.getSetCookie();
  };
  if (!found?.user.email || !found.user.emailVerified) {
    await signOut();
    return fail("google");
  }

  try {
    const { value: user, signedIn } = await runCall(null, () =>
      signInWithVerifiedEmail({ email: found.user.email, name: found.user.name ?? "" }),
    );
    const cookies = await signOut();
    const previous = await sessionUser(req);
    if (previous) cookies.push(await endSession(req, previous.token));
    if (signedIn?.userId) cookies.push(await startSession(req, signedIn.userId));
    const to = user.onboarded
      ? (next ?? "/home")
      : `/welcome${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    return redirect(req, to, cookies);
  } catch (e) {
    await signOut();
    if (isServiceError(e) && e.code === "FORBIDDEN") return fail("not_invited");
    console.error("[google] sign-in failed", e);
    return fail("google");
  }
}
