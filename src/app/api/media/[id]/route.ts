import type { NextRequest } from "next/server";
import { handleDelete, handleGet } from "@/server/media";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/media/[id]">) {
  return handleGet((await ctx.params).id);
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/media/[id]">) {
  return handleDelete(req, (await ctx.params).id);
}
