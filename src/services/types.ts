/**
 * Entity and DTO types shared by every service implementation.
 * This file IS the API contract in code. See API_CONTRACT.md for the REST mapping.
 */
import type { Kobo } from "@/domain/money";
import type { ArtPalette } from "@/design/tokens";

export type ID = string;
export type ISODate = string;

/* --------------------------------- Media ---------------------------------- */

export type ArtMotif =
  | "tee"
  | "dress"
  | "cap"
  | "jacket"
  | "sneaker"
  | "tote"
  | "bowl"
  | "jar"
  | "cookie"
  | "drink"
  | "bottle"
  | "dropper"
  | "tube"
  | "bracelet"
  | "earring"
  | "poster"
  | "sticker"
  | "card"
  | "earbuds"
  | "case"
  | "cable"
  | "book"
  | "candle"
  | "monogram";

/** How an image is sourced. UI renders every kind through <AppImage>. */
export type ImageRef =
  /** Generated SVG art (seed data). Deterministic from `seed`. */
  | { kind: "art"; motif: ArtMotif; palette: ArtPalette; seed: number; label?: string }
  /** User upload stored as a Blob in IndexedDB. BACKEND-SEAM: becomes a CDN URL. */
  | { kind: "blob"; id: ID; width?: number; height?: number }
  /** Static file in /public/seed or a remote CDN URL. */
  | { kind: "url"; src: string; width?: number; height?: number; blurDataURL?: string };

/* -------------------------------- Campus ---------------------------------- */

export type ZoneKind = "hostel" | "faculty" | "gate" | "market" | "offcampus";

export type CampusZone = { id: ID; name: string; kind: ZoneKind };

export type PickupPoint = { id: ID; zoneId: ID; name: string; hint: string };

export type Campus = {
  id: ID;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  zones: CampusZone[];
  pickupPoints: PickupPoint[];
};

/* --------------------------------- Users ---------------------------------- */

export type NotificationPrefs = {
  orderUpdates: boolean;
  messages: boolean;
  promotions: boolean;
  newFromFollowed: boolean;
};

export type User = {
  id: ID;
  email: string;
  name: string;
  phone: string;
  campusId: ID | null;
  avatar: ImageRef | null;
  brandIds: ID[];
  followingBrandIds: ID[];
  wishlistProductIds: ID[];
  onboarded: boolean;
  notificationPrefs: NotificationPrefs;
  createdAt: ISODate;
  /** Admins can create logins for other people (invite-only mode). */
  role?: "admin" | "member";
};

/** Never leaves the service layer. */
export type UserRecord = User & { passwordHash: string; passwordSalt: string };

export type Session = { id: ID; userId: ID; createdAt: ISODate };

/* --------------------------------- Brands --------------------------------- */

export type CategoryId =
  "fashion" | "thrift" | "food" | "beauty" | "accessories" | "print" | "tech" | "books";

export type OpenHours = {
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  /** "08:00" 24h local time */
  opens: string;
  closes: string;
};

export type Fulfilment = {
  pickup: boolean;
  delivery: boolean;
  deliveryFeeKobo: Kobo;
  /** Typical minutes from confirmation to ready/out for delivery */
  prepMinutes: number;
  pickupPointIds: ID[];
  /** Campus zones the brand delivers to */
  zoneIds: ID[];
};

export type Brand = {
  id: ID;
  ownerId: ID;
  handle: string;
  name: string;
  category: CategoryId;
  tagline: string;
  bio: string;
  logo: ImageRef;
  cover: ImageRef;
  campusId: ID;
  fulfilment: Fulfilment;
  openHours: OpenHours;
  vacation: boolean;
  rating: number;
  ratingCount: number;
  followerCount: number;
  productCount: number;
  createdAt: ISODate;
  payoutAccount: { bankName: string; accountLast4: string; accountName: string } | null;
  verified: boolean;
};

/* -------------------------------- Products -------------------------------- */

export type OptionValue = { id: ID; label: string; swatch?: string };
export type ProductOption = { id: ID; name: string; values: OptionValue[] };

/** A purchasable combination of option values. `key` = value ids joined by "|". */
export type Variant = { key: string; stock: number; priceDeltaKobo: Kobo };

export type ProductStatus = "published" | "draft";

export type Product = {
  id: ID;
  brandId: ID;
  slug: string;
  name: string;
  description: string;
  details: string[];
  category: CategoryId;
  tags: string[];
  priceKobo: Kobo;
  compareAtKobo?: Kobo;
  images: ImageRef[];
  options: ProductOption[];
  variants: Variant[];
  status: ProductStatus;
  rating: number;
  ratingCount: number;
  salesCount: number;
  viewCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type ProductWithBrand = Product & {
  brand: Pick<
    Brand,
    "id" | "handle" | "name" | "logo" | "campusId" | "vacation" | "rating" | "verified"
  >;
};

/* -------------------------------- Reviews --------------------------------- */

export type Review = {
  id: ID;
  productId: ID;
  brandId: ID;
  userId: ID;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  variantLabel?: string;
  createdAt: ISODate;
  orderId?: ID;
  reply?: { body: string; createdAt: ISODate };
};

export type RatingBreakdown = {
  average: number;
  count: number;
  histogram: [number, number, number, number, number];
};

/* --------------------------------- Orders --------------------------------- */

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "declined";

export type FulfilmentMethod = "pickup" | "delivery";
/**
 * Offline methods work today. "card" and "transfer" are online payments and
 * need the payments backend (BACKEND-SEAM: Paystack); see config/features.ts.
 */
export type PaymentMethod = "pay_on_delivery" | "pay_on_pickup" | "card" | "transfer";

export type OrderItem = {
  productId: ID;
  name: string;
  variantKey: string;
  variantLabel: string;
  unitPriceKobo: Kobo;
  quantity: number;
  image: ImageRef | null;
};

export type OrderFulfilment = {
  method: FulfilmentMethod;
  campusId: ID;
  zoneId: ID;
  pickupPointId?: ID;
  /** Room / landmark for delivery */
  addressLine?: string;
  note?: string;
};

export type TimelineEntry = { status: OrderStatus; at: ISODate; note?: string };

export type Order = {
  id: ID;
  code: string;
  checkoutId: ID;
  buyerId: ID;
  buyerName: string;
  buyerPhone: string;
  brandId: ID;
  brandName: string;
  brandHandle: string;
  brandLogo: ImageRef;
  items: OrderItem[];
  fulfilment: OrderFulfilment;
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo;
  discountKobo: Kobo;
  totalKobo: Kobo;
  promoCode?: string;
  payment: { method: PaymentMethod; status: "paid" | "pending" | "refunded" };
  status: OrderStatus;
  timeline: TimelineEntry[];
  /** Sellers move orders along by hand. Kept for a future courier integration. */
  autoProgress: boolean;
  placedAt: ISODate;
  reviewed: boolean;
};

/* --------------------------------- Promos --------------------------------- */

export type PromoKind = "percent" | "fixed" | "free_delivery";

export type Promo = {
  id: ID;
  code: string;
  /** null = platform-wide promo */
  brandId: ID | null;
  kind: PromoKind;
  /** percent: 1–90; fixed: kobo; free_delivery: 0 */
  value: number;
  maxDiscountKobo?: Kobo;
  minSubtotalKobo: Kobo;
  active: boolean;
  usageCount: number;
  usageLimit?: number;
  expiresAt?: ISODate;
  description: string;
  createdAt: ISODate;
};

/* ------------------------------ Notifications ----------------------------- */

export type NotificationKind = "order" | "message" | "promo" | "review" | "follow" | "system";

export type AppNotification = {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODate;
};

/* -------------------------------- Messages -------------------------------- */

export type Message = { id: ID; from: "buyer" | "brand"; body: string; at: ISODate };

export type Thread = {
  id: ID;
  buyerId: ID;
  buyerName: string;
  brandId: ID;
  brandName: string;
  brandHandle: string;
  brandLogo: ImageRef;
  productId?: ID;
  messages: Message[];
  updatedAt: ISODate;
  unreadForBuyer: number;
  unreadForBrand: number;
};

/* -------------------------------- Analytics ------------------------------- */

/** One shopper action. Shop owners' own views are not recorded. */
export type AnalyticsEvent = {
  id: ID;
  type: "view" | "add_to_bag";
  productId: ID;
  brandId: ID;
  userId: ID | null;
  at: ISODate;
};

/* ------------------------------ Saved places ------------------------------ */

export type SavedPlace = {
  id: ID;
  userId: ID;
  label: string;
  campusId: ID;
  zoneId: ID;
  pickupPointId?: ID;
  addressLine: string;
  isDefault: boolean;
};

/* ---------------------------------- Lists --------------------------------- */

export type SortKey = "relevance" | "popular" | "newest" | "price_asc" | "price_desc" | "rating";

export type ProductQuery = {
  q?: string;
  category?: CategoryId;
  brandId?: ID;
  campusId?: ID;
  zoneId?: ID;
  minPriceKobo?: Kobo;
  maxPriceKobo?: Kobo;
  minRating?: number;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  /** Include drafts (seller views only) */
  includeDrafts?: boolean;
  ids?: ID[];
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
