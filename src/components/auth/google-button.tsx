"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { toast } from "@/stores/toast";

/** A plain reason for a failed start, from Better Auth's or our own message. */
function explain(status: number, message: string | undefined) {
  if (message && /origin/i.test(message))
    return "Google sign-in isn't allowed from this address. Open the site at its main address.";
  if (message) return message;
  return `Something went wrong on our side (${status}). Try again, or use your email and password.`;
}

/** Google's "G", in its own colours. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * "Continue with Google". Only with the real backend: Better Auth sends the
 * person to Google and back to /api/session/google, which signs them in.
 */
export function GoogleButton({ next }: { next: string | null }) {
  const [busy, setBusy] = useState(false);
  if (env.NEXT_PUBLIC_DATA_SOURCE !== "remote") return null;

  const start = async () => {
    setBusy(true);
    const back = `/api/session/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    try {
      const res = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          callbackURL: back,
          errorCallbackURL: "/login?error=google",
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;
      if (res.ok && body?.url) return window.location.assign(body.url);
      setBusy(false);
      toast.error("Google sign-in didn't start", {
        description: explain(res.status, body?.message),
      });
    } catch {
      setBusy(false);
      toast.error("Google sign-in didn't start", {
        description: "We couldn't reach Kamplug. Check your connection and try again.",
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        loading={busy}
        leadingIcon={<GoogleMark />}
        onClick={start}
      >
        Continue with Google
      </Button>
      <p className="flex items-center gap-3 text-small text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </p>
    </>
  );
}

const ERRORS: Record<string, string> = {
  google: "Google sign-in didn't finish. Please try again.",
  google_unavailable: "Google sign-in isn't set up yet. Use your email and password for now.",
};

/** The reason a Google sign-in came back to the login page, if any. */
export function SignInError({ code }: { code: string | null }) {
  const message = code ? ERRORS[code] : undefined;
  if (!message) return null;
  return (
    <p role="alert" className="mt-6 rounded-lg bg-danger-soft px-4 py-3 text-small text-danger">
      {message}
    </p>
  );
}
