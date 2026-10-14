import { brand as appBrand } from "@/config/brand";
import { purchaseBlock } from "@/domain/bag";
import { groupTotal, sumQuote, type CheckoutQuote, type GroupQuote } from "@/domain/checkout";
import { canBuyerCancel, transition } from "@/domain/orders";
import { buyerDashboard } from "@/domain/analytics";
import { categories, categoryById } from "@/config/categories";
import { features } from "@/config/features";
import { evaluatePromo, normalizeCode } from "@/domain/promos";
import { findVariant, unitPrice, variantLabel } from "@/domain/variants";
import { newId, orderCode } from "@/lib/ids";
import type { OrderService } from "../contracts";
import { ServiceError } from "../errors";
import type { CheckoutInput } from "../inputs";
import { schemas, type Schemas } from "./schemas";
import type { Order, Product, UserRecord } from "../types";
import { commit, getDb } from "./db";
import { clone, requireUser } from "./context";
import { latency } from "./latency";
import { notifyBuyerOfStatus, pushNotification } from "./notify";
import type { DbSnapshot } from "./seed";

type Resolved = {
  quote: CheckoutQuote;
  groups: {
    quote: GroupQuote;
    lines: { product: Product; variantKey: string; quantity: number }[];
    input: CheckoutInput["groups"][number];
    /** The promo this group used, if it applied. */
    promoId: string | null;
  }[];
};

function price(
  db: DbSnapshot,
  user: UserRecord,
  raw: CheckoutInput,
  now: number,
  { checkoutSchema }: Schemas,
): Resolved {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Check your checkout details",
    );
  }
  const input = parsed.data;
  // One group per shop, so stock and promo limits are counted once for the whole checkout.
  if (new Set(input.groups.map((g) => g.brandId)).size !== input.groups.length)
    throw new ServiceError("VALIDATION", "Each shop can only appear once in a checkout.");
  const groups: Resolved["groups"] = [];
  /** Uses of each promo within this checkout, so a limited code can't apply twice. */
  const promoUses = new Map<string, number>();
  for (const g of input.groups) {
    const brand = db.brands.find((b) => b.id === g.brandId);
    if (!brand) throw new ServiceError("NOT_FOUND", "A brand in your bag no longer exists.");
    const problems: GroupQuote["problems"] = [];
    const lines: Resolved["groups"][number]["lines"] = [];
    if (user.brandIds.includes(brand.id)) {
      problems.push({
        productId: "",
        variantKey: "",
        reason: "This is your own shop, so you can't buy from it.",
      });
    }
    /** Units asked for so far, per product and option, across repeated lines. */
    const asked = new Map<string, number>();
    for (const l of g.lines) {
      const product = db.products.find((p) => p.id === l.productId);
      if (product && product.brandId !== brand.id) {
        problems.push({
          productId: l.productId,
          variantKey: l.variantKey,
          reason: `This item isn't sold by ${brand.name}.`,
        });
        continue;
      }
      if (!product) {
        problems.push({
          productId: l.productId,
          variantKey: l.variantKey,
          reason: "This item was removed by the brand.",
        });
        continue;
      }
      const block = purchaseBlock(product, l.variantKey, {
        userBrandIds: user.brandIds,
        brandOnVacation: brand.vacation,
      });
      if (block.blocked) {
        problems.push({ productId: l.productId, variantKey: l.variantKey, reason: block.message });
        continue;
      }
      const v = findVariant(product, l.variantKey)!;
      const key = `${product.id}/${v.key}`;
      const total = (asked.get(key) ?? 0) + l.quantity;
      asked.set(key, total);
      if (v.stock < total) {
        problems.push({
          productId: l.productId,
          variantKey: l.variantKey,
          reason: `Only ${v.stock} left. Lower the quantity to continue.`,
        });
        continue;
      }
      lines.push({ product, variantKey: l.variantKey, quantity: l.quantity });
    }

    const method = g.fulfilment.method;
    if (method === "delivery" && !brand.fulfilment.delivery) {
      problems.push({ productId: "", variantKey: "", reason: `${brand.name} only offers pickup.` });
    }
    if (method === "pickup" && !brand.fulfilment.pickup) {
      problems.push({
        productId: "",
        variantKey: "",
        reason: `${brand.name} only offers delivery.`,
      });
    }

    const subtotal = lines.reduce((n, l) => n + unitPrice(l.product, l.variantKey) * l.quantity, 0);
    let deliveryFee = method === "delivery" ? brand.fulfilment.deliveryFeeKobo : 0;
    let discount = 0;
    let promo: GroupQuote["promo"] = null;
    let promoId: string | null = null;
    if (g.promoCode) {
      const code = normalizeCode(g.promoCode);
      const found = db.promos.find(
        (p) => p.code === code && (p.brandId === null || p.brandId === brand.id),
      );
      const row = found ?? db.promos.find((p) => p.code === code);
      const usedHere = row ? (promoUses.get(row.id) ?? 0) : 0;
      const res = evaluatePromo(row && { ...row, usageCount: row.usageCount + usedHere }, {
        brandId: brand.id,
        subtotalKobo: subtotal,
        deliveryFeeKobo: deliveryFee,
        now,
      });
      if (res.ok) {
        discount = res.discountKobo;
        if (res.freeDelivery) deliveryFee = 0;
        promo = { code, status: "applied", label: res.label };
        if (row) {
          promoId = row.id;
          promoUses.set(row.id, usedHere + 1);
        }
      } else {
        promo = { code, status: "invalid", reason: res.reason };
      }
    }
    const quote: GroupQuote = {
      brandId: brand.id,
      brandName: brand.name,
      subtotalKobo: subtotal,
      deliveryFeeKobo: deliveryFee,
      discountKobo: discount,
      totalKobo: groupTotal({
        subtotalKobo: subtotal,
        deliveryFeeKobo: deliveryFee,
        discountKobo: discount,
      }),
      method,
      promo,
      problems,
    };
    groups.push({ quote, lines, input: g, promoId });
  }
  return { quote: sumQuote(groups.map((g) => g.quote)), groups };
}

export const mockOrders: OrderService = {
  async quote(input) {
    await latency(0.5);
    const db = await getDb();
    const user = await requireUser(db);
    return price(db, user, input, Date.now(), await schemas()).quote;
  },

  async createOrders(input) {
    await latency(1.4);
    const db = await getDb();
    const user = await requireUser(db);
    const now = Date.now();
    const s = await schemas();
    const resolved = price(db, user, input, now, s);

    const problems = resolved.groups.flatMap((g) => g.quote.problems);
    if (problems.length) throw new ServiceError("CONFLICT", problems[0]!.reason);
    const invalidPromo = resolved.groups.find((g) => g.quote.promo?.status === "invalid");
    if (invalidPromo?.quote.promo?.status === "invalid") {
      throw new ServiceError(
        "VALIDATION",
        `${invalidPromo.quote.promo.code}: ${invalidPromo.quote.promo.reason}`,
      );
    }

    const parsed = s.checkoutSchema.parse(input);
    const online = parsed.paymentMethod === "card" || parsed.paymentMethod === "transfer";
    // BACKEND-SEAM: online payments create a payment intent (Paystack) before the order exists.
    if (online && !features.onlinePayments) {
      throw new ServiceError(
        "UNAVAILABLE",
        "Online payment isn't available yet. Choose pay on delivery or pay at pickup.",
      );
    }

    const checkoutId = newId("ck");
    const placedAt = new Date(now).toISOString();
    const orders: Order[] = [];
    for (const g of resolved.groups) {
      const brand = db.brands.find((b) => b.id === g.quote.brandId)!;
      const owner = db.users.find((u) => u.id === brand.ownerId);
      const campus = db.campuses.find((c) => c.id === brand.campusId);
      const f = g.input.fulfilment;
      const order: Order = {
        id: newId("o"),
        code: orderCode(appBrand.orderPrefix),
        checkoutId,
        buyerId: user.id,
        buyerName: user.name,
        buyerPhone: parsed.phone,
        brandId: brand.id,
        brandName: brand.name,
        brandHandle: brand.handle,
        brandLogo: clone(brand.logo),
        items: g.lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          variantKey: l.variantKey,
          variantLabel: variantLabel(l.product.options, l.variantKey),
          unitPriceKobo: unitPrice(l.product, l.variantKey),
          quantity: l.quantity,
          image: l.product.images[0] ? clone(l.product.images[0]) : null,
        })),
        fulfilment: {
          method: f.method,
          campusId: campus?.id ?? parsed.campusId,
          zoneId: f.zoneId,
          ...(f.method === "pickup" && f.pickupPointId ? { pickupPointId: f.pickupPointId } : {}),
          ...(f.method === "delivery" && f.addressLine ? { addressLine: f.addressLine } : {}),
          ...(f.note ? { note: f.note } : {}),
        },
        subtotalKobo: g.quote.subtotalKobo,
        deliveryFeeKobo: g.quote.deliveryFeeKobo,
        discountKobo: g.quote.discountKobo,
        totalKobo: g.quote.totalKobo,
        ...(g.quote.promo?.status === "applied" ? { promoCode: g.quote.promo.code } : {}),
        // Offline payments are collected by the seller on handover and marked paid on delivery.
        payment: { method: parsed.paymentMethod, status: online ? "paid" : "pending" },
        status: "placed",
        timeline: [{ status: "placed", at: placedAt }],
        autoProgress: false,
        placedAt,
        reviewed: false,
      };
      orders.push(order);
      db.orders.push(order);

      for (const l of g.lines) {
        const v = findVariant(l.product, l.variantKey);
        if (v) v.stock = Math.max(0, v.stock - l.quantity);
        l.product.salesCount += l.quantity;
      }
      if (g.promoId) {
        const promo = db.promos.find((p) => p.id === g.promoId);
        if (promo) promo.usageCount += 1;
      }
      if (owner) {
        pushNotification(db, {
          userId: owner.id,
          kind: "order",
          title: `New order ${order.code}`,
          body: `${user.name} ordered ${order.items.length} item${order.items.length > 1 ? "s" : ""}. Accept it to let them know you're on it.`,
          href: "/studio/orders",
        });
      }
    }

    pushNotification(db, {
      userId: user.id,
      kind: "order",
      title:
        orders.length > 1 ? `${orders.length} orders placed` : `Order placed · ${orders[0]?.code}`,
      body: "We'll let you know as soon as the shop accepts it.",
      href: orders.length > 1 ? "/orders" : `/orders/${orders[0]?.id}`,
    });

    await commit("orders", "products", "promos", "notifications");
    return { checkoutId, orders: clone(orders) };
  },

  async listMyOrders() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    return clone(
      db.orders
        .filter((o) => o.buyerId === user.id)
        .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)),
    );
  },

  async getOrder(id) {
    await latency(0.6);
    const db = await getDb();
    const user = await requireUser(db);
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    if (order.buyerId !== user.id && !user.brandIds.includes(order.brandId)) {
      throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    }
    return clone(order);
  },

  async cancelOrder(id) {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    const idx = db.orders.findIndex((o) => o.id === id && o.buyerId === user.id);
    const order = db.orders[idx];
    if (!order) throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    if (!canBuyerCancel(order)) {
      throw new ServiceError(
        "CONFLICT",
        "This order has already been accepted, so it can't be cancelled here. Message the shop instead.",
      );
    }
    const next: Order = {
      ...order,
      autoProgress: false,
      status: "cancelled",
      timeline: [...order.timeline, { status: "cancelled", at: new Date().toISOString() }],
      payment: {
        ...order.payment,
        status: order.payment.status === "paid" ? "refunded" : order.payment.status,
      },
    };
    db.orders[idx] = next;
    for (const it of next.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const v = p ? findVariant(p, it.variantKey) : undefined;
      if (v) v.stock += it.quantity;
    }
    const brand = db.brands.find((b) => b.id === next.brandId);
    if (brand) {
      pushNotification(db, {
        userId: brand.ownerId,
        kind: "order",
        title: `${next.code} was cancelled`,
        body: `${user.name} cancelled before you accepted it. The stock is back on your shelf.`,
        href: `/studio/orders?order=${next.id}`,
      });
    }
    await commit("orders", "products", "notifications");
    return clone(next);
  },

  async reviewOrderItem(raw) {
    const { reviewInputSchema } = await schemas();
    const input = reviewInputSchema.parse(raw);
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    const order = db.orders.find((o) => o.id === input.orderId && o.buyerId === user.id);
    if (!order) throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    if (order.status !== "delivered")
      throw new ServiceError("CONFLICT", "You can review once your order is delivered.");
    const item = order.items.find((i) => i.productId === input.productId);
    if (!item) throw new ServiceError("VALIDATION", "That item isn't in this order.");
    if (db.reviews.some((r) => r.orderId === order.id && r.productId === input.productId)) {
      throw new ServiceError("CONFLICT", "You've already reviewed this item.");
    }
    const review = {
      id: newId("r"),
      productId: input.productId,
      brandId: order.brandId,
      userId: user.id,
      authorName: shortName(user.name),
      rating: input.rating,
      body: input.body,
      ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
      createdAt: new Date().toISOString(),
      orderId: order.id,
    };
    db.reviews.push(review);
    const reviewedAll = order.items.every((i) =>
      db.reviews.some((r) => r.orderId === order.id && r.productId === i.productId),
    );
    order.reviewed = reviewedAll;
    for (const target of [
      db.products.find((p) => p.id === input.productId),
      db.brands.find((b) => b.id === order.brandId),
    ]) {
      if (!target) continue;
      const rs = db.reviews.filter((r) =>
        "brandId" in target && "handle" in target
          ? r.brandId === target.id
          : r.productId === target.id,
      );
      target.ratingCount = rs.length;
      target.rating = Math.round((rs.reduce((n, r) => n + r.rating, 0) / rs.length) * 10) / 10;
    }
    const brand = db.brands.find((b) => b.id === order.brandId);
    if (brand) {
      pushNotification(db, {
        userId: brand.ownerId,
        kind: "review",
        title: `New ${input.rating}-star review`,
        body: `"${input.body.slice(0, 80)}${input.body.length > 80 ? "…" : ""}"`,
        href: "/studio/reviews",
      });
    }
    await commit("reviews", "orders", "products", "brands", "notifications");
    return clone(review);
  },

  async getDashboard(range) {
    await latency(0.6);
    const db = await getDb();
    const user = await requireUser(db);
    const productCategory = new Map(db.products.map((p) => [p.id, p.category]));
    return buyerDashboard({
      orders: db.orders.filter((o) => o.buyerId === user.id),
      categoryOf: (id) => productCategory.get(id),
      categoryName: (id) =>
        categories.some((c) => c.id === id) ? categoryById(id as never).name : "Other",
      range,
    });
  },

  async myReviews() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    return clone(
      db.reviews
        .filter((r) => r.userId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },
};

function shortName(full: string) {
  const [first, last] = full.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : (first ?? full);
}

/** Seller-side transition with notification (used by Studio). */
export function applySellerTransition(db: DbSnapshot, orderId: string, to: Order["status"]): Order {
  const idx = db.orders.findIndex((o) => o.id === orderId);
  const order = db.orders[idx];
  if (!order) throw new ServiceError("NOT_FOUND", "Order not found.");
  let next: Order;
  try {
    next = transition({ ...order, autoProgress: false }, to, Date.now());
    if (to === "delivered" && next.payment.status === "pending") {
      next = { ...next, payment: { ...next.payment, status: "paid" } };
    }
  } catch (e) {
    throw new ServiceError("CONFLICT", e instanceof Error ? e.message : "Invalid status change");
  }
  if (to === "declined" || to === "cancelled") {
    for (const it of next.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const v = p ? findVariant(p, it.variantKey) : undefined;
      if (v) v.stock += it.quantity;
    }
  }
  db.orders[idx] = next;
  notifyBuyerOfStatus(db, next, to);
  return next;
}
