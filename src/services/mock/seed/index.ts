import type {
  AnalyticsEvent,
  AppNotification,
  Brand,
  Campus,
  Order,
  Product,
  Promo,
  Review,
  SavedPlace,
  Thread,
  UserRecord,
} from "@/services/types";
import { seedCampuses } from "./campuses";

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
  places: SavedPlace[];
  events: AnalyticsEvent[];
};

/**
 * A fresh database: the list of campuses we serve (reference data) and
 * nothing else. Every account, shop, product and order is created by people.
 */
export async function generateSeed(): Promise<DbSnapshot> {
  return {
    campuses: seedCampuses(),
    users: [],
    brands: [],
    products: [],
    reviews: [],
    orders: [],
    promos: [],
    notifications: [],
    threads: [],
    places: [],
    events: [],
  };
}
