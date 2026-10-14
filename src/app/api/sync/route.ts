import { connection } from "next/server";
import { latestSeq } from "@/server/store";

/** GET /api/sync → { seq }: the newest change, so open tabs know when to refetch. */
export async function GET() {
  await connection();
  try {
    return Response.json({ seq: await latestSeq() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ seq: null }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
