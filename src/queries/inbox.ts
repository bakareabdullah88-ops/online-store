"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "./use-query";
import { services } from "@/services";
import type { PlaceInput } from "@/services/inputs";
import type { AppNotification, Thread } from "@/services/types";
import { qk } from "./keys";
import { useSession } from "./session";

export function useNotifications() {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => services.notifications.list(),
    enabled: isSignedIn,
    refetchInterval: 15_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | "all") =>
      id === "all" ? services.notifications.markAllRead() : services.notifications.markRead(id),
    onMutate: (id) => {
      const prev = qc.getQueryData<AppNotification[]>(qk.notifications);
      qc.setQueryData<AppNotification[]>(qk.notifications, (list) =>
        list?.map((n) => (id === "all" || n.id === id ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(qk.notifications, ctx.prev),
  });
}

export function useThreads(as: "buyer" | "brand") {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.threads(as),
    queryFn: () => services.messages.listThreads(as),
    enabled: isSignedIn,
    refetchInterval: 20_000,
  });
}

export function useThread(id: string | null, as: "buyer" | "brand") {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.thread(id ?? "", as),
    queryFn: async () => {
      const t = await services.messages.getThread(id!, as);
      void qc.invalidateQueries({ queryKey: qk.threads(as) });
      return t;
    },
    enabled: !!id,
    refetchInterval: 6000,
  });
}

export function useStartThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { brandId: string; productId?: string }) =>
      services.messages.startThread(input),
    onSuccess: (t) => {
      qc.setQueryData(qk.thread(t.id, "buyer"), t);
      void qc.invalidateQueries({ queryKey: qk.threads("buyer") });
    },
  });
}

export function useSendMessage(as: "buyer" | "brand") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { threadId: string; body: string }) =>
      services.messages.send({ ...input, as }),
    onMutate: async ({ threadId, body }) => {
      await qc.cancelQueries({ queryKey: qk.thread(threadId, as) });
      const prev = qc.getQueryData<Thread>(qk.thread(threadId, as));
      if (prev) {
        qc.setQueryData<Thread>(qk.thread(threadId, as), {
          ...prev,
          messages: [
            ...prev.messages,
            { id: `optimistic-${Date.now()}`, from: as, body, at: new Date().toISOString() },
          ],
        });
      }
      return { prev };
    },
    onError: (_e, v, ctx) => ctx?.prev && qc.setQueryData(qk.thread(v.threadId, as), ctx.prev),
    onSuccess: (t) => {
      qc.setQueryData(qk.thread(t.id, as), t);
      void qc.invalidateQueries({ queryKey: qk.threads(as) });
    },
  });
}

export function usePlaces() {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.places,
    queryFn: () => services.places.list(),
    enabled: isSignedIn,
  });
}

export function useSavePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: PlaceInput) => services.places.save(i),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.places }),
  });
}

export function useRemovePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.places.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.places }),
  });
}
