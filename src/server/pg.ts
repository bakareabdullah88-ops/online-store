import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type PoolClient } from "pg";
import { ServiceError } from "@/services/errors";

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

/** Neon (through the Vercel Marketplace) sets DATABASE_URL; POSTGRES_URL is the older name. */
export function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function getPool(): Pool {
  if (pool) return pool;
  const url = databaseUrl();
  if (!url) {
    throw new ServiceError(
      "UNAVAILABLE",
      "The database isn't connected yet. Connect Neon to this project (DATABASE_URL).",
    );
  }
  pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
  // On Vercel, closes idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return pool;
}

/** Arbitrary keys for Postgres advisory locks. */
export const LOCK = { schema: 7_310_001, write: 7_310_002 } as const;

/**
 * Tables, created on first use so a fresh database needs no setup step.
 * - kiosk_docs: every record as JSON, keyed by collection and id. `seq` goes
 *   up on every write (servers fetch only what changed since they last
 *   looked); `ord` keeps the order records were added in; deleted records
 *   stay as tombstones so other servers learn about the delete.
 * - kiosk_meta: small settings (when the sample data was last rebuilt, …).
 * - kiosk_sessions: sign-ins. Only a hash of the cookie's token is stored.
 * - kiosk_media: uploaded photos.
 */
const SCHEMA = `
create sequence if not exists kiosk_seq;
create table if not exists kiosk_docs (
  collection text not null,
  id text not null,
  data jsonb not null,
  seq bigint not null,
  ord bigint not null,
  deleted boolean not null default false,
  primary key (collection, id)
);
create index if not exists kiosk_docs_seq on kiosk_docs (seq);
create table if not exists kiosk_meta (
  key text primary key,
  value jsonb not null
);
create table if not exists kiosk_sessions (
  token_hash text primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists kiosk_sessions_user on kiosk_sessions (user_id);
create table if not exists kiosk_media (
  id text primary key,
  owner_id text not null,
  content_type text not null,
  bytes bytea not null,
  created_at timestamptz not null default now()
);
`;

/** The pool, with the tables in place. */
export async function db(): Promise<Pool> {
  const p = getPool();
  ready ??= tx(p, async (c) => {
    await c.query("select pg_advisory_xact_lock($1)", [LOCK.schema]);
    await c.query(SCHEMA);
  }).catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return p;
}

export async function tx<T>(p: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await p.connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

/** Test helper: close the pool so the process can exit. */
export async function closePool() {
  const p = pool;
  pool = null;
  ready = null;
  await p?.end();
}
