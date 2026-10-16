"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "./use-query";
import { services } from "@/services";
import type { DayRange } from "@/domain/analytics";
import type {
  CreateBrandInput,
  ProductInput,
  PromoInput,
  UpdateBrandInput,
} from "@/services/inputs";
import type { CategoryId, Order, OrderStatus, Review } from "@/services/types";
import { qk } from "./keys";
import { useSession } from "./session";

function useHasBrand() {
  const { user } = useSession();
  return !!user && user.brandIds.length > 0;
}

export function useMyBrand() {
  const { isSignedIn } = useSession();
  return useQuery({
    queryKey: qk.studio.brand,
    queryFn: () => services.studio.getMyBrand(),
    enabled: isSignedIn,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: CreateBrandInput) => services.studio.createBrand(i),
    onSuccess: async (b) => {
      qc.setQueryData(qk.studio.brand, b);
      await qc.invalidateQueries({ queryKey: qk.session });
      void qc.invalidateQueries({ queryKey: qk.brandsAll });
    },
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: UpdateBrandInput) => services.studio.updateBrand(i),
    onSuccess: (b) => {
      qc.setQueryData(qk.studio.brand, b);
      qc.setQueryData(qk.brand(b.handle), b);
      void qc.invalidateQueries({ queryKey: qk.studio.setup });
      void qc.invalidateQueries({ queryKey: qk.brandsAll });
    },
  });
}

export function useSetup() {
  return useQuery({
    queryKey: qk.studio.setup,
    queryFn: () => services.studio.getSetup(),
    enabled: useHasBrand(),
  });
}

export function useShopDashboard(range: DayRange) {
  return useQuery({
    queryKey: qk.studio.dashboard(range),
    queryFn: () => services.studio.getDashboard(range),
    enabled: useHasBrand(),
    placeholderData: (p) => p,
  });
}

export function useProductAnalytics(range: DayRange) {
  return useQuery({
    queryKey: qk.studio.productAnalytics(range),
    queryFn: () => services.studio.getProductAnalytics(range),
    enabled: useHasBrand(),
    placeholderData: (p) => p,
  });
}

export function useStudioProducts(
  q: { q?: string; status?: "published" | "draft" | "all"; category?: CategoryId } = {},
) {
  return useQuery({
    queryKey: qk.studio.products(q),
    queryFn: () => services.studio.listProducts(q),
    enabled: useHasBrand(),
    placeholderData: (p) => p,
  });
}

export function useStudioProduct(id: string | null) {
  const hasBrand = useHasBrand();
  return useQuery({
    queryKey: qk.studio.product(id ?? ""),
    queryFn: () => services.studio.getProduct(id!),
    enabled: !!id && hasBrand,
  });
}

function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.studio.productsAll });
  void qc.invalidateQueries({ queryKey: qk.studio.setup });
  void qc.invalidateQueries({ queryKey: qk.productsAll });
  void qc.invalidateQueries({ queryKey: ["product"] });
  void qc.invalidateQueries({ queryKey: qk.studio.brand });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductInput }) =>
      id ? services.studio.updateProduct(id, input) : services.studio.createProduct(input),
    onSuccess: (p) => {
      qc.setQueryData(qk.studio.product(p.id), p);
      invalidateProducts(qc);
    },
  });
}

export function useBulkProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { ids: string[]; action: "publish" | "draft" | "delete" }) => {
      if (a.action === "delete") await services.studio.deleteProducts(a.ids);
      else
        await services.studio.setProductsStatus(
          a.ids,
          a.action === "publish" ? "published" : "draft",
        );
    },
    onSettled: () => invalidateProducts(qc),
  });
}

export function useStudioOrders() {
  return useQuery({
    queryKey: qk.studio.orders,
    queryFn: () => services.studio.listOrders(),
    enabled: useHasBrand(),
    refetchInterval: 30_000,
  });
}

/** Optimistic: the status changes immediately; rolled back if the transition is illegal. */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      services.studio.updateOrderStatus(id, status, note),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: qk.studio.orders });
      const prev = qc.getQueryData<Order[]>(qk.studio.orders);
      qc.setQueryData<Order[]>(qk.studio.orders, (list) =>
        list?.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.studio.orders, ctx.prev),
    onSuccess: (o) => {
      qc.setQueryData<Order[]>(qk.studio.orders, (list) =>
        list?.map((x) => (x.id === o.id ? o : x)),
      );
      qc.setQueryData(qk.order(o.id), o);
      // Money and counts derived from orders.
      void qc.invalidateQueries({
        queryKey: qk.studio.all,
        predicate: (q) =>
          ["dashboard", "product-analytics", "finance", "customers", "products"].includes(
            String(q.queryKey[1]),
          ),
      });
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: qk.studio.customers,
    queryFn: () => services.studio.listCustomers(),
    enabled: useHasBrand(),
  });
}

export function useStudioReviews() {
  return useQuery({
    queryKey: qk.studio.reviews,
    queryFn: () => services.studio.listReviews(),
    enabled: useHasBrand(),
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      services.studio.replyToReview(id, body),
    onSuccess: (r) => {
      qc.setQueryData<Review[]>(qk.studio.reviews, (list) =>
        list?.map((x) => (x.id === r.id ? r : x)),
      );
      void qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function usePromos() {
  return useQuery({
    queryKey: qk.studio.promos,
    queryFn: () => services.studio.listPromos(),
    enabled: useHasBrand(),
  });
}

export function useSavePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PromoInput | Partial<PromoInput> }) =>
      id
        ? services.studio.updatePromo(id, input)
        : services.studio.createPromo(input as PromoInput),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.studio.promos });
      void qc.invalidateQueries({ queryKey: qk.studio.setup });
    },
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.studio.deletePromo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.studio.promos }),
  });
}

export function useFinance() {
  return useQuery({
    queryKey: qk.studio.finance,
    queryFn: () => services.studio.getFinance(),
    enabled: useHasBrand(),
  });
}

export function useHandleAvailable() {
  return useMutation({ mutationFn: (h: string) => services.studio.isHandleAvailable(h) });
}

export function useUploadImage() {
  return useMutation({ mutationFn: (file: Blob) => services.media.putImage(file) });
}
