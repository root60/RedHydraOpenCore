import { NextRequest } from "next/server";
import { PROVIDERS } from "@/lib/llm-gateway/providers";
import { GATEWAY_HEADERS, requireAdmin } from "@/lib/llm-gateway/router";
import { listRedactedKeys } from "@/lib/llm-gateway/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: GATEWAY_HEADERS });
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  }
  const keys = await listRedactedKeys();
  const configured = new Set(keys.map((key) => key.providerId));
  return Response.json(
    {
      providers: PROVIDERS.map((provider) => ({
        ...provider,
        configured: configured.has(provider.id),
        keyCount: keys.filter((key) => key.providerId === provider.id && !key.id.startsWith("virtual:")).length,
      })),
      keys,
    },
    { headers: GATEWAY_HEADERS }
  );
}
