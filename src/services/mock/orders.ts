import { brand as appBrand } from "@/config/brand";
import { purchaseBlock } from "@/domain/bag";
import { groupTotal, sumQuote, type CheckoutQuote, type GroupQuote } from "@/domain/checkout";
import { advanceOrder, canBuyerCancel, transition } from "@/domain/orders";
import { evaluatePromo, normalizeCode } from "@/domain/promos";
import { findVariant, unitPrice, variantLabel } from "@/domain/variants";
import { newId, orderCode } from "@/lib/ids";
import type { OrderService } from "../contracts";
import { ServiceError } from "../errors";
import { checkoutSchema, reviewInputSchema, type CheckoutInput } from "../inputs";
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
  }[];
};

function price(db: DbSnapshot, user: UserRecord, raw: CheckoutInput, now: number): Resolved {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError("VALIDATION", parsed.error.issues[0]?.message ?? "Check your checkout details");
  }
  const input = parsed.data;
  const groups: Resolved["groups"] = [];
  for (const g of input.groups) {
    const brand = db.brands.find((b) => b.id === g.brandId);
    if (!brand) throw new ServiceError("NOT_FOUND", "A brand in your bag no longer exists.");
    const problems: GroupQuote["problems"] = [];
    const lines: Resolved["groups"][number]["lines"] = [];
    for (const l of g.lines) {
      const product = db.products.find((p) => p.id === l.productId);
      if (!product) {
        problems.push({ productId: l.productId, variantKey: l.variantKey, reason: "This item was removed by the brand." });
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
      if (v.stock < l.quantity) {
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
      problems.push({ productId: "", variantKey: "", reason: `${brand.name} only offers delivery.` });
    }

    const subtotal = lines.reduce((n, l) => n + unitPrice(l.product, l.variantKey) * l.quantity, 0);
    let deliveryFee = method === "delivery" ? brand.fulfilment.deliveryFeeKobo : 0;
    let discount = 0;
    let promo: GroupQuote["promo"] = null;
    if (g.promoCode) {
      const code = normalizeCode(g.promoCode);
      const found = db.promos.find((p) => p.code === code && (p.brandId === null || p.brandId === brand.id));
      const res = evaluatePromo(found ?? db.promos.find((p) => p.code === code), {
        brandId: brand.id,
        subtotalKobo: subtotal,
        deliveryFeeKobo: deliveryFee,
        now,
      });
      if (res.ok) {
        discount = res.discountKobo;
        if (res.freeDelivery) deliveryFee = 0;
        promo = { code, status: "applied", label: res.label };
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
      totalKobo: groupTotal({ subtotalKobo: subtotal, deliveryFeeKobo: deliveryFee, discountKobo: discount }),
      method,
      promo,
      problems,
    };
    groups.push({ quote, lines, input: g });
  }
  return { quote: sumQuote(groups.map((g) => g.quote)), groups };
}

/** Bring auto-progressing orders up to date and emit notifications. */
export function syncOrders(db: DbSnapshot, now = Date.now()): boolean {
  let changed = false;
  for (let i = 0; i < db.orders.length; i++) {
    const o = db.orders[i]!;
    if (!o.autoProgress) continue;
    const { order, reached } = advanceOrder(o, now);
    if (order !== o) {
      db.orders[i] = order;
      changed = true;
      for (const s of reached) {
        const at = order.timeline.find((t) => t.status === s)?.at;
        notifyBuyerOfStatus(db, order, s, at);
      }
    }
  }
  return changed;
}

export const mockOrders: OrderService = {
  async quote(input) {
    await latency(0.5);
    const db = await getDb();
    const user = await requireUser(db);
    return price(db, user, input, Date.now()).quote;
  },

  async createOrders(input) {
    await latency(1.4);
    const db = await getDb();
    const user = await requireUser(db);
    const now = Date.now();
    const resolved = price(db, user, input, now);

    const problems = resolved.groups.flatMap((g) => g.quote.problems);
    if (problems.length) throw new ServiceError("CONFLICT", problems[0]!.reason);
    const invalidPromo = resolved.groups.find((g) => g.quote.promo?.status === "invalid");
    if (invalidPromo?.quote.promo?.status === "invalid") {
      throw new ServiceError("VALIDATION", `${invalidPromo.quote.promo.code}: ${invalidPromo.quote.promo.reason}`);
    }

    const parsed = checkoutSchema.parse(input);
    const total = resolved.quote.totalKobo;
    if (parsed.paymentMethod === "wallet") {
      const balance = db.wallet.filter((w) => w.userId === user.id).reduce((n, w) => n + w.amountKobo, 0);
      if (balance < total) throw new ServiceError("CONFLICT", "Your demo wallet balance is too low. Top up or pick another method.");
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
          image: clone(l.product.images[0] ?? { kind: "art", motif: "monogram", palette: "sand", seed: 1 }),
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
        // BACKEND-SEAM: payment intent / gateway (Paystack, Flutterwave) confirms before the order is placed.
        payment: {
          method: parsed.paymentMethod,
          status: parsed.paymentMethod === "pay_on_pickup" ? "pending" : "paid",
        },
        status: "placed",
        timeline: [{ status: "placed", at: placedAt }],
        // Seeded brands (owner has no login) progress automatically; real sellers update by hand.
        autoProgress: !owner?.passwordHash,
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
      if (g.quote.promo?.status === "applied") {
        const promo = db.promos.find((p) => p.code === g.quote.promo!.code);
        if (promo) promo.usageCount += 1;
      }
      const date = placedAt.slice(0, 10);
      let m = db.metrics.find((x) => x.brandId === brand.id && x.date === date);
      if (!m) {
        m = { brandId: brand.id, date, views: 0, addToBag: 0, orders: 0, revenueKobo: 0, hourly: Array.from({ length: 24 }, () => 0) };
        db.metrics.push(m);
      }
      m.orders += 1;
      m.revenueKobo += order.subtotalKobo - order.discountKobo;

      if (owner) {
        pushNotification(db, {
          userId: owner.id,
          kind: "order",
          title: `New order ${order.code}`,
          body: `${user.name} ordered ${order.items.length} item${order.items.length > 1 ? "s" : ""}. Accept it in Shop Studio.`,
          href: "/studio/orders",
        });
      }
    }

    if (parsed.paymentMethod === "wallet") {
      db.wallet.push({
        id: newId("w"),
        userId: user.id,
        kind: "payment",
        amountKobo: -total,
        label: orders.length > 1 ? `${orders.length} orders` : (orders[0]?.brandName ?? "Order"),
        at: placedAt,
      });
    }

    pushNotification(db, {
      userId: user.id,
      kind: "order",
      title: orders.length > 1 ? `${orders.length} orders placed` : `Order placed · ${orders[0]?.code}`,
      body: "We'll keep you posted as each brand updates your order.",
      href: orders.length > 1 ? "/orders" : `/orders/${orders[0]?.id}`,
    });

    await commit("orders", "products", "promos", "metrics", "notifications", "wallet");
    return { checkoutId, orders: clone(orders) };
  },

  async listMyOrders() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    if (syncOrders(db)) await commit("orders", "notifications");
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
    if (syncOrders(db)) await commit("orders", "notifications");
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
    syncOrders(db);
    const idx = db.orders.findIndex((o) => o.id === id && o.buyerId === user.id);
    const order = db.orders[idx];
    if (!order) throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    if (!canBuyerCancel(order)) {
      throw new ServiceError("CONFLICT", "This order has already been accepted, so it can't be cancelled here. Message the brand instead.");
    }
    const next: Order = {
      ...order,
      autoProgress: false,
      status: "cancelled",
      timeline: [...order.timeline, { status: "cancelled", at: new Date().toISOString() }],
      payment: { ...order.payment, status: order.payment.status === "paid" ? "refunded" : order.payment.status },
    };
    db.orders[idx] = next;
    for (const it of next.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const v = p ? findVariant(p, it.variantKey) : undefined;
      if (v) v.stock += it.quantity;
    }
    if (order.payment.method === "wallet" && order.payment.status === "paid") {
      db.wallet.push({ id: newId("w"), userId: user.id, kind: "refund", amountKobo: order.totalKobo, label: `Refund · ${order.brandName}`, at: new Date().toISOString() });
    }
    await commit("orders", "products", "wallet");
    return clone(next);
  },

  async reviewOrderItem(raw) {
    const input = reviewInputSchema.parse(raw);
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    const order = db.orders.find((o) => o.id === input.orderId && o.buyerId === user.id);
    if (!order) throw new ServiceError("NOT_FOUND", "We couldn't find that order.");
    if (order.status !== "delivered") throw new ServiceError("CONFLICT", "You can review once your order is delivered.");
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
    const reviewedAll = order.items.every((i) => db.reviews.some((r) => r.orderId === order.id && r.productId === i.productId));
    order.reviewed = reviewedAll;
    for (const target of [db.products.find((p) => p.id === input.productId), db.brands.find((b) => b.id === order.brandId)]) {
      if (!target) continue;
      const rs = db.reviews.filter((r) => ("brandId" in target && "handle" in target ? r.brandId === target.id : r.productId === target.id));
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

  async myReviews() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    return clone(db.reviews.filter((r) => r.userId === user.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
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
