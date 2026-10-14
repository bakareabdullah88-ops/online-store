import { clear, createStore, del, getMany, set, setMany, type UseStore } from "idb-keyval";
import { generateSeed, type DbSnapshot } from "./seed";
import { stripSample } from "./sample-sync";

/**
 * In-memory repositories hydrated from IndexedDB and written through on change.
 * One key per collection keeps writes small; the whole dataset is < 1MB.
 */

export const SCHEMA_VERSION = 3;

/**
 * Where the data lives. By default the browser's IndexedDB (one person's
 * device). The server installs a driver backed by Postgres so the same
 * service code serves every member from one shared database.
 */
export type Driver = {
  getDb(): Promise<DbSnapshot>;
  commit(names: CollectionName[]): Promise<void>;
  getSessionUserId(): Promise<string | null>;
  setSessionUserId(id: string | null): Promise<void>;
  removeMedia(ids: string[]): Promise<void>;
};

let driver: Driver | null = null;

export function installDriver(d: Driver) {
  driver = d;
}

/** True when the service code runs on the server against the shared database. */
export const hasDriver = () => driver !== null;

export function removeMediaViaDriver(ids: string[]) {
  return driver ? driver.removeMedia(ids) : Promise.resolve();
}

export type CollectionName = keyof DbSnapshot;

export const COLLECTIONS: CollectionName[] = [
  "campuses",
  "users",
  "brands",
  "products",
  "reviews",
  "orders",
  "promos",
  "notifications",
  "threads",
  "places",
  "events",
];

/** Collections from v1 that no longer exist. */
const RETIRED = [
  "col:wallet",
  "col:payouts",
  "col:metrics",
  "meta:photos",
  "meta:sampleAt",
  "meta:sampleVersion",
];

/** Ordered migrations: key = version being migrated TO. */
const migrations: Record<number, (db: DbSnapshot) => void> = {
  2: purgeSampleData,
  // The sample shops and preview account are gone for good.
  3: stripSample,
};

const isSampleUser = (id: string) =>
  id.startsWith("u_demo_") || id.startsWith("u_owner_") || /^u_c\d+$/.test(id);

/**
 * v1 shipped with sample shops, products and accounts. v2 keeps only what
 * people created themselves: their accounts, shops, products and the orders,
 * messages and reviews between real accounts.
 */
export function purgeSampleData(db: DbSnapshot) {
  const users = db.users.filter((u) => !isSampleUser(u.id));
  const userIds = new Set(users.map((u) => u.id));
  const brands = db.brands.filter((b) => userIds.has(b.ownerId));
  const brandIds = new Set(brands.map((b) => b.id));
  const products = db.products.filter((p) => brandIds.has(p.brandId));
  const productIds = new Set(products.map((p) => p.id));
  const realOrder = (o: { buyerId: string; brandId: string }) =>
    userIds.has(o.buyerId) && brandIds.has(o.brandId);
  for (const u of users) {
    u.followingBrandIds = u.followingBrandIds.filter((id) => brandIds.has(id));
    u.wishlistProductIds = u.wishlistProductIds.filter((id) => productIds.has(id));
    delete (u as { isDemo?: boolean }).isDemo;
  }
  db.users = users;
  db.brands = brands;
  db.products = products;
  db.orders = db.orders.filter(realOrder);
  db.reviews = db.reviews.filter((r) => userIds.has(r.userId) && brandIds.has(r.brandId));
  db.promos = db.promos.filter((p) => p.brandId !== null && brandIds.has(p.brandId));
  db.threads = db.threads.filter((t) => userIds.has(t.buyerId) && brandIds.has(t.brandId));
  db.notifications = db.notifications.filter((n) => userIds.has(n.userId));
  db.places = db.places.filter((p) => userIds.has(p.userId));
  db.events = [];
}

export function migrate(db: DbSnapshot, from: number, to: number = SCHEMA_VERSION): DbSnapshot {
  for (let v = from + 1; v <= to; v++) migrations[v]?.(db);
  return db;
}

const hasIdb = () => typeof indexedDB !== "undefined";

let kv: UseStore | null = null;
function store() {
  kv ??= createStore("kiosk-db", "kv");
  return kv;
}

let snapshot: DbSnapshot | null = null;
let loading: Promise<DbSnapshot> | null = null;
let sessionUserId: string | null = null;

async function loadFromIdb(): Promise<DbSnapshot> {
  if (!hasIdb()) {
    // Server render or non-browser: read-only seed in memory.
    return generateSeed();
  }
  const [version, sid] = (await getMany(["meta:version", "session"], store())) as [
    number | undefined,
    string | undefined,
  ];
  if (version === undefined) {
    const seed = await generateSeed();
    await writeAll(seed);
    await set("meta:version", SCHEMA_VERSION, store());
    sessionUserId = null;
    return seed;
  }
  const values = await getMany(
    COLLECTIONS.map((c) => `col:${c}`),
    store(),
  );
  const db = Object.fromEntries(COLLECTIONS.map((c, i) => [c, values[i] ?? []])) as DbSnapshot;
  let session = sid ?? null;
  if (version < SCHEMA_VERSION) {
    migrate(db, version);
    if (session && !db.users.some((u) => u.id === session)) {
      session = null;
      await del("session", store());
    }
    await writeAll(db);
    await Promise.all(RETIRED.map((k) => del(k, store())));
    await set("meta:version", SCHEMA_VERSION, store());
  }
  sessionUserId = session;
  return db;
}

async function writeAll(db: DbSnapshot) {
  await setMany(
    COLLECTIONS.map((c) => [`col:${c}`, db[c]] as [string, unknown]),
    store(),
  );
}

export async function getDb(): Promise<DbSnapshot> {
  if (driver) return driver.getDb();
  if (snapshot) return snapshot;
  loading ??= loadFromIdb().then((db) => {
    snapshot = db;
    return db;
  });
  return loading;
}

const pending = new Set<CollectionName>();
let flushScheduled: Promise<void> | null = null;

/** Persist changed collections (batched per tick). */
export function commit(...names: CollectionName[]): Promise<void> {
  if (driver) return driver.commit(names);
  if (!hasIdb() || !snapshot) return Promise.resolve();
  for (const n of names) pending.add(n);
  flushScheduled ??= Promise.resolve().then(async () => {
    const db = snapshot;
    const batch = [...pending];
    pending.clear();
    flushScheduled = null;
    if (!db) return;
    await setMany(
      batch.map((n) => [`col:${n}`, db[n]] as [string, unknown]),
      store(),
    );
    broadcast();
  });
  return flushScheduled;
}

export async function getSessionUserId(): Promise<string | null> {
  if (driver) return driver.getSessionUserId();
  await getDb();
  return sessionUserId;
}

export async function setSessionUserId(id: string | null): Promise<void> {
  if (driver) return driver.setSessionUserId(id);
  await getDb();
  sessionUserId = id;
  if (!hasIdb()) return;
  if (id) await set("session", id, store());
  else await del("session", store());
  broadcast();
}

/** Wipes the database (and uploaded media) and reseeds. */
export async function resetDb(): Promise<void> {
  snapshot = null;
  loading = null;
  sessionUserId = null;
  if (hasIdb()) await clear(store());
  await getDb();
  broadcast();
}

/* Cross-tab awareness: other tabs drop their cache when data changes. */
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function ensureChannel() {
  if (channel || typeof BroadcastChannel === "undefined") return;
  channel = new BroadcastChannel("kiosk-db");
  channel.onmessage = async () => {
    snapshot = null;
    loading = null;
    await getDb();
    for (const l of listeners) l();
  };
}

function broadcast() {
  ensureChannel();
  channel?.postMessage("changed");
}

/** Subscribe to changes made in other tabs. */
export function onExternalChange(cb: () => void) {
  ensureChannel();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Test helper: forget the in-memory snapshot. */
export function __resetMemory() {
  snapshot = null;
  loading = null;
  sessionUserId = null;
}
