import { NextRequest } from "next/server";
import { GATEWAY_HEADERS, requireAdmin } from "@/lib/llm-gateway/router";
import { listRedactedKeys, readStore } from "@/lib/llm-gateway/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  const store = await readStore();
  const keys = await listRedactedKeys();
  return Response.json({ usage: store.usage, cooldowns: store.cooldowns, keys }, { headers: GATEWAY_HEADERS });
}
