import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type ModelResponse = {
  id?: string;
  choices?: Array<{
    message?: { content?: string };
    text?: string;
  }>;
  model?: string;
};

function normalizeChatUrl(endpoint: string) {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
    const apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";
    const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "gpt-3.5-turbo";

    if (!endpoint) {
      return NextResponse.json({ ok: false, error: "endpoint required" }, { status: 400 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const t0 = Date.now();
    const upstream = await fetch(normalizeChatUrl(endpoint), {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: "Reply with one short confirmation that the endpoint works.",
          },
        ],
      }),
    });
    const elapsed = Date.now() - t0;

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      return NextResponse.json({
        ok: false,
        status: upstream.status,
        elapsed,
        error: errText.slice(0, 300),
      });
    }

    const data = (await upstream.json().catch(() => ({}))) as ModelResponse;
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ??
      data?.choices?.[0]?.text?.trim() ??
      "connected";

    return NextResponse.json({
      ok: true,
      elapsed,
      model: data.model ?? model,
      reply: reply.slice(0, 180),
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message?.slice(0, 300) ?? "connection test failed",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chat/connection-test",
    purpose: "test an OpenAI-compatible chat endpoint before saving it",
    body: "{ endpoint, apiKey?, model? }",
  });
}
