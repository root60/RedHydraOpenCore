import { NextRequest } from "next/server";
import { GATEWAY_HEADERS, requireAdmin } from "@/lib/llm-gateway/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: GATEWAY_HEADERS });
  const started = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(new URL("/v1/chat/completions", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: body.model || "uncensored-auto",
        messages: [{ role: "user", content: "Reply with exactly: ok" }],
        stream: false,
        max_tokens: 12,
        temperature: 0,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content || data?.error?.message || "";
    return Response.json(
      {
        ok: res.ok,
        status: res.status,
        elapsed: Date.now() - started,
        provider: res.headers.get("x-opencore-provider"),
        model: res.headers.get("x-opencore-model"),
        reply,
        error: res.ok ? undefined : data?.error,
      },
      { headers: GATEWAY_HEADERS }
    );
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? "gateway test failed", elapsed: Date.now() - started }, { status: 500, headers: GATEWAY_HEADERS });
  }
}
