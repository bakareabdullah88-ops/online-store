"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isActive } from "@/domain/orders";
import { services } from "@/services";
import type { CheckoutInput, ReviewInput } from "@/services/inputs";
import type { Order } from "@/services/types";
import { qk } from "./keys";
import { useSession } from "./session";

export function useMyOrders() {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.orders,
    queryFn: () => services.orders.listMyOrders(),
    enabled: isSignedIn,
    // Keep the list fresh while anything is moving.
    refetchInterval: (q) => (q.state.data?.some((o) => o.autoProgress && isActive(o.status)) ? 4000 : false),
  });
}

export function useOrder(id: string) {
  const qc = useQueryClient();
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.order(id),
    queryFn: () => services.orders.getOrder(id),
    enabled: isSignedIn,
    placeholderData: () => qc.getQueryData<Order[]>(qk.orders)?.find((o) => o.id === id),
    // BACKEND-SEAM: replace polling with SSE / websocket order events.
    refetchInterval: (q) => {
      const o = q.state.data;
      if (!o || !isActive(o.status)) return false;
      return o.autoProgress ? 2000 : 8000;
    },
  });
}

export function useQuote(input: CheckoutInput | null) {
  return useQuery({
    queryKey: ["quote", input],
    queryFn: () => services.orders.quote(input!),
    enabled: !!input && input.groups.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 0,
  });
}

export function useCreateOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => services.orders.createOrders(input),
    onSuccess: (res) => {
      for (const o of res.orders) qc.setQueryData(qk.order(o.id), o);
      void qc.invalidateQueries({ queryKey: qk.orders });
      void qc.invalidateQueries({ queryKey: qk.notifications });
      void qc.invalidateQueries({ queryKey: qk.wallet });
      void qc.invalidateQueries({ queryKey: qk.productsAll });
      void qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.orders.cancelOrder(id),
    onSuccess: (o) => {
      qc.setQueryData(qk.order(o.id), o);
      void qc.invalidateQueries({ queryKey: qk.orders });
      void qc.invalidateQueries({ queryKey: qk.wallet });
    },
  });
}

export function useReviewItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => services.orders.reviewOrderItem(input),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.order(r.orderId ?? "") });
      void qc.invalidateQueries({ queryKey: qk.orders });
      void qc.invalidateQueries({ queryKey: qk.myReviews });
      void qc.invalidateQueries({ queryKey: qk.productReviews(r.productId) });
    },
  });
}

export function useMyReviews() {
  const { isSignedIn } = useSession();
  return useQuery({ queryKey: qk.myReviews, queryFn: () => services.orders.myReviews(), enabled: isSignedIn });
}
