import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type PoolClient } from "pg";
import { ServiceError } from "@/services/errors";

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

/**
 * Neon's links say sslmode=require, which node-postgres already treats as full
 * certificate checking (and warns about). Ask for that explicitly, and keep
 * Neon's channel binding.
 */
function connection(url: string) {
  try {
    const u = new URL(url);
    const binding = u.searchParams.get("channel_binding") === "require";
    if (["require", "prefer", "verify-ca"].includes(u.searchParams.get("sslmode") ?? ""))
      u.searchParams.set("sslmode", "verify-full");
    u.searchParams.delete("channel_binding");
    return { connectionString: u.toString(), ...(binding ? { enableChannelBinding: true } : {}) };
  } catch {
    return { connectionString: url };
  }
}

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
  pool = new Pool({ ...connection(url), max: 5, idleTimeoutMillis: 10_000 });
  // On Vercel, closes idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return pool;
}

/** Arbitrary keys for Postgres advisory locks. */
export const LOCK = { schema: 7_310_001, write: 7_310_002 } as const;

/**
 * Tables, created on first use so a fresh database needs no setup step.
 * - kamplug_docs: every record as JSON, keyed by collection and id. `seq` goes
 *   up on every write (servers fetch only what changed since they last
 *   looked); `ord` keeps the order records were added in; deleted records
 *   stay as tombstones so other servers learn about the delete.
 * - kamplug_meta: small settings (when the sample data was last rebuilt, …).
 * - kamplug_sessions: sign-ins. Only a hash of the cookie's token is stored.
 * - kamplug_media: uploaded photos: who uploaded each, and either its bytes or
 *   its key on Cloudflare R2.
 */
const SCHEMA = `
create sequence if not exists kamplug_seq;
create table if not exists kamplug_docs (
  collection text not null,
  id text not null,
  data jsonb not null,
  seq bigint not null,
  ord bigint not null,
  deleted boolean not null default false,
  primary key (collection, id)
);
create index if not exists kamplug_docs_seq on kamplug_docs (seq);
create table if not exists kamplug_meta (
  key text primary key,
  value jsonb not null
);
create table if not exists kamplug_sessions (
  token_hash text primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists kamplug_sessions_user on kamplug_sessions (user_id);
create table if not exists kamplug_media (
  id text primary key,
  owner_id text not null,
  content_type text not null,
  bytes bytea,
  created_at timestamptz not null default now()
);
-- Photos on Cloudflare R2 keep their key here instead of their bytes.
alter table kamplug_media add column if not exists location text;
alter table kamplug_media alter column bytes drop not null;
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
