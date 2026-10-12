import { clear, createStore, del, getMany, set, setMany, type UseStore } from "idb-keyval";
import { generateSeed, type DbSnapshot } from "./seed";
import { coverFor, motifCovers, motifPhotos, photosFor } from "./seed/photos";
import { hashString } from "@/lib/random";

/**
 * In-memory repositories hydrated from IndexedDB and written through on change.
 * One key per collection keeps writes small; the whole dataset is < 1MB.
 */

export const SCHEMA_VERSION = 1;

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
  "wallet",
  "places",
  "payouts",
  "metrics",
];

/** Ordered migrations: key = version being migrated TO. */
const migrations: Record<number, (db: DbSnapshot) => void> = {
  // 2: (db) => { for (const p of db.products) p.newField ??= defaultValue },
};

export function migrate(db: DbSnapshot, from: number, to: number = SCHEMA_VERSION): DbSnapshot {
  for (let v = from + 1; v <= to; v++) migrations[v]?.(db);
  return db;
}

/** Changes whenever the photo set changes, so saved demo data picks up new photos. */
const PHOTO_KEY = hashString(JSON.stringify([motifPhotos, motifCovers, 2]));

/** Swaps generated art for real photos where we have them. Leaves uploads and URLs alone. */
export function applyPhotos(db: DbSnapshot) {
  for (const p of db.products) {
    const first = p.images[0];
    if (first?.kind !== "art" || !p.images.every((i) => i.kind === "art")) continue;
    p.images = photosFor(first.motif, p.id, p.images.length, p.category) ?? p.images;
  }
  for (const b of db.brands) {
    if (b.cover.kind === "art") b.cover = coverFor(b.cover.motif) ?? b.cover;
  }
  const firstImage = new Map(db.products.map((p) => [p.id, p.images[0]]));
  for (const o of db.orders) {
    for (const it of o.items) {
      const img = firstImage.get(it.productId);
      if (it.image.kind === "art" && img) it.image = img;
    }
  }
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
    await set("meta:photos", PHOTO_KEY, store());
    sessionUserId = null;
    return seed;
  }
  const values = await getMany(
    COLLECTIONS.map((c) => `col:${c}`),
    store(),
  );
  const db = Object.fromEntries(COLLECTIONS.map((c, i) => [c, values[i] ?? []])) as DbSnapshot;
  if (version < SCHEMA_VERSION) {
    migrate(db, version);
    await writeAll(db);
    await set("meta:version", SCHEMA_VERSION, store());
  }
  const photoKey = (await getMany(["meta:photos"], store()))[0] as number | undefined;
  if (photoKey !== PHOTO_KEY) {
    applyPhotos(db);
    await writeAll(db);
    await set("meta:photos", PHOTO_KEY, store());
  }
  sessionUserId = sid ?? null;
  return db;
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
