import { NextRequest } from "next/server";
import { GATEWAY_HEADERS, routeChatCompletions } from "@/lib/llm-gateway/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: GATEWAY_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return routeChatCompletions(body);
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message ?? "invalid JSON", type: "invalid_request_error" } },
      { status: 400, headers: GATEWAY_HEADERS }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      endpoint: "/v1/chat/completions",
      compatible: "OpenAI chat completions",
      usage: "POST { model: 'auto' | 'groq/llama-3.1-8b-instant' | '<provider>/<model>', messages, stream? }",
    },
    { headers: GATEWAY_HEADERS }
  );
}
