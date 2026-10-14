import { clear, createStore, del, get, getMany, set, setMany, type UseStore } from "idb-keyval";
import { features } from "@/config/features";
import { generateSeed, type DbSnapshot } from "./seed";
import { hasSample, refreshSample, SAMPLE_TTL_MS, stripSample } from "./sample-sync";

/**
 * In-memory repositories hydrated from IndexedDB and written through on change.
 * One key per collection keeps writes small; the whole dataset is < 1MB.
 */

export const SCHEMA_VERSION = 2;

export type CollectionName = keyof DbSnapshot;

const COLLECTIONS: CollectionName[] = [
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
const RETIRED = ["col:wallet", "col:payouts", "col:metrics", "meta:photos"];

/** Ordered migrations: key = version being migrated TO. */
const migrations: Record<number, (db: DbSnapshot) => void> = {
  2: purgeSampleData,
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
    const db = await generateSeed();
    if (features.sampleData) refreshSample(db);
    return db;
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
    await syncSample(seed);
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
  await syncSample(db);
  return db;
}

/**
 * SAMPLE DATA: adds it (and rebuilds it every few days so dates stay current),
 * or takes it out once features.sampleData is off.
 */
async function syncSample(db: DbSnapshot) {
  const at = (await get("meta:sampleAt", store())) as number | undefined;
  if (features.sampleData) {
    if (at !== undefined && Date.now() - at < SAMPLE_TTL_MS && hasSample(db)) return;
    refreshSample(db);
    await writeAll(db);
    await set("meta:sampleAt", Date.now(), store());
  } else if (at !== undefined || hasSample(db)) {
    stripSample(db, "remove");
    if (sessionUserId && !db.users.some((u) => u.id === sessionUserId)) {
      sessionUserId = null;
      await del("session", store());
    }
    await writeAll(db);
    await del("meta:sampleAt", store());
  }
}

async function writeAll(db: DbSnapshot) {
  await setMany(
    COLLECTIONS.map((c) => [`col:${c}`, db[c]] as [string, unknown]),
    store(),
  );
}

export async function getDb(): Promise<DbSnapshot> {
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
  await getDb();
  return sessionUserId;
}

export async function setSessionUserId(id: string | null): Promise<void> {
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
