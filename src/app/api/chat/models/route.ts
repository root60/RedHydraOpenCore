import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

/**
 * Fetch the list of models ACTUALLY available on a user's OpenAI-compatible
 * endpoint (GET /v1/models). This is the honest way to populate a model
 * dropdown — it shows what's running on YOUR machine, not a fake hardcoded
 * list of models that would 404 when selected.
 *
 * Works with: Ollama, LM Studio, llama.cpp server, vLLM, HF TGI, any
 * OpenAI-compatible gateway.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint: string = typeof body?.endpoint === "string" ? body.endpoint.trim().replace(/\/+$/, "") : "";
    const apiKey: string = typeof body?.apiKey === "string" ? body.apiKey : "";

    if (!endpoint) {
      return NextResponse.json({ ok: false, error: "endpoint required" }, { status: 400 });
    }

    const url = endpoint.endsWith("/models")
      ? endpoint
      : endpoint.endsWith("/v1")
      ? `${endpoint}/models`
      : `${endpoint}/v1/models`;

    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const t0 = Date.now();
    const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const elapsed = Date.now() - t0;

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return NextResponse.json({
        ok: false,
        status: res.status,
        elapsed,
        error: errText.slice(0, 200),
      });
    }

    const data = await res.json().catch(() => ({}));
    // OpenAI-compatible /v1/models returns { data: [{ id, ... }, ...] }
    const models: { id: string; owned_by?: string; size?: number }[] = Array.isArray(data?.data)
      ? data.data.map((m: any) => ({ id: m.id ?? m.name ?? "", owned_by: m.owned_by, size: m.size }))
      : Array.isArray(data?.models)
      ? data.models.map((m: any) => ({ id: m.name ?? m.id ?? "", owned_by: m.details?.family, size: m.size }))
      : [];

    return NextResponse.json({
      ok: true,
      elapsed,
      count: models.length,
      models: models.filter((m) => m.id).slice(0, 100), // cap at 100 for sanity
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message?.slice(0, 200) ?? "failed to fetch models",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chat/models",
    purpose: "list models available on a user's OpenAI-compatible endpoint",
    body: "{ endpoint, apiKey? }",
  });
}
