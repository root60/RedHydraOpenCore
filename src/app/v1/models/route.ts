import { GATEWAY_HEADERS, listGatewayModels } from "@/lib/llm-gateway/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: GATEWAY_HEADERS });
}

export async function GET() {
  return Response.json(await listGatewayModels(), { headers: GATEWAY_HEADERS });
}
