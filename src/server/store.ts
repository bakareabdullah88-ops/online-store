import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { PoolClient } from "pg";
import { COLLECTIONS, installDriver, type CollectionName } from "@/services/mock/db";
import { hasSample, stripSample } from "@/services/mock/sample-sync";
import { generateSeed, type DbSnapshot } from "@/services/mock/seed";
import { ServiceError } from "@/services/errors";
import { deleteMedia } from "./media-store";
import { db, LOCK, tx } from "./pg";

/**
 * The shared database behind the service code in services/mock.
 *
 * Each server keeps a copy of every record in memory and, at the start of a
 * request, fetches only the records that changed since it last looked (one
 * small query). A request works on its own copy; when it's done, the records
 * it changed are written back in one transaction. If someone else changed
 * one of those records in the meantime, nothing is written and the request
 * runs again on the fresh data.
 */

type Row = { data: unknown; json: string; seq: number; ord: number };
type Table = { rows: Map<string, Row>; list: unknown[] };
type Cache = { maxSeq: number; tables: Record<CollectionName, Table> };

const emptyTable = (): Table => ({ rows: new Map(), list: [] });

let cache: Cache = {
  maxSeq: 0,
  tables: Object.fromEntries(COLLECTIONS.map((c) => [c, emptyTable()])) as Cache["tables"],
};

/** JSON with sorted keys, so the same record always gives the same text. */
export function stableJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v))
    return `[${v.map((x) => (x === undefined ? "null" : stableJson(x))).join(",")}]`;
  const keys = Object.keys(v as object)
    .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

type DocRow = {
  collection: string;
  id: string;
  data: unknown;
  seq: string;
  ord: string;
  deleted: boolean;
};

/** Pulls in whatever changed since this server last looked. */
async function refresh(): Promise<Cache> {
  const pool = await db();
  const since = cache.maxSeq;
  const { rows } = await pool.query<DocRow>(
    "select collection, id, data, seq, ord, deleted from kamplug_docs where seq > $1 order by seq",
    [since],
  );
  if (!rows.length) return cache;
  // Build new tables rather than editing the old ones: requests already
  // running keep reading the version they started with.
  const next: Cache = { maxSeq: cache.maxSeq, tables: { ...cache.tables } };
  const changed = new Map<CollectionName, Map<string, Row>>();
  for (const r of rows) {
    const c = r.collection as CollectionName;
    if (!(c in next.tables)) continue;
    const seq = Number(r.seq);
    let map = changed.get(c);
    if (!map) {
      map = new Map(next.tables[c].rows);
      changed.set(c, map);
    }
    const cur = map.get(r.id);
    if (cur && cur.seq >= seq) continue;
    if (r.deleted) map.delete(r.id);
    else map.set(r.id, { data: r.data, json: stableJson(r.data), seq, ord: Number(r.ord) });
    next.maxSeq = Math.max(next.maxSeq, seq);
  }
  for (const [c, map] of changed) {
    const sorted = new Map([...map].sort((a, b) => a[1].ord - b[1].ord));
    next.tables[c] = { rows: sorted, list: [...sorted.values()].map((r) => r.data) };
  }
  // Another request may have refreshed further while this one waited.
  if (next.maxSeq > cache.maxSeq) cache = next;
  return cache;
}

/** Forget the in-memory copy (tests, or after the database was wiped). */
export function forgetCache() {
  cache = {
    maxSeq: 0,
    tables: Object.fromEntries(COLLECTIONS.map((c) => [c, emptyTable()])) as Cache["tables"],
  };
}

/** A request's own copy. A collection is copied the first time it's read. */
type View = {
  db: DbSnapshot;
  base: Cache["tables"];
  read: Set<CollectionName>;
};

function viewOf(c: Cache): View {
  const own = new Map<CollectionName, unknown[]>();
  const read = new Set<CollectionName>();
  const snapshot = {} as DbSnapshot;
  for (const name of COLLECTIONS) {
    Object.defineProperty(snapshot, name, {
      enumerable: true,
      get() {
        let v = own.get(name);
        if (!v) {
          v = structuredClone(c.tables[name].list);
          own.set(name, v);
          read.add(name);
        }
        return v;
      },
      set(v: unknown[]) {
        own.set(name, v);
        read.add(name);
      },
    });
  }
  return { db: snapshot, base: c.tables, read };
}

type Change = {
  collection: CollectionName;
  id: string;
  data: unknown;
  /** null: a new record. */
  expected: number | null;
  deleted: boolean;
};

function diff(view: View, names: Iterable<CollectionName>): Change[] {
  const out = new Map<string, Change>();
  for (const c of names) {
    if (!view.read.has(c)) continue;
    const base = view.base[c].rows;
    const seen = new Set<string>();
    for (const item of view.db[c] as { id: string }[]) {
      if (typeof item?.id !== "string") throw new Error(`A ${c} record has no id`);
      seen.add(item.id);
      const b = base.get(item.id);
      const json = stableJson(item);
      if (b && b.json === json) continue;
      out.set(`${c}/${item.id}`, {
        collection: c,
        id: item.id,
        data: JSON.parse(json),
        expected: b ? b.seq : null,
        deleted: false,
      });
    }
    for (const [id, b] of base) {
      if (!seen.has(id))
        out.set(`${c}/${id}`, { collection: c, id, data: null, expected: b.seq, deleted: true });
    }
  }
  return [...out.values()];
}

/** Thrown when another request changed the same records first. The call runs again. */
class Conflict extends Error {}

type Meta = Record<string, unknown>;

/** Writes the changes in one transaction. Returns the newest seq written, or null for none. */
async function write(changes: Change[], meta?: Meta): Promise<number | null> {
  if (!changes.length && !meta) return null;
  const pool = await db();
  return tx(pool, async (c) => {
    // One writer at a time, so seq numbers become visible in order and a
    // server that has seen seq N has seen everything up to N.
    await c.query("select pg_advisory_xact_lock($1)", [LOCK.write]);
    let top: number | null = null;
    if (changes.length) {
      await check(c, changes);
      const { rows } = await c.query<{ seq: string }>(
        `insert into kamplug_docs (collection, id, data, seq, ord, deleted)
         select t.collection, t.id, coalesce(t.data, '{}'::jsonb), t.n, t.n, t.deleted
         from (
           select u.*, nextval('kamplug_seq') as n
           from unnest($1::text[], $2::text[], $3::jsonb[], $4::boolean[])
             with ordinality as u(collection, id, data, deleted, i)
           order by u.i
         ) t
         on conflict (collection, id) do update set
           data = case when excluded.deleted then kamplug_docs.data else excluded.data end,
           seq = excluded.seq,
           deleted = excluded.deleted
         returning seq`,
        [
          changes.map((x) => x.collection),
          changes.map((x) => x.id),
          changes.map((x) => (x.deleted ? null : JSON.stringify(x.data))),
          changes.map((x) => x.deleted),
        ],
      );
      top = Math.max(...rows.map((r) => Number(r.seq)));
    }
    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        await c.query(
          `insert into kamplug_meta (key, value) values ($1, $2)
           on conflict (key) do update set value = excluded.value`,
          [key, JSON.stringify(value)],
        );
      }
    }
    return top;
  });
}

async function check(c: PoolClient, changes: Change[]) {
  const { rows } = await c.query<{ collection: string; id: string; seq: string; deleted: boolean }>(
    `select d.collection, d.id, d.seq, d.deleted from kamplug_docs d
     join unnest($1::text[], $2::text[]) as t(collection, id)
       on d.collection = t.collection and d.id = t.id`,
    [changes.map((x) => x.collection), changes.map((x) => x.id)],
  );
  const now = new Map(rows.map((r) => [`${r.collection}/${r.id}`, r]));
  for (const x of changes) {
    const cur = now.get(`${x.collection}/${x.id}`);
    const ok =
      x.expected === null
        ? !cur || cur.deleted
        : !!cur && !cur.deleted && Number(cur.seq) === x.expected;
    if (!ok) throw new Conflict(`${x.collection}/${x.id} changed`);
  }
}

/* ---------------------------------------------------------------- setup */

async function readMeta(keys: string[]): Promise<Meta> {
  const pool = await db();
  const { rows } = await pool.query<{ key: string; value: unknown }>(
    "select key, value from kamplug_meta where key = any($1)",
    [keys],
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Runs a change against the whole database outside any request, retrying on conflicts. */
async function maintain(fn: (db: DbSnapshot) => Meta | void): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const view = viewOf(await refresh());
    const meta = fn(view.db) ?? undefined;
    try {
      await write(diff(view, COLLECTIONS), meta);
      return;
    } catch (e) {
      if (!(e instanceof Conflict)) throw e;
    }
  }
  throw new ServiceError("UNAVAILABLE", "The database is busy. Please try again.");
}

let seeded: Promise<void> | null = null;
let sampleChecked = false;

/** First run: the campus list. */
async function prepare() {
  seeded ??= (async () => {
    const { seeded: done } = await readMeta(["seeded"]);
    if (done) return;
    const seed = await generateSeed();
    await maintain((d) => {
      if (d.campuses.length) return { seeded: true };
      d.campuses = seed.campuses;
      return { seeded: true };
    });
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  await seeded;

  // Once per server: take out sample data an earlier version may have added.
  if (sampleChecked) return;
  if (hasSample(viewOf(await refresh()).db)) {
    await maintain((d) => stripSample(d));
    const pool = await db();
    await pool.query("delete from kamplug_sessions where user_id like '%\\_demo\\_%'");
  }
  sampleChecked = true;
}

/** Test helper: run the first-time setup again. */
export function forgetSetup() {
  seeded = null;
  sampleChecked = false;
}

/* ------------------------------------------------------------- requests */

type Ctx = {
  view: View;
  committed: Set<CollectionName>;
  userId: string | null;
  /** Set when the call signed someone in or out. */
  signedIn?: { userId: string | null };
  removeMedia: string[];
};

const als = new AsyncLocalStorage<Ctx>();

function ctx(): Ctx {
  const c = als.getStore();
  if (!c) throw new Error("Service code ran outside a server request");
  return c;
}

installDriver({
  getDb: async () => ctx().view.db,
  commit: async (names) => {
    const c = ctx();
    for (const n of names) c.committed.add(n);
  },
  getSessionUserId: async () => ctx().userId,
  setSessionUserId: async (id) => {
    const c = ctx();
    c.userId = id;
    c.signedIn = { userId: id };
  },
  removeMedia: async (ids) => {
    ctx().removeMedia.push(...ids);
  },
});

export type CallResult<T> = {
  value: T;
  /** The newest change this server knows about, for the client's change feed. */
  seq: number;
  signedIn?: { userId: string | null };
};

/**
 * Runs one service call for the person signed in as `userId`, and saves what
 * it changed. Runs again (up to a few times) if it lost a race.
 */
export async function runCall<T>(
  userId: string | null,
  fn: () => Promise<T>,
): Promise<CallResult<T>> {
  await prepare();
  for (let attempt = 0; ; attempt++) {
    const c = await refresh();
    const context: Ctx = { view: viewOf(c), committed: new Set(), userId, removeMedia: [] };
    const value = await als.run(context, fn);
    const changes = diff(context.view, context.committed);
    try {
      const top = await write(changes);
      // Only photos this person uploaded, whatever ids their records pointed at.
      if (context.removeMedia.length && userId) await deleteMedia(context.removeMedia, userId);
      return {
        value,
        seq: Math.max(top ?? 0, c.maxSeq),
        ...(context.signedIn ? { signedIn: context.signedIn } : {}),
      };
    } catch (e) {
      if (!(e instanceof Conflict) || attempt >= 4) {
        if (e instanceof Conflict)
          throw new ServiceError(
            "CONFLICT",
            "Someone changed this at the same time. Please try again.",
          );
        throw e;
      }
    }
  }
}

/** The newest change in the database, for clients checking whether to refetch. */
export async function latestSeq(): Promise<number> {
  return (await refresh()).maxSeq;
}
