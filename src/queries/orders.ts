"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "./use-query";
import { isActive } from "@/domain/orders";
import { services } from "@/services";
import type { CheckoutInput, ReviewInput } from "@/services/inputs";
import type { Order } from "@/services/types";
import type { DayRange } from "@/domain/analytics";
import { qk } from "./keys";
import { useSession } from "./session";

export function useMyOrders() {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.orders,
    queryFn: () => services.orders.listMyOrders(),
    enabled: isSignedIn,
    // Keep the list fresh while anything is moving. BACKEND-SEAM: realtime order events.
    refetchInterval: (q) => (q.state.data?.some((o) => isActive(o.status)) ? 8000 : false),
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
      return o && isActive(o.status) ? 8000 : false;
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
      // The success page reads the order list: it must find these at once, not after a refetch.
      const ids = new Set(res.orders.map((o) => o.id));
      qc.setQueryData<Order[]>(qk.orders, (list) => [
        ...res.orders,
        ...(list ?? []).filter((o) => !ids.has(o.id)),
      ]);
      void qc.invalidateQueries({ queryKey: qk.orders });
      void qc.invalidateQueries({ queryKey: qk.notifications });
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
  return useQuery({
    queryKey: qk.myReviews,
    queryFn: () => services.orders.myReviews(),
    enabled: isSignedIn,
  });
}

export function useBuyerDashboard(range: DayRange) {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.buyerDashboard(range),
    queryFn: () => services.orders.getDashboard(range),
    enabled: isSignedIn,
    placeholderData: (p) => p,
  });
}
