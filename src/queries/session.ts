"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "./use-query";
import { services } from "@/services";
import type { ProfileInput, SignInInput, SignUpInput } from "@/services/inputs";
import type { User } from "@/services/types";
import { qk } from "./keys";

/**
 * The session resolves from IndexedDB in a few milliseconds, which can be
 * before late Suspense boundaries finish hydrating. Until hydration is done we
 * report "unknown" so client markup always matches the server HTML.
 */
export function useSession() {
  const q = useQuery({ queryKey: qk.session, queryFn: () => services.auth.getSession(), staleTime: 5 * 60_000 });
  const user = q.data ?? null;
  return { ...q, user, isSignedIn: !!user, isReady: q.isFetched };
}

/** After any identity change, drop every per-user cache. */
function useOnIdentityChange() {
  const qc = useQueryClient();
  return (user: User | null) => {
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "session" && q.queryKey[0] !== "campuses" });
    qc.setQueryData(qk.session, user);
  };
}

export function useSignIn() {
  const done = useOnIdentityChange();
  return useMutation({ mutationFn: (i: SignInInput) => services.auth.signIn(i), onSuccess: done });
}

export function useSignUp() {
  const done = useOnIdentityChange();
  return useMutation({ mutationFn: (i: SignUpInput) => services.auth.signUp(i), onSuccess: done });
}

export function useSignInDemo() {
  const done = useOnIdentityChange();
  return useMutation({ mutationFn: (k: "buyer" | "seller") => services.auth.signInDemo(k), onSuccess: done });
}

export function useSignOut() {
  const done = useOnIdentityChange();
  return useMutation({ mutationFn: () => services.auth.signOut(), onSuccess: () => done(null) });
}

export function useRequestReset() {
  return useMutation({ mutationFn: (email: string) => services.auth.requestPasswordReset({ email }) });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: ProfileInput) => services.auth.updateProfile(i),
    onSuccess: (u) => qc.setQueryData(qk.session, u),
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<User["notificationPrefs"]>) => services.auth.updateNotificationPrefs(p),
    onMutate: async (p) => {
      const prev = qc.getQueryData<User | null>(qk.session);
      if (prev) qc.setQueryData(qk.session, { ...prev, notificationPrefs: { ...prev.notificationPrefs, ...p } });
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx?.prev && qc.setQueryData(qk.session, ctx.prev),
    onSuccess: (u) => qc.setQueryData(qk.session, u),
  });
}

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => services.demo.reset(),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(qk.session, null);
    },
  });
}
