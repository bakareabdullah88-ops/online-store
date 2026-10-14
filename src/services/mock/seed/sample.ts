/**
 * SAMPLE DATA, for the preview while Kamplug is being built.
 *
 * Every id made here contains "_demo_" (real ids never can: see lib/ids.ts),
 * so the whole set can be found, refreshed or removed in one pass. Switch it
 * off with NEXT_PUBLIC_SAMPLE_DATA=0, or delete this file and its callers
 * once real shops are live.
 */
import { brand as appBrand } from "@/config/brand";
import { slugify } from "@/lib/ids";
import { createRng, hashString, type Rng } from "@/lib/random";
import { allVariantKeys, DEFAULT_VARIANT_KEY, variantLabel } from "@/domain/variants";
import { groupTotal } from "@/domain/checkout";
import { stepsFor } from "@/domain/orders";
import type {
  AnalyticsEvent,
  AppNotification,
  Brand,
  Campus,
  Order,
  OrderStatus,
  Product,
  ProductOption,
  Promo,
  Review,
  SavedPlace,
  Thread,
  UserRecord,
  Variant,
} from "@/services/types";
import { brandSpecs, reviewBank, swatches, type ProductSpec } from "./catalog";
import { coverFor, photosFor } from "./photos";

/** The marker in every sample id. */
export const SAMPLE_MARK = "_demo_";
export const isSampleId = (id: string) => id.includes(SAMPLE_MARK);

/**
 * Bump when the sample data changes shape or content, so browsers holding an
 * older set rebuild it on their next visit instead of waiting for it to expire.
 */
export const SAMPLE_VERSION = 3;

/** The account anyone can look around with, no sign-up needed. */
export const PREVIEW = {
  userId: "u_demo_preview",
  name: "Temi Adebisi",
  email: "preview@kamplug.demo",
  shopHandle: "adirelab",
} as const;

export type SampleData = {
  users: UserRecord[];
  brands: Brand[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  promos: Promo[];
  notifications: AppNotification[];
  threads: Thread[];
  places: SavedPlace[];
  events: AnalyticsEvent[];
};

const SEED = 20261014;
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

const customerNames = [
  "Kunle Adebayo",
  "Zainab Musa",
  "Tobi Fashola",
  "Emeka Nwankwo",
  "Halima Bello",
  "Seyi Kolawole",
  "Ngozi Eze",
  "Ibrahim Sani",
  "Funke Akinola",
  "Chidi Uche",
  "Amaka Ibe",
  "Bolu Dada",
  "Hauwa Garba",
  "Dare Ogunleye",
  "Nkechi Chukwu",
  "Yusuf Tanko",
  "Ronke Jimoh",
  "Ikenna Peters",
  "Mariam Yakubu",
  "Tomiwa Lawal",
  "Esther Ayodele",
  "Obinna Kalu",
  "Rukayat Shittu",
  "Damilola Williams",
  "Uche Madu",
  "Bisi Oyelaran",
  "Femi Ojo",
  "Kemi Alabi",
];

const iso = (t: number) => new Date(t).toISOString();
const round1 = (n: number) => Math.round(n * 10) / 10;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

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

function parseOptions(specs: string[] | undefined, productId: string) {
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

function buildVariants(
  options: ProductOption[],
  deltas: Map<string, number>,
  spec: ProductSpec,
  rng: Rng,
): Variant[] {
  return allVariantKeys(options).map((key) => {
    const ids = key === DEFAULT_VARIANT_KEY ? [] : key.split("|");
    const delta = ids.reduce((n, id) => n + (deltas.get(id) ?? 0), 0);
    let stock: number;
    if (spec.scarce) stock = rng.chance(0.85) ? 1 : 0;
    else stock = rng.chance(0.08) ? 0 : rng.chance(0.15) ? rng.int(1, 3) : rng.int(6, 40);
    return { key, stock, priceDeltaKobo: delta };
  });
}

const prefs = { orderUpdates: true, messages: true, promotions: false, newFromFollowed: true };

function person(p: {
  id: string;
  name: string;
  email: string;
  phone: string;
  campusId: string;
  createdAt: number;
}): UserRecord {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    phone: p.phone,
    campusId: p.campusId,
    avatar: null,
    brandIds: [],
    followingBrandIds: [],
    wishlistProductIds: [],
    onboarded: true,
    notificationPrefs: prefs,
    createdAt: iso(p.createdAt),
    // Nobody can log in to these with a password.
    passwordHash: "",
    passwordSalt: "",
  };
}

/**
 * Twenty student shops with photos and reviews, customers, and one preview
 * account (Temi) that shops around and runs Àdìrẹ Lab, so every page of the
 * app, buyer and seller side, has something to show.
 */
export function generateSample(campuses: Campus[], now: number = Date.now()): SampleData {
  const rng = createRng(SEED);
  const campusBySlug = new Map(campuses.map((c) => [c.slug, c]));
  const campusById = new Map(campuses.map((c) => [c.id, c]));
  const unilag = campusBySlug.get("unilag") ?? campuses[0]!;

  const users: UserRecord[] = [];
  const preview = person({
    id: PREVIEW.userId,
    name: PREVIEW.name,
    email: PREVIEW.email,
    phone: "08031234567",
    campusId: unilag.id,
    createdAt: now - 170 * DAY,
  });
  preview.notificationPrefs = { ...prefs, promotions: true };
  users.push(preview);

  const customers = customerNames.map((name, i) =>
    person({
      id: `u_demo_c${pad(i + 1)}`,
      name,
      email: `${slugify(name).replace(/-/g, ".")}@students.example`,
      phone: `080${String(30000000 + i * 7919).slice(0, 8)}`,
      campusId: i % 3 === 0 ? unilag.id : campuses[i % campuses.length]!.id,
      createdAt: now - rng.int(30, 400) * DAY,
    }),
  );
  users.push(...customers);

  const brands: Brand[] = [];
  const products: Product[] = [];
  const reviews: Review[] = [];

  for (const [bi, spec] of brandSpecs.entries()) {
    const campus = campusBySlug.get(spec.campus) ?? unilag;
    const brandId = `b_demo_${spec.handle}`;
    const mine = spec.handle === PREVIEW.shopHandle;
    const ownerName = mine ? PREVIEW.name : spec.owner;
    let owner: UserRecord;
    if (mine) {
      owner = preview;
    } else {
      owner = person({
        id: `u_demo_owner_${spec.handle}`,
        name: ownerName,
        email: `${spec.handle}@brands.example`,
        phone: `0810${String(1000000 + bi * 31337).slice(0, 7)}`,
        campusId: campus.id,
        createdAt: now - rng.int(200, 500) * DAY,
      });
      users.push(owner);
    }
    owner.brandIds.push(brandId);

    const brandCreated = now - rng.int(170, 420) * DAY;
    const food = spec.category === "food";
    brands.push({
      id: brandId,
      ownerId: owner.id,
      handle: spec.handle,
      name: spec.name,
      category: spec.category,
      tagline: spec.tagline,
      bio: spec.bio,
      logo: { kind: "art", motif: "monogram", palette: spec.palette, seed: bi + 1 },
      cover: coverFor(spec.motif) ?? {
        kind: "art",
        motif: spec.motif,
        palette: spec.palette,
        seed: 1000 + bi,
      },
      campusId: campus.id,
      fulfilment: {
        pickup: spec.delivery.pickup,
        delivery: spec.delivery.delivery,
        deliveryFeeKobo: spec.delivery.fee * 100,
        prepMinutes: spec.delivery.prepMinutes,
        pickupPointIds: spec.delivery.pickup ? campus.pickupPoints.map((p) => p.id) : [],
        zoneIds: spec.delivery.delivery ? campus.zones.map((z) => z.id) : [],
      },
      openHours: {
        days: food ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6],
        opens: food ? "10:00" : "09:00",
        closes: food ? "22:30" : "20:00",
      },
      vacation: false,
      rating: 0,
      ratingCount: 0,
      followerCount: rng.int(80, 2400),
      productCount: spec.products.length,
      createdAt: iso(brandCreated),
      payoutAccount: mine
        ? { bankName: "GTBank", accountLast4: "4821", accountName: ownerName }
        : null,
      verified: !!spec.verified,
    });

    for (const [pi, ps] of spec.products.entries()) {
      const productId = `p_demo_${spec.handle}_${pad(pi + 1)}`;
      const { options, deltas } = parseOptions(ps.options, productId);
      const variants = buildVariants(options, deltas, ps, rng);
      const ageDays = Math.max(2, Math.floor((now - brandCreated) / DAY) - 2);
      // Most of the shop's products are older than the order history below.
      const created = Math.min(brandCreated + rng.int(1, ageDays) * DAY, now - 160 * DAY);
      const imgCount = rng.int(2, 4);
      const palettes = [spec.palette, spec.palette, rng.pick(["sand", "clay", "sage"] as const)];
      products.push({
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
        images: ps.photos?.length
          ? ps.photos.map((src) => ({ kind: "url" as const, src }))
          : (photosFor(ps.motif, productId, imgCount, spec.category) ??
            Array.from({ length: imgCount }, (_, k) => ({
              kind: "art" as const,
              motif: ps.motif,
              palette: palettes[k % palettes.length]!,
              seed: hashString(`${productId}:${k}`),
            }))),
        options,
        variants,
        status: ps.draft ? "draft" : "published",
        rating: 0,
        ratingCount: 0,
        salesCount: ps.tags?.includes("bestseller") ? rng.int(180, 520) : rng.int(4, 160),
        viewCount: rng.int(300, 6000),
        createdAt: iso(created),
        updatedAt: iso(created + rng.int(0, 20) * DAY),
      });

      const bank = reviewBank[spec.category] ?? reviewBank.default;
      const n = ps.tags?.includes("bestseller") ? rng.int(6, 10) : rng.int(0, 6);
      for (const [ri, author] of rng.shuffle(customers).slice(0, n).entries()) {
        const pick = bank[(pi * 3 + ri) % bank.length]!;
        const at = Math.min(now - DAY, created + rng.int(3, 150) * DAY);
        const label = variantLabel(options, rng.pick(variants).key);
        reviews.push({
          id: `r_demo_${spec.handle}_${pad(pi + 1)}_${ri}`,
          productId,
          brandId,
          userId: author.id,
          authorName: shortName(author.name),
          rating: pick.r,
          body: pick.t,
          ...(label ? { variantLabel: label } : {}),
          createdAt: iso(at),
          ...(rng.chance(mine ? 0.45 : 0.3)
            ? {
                reply: {
                  body: replyFor(pick.r, ownerName),
                  createdAt: iso(at + rng.int(1, 30) * HOUR),
                },
              }
            : {}),
        });
      }
    }
  }

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

  const brandById = new Map(brands.map((b) => [b.id, b]));
  const shop = brandById.get(`b_demo_${PREVIEW.shopHandle}`)!;

  preview.followingBrandIds = [
    "b_demo_mamaputexpress",
    "b_demo_sweettoothtobi",
    "b_demo_secondlap",
    "b_demo_glowtheory",
    "b_demo_plughub",
  ];
  preview.wishlistProductIds = [
    "p_demo_kampuskulture_03",
    "p_demo_secondlap_01",
    "p_demo_glowtheory_03",
    "p_demo_beadandbloom_07",
    "p_demo_carrygood_05",
    "p_demo_plughub_03",
  ].filter((id) => products.some((p) => p.id === id));
  for (const b of brands) if (preview.followingBrandIds.includes(b.id)) b.followerCount += 1;

  /* --------------------------------- Orders --------------------------------- */

  const orders: Order[] = [];
  const published = (brandId: string) =>
    products.filter((p) => p.brandId === brandId && p.status === "published");
  let orderSeq = 0;

  const makeOrder = (a: {
    buyer: UserRecord;
    brand: Brand;
    placedAt: number;
    status: OrderStatus;
    method?: "pickup" | "delivery";
  }): Order => {
    const { brand: b, buyer: u } = a;
    const pool = published(b.id);
    const chosen = rng.shuffle(pool).slice(0, rng.int(1, Math.min(3, pool.length)));
    const items = chosen.map((p) => {
      const v = rng.pick(p.variants);
      return {
        productId: p.id,
        name: p.name,
        variantKey: v.key,
        variantLabel: variantLabel(p.options, v.key),
        unitPriceKobo: p.priceKobo + v.priceDeltaKobo,
        quantity: rng.chance(0.75) ? 1 : 2,
        image: p.images[0] ?? null,
      };
    });
    const method =
      a.method ??
      (b.fulfilment.delivery && (!b.fulfilment.pickup || rng.chance(0.6)) ? "delivery" : "pickup");
    const campus = campusById.get(b.campusId)!;
    const zone = rng.pick(campus.zones);
    const subtotal = items.reduce((n, it) => n + it.unitPriceKobo * it.quantity, 0);
    const fee = method === "delivery" ? b.fulfilment.deliveryFeeKobo : 0;
    const discount = rng.chance(0.12) ? Math.round(subtotal * 0.1) : 0;
    const steps = stepsFor(method);
    let timeline: Order["timeline"];
    if (a.status === "declined" || a.status === "cancelled") {
      timeline = [
        { status: "placed", at: iso(a.placedAt) },
        { status: a.status, at: iso(a.placedAt + rng.int(5, 40) * MIN) },
      ];
    } else {
      const upto = steps.indexOf(a.status);
      let t = a.placedAt;
      timeline = steps.slice(0, upto + 1).map((s, i) => {
        if (i > 0) t += rng.int(4, i === steps.length - 1 ? 50 : 30) * MIN;
        return { status: s, at: iso(Math.min(t, now - MIN)) };
      });
    }
    const pickupPoint =
      campus.pickupPoints.find((p) => b.fulfilment.pickupPointIds.includes(p.id)) ??
      campus.pickupPoints[0];
    const id = `o_demo_${pad(++orderSeq, 4)}${Math.floor(rng.next() * 46656)
      .toString(36)
      .padStart(3, "0")}`;
    return {
      id,
      code: `${appBrand.orderPrefix}-${Array.from({ length: 4 }, () => "ABCDEFGHJKMNPQRSTVWXYZ23456789"[rng.int(0, 29)]).join("")}`,
      checkoutId: `ck_${id}`,
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
          ? {
              method,
              campusId: campus.id,
              zoneId: pickupPoint?.zoneId ?? zone.id,
              ...(pickupPoint ? { pickupPointId: pickupPoint.id } : {}),
            }
          : {
              method,
              campusId: campus.id,
              zoneId: zone.id,
              addressLine: `Room ${rng.pick(["A", "B", "C", "D"])}${rng.int(101, 420)}`,
            },
      subtotalKobo: subtotal,
      deliveryFeeKobo: fee,
      discountKobo: discount,
      totalKobo: groupTotal({
        subtotalKobo: subtotal,
        deliveryFeeKobo: fee,
        discountKobo: discount,
      }),
      ...(discount ? { promoCode: "KAMPLUG10" } : {}),
      payment: {
        method: method === "pickup" ? "pay_on_pickup" : "pay_on_delivery",
        status: a.status === "delivered" ? "paid" : "pending",
      },
      status: a.status,
      timeline,
      autoProgress: false,
      placedAt: iso(a.placedAt),
      reviewed: a.status === "delivered" && rng.chance(0.5),
    };
  };

  // Temi's own shopping: about two orders a week for five months.
  const shopsTemiUses = [
    "b_demo_mamaputexpress",
    "b_demo_mamaputexpress",
    "b_demo_choplife",
    "b_demo_sweettoothtobi",
    "b_demo_zoborepublic",
    "b_demo_glowtheory",
    "b_demo_secondlap",
    "b_demo_plughub",
    "b_demo_inkandpaper",
    "b_demo_kampuskulture",
    "b_demo_beadandbloom",
    "b_demo_pastqplug",
  ]
    .map((id) => brandById.get(id))
    .filter((b): b is Brand => !!b);
  for (let d = 150; d >= 2; d -= rng.int(2, 5)) {
    orders.push(
      makeOrder({
        buyer: preview,
        brand: rng.pick(shopsTemiUses),
        placedAt: now - d * DAY - rng.int(1, 10) * HOUR,
        status: rng.chance(0.07) ? "cancelled" : "delivered",
      }),
    );
  }
  // Two on the way right now.
  const mamaput = brandById.get("b_demo_mamaputexpress");
  if (mamaput)
    orders.push(
      makeOrder({
        buyer: preview,
        brand: mamaput,
        placedAt: now - 35 * MIN,
        status: "out_for_delivery",
        method: "delivery",
      }),
    );
  const sweet = brandById.get("b_demo_sweettoothtobi");
  if (sweet)
    orders.push(
      makeOrder({ buyer: preview, brand: sweet, placedAt: now - 3 * HOUR, status: "preparing" }),
    );

  // Àdìrẹ Lab's order book: five months of growth, busier on weekends.
  const loyal = customers.slice(0, 8);
  for (let d = 150; d >= 1; d--) {
    const day = now - d * DAY;
    const weekday = new Date(day).getDay();
    const weekend = weekday === 5 || weekday === 6 ? 1.6 : 1;
    const trend = 0.45 + (150 - d) / 120;
    const n = Math.max(0, Math.round(rng.next() * 2.4 * weekend * trend));
    for (let k = 0; k < n; k++) {
      const placedAt = Math.min(day - rng.int(1, 13) * HOUR - rng.int(0, 59) * MIN, now - 5 * MIN);
      let status: OrderStatus = "delivered";
      if (d === 1) status = rng.pick(["delivered", "ready", "out_for_delivery"] as const);
      else if (rng.chance(0.04)) status = "declined";
      else if (rng.chance(0.03)) status = "cancelled";
      orders.push(
        makeOrder({
          buyer: rng.chance(0.45) ? rng.pick(loyal) : rng.pick(customers),
          brand: shop,
          placedAt,
          status,
          method:
            status === "ready" ? "pickup" : status === "out_for_delivery" ? "delivery" : undefined,
        }),
      );
    }
  }
  // Today's queue, so the order board has something in every column.
  for (const status of ["placed", "placed", "placed", "confirmed", "preparing", "ready"] as const) {
    orders.push(
      makeOrder({
        buyer: rng.pick(customers),
        brand: shop,
        placedAt: now - rng.int(8, 160) * MIN,
        status,
        method: status === "ready" ? "pickup" : undefined,
      }),
    );
  }

  // A trickle of orders at every other shop, so their numbers aren't zero.
  for (const b of brands) {
    if (b.id === shop.id) continue;
    for (let i = rng.int(6, 16); i > 0; i--) {
      orders.push(
        makeOrder({
          buyer: rng.pick(customers),
          brand: b,
          placedAt: now - rng.int(1, 120) * DAY - rng.int(1, 12) * HOUR,
          status: rng.chance(0.06) ? "cancelled" : "delivered",
        }),
      );
    }
  }

  /* ------------------------- Views and add-to-bags -------------------------- */

  const events: AnalyticsEvent[] = [];
  const shopProducts = published(shop.id);
  const weights = shopProducts.map((p) => (p.tags.includes("bestseller") ? 4 : 1));
  const totalWeight = weights.reduce((n, w) => n + w, 0);
  const pickProduct = () => {
    let r = rng.next() * totalWeight;
    for (const [i, w] of weights.entries()) if ((r -= w) < 0) return shopProducts[i]!;
    return shopProducts[0]!;
  };
  // Views follow the campus day: quiet at dawn, busy at lunch and late evening.
  const hourWeights = Array.from({ length: 24 }, (_, h) =>
    h < 7 ? 0.15 : h < 11 ? 0.7 : h < 15 ? 1.4 : h < 19 ? 0.9 : h < 23 ? 1.7 : 0.6,
  );
  const hourTotal = hourWeights.reduce((n, w) => n + w, 0);
  const pickHour = () => {
    let r = rng.next() * hourTotal;
    for (const [h, w] of hourWeights.entries()) if ((r -= w) < 0) return h;
    return 20;
  };
  let ev = 0;
  for (let d = 150; d >= 0; d--) {
    const start = new Date(now - d * DAY);
    start.setHours(0, 0, 0, 0);
    const weekday = start.getDay();
    const views = Math.round(
      (22 + rng.int(0, 22)) * (weekday === 5 || weekday === 6 ? 1.35 : 1) * (0.5 + (150 - d) / 150),
    );
    for (let v = 0; v < views; v++) {
      const at = start.getTime() + pickHour() * HOUR + rng.int(0, 59) * MIN;
      if (at > now) continue;
      const p = pickProduct();
      const who = rng.chance(0.4) ? rng.pick(customers).id : null;
      events.push({
        id: `e_demo_${++ev}`,
        type: "view",
        productId: p.id,
        brandId: shop.id,
        userId: who,
        at: iso(at),
      });
      if (rng.chance(0.11))
        events.push({
          id: `e_demo_${++ev}`,
          type: "add_to_bag",
          productId: p.id,
          brandId: shop.id,
          userId: who,
          at: iso(Math.min(now, at + rng.int(1, 6) * MIN)),
        });
    }
  }

  /* --------------------------------- Promos --------------------------------- */

  const promos: Promo[] = [
    {
      id: "pr_demo_kiosk10",
      code: "KAMPLUG10",
      brandId: null,
      kind: "percent",
      value: 10,
      maxDiscountKobo: 200_000,
      minSubtotalKobo: 300_000,
      active: true,
      usageCount: 1284,
      description: "10% off orders over ₦3,000 (max ₦2,000)",
      createdAt: iso(now - 60 * DAY),
    },
    {
      id: "pr_demo_freedel",
      code: "FREEDEL",
      brandId: null,
      kind: "free_delivery",
      value: 0,
      minSubtotalKobo: 0,
      active: true,
      usageCount: 2210,
      description: "Free delivery on any order",
      createdAt: iso(now - 30 * DAY),
    },
    {
      id: "pr_demo_adire15",
      code: "ADIRE15",
      brandId: shop.id,
      kind: "percent",
      value: 15,
      minSubtotalKobo: 1_000_000,
      active: true,
      usageCount: 23,
      usageLimit: 100,
      description: "15% off Àdìrẹ Lab orders over ₦10,000",
      createdAt: iso(now - 20 * DAY),
    },
    {
      id: "pr_demo_hallweek",
      code: "HALLWEEK",
      brandId: shop.id,
      kind: "fixed",
      value: 100_000,
      minSubtotalKobo: 800_000,
      active: false,
      usageCount: 61,
      description: "Hall week special: ₦1,000 off",
      createdAt: iso(now - 75 * DAY),
    },
    {
      id: "pr_demo_sweet20",
      code: "SWEET20",
      brandId: "b_demo_sweettoothtobi",
      kind: "percent",
      value: 20,
      maxDiscountKobo: 200_000,
      minSubtotalKobo: 0,
      active: true,
      usageCount: 88,
      description: "20% off Sweet Tooth treats (max ₦2,000)",
      createdAt: iso(now - 10 * DAY),
    },
  ];

  /* ------------------------------ Notifications ----------------------------- */

  const live = orders.find((o) => o.buyerId === preview.id && o.status === "out_for_delivery");
  const notifications: AppNotification[] = [
    {
      id: "n_demo_1",
      userId: preview.id,
      kind: "order",
      title: "Your Mama Put Express order is on the way",
      body: "The rider left a few minutes ago. Keep your phone close.",
      href: live ? `/orders/${live.id}` : "/orders",
      read: false,
      createdAt: iso(now - 12 * MIN),
    },
    {
      id: "n_demo_2",
      userId: preview.id,
      kind: "order",
      title: "3 new orders waiting at Àdìrẹ Lab",
      body: "Accept them soon so customers aren't left waiting.",
      href: "/studio/orders",
      read: false,
      createdAt: iso(now - 40 * MIN),
    },
    {
      id: "n_demo_3",
      userId: preview.id,
      kind: "message",
      title: "Kunle asked about sizes",
      body: '"Does the boxy tee come in XXL?"',
      href: "/studio/messages",
      read: false,
      createdAt: iso(now - 3 * HOUR),
    },
    {
      id: "n_demo_4",
      userId: preview.id,
      kind: "review",
      title: "New 5-star review on Indigo Àdìrẹ Boxy Tee",
      body: '"The colour is even better in person."',
      href: "/studio/reviews",
      read: false,
      createdAt: iso(now - 9 * HOUR),
    },
    {
      id: "n_demo_5",
      userId: preview.id,
      kind: "promo",
      title: "FREEDEL is live this week",
      body: "Free delivery on any order. Use code FREEDEL at checkout.",
      read: true,
      createdAt: iso(now - 26 * HOUR),
    },
    {
      id: "n_demo_6",
      userId: preview.id,
      kind: "follow",
      title: "Second Lap Thrift dropped 3 new pieces",
      body: "One-of-one vintage, gone when it's gone.",
      href: "/brands/secondlap",
      read: true,
      createdAt: iso(now - 2 * DAY),
    },
  ];

  /* -------------------------------- Messages -------------------------------- */

  const thread = (
    id: string,
    buyer: UserRecord,
    b: Brand,
    lines: [from: "buyer" | "brand", body: string, agoMinutes: number][],
    unread: { buyer: number; brand: number },
    productId?: string,
  ): Thread => ({
    id: `th_demo_${id}`,
    buyerId: buyer.id,
    buyerName: buyer.name,
    brandId: b.id,
    brandName: b.name,
    brandHandle: b.handle,
    brandLogo: b.logo,
    ...(productId ? { productId } : {}),
    messages: lines.map(([from, body, ago], i) => ({
      id: `m${i + 1}`,
      from,
      body,
      at: iso(now - ago * MIN),
    })),
    updatedAt: iso(now - lines[lines.length - 1]![2] * MIN),
    unreadForBuyer: unread.buyer,
    unreadForBrand: unread.brand,
  });

  const c = (i: number) => customers[i]!;
  const threads: Thread[] = [
    thread(
      "kunle",
      c(0),
      shop,
      [["buyer", "Does the boxy tee come in XXL? I'm 6'3\".", 180]],
      { buyer: 0, brand: 1 },
      "p_demo_adirelab_01",
    ),
    thread(
      "zainab",
      c(1),
      shop,
      [
        ["buyer", "Hi, can I pick up at the Engineering foyer instead of Arts?", 2900],
        ["brand", "Sure, I'll be there from 12 to 2pm tomorrow.", 2860],
        ["buyer", "Perfect, thank you!", 2845],
      ],
      { buyer: 0, brand: 0 },
    ),
    thread(
      "tobi",
      c(2),
      shop,
      [
        ["buyer", "Is the indigo tee restocking in M? 🙏", 420],
        ["brand", "Yes! New batch is drying now, should be up by Friday.", 400],
        ["buyer", "Can you hold one for me?", 395],
      ],
      { buyer: 0, brand: 1 },
      "p_demo_adirelab_01",
    ),
    thread(
      "halima",
      c(4),
      shop,
      [
        ["buyer", "Do you do custom colours for a group order? We're 12 people.", 5800],
        ["brand", "We do. For 10+ pieces it's 10% off and about 5 days. What colour?", 5750],
        ["buyer", "Deep green for our department dinner.", 5700],
        ["brand", "Lovely. I'll send a swatch photo tonight.", 5690],
      ],
      { buyer: 0, brand: 0 },
    ),
  ];
  if (sweet)
    threads.push(
      thread(
        "sweet",
        preview,
        sweet,
        [
          ["buyer", "Hi! Can you write 'Happy 21st Bisi' on the bento cake?", 1560],
          ["brand", "Yes of course! Pink or white icing for the letters?", 1500],
          ["buyer", "Pink please. Can it be ready by Friday 4pm?", 1440],
          ["brand", "Done ✓ Place the order by Thursday and add the message in the note.", 1380],
        ],
        { buyer: 1, brand: 0 },
        "p_demo_sweettoothtobi_03",
      ),
    );
  const second = brandById.get("b_demo_secondlap");
  if (second)
    threads.push(
      thread(
        "secondlap",
        preview,
        second,
        [
          ["buyer", "Is the denim jacket still available?", 4400],
          ["brand", "It is! Only one though, it's a one-off.", 4300],
        ],
        { buyer: 0, brand: 0 },
      ),
    );

  /* ------------------------------ Saved places ------------------------------ */

  const moremi = unilag.zones.find((z) => z.name === "Moremi Hall") ?? unilag.zones[0]!;
  const places: SavedPlace[] = [
    {
      id: "pl_demo_1",
      userId: preview.id,
      label: "Hostel",
      campusId: unilag.id,
      zoneId: moremi.id,
      addressLine: "Room B214, Block B",
      isDefault: true,
    },
    {
      id: "pl_demo_2",
      userId: preview.id,
      label: "Department",
      campusId: unilag.id,
      zoneId: unilag.zones[4]?.id ?? moremi.id,
      ...(unilag.pickupPoints[0] ? { pickupPointId: unilag.pickupPoints[0].id } : {}),
      addressLine: "Faculty of Arts, 2nd floor",
      isDefault: false,
    },
  ];

  return {
    users,
    brands,
    products,
    reviews,
    orders,
    promos,
    notifications,
    threads,
    places,
    events,
  };
}
