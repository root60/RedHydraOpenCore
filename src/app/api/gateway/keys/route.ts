import { NextRequest } from "next/server";
import { GATEWAY_HEADERS, requireAdmin } from "@/lib/llm-gateway/router";
import { addProviderKey, listRedactedKeys, removeProviderKey, updateProviderKey } from "@/lib/llm-gateway/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: GATEWAY_HEADERS });
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  return Response.json({ keys: await listRedactedKeys() }, { headers: GATEWAY_HEADERS });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  try {
    const body = await req.json();
    const key = await addProviderKey({
      providerId: body.providerId,
      apiKey: body.apiKey,
      label: body.label,
      baseUrl: body.baseUrl,
      model: body.model,
      enabled: body.enabled,
      dailyRequestCap: Number.isFinite(Number(body.dailyRequestCap)) ? Number(body.dailyRequestCap) : undefined,
      monthlyTokenCap: Number.isFinite(Number(body.monthlyTokenCap)) ? Number(body.monthlyTokenCap) : undefined,
    });
    return Response.json({ key }, { headers: GATEWAY_HEADERS });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "could not save key" }, { status: 400, headers: GATEWAY_HEADERS });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  try {
    const body = await req.json();
    const key = await updateProviderKey(body.id, body);
    return Response.json({ key }, { headers: GATEWAY_HEADERS });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "could not update key" }, { status: 400, headers: GATEWAY_HEADERS });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  try {
    const body = await req.json();
    const removed = await removeProviderKey(body.id);
    return Response.json({ removed }, { headers: GATEWAY_HEADERS });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "could not delete key" }, { status: 400, headers: GATEWAY_HEADERS });
  }
}
