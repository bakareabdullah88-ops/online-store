import { getAuth } from "@/server/better-auth";

/** Better Auth's routes: /api/auth/sign-in/social, /api/auth/callback/google, … */
async function handle(req: Request) {
  return (await getAuth()).handler(req);
}

export const GET = handle;
export const POST = handle;
