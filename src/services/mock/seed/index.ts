import { brand as appBrand } from "@/config/brand";
import { hashPassword } from "@/lib/hash";
import { slugify } from "@/lib/ids";
import { createRng, type Rng } from "@/lib/random";
import { allVariantKeys, DEFAULT_VARIANT_KEY, variantLabel } from "@/domain/variants";
import { groupTotal } from "@/domain/checkout";
import { stepsFor } from "@/domain/orders";
import type {
  AppNotification,
  Brand,
  BrandMetric,
  Campus,
  Order,
  OrderStatus,
  Payout,
  Product,
  ProductOption,
  Promo,
  Review,
  SavedPlace,
  Thread,
  UserRecord,
  Variant,
  WalletTransaction,
} from "@/services/types";
import { seedCampuses } from "./campuses";
import { brandSpecs, reviewBank, swatches, type BrandSpec, type ProductSpec } from "./catalog";

export type DbSnapshot = {
  campuses: Campus[];
  users: UserRecord[];
  brands: Brand[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  promos: Promo[];
  notifications: AppNotification[];
  threads: Thread[];
  wallet: WalletTransaction[];
  places: SavedPlace[];
  payouts: Payout[];
  metrics: BrandMetric[];
};

export const DEMO = {
  buyer: { id: "u_demo_buyer", email: "ada@demo.kiosk", password: "kiosk-demo-1", name: "Ada Okafor" },
  seller: { id: "u_demo_seller", email: "tolu@demo.kiosk", password: "kiosk-demo-1", name: "Tolu Adeyemi" },
  sellerBrandHandle: "adirelab",
} as const;

const SEED = 20251012;
const DAY = 86_400_000;

const customerNames = [
  "Kunle Adebayo", "Zainab Musa", "Tobi Fashola", "Emeka Nwankwo", "Halima Bello", "Seyi Kolawole",
  "Ngozi Eze", "Ibrahim Sani", "Funke Akindele", "Chidi Uche", "Amaka Ibe", "Bolu Dada", "Hauwa Garba",
  "Dare Ogunleye", "Nkechi Chukwu", "Yusuf Tanko", "Ronke Jimoh", "Ikenna Peters", "Mariam Yakubu",
  "Tomiwa Lawal", "Esther Ayodele", "Obinna Kalu", "Rukayat Shittu", "Damilola Williams", "Uche Madu",
];

function iso(t: number) {
  return new Date(t).toISOString();
}

function parseOptions(specs: string[] | undefined, productId: string): { options: ProductOption[]; deltas: Map<string, number> } {
  const deltas = new Map<string, number>();
  const options: ProductOption[] = (specs ?? []).map((spec, oi) => {
    let name: string;
    let raw: string[];
    if (spec === "size") {
      name = "Size";
      raw = ["S", "M", "L", "XL"];
    } else if (spec === "size3") {
      name = "Size";
      raw = ["S", "M", "L"];
    } else {
      const [n, rest] = spec.split(":");
      name = n ?? "Option";
      raw = (rest ?? "").split(",");
    }
    const optId = `${productId}-o${oi + 1}`;
    return {
      id: optId,
      name,
      values: raw.map((r, vi) => {
        const [label, delta] = r.split("+");
        const id = `${optId}-v${vi + 1}`;
        if (delta) deltas.set(id, Number(delta) * 100);
        const clean = (label ?? r).trim();
        const swatch = name === "Colour" ? swatches[clean] : undefined;
        return swatch ? { id, label: clean, swatch } : { id, label: clean };
      }),
    };
  });
  return { options, deltas };
}

function buildVariants(options: ProductOption[], deltas: Map<string, number>, spec: ProductSpec, rng: Rng): Variant[] {
  return allVariantKeys(options).map((key) => {
    const ids = key === DEFAULT_VARIANT_KEY ? [] : key.split("|");
    const delta = ids.reduce((n, id) => n + (deltas.get(id) ?? 0), 0);
    let stock: number;
    if (spec.scarce) stock = rng.chance(0.85) ? 1 : 0;
    else stock = rng.chance(0.08) ? 0 : rng.chance(0.15) ? rng.int(1, 3) : rng.int(6, 40);
    return { key, stock, priceDeltaKobo: delta };
  });
}

function pickReviews(spec: BrandSpec) {
  return reviewBank[spec.category] ?? reviewBank.default;
}

export async function generateSeed(now: number = Date.now()): Promise<DbSnapshot> {
  const rng = createRng(SEED);
  const campuses = seedCampuses();
  const campusBySlug = new Map(campuses.map((c) => [c.slug, c]));

  const salt = "6b696f736b2d64656d6f2d73616c7400"; // fixed demo salt so seeding is deterministic
  const demoHash = await hashPassword(DEMO.buyer.password, salt);

  const basePrefs = { orderUpdates: true, messages: true, promotions: false, newFromFollowed: true };
  const users: UserRecord[] = [];

  const unilag = campusBySlug.get("unilag")!;

  users.push({
    id: DEMO.buyer.id,
    email: DEMO.buyer.email,
    name: DEMO.buyer.name,
    phone: "08031234567",
    campusId: unilag.id,
    avatar: null,
    brandIds: [],
    followingBrandIds: [],
    wishlistProductIds: [],
    onboarded: true,
    notificationPrefs: { ...basePrefs, promotions: true },
    createdAt: iso(now - 140 * DAY),
    isDemo: true,
    passwordHash: demoHash,
    passwordSalt: salt,
  });

  // Customers (review authors, order history for the demo seller)
  const customers: UserRecord[] = customerNames.map((name, i) => {
    const campus = campuses[i % campuses.length]!;
    return {
      id: `u_c${String(i + 1).padStart(2, "0")}`,
      email: `${slugify(name).replace(/-/g, ".")}@students.example`,
      name,
      phone: `080${String(30000000 + i * 7919).slice(0, 8)}`,
      campusId: i % 3 === 0 ? unilag.id : campus.id,
      avatar: null,
      brandIds: [],
      followingBrandIds: [],
      wishlistProductIds: [],
      onboarded: true,
      notificationPrefs: basePrefs,
      createdAt: iso(now - rng.int(30, 400) * DAY),
      isDemo: false,
      passwordHash: "",
      passwordSalt: "",
    };
  });
  users.push(...customers);

  const brands: Brand[] = [];
  const products: Product[] = [];
  const reviews: Review[] = [];

  for (const [bi, spec] of brandSpecs.entries()) {
    const campus = campusBySlug.get(spec.campus)!;
    const brandId = `b_${spec.handle}`;
    const isDemoBrand = spec.handle === DEMO.sellerBrandHandle;
    const ownerId = isDemoBrand ? DEMO.seller.id : `u_owner_${spec.handle}`;

    const owner: UserRecord = {
      id: ownerId,
      email: isDemoBrand ? DEMO.seller.email : `${spec.handle}@brands.example`,
      name: spec.owner,
      phone: `0810${String(1000000 + bi * 31337).slice(0, 7)}`,
      campusId: campus.id,
      avatar: null,
      brandIds: [brandId],
      followingBrandIds: [],
      wishlistProductIds: [],
      onboarded: true,
      notificationPrefs: basePrefs,
      createdAt: iso(now - rng.int(200, 500) * DAY),
      isDemo: isDemoBrand,
      passwordHash: isDemoBrand ? demoHash : "",
      passwordSalt: isDemoBrand ? salt : "",
    };
    users.push(owner);

    const brandCreated = now - rng.int(160, 420) * DAY;
    const pickupPoints = campus.pickupPoints.map((p) => p.id);
    brands.push({
      id: brandId,
      ownerId,
      handle: spec.handle,
      name: spec.name,
      category: spec.category,
      tagline: spec.tagline,
      bio: spec.bio,
      logo: { kind: "art", motif: "monogram", palette: spec.palette, seed: bi + 1 },
      cover: { kind: "art", motif: spec.motif, palette: spec.palette, seed: 1000 + bi },
      campusId: campus.id,
      fulfilment: {
        pickup: spec.delivery.pickup,
        delivery: spec.delivery.delivery,
        deliveryFeeKobo: spec.delivery.fee * 100,
        prepMinutes: spec.delivery.prepMinutes,
        pickupPointIds: spec.delivery.pickup ? pickupPoints : [],
        zoneIds: spec.delivery.delivery ? campus.zones.map((z) => z.id) : [],
      },
      openHours: {
        days: spec.category === "food" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6],
        opens: spec.category === "food" ? "10:00" : "09:00",
        closes: spec.category === "food" ? "22:30" : "20:00",
      },
      vacation: false,
      rating: 0,
      ratingCount: 0,
      followerCount: rng.int(80, 2400),
      productCount: spec.products.length,
      createdAt: iso(brandCreated),
      payoutAccount: isDemoBrand ? { bankName: "GTBank", accountLast4: "4821", accountName: spec.owner } : null,
      verified: !!spec.verified,
    });

    for (const [pi, ps] of spec.products.entries()) {
      const productId = `p_${spec.handle}_${String(pi + 1).padStart(2, "0")}`;
      const { options, deltas } = parseOptions(ps.options, productId);
      const variants = buildVariants(options, deltas, ps, rng);
      const created = brandCreated + rng.int(1, Math.max(2, Math.floor((now - brandCreated) / DAY) - 2)) * DAY;
      const imgCount = rng.int(2, 4);
      const palettes = [spec.palette, spec.palette, rng.pick(["sand", "clay", "sage", "ochre", "ink"] as const)];
      const product: Product = {
        id: productId,
        brandId,
        slug: `${slugify(ps.name)}-${spec.handle}`,
        name: ps.name,
        description: ps.desc,
        details: spec.details,
        category: spec.category,
        tags: ps.tags ?? [],
        priceKobo: ps.price * 100,
        ...(ps.compareAt ? { compareAtKobo: ps.compareAt * 100 } : {}),
        images: Array.from({ length: imgCount }, (_, k) => ({
          kind: "art" as const,
          motif: ps.motif,
          palette: palettes[k % palettes.length]!,
          seed: hashSeed(productId, k),
        })),
        options,
        variants,
        status: ps.draft ? "draft" : "published",
        rating: 0,
        ratingCount: 0,
        salesCount: ps.tags?.includes("bestseller") ? rng.int(180, 520) : rng.int(4, 160),
        viewCount: rng.int(300, 6000),
        createdAt: iso(created),
        updatedAt: iso(created + rng.int(0, 20) * DAY),
      };
      products.push(product);

      // Reviews
      const bank = pickReviews(spec);
      const n = ps.tags?.includes("bestseller") ? rng.int(6, 10) : rng.int(0, 6);
      const authors = rng.shuffle(customers).slice(0, n);
      for (const [ri, author] of authors.entries()) {
        const pick = bank[(pi * 3 + ri) % bank.length]!;
        const at = Math.min(now - DAY, created + rng.int(3, 120) * DAY);
        const variantKey = rng.pick(variants).key;
        const label = variantLabel(options, variantKey);
        const review: Review = {
          id: `r_${productId}_${ri}`,
          productId,
          brandId,
          userId: author.id,
          authorName: shortName(author.name),
          rating: pick.r,
          body: pick.t,
          ...(label ? { variantLabel: label } : {}),
          createdAt: iso(at),
          ...(rng.chance(isDemoBrand ? 0.45 : 0.3)
            ? { reply: { body: replyFor(pick.r, spec.owner), createdAt: iso(at + rng.int(1, 30) * 3_600_000) } }
            : {}),
        };
        reviews.push(review);
      }
    }
  }

  // Aggregate ratings
  for (const p of products) {
    const rs = reviews.filter((r) => r.productId === p.id);
    p.ratingCount = rs.length;
    p.rating = rs.length ? round1(rs.reduce((n, r) => n + r.rating, 0) / rs.length) : 0;
  }
  for (const b of brands) {
    const rs = reviews.filter((r) => r.brandId === b.id);
    b.ratingCount = rs.length;
    b.rating = rs.length ? round1(rs.reduce((n, r) => n + r.rating, 0) / rs.length) : 0;
  }

  // Demo buyer follows + wishlist
  const buyer = users[0]!;
  buyer.followingBrandIds = ["b_mamaputexpress", "b_sweettoothtobi", "b_secondlap", "b_glowtheory"];
  buyer.wishlistProductIds = [
    "p_kampuskulture_03",
    "p_secondlap_01",
    "p_glowtheory_03",
    "p_beadandbloom_07",
    "p_carrygood_05",
    "p_plughub_03",
  ];
  for (const b of brands) if (buyer.followingBrandIds.includes(b.id)) b.followerCount += 1;

  // ----------------------------- Orders -----------------------------------
  const orders: Order[] = [];
  const productsByBrand = (id: string) => products.filter((p) => p.brandId === id && p.status === "published");
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const campusById = new Map(campuses.map((c) => [c.id, c]));

  const makeOrder = (args: {
    id: string;
    buyer: UserRecord;
    brand: Brand;
    placedAt: number;
    status: OrderStatus;
    autoProgress: boolean;
    method?: "pickup" | "delivery";
  }): Order => {
    const { brand: b, buyer: u } = args;
    const pool = productsByBrand(b.id);
    const count = rng.int(1, Math.min(3, pool.length));
    const chosen = rng.shuffle(pool).slice(0, count);
    const items = chosen.map((p) => {
      const v = rng.pick(p.variants);
      return {
        productId: p.id,
        name: p.name,
        variantKey: v.key,
        variantLabel: variantLabel(p.options, v.key),
        unitPriceKobo: p.priceKobo + v.priceDeltaKobo,
        quantity: rng.chance(0.75) ? 1 : 2,
        image: p.images[0]!,
      };
    });
    const method = args.method ?? (b.fulfilment.delivery && (!b.fulfilment.pickup || rng.chance(0.6)) ? "delivery" : "pickup");
    const campus = campusById.get(b.campusId)!;
    const zone = rng.pick(campus.zones);
    const subtotal = items.reduce((n, it) => n + it.unitPriceKobo * it.quantity, 0);
    const fee = method === "delivery" ? b.fulfilment.deliveryFeeKobo : 0;
    const discount = rng.chance(0.12) ? Math.round(subtotal * 0.1) : 0;
    const steps = stepsFor(method);
    let timeline: Order["timeline"];
    if (args.status === "declined" || args.status === "cancelled") {
      timeline = [
        { status: "placed", at: iso(args.placedAt) },
        { status: args.status, at: iso(args.placedAt + rng.int(5, 40) * 60_000) },
      ];
    } else {
      const upto = steps.indexOf(args.status);
      let t = args.placedAt;
      timeline = steps.slice(0, upto + 1).map((s, i) => {
        if (i > 0) t += rng.int(4, i === steps.length - 1 ? 50 : 30) * 60_000;
        return { status: s, at: iso(Math.min(t, now - 60_000)) };
      });
    }
    const paymentMethod = rng.pick(["card", "transfer", "pay_on_pickup", "card"] as const);
    const pickupPoint = campus.pickupPoints.find((p) => b.fulfilment.pickupPointIds.includes(p.id)) ?? campus.pickupPoints[0];
    return {
      id: args.id,
      code: `${appBrand.orderPrefix}-${args.id.slice(-4).toUpperCase()}`,
      checkoutId: `ck_${args.id}`,
      buyerId: u.id,
      buyerName: u.name,
      buyerPhone: u.phone,
      brandId: b.id,
      brandName: b.name,
      brandHandle: b.handle,
      brandLogo: b.logo,
      items,
      fulfilment:
        method === "pickup"
          ? { method, campusId: campus.id, zoneId: pickupPoint?.zoneId ?? zone.id, ...(pickupPoint ? { pickupPointId: pickupPoint.id } : {}) }
          : { method, campusId: campus.id, zoneId: zone.id, addressLine: `Room ${rng.pick(["A", "B", "C", "D"])}${rng.int(101, 420)}` },
      subtotalKobo: subtotal,
      deliveryFeeKobo: fee,
      discountKobo: discount,
      totalKobo: groupTotal({ subtotalKobo: subtotal, deliveryFeeKobo: fee, discountKobo: discount }),
      ...(discount ? { promoCode: "KIOSK10" } : {}),
      payment: {
        method: paymentMethod,
        status:
          args.status === "declined" || args.status === "cancelled"
            ? paymentMethod === "pay_on_pickup"
              ? "pending"
              : "refunded"
            : paymentMethod === "pay_on_pickup" && args.status !== "delivered"
              ? "pending"
              : "paid",
      },
      status: args.status,
      timeline,
      autoProgress: args.autoProgress,
      placedAt: iso(args.placedAt),
      reviewed: args.status === "delivered" && rng.chance(0.5),
    };
  };

  // Demo buyer's history across brands (all completed)
  const buyerBrands = ["b_mamaputexpress", "b_sweettoothtobi", "b_glowtheory", "b_secondlap", "b_plughub", "b_zoborepublic", "b_inkandpaper"];
  buyerBrands.forEach((bid, i) => {
    const b = brandById.get(bid)!;
    orders.push(
      makeOrder({
        id: `o_ada_${String(i + 1).padStart(2, "0")}${["k3m9", "x2q7", "p8r4", "t6w2", "h9n3", "d4f8", "z7c5"][i]}`,
        buyer,
        brand: b,
        placedAt: now - (4 + i * 9 + rng.int(0, 4)) * DAY - rng.int(1, 10) * 3_600_000,
        status: i === 5 ? "cancelled" : "delivered",
        autoProgress: true,
      }),
    );
  });

  // Ada's live order at the demo seller's brand (seller advances it by hand)
  const demoBrand = brandById.get(`b_${DEMO.sellerBrandHandle}`)!;
  orders.push(
    makeOrder({
      id: "o_ada_live_a7b2",
      buyer,
      brand: demoBrand,
      placedAt: now - 52 * 60_000,
      status: "preparing",
      autoProgress: false,
      method: "delivery",
    }),
  );

  // Demo seller's order book: 90 days of orders from customers
  let oi = 0;
  for (let d = 89; d >= 0; d--) {
    const day = now - d * DAY;
    const weekday = new Date(day).getDay();
    const base = weekday === 5 || weekday === 6 ? 1.6 : 1;
    const trend = 0.6 + (90 - d) / 90;
    const n = Math.max(0, Math.round(rng.next() * 1.4 * base * trend));
    for (let k = 0; k < n; k++) {
      const u = rng.pick(customers);
      const placedAt = day - rng.int(1, 13) * 3_600_000 - rng.int(0, 59) * 60_000;
      let status: OrderStatus = "delivered";
      if (d === 0) status = rng.pick(["placed", "placed", "confirmed", "preparing", "ready"] as const);
      else if (d === 1) status = rng.pick(["delivered", "ready", "out_for_delivery", "preparing"] as const);
      else if (rng.chance(0.04)) status = "declined";
      else if (rng.chance(0.03)) status = "cancelled";
      const methodGuess: "pickup" | "delivery" = status === "ready" ? "pickup" : status === "out_for_delivery" ? "delivery" : rng.chance(0.55) ? "delivery" : "pickup";
      orders.push(
        makeOrder({
          id: `o_tl_${String(++oi).padStart(3, "0")}${Math.floor(rng.next() * 46656).toString(36).padStart(3, "0")}`,
          buyer: u,
          brand: demoBrand,
          placedAt: Math.min(placedAt, now - 5 * 60_000),
          status,
          autoProgress: false,
          method: methodGuess,
        }),
      );
    }
  }
  // Guarantee a lively kanban
  for (const status of ["placed", "placed", "confirmed", "preparing", "ready"] as const) {
    orders.push(
      makeOrder({
        id: `o_tl_new_${status}_${++oi}`,
        buyer: rng.pick(customers),
        brand: demoBrand,
        placedAt: now - rng.int(8, 160) * 60_000,
        status,
        autoProgress: false,
        method: status === "ready" ? "pickup" : undefined,
      }),
    );
  }

  // ----------------------------- Metrics ----------------------------------
  const metrics: BrandMetric[] = [];
  for (let d = 89; d >= 0; d--) {
    const day = new Date(now - d * DAY);
    const date = day.toISOString().slice(0, 10);
    const dayOrders = orders.filter(
      (o) => o.brandId === demoBrand.id && o.placedAt.slice(0, 10) === date && o.status !== "declined" && o.status !== "cancelled",
    );
    const weekday = day.getDay();
    const views = Math.round((90 + rng.int(0, 70)) * (weekday === 5 || weekday === 6 ? 1.35 : 1) * (0.7 + (90 - d) / 150));
    const hourly = Array.from({ length: 24 }, (_, h) => {
      const w = h < 7 ? 0.15 : h < 11 ? 0.7 : h < 15 ? 1.4 : h < 19 ? 0.9 : h < 23 ? 1.7 : 0.6;
      return Math.round((views / 24) * w * (0.8 + rng.next() * 0.4));
    });
    metrics.push({
      brandId: demoBrand.id,
      date,
      views,
      addToBag: Math.round(views * (0.06 + rng.next() * 0.05)) + dayOrders.length,
      orders: dayOrders.length,
      revenueKobo: dayOrders.reduce((n, o) => n + o.subtotalKobo - o.discountKobo, 0),
      hourly,
    });
  }

  // ----------------------------- Promos -----------------------------------
  const promos: Promo[] = [
    { id: "pr_kiosk10", code: "KIOSK10", brandId: null, kind: "percent", value: 10, maxDiscountKobo: 200_000, minSubtotalKobo: 300_000, active: true, usageCount: 1284, description: "10% off orders over ₦3,000 (max ₦2,000)", createdAt: iso(now - 60 * DAY) },
    { id: "pr_fresher", code: "FRESHER", brandId: null, kind: "fixed", value: 50_000, minSubtotalKobo: 250_000, active: true, usageCount: 412, description: "₦500 off your order over ₦2,500", createdAt: iso(now - 40 * DAY) },
    { id: "pr_freedel", code: "FREEDEL", brandId: null, kind: "free_delivery", value: 0, minSubtotalKobo: 0, active: true, usageCount: 2210, description: "Free delivery on any order", createdAt: iso(now - 30 * DAY) },
    { id: "pr_adire15", code: "ADIRE15", brandId: demoBrand.id, kind: "percent", value: 15, minSubtotalKobo: 1_000_000, active: true, usageCount: 23, usageLimit: 100, description: "15% off Àdìrẹ Lab orders over ₦10,000", createdAt: iso(now - 20 * DAY) },
    { id: "pr_hallweek", code: "HALLWEEK", brandId: demoBrand.id, kind: "fixed", value: 100_000, minSubtotalKobo: 800_000, active: false, usageCount: 61, description: "Hall week special: ₦1,000 off", createdAt: iso(now - 75 * DAY) },
    { id: "pr_sweet20", code: "SWEET20", brandId: "b_sweettoothtobi", kind: "percent", value: 20, maxDiscountKobo: 200_000, minSubtotalKobo: 0, active: true, usageCount: 88, description: "20% off Sweet Tooth treats (max ₦2,000)", createdAt: iso(now - 10 * DAY) },
  ];

  // --------------------------- Notifications ------------------------------
  const notifications: AppNotification[] = [
    { id: "n_1", userId: buyer.id, kind: "order", title: "Your Àdìrẹ Lab order is being prepared", body: "Tolu is packing your order. We'll tell you when it's on the way.", href: "/orders/o_ada_live_a7b2", read: false, createdAt: iso(now - 30 * 60_000) },
    { id: "n_2", userId: buyer.id, kind: "promo", title: "FREEDEL is live this week", body: "Free delivery on any order. Use code FREEDEL at checkout.", read: false, createdAt: iso(now - 5 * 3_600_000) },
    { id: "n_3", userId: buyer.id, kind: "follow", title: "Second Lap Thrift dropped 3 new pieces", body: "One-of-one vintage, gone when it's gone.", href: "/brands/secondlap", read: true, createdAt: iso(now - 2 * DAY) },
    { id: "n_4", userId: buyer.id, kind: "review", title: "How was your Sweet Tooth order?", body: "Leave a quick review to help other students.", href: "/orders", read: true, createdAt: iso(now - 6 * DAY) },
    { id: "n_5", userId: DEMO.seller.id, kind: "order", title: "3 new orders waiting", body: "Accept them soon so customers aren't left waiting.", href: "/studio/orders", read: false, createdAt: iso(now - 40 * 60_000) },
    { id: "n_6", userId: DEMO.seller.id, kind: "review", title: "New 5-star review on Indigo Àdìrẹ Boxy Tee", body: "\"The colour is even better in person.\"", href: "/studio/reviews", read: false, createdAt: iso(now - 9 * 3_600_000) },
  ];

  // ------------------------------ Threads ---------------------------------
  const sweet = brandById.get("b_sweettoothtobi")!;
  const threads: Thread[] = [
    {
      id: "th_ada_sweet",
      buyerId: buyer.id,
      buyerName: buyer.name,
      brandId: sweet.id,
      brandName: sweet.name,
      brandHandle: sweet.handle,
      brandLogo: sweet.logo,
      productId: "p_sweettoothtobi_03",
      messages: [
        { id: "m1", from: "buyer", body: "Hi! Can you write 'Happy 21st Bisi' on the bento cake?", at: iso(now - 26 * 3_600_000) },
        { id: "m2", from: "brand", body: "Yes of course! Pink or white icing for the letters?", at: iso(now - 25 * 3_600_000) },
        { id: "m3", from: "buyer", body: "Pink please. Can it be ready by Friday 4pm?", at: iso(now - 24 * 3_600_000) },
        { id: "m4", from: "brand", body: "Done ✓ Place the order by Thursday and add the message in the note.", at: iso(now - 23 * 3_600_000) },
      ],
      updatedAt: iso(now - 23 * 3_600_000),
      unreadForBuyer: 1,
      unreadForBrand: 0,
    },
    {
      id: "th_kunle_adire",
      buyerId: customers[0]!.id,
      buyerName: customers[0]!.name,
      brandId: demoBrand.id,
      brandName: demoBrand.name,
      brandHandle: demoBrand.handle,
      brandLogo: demoBrand.logo,
      productId: "p_adirelab_01",
      messages: [
        { id: "m1", from: "buyer", body: "Does the boxy tee come in XXL? I'm 6'3\".", at: iso(now - 3 * 3_600_000) },
      ],
      updatedAt: iso(now - 3 * 3_600_000),
      unreadForBuyer: 0,
      unreadForBrand: 1,
    },
    {
      id: "th_zainab_adire",
      buyerId: customers[1]!.id,
      buyerName: customers[1]!.name,
      brandId: demoBrand.id,
      brandName: demoBrand.name,
      brandHandle: demoBrand.handle,
      brandLogo: demoBrand.logo,
      messages: [
        { id: "m1", from: "buyer", body: "Hi, can I pick up at the Engineering foyer instead of Arts?", at: iso(now - 2 * DAY) },
        { id: "m2", from: "brand", body: "Sure, I'll be there from 12 to 2pm tomorrow.", at: iso(now - 2 * DAY + 40 * 60_000) },
        { id: "m3", from: "buyer", body: "Perfect, thank you!", at: iso(now - 2 * DAY + 55 * 60_000) },
      ],
      updatedAt: iso(now - 2 * DAY + 55 * 60_000),
      unreadForBuyer: 0,
      unreadForBrand: 0,
    },
  ];

  // ------------------------------ Wallet ----------------------------------
  const wallet: WalletTransaction[] = [
    { id: "w1", userId: buyer.id, kind: "topup", amountKobo: 2_000_000, label: "Top-up (demo)", at: iso(now - 30 * DAY) },
    { id: "w2", userId: buyer.id, kind: "payment", amountKobo: -480_000, label: "Sweet Tooth by Tobi", at: iso(now - 22 * DAY) },
    { id: "w3", userId: buyer.id, kind: "payment", amountKobo: -390_000, label: "Mama Put Express", at: iso(now - 13 * DAY) },
    { id: "w4", userId: buyer.id, kind: "refund", amountKobo: 120_000, label: "Refund · Zobo Republic", at: iso(now - 9 * DAY) },
    { id: "w5", userId: buyer.id, kind: "topup", amountKobo: 500_000, label: "Top-up (demo)", at: iso(now - 4 * DAY) },
  ];

  // ------------------------------- Places ---------------------------------
  const moremi = unilag.zones.find((z) => z.name === "Moremi Hall")!;
  const places: SavedPlace[] = [
    { id: "pl_1", userId: buyer.id, label: "Hostel", campusId: unilag.id, zoneId: moremi.id, addressLine: "Room B214, Block B", isDefault: true },
    { id: "pl_2", userId: buyer.id, label: "Department", campusId: unilag.id, zoneId: unilag.zones[4]!.id, pickupPointId: unilag.pickupPoints[0]!.id, addressLine: "Faculty of Arts, 2nd floor", isDefault: false },
  ];

  // ------------------------------ Payouts ---------------------------------
  const payouts: Payout[] = Array.from({ length: 6 }, (_, i) => ({
    id: `po_${i + 1}`,
    brandId: demoBrand.id,
    amountKobo: rng.int(38, 140) * 100_000 + rng.int(0, 99) * 100,
    status: "paid" as const,
    at: iso(now - (i * 14 + 3) * DAY),
    reference: `PAY-${(48213 + i * 977).toString(36).toUpperCase()}`,
  }));

  return { campuses, users, brands, products, reviews, orders, promos, notifications, threads, wallet, places, payouts, metrics };
}

function hashSeed(id: string, k: number) {
  let h = 2166136261;
  const s = `${id}:${k}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function shortName(full: string) {
  const [first, last] = full.split(" ");
  return last ? `${first} ${last[0]}.` : full;
}

function replyFor(rating: number, owner: string) {
  const first = owner.split(" ")[0];
  if (rating >= 5) return `Thank you so much! This made our week. ${first} from the team`;
  if (rating === 4) return `Thanks for the honest review. We'll keep improving. ${first}`;
  return `Sorry it wasn't perfect. Please message us and we'll make it right. ${first}`;
}
