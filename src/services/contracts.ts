/**
 * Service interfaces. The UI depends on these, never on an implementation.
 * Each method maps to one endpoint in API_CONTRACT.md.
 */
import type { Kobo } from "@/domain/money";
import type { CheckoutQuote } from "@/domain/checkout";
import type { BuyerDashboard, DayRange, ProductStat, SellerDashboard } from "@/domain/analytics";
import type {
  CheckoutInput,
  CreateBrandInput,
  DeleteAccountInput,
  PlaceInput,
  ProductInput,
  ProfileInput,
  PromoInput,
  ResetInput,
  ReviewInput,
  SignInInput,
  SignUpInput,
  UpdateBrandInput,
} from "./inputs";
import type {
  AppNotification,
  Brand,
  Campus,
  CategoryId,
  ID,
  ImageRef,
  Order,
  OrderStatus,
  Page,
  Product,
  ProductQuery,
  ProductWithBrand,
  Promo,
  RatingBreakdown,
  Review,
  SavedPlace,
  Thread,
  User,
} from "./types";

export interface AuthService {
  /** Current user, or null when signed out. */
  getSession(): Promise<User | null>;
  signUp(input: SignUpInput): Promise<User>;
  signIn(input: SignInInput): Promise<User>;
  signOut(): Promise<void>;
  /** Look around as the sample preview account, no sign-up. Only while features.sampleData is on. */
  startPreview(): Promise<User>;
  /** Emails a reset link. BACKEND-SEAM: needs transactional email (see config/features). */
  requestPasswordReset(input: ResetInput): Promise<{ sent: true }>;
  /** Deletes the account, its shop and listings. Orders stay in the other party's history. */
  deleteAccount(input: DeleteAccountInput): Promise<void>;
  /** Onboarding + profile settings. */
  updateProfile(input: ProfileInput): Promise<User>;
  updateNotificationPrefs(prefs: Partial<User["notificationPrefs"]>): Promise<User>;
}

export type BrandQuery = {
  category?: CategoryId;
  campusId?: ID;
  ids?: ID[];
  featured?: boolean;
  limit?: number;
};

export type SearchResults = {
  products: ProductWithBrand[];
  brands: Brand[];
};

export interface CatalogService {
  listCampuses(): Promise<Campus[]>;
  getProducts(query: ProductQuery): Promise<Page<ProductWithBrand>>;
  getProduct(slug: string): Promise<ProductWithBrand>;
  getRelatedProducts(productId: ID, limit?: number): Promise<ProductWithBrand[]>;
  getBrands(query?: BrandQuery): Promise<Brand[]>;
  getBrand(handle: string): Promise<Brand>;
  getProductReviews(productId: ID): Promise<{ reviews: Review[]; breakdown: RatingBreakdown }>;
  getBrandReviews(brandId: ID): Promise<{ reviews: Review[]; breakdown: RatingBreakdown }>;
  search(q: string, limit?: number): Promise<SearchResults>;
  /** Analytics beacon; fire-and-forget. */
  recordEvent(event: { type: "view" | "add_to_bag"; productId: ID }): Promise<void>;
  /** Price bounds for the explore slider. */
  getPriceRange(): Promise<{ minKobo: Kobo; maxKobo: Kobo }>;
}

export interface SocialService {
  toggleFollow(brandId: ID): Promise<{ following: boolean; followerCount: number }>;
  toggleWishlist(productId: ID): Promise<{ saved: boolean }>;
  getWishlist(): Promise<ProductWithBrand[]>;
  getFollowing(): Promise<Brand[]>;
}

export interface OrderService {
  /** Prices a prospective checkout (subtotals, fees, promo validity) without creating anything. */
  quote(input: CheckoutInput): Promise<CheckoutQuote>;
  /** Creates one order per brand group. */
  createOrders(input: CheckoutInput): Promise<{ checkoutId: ID; orders: Order[] }>;
  listMyOrders(): Promise<Order[]>;
  getOrder(id: ID): Promise<Order>;
  cancelOrder(id: ID): Promise<Order>;
  reviewOrderItem(input: ReviewInput): Promise<Review>;
  myReviews(): Promise<Review[]>;
  /** Spending dashboard for the signed-in buyer. */
  getDashboard(range: DayRange): Promise<BuyerDashboard>;
}

export interface NotificationService {
  list(): Promise<AppNotification[]>;
  markRead(id: ID): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface MessageService {
  listThreads(as: "buyer" | "brand"): Promise<Thread[]>;
  getThread(id: ID, as: "buyer" | "brand"): Promise<Thread>;
  startThread(input: { brandId: ID; productId?: ID }): Promise<Thread>;
  send(input: { threadId: ID; body: string; as: "buyer" | "brand" }): Promise<Thread>;
}

export interface PlacesService {
  list(): Promise<SavedPlace[]>;
  save(input: PlaceInput): Promise<SavedPlace>;
  remove(id: ID): Promise<void>;
}

export type SetupStep = { id: string; label: string; done: boolean; href: string };

export type Customer = {
  userId: ID;
  name: string;
  campusName: string;
  orders: number;
  spentKobo: Kobo;
  lastOrderAt: string;
};

export type Finance = {
  /** Completed (delivered) orders, all time. */
  earnedKobo: Kobo;
  /** Accepted orders still in progress. */
  pendingKobo: Kobo;
  completedOrders: number;
  /** Completed order value by month, oldest first (last 6 months). */
  byMonth: { month: string; amountKobo: Kobo }[];
  payoutAccount: Brand["payoutAccount"];
};

export type ProductAnalytics = {
  stats: ProductStat[];
  /** Product views by hour of day. */
  hourly: number[];
  campuses: { campusId: ID; name: string; orders: number; revenueKobo: Kobo }[];
};

export interface StudioService {
  createBrand(input: CreateBrandInput): Promise<Brand>;
  isHandleAvailable(handle: string): Promise<boolean>;
  getMyBrand(): Promise<Brand | null>;
  updateBrand(input: UpdateBrandInput): Promise<Brand>;
  getSetup(): Promise<SetupStep[]>;
  getDashboard(range: DayRange): Promise<SellerDashboard>;
  getProductAnalytics(range: DayRange): Promise<ProductAnalytics>;

  listProducts(query?: {
    q?: string;
    status?: "published" | "draft" | "all";
    category?: CategoryId;
  }): Promise<Product[]>;
  getProduct(id: ID): Promise<Product>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: ID, input: ProductInput): Promise<Product>;
  setProductsStatus(ids: ID[], status: "published" | "draft"): Promise<void>;
  deleteProducts(ids: ID[]): Promise<void>;

  listOrders(): Promise<Order[]>;
  updateOrderStatus(id: ID, status: OrderStatus): Promise<Order>;

  listCustomers(): Promise<Customer[]>;
  listReviews(): Promise<Review[]>;
  replyToReview(reviewId: ID, body: string): Promise<Review>;

  listPromos(): Promise<Promo[]>;
  createPromo(input: PromoInput): Promise<Promo>;
  updatePromo(id: ID, input: Partial<PromoInput>): Promise<Promo>;
  deletePromo(id: ID): Promise<void>;

  getFinance(): Promise<Finance>;
}

export interface MediaService {
  /** Stores an uploaded image. BACKEND-SEAM: upload to object storage, return a CDN ImageRef. */
  putImage(file: Blob): Promise<{ id: ID; ref: ImageRef }>;
  getImage(id: ID): Promise<Blob | null>;
  deleteImage(id: ID): Promise<void>;
}

export interface RealtimeService {
  /** Notifies when data changed elsewhere (another tab today). BACKEND-SEAM: realtime channel. */
  subscribe(cb: () => void): () => void;
}

export interface Services {
  auth: AuthService;
  catalog: CatalogService;
  social: SocialService;
  orders: OrderService;
  notifications: NotificationService;
  messages: MessageService;
  places: PlacesService;
  studio: StudioService;
  media: MediaService;
  realtime: RealtimeService;
}
