import { NextRequest, NextResponse } from "next/server";
import { PERSONAS } from "@/lib/opencore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

/**
 * Custom-endpoint chat — proxies to ANY OpenAI-compatible API the user configures.
 *
 * Supported providers (anything that speaks the OpenAI /v1/chat/completions schema):
 *   - Ollama (local, e.g. http://localhost:11434/v1) — run any model, incl. uncensored ones you chose
 *   - LM Studio (local OpenAI-compatible server)
 *   - llama.cpp server / llama-server
 *   - vLLM, text-generation-inference (HF TGI)
 *   - HuggingFace Inference Endpoints (OpenAI-compatible mode)
 *   - Any OpenAI-compatible gateway
 *
 * The user supplies: endpoint URL, optional API key, model name.
 * We forward the persona system prompt + messages and stream the response back as SSE.
 *
 * Privacy: the endpoint URL + key are sent from the browser to this route, which
 * proxies to the user's endpoint server-side. Nothing is logged or stored.
 */

function buildOpenAIMessages(personaId: string, incoming: ChatMessage[]) {
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  // OpenAI schema uses "system" role for the system prompt
  return [
    { role: "system" as const, content: persona.systemPrompt },
    ...incoming.map((m) => ({ role: m.role, content: m.content })),
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const incoming: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
          .filter(
            (m: unknown): m is ChatMessage =>
              !!m && typeof m === "object" && (m as ChatMessage).role && typeof (m as ChatMessage).content === "string"
          )
          .slice(-12)
      : [];

    if (incoming.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const endpoint: string = typeof body?.endpoint === "string" ? body.endpoint.trim().replace(/\/+$/, "") : "";
    const apiKey: string = typeof body?.apiKey === "string" ? body.apiKey : "";
    const model: string = typeof body?.model === "string" && body.model ? body.model : "gpt-3.5-turbo";
    const personaId: string = typeof body?.persona === "string" ? body.persona : "snarky";
    const stream: boolean = body?.stream !== false; // default stream

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint URL required (e.g. http://localhost:11434/v1)" },
        { status: 400 }
      );
    }

    // Normalize: accept either the base (/v1) or the full path
    const url = endpoint.endsWith("/chat/completions")
      ? endpoint
      : `${endpoint}/chat/completions`;

    const messages = buildOpenAIMessages(personaId, incoming);

    const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) fetchHeaders["Authorization"] = `Bearer ${apiKey}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({ model, messages, stream, temperature: 0.7 }),
      // Don't let Next.js cache this
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      return NextResponse.json(
        { error: `upstream ${upstream.status}: ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

    // Non-streaming: parse JSON and re-emit as a single delta
    if (!stream) {
      const data = await upstream.json();
      const reply: string = data?.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ reply, persona: persona.id, model, source: "custom" });
    }

    // Streaming: pipe upstream SSE → our SSE (normalized to {delta} events)
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          } catch {
            /* closed */
          }
        };
        const keepalive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keepalive\n\n`));
          } catch {
            /* closed */
          }
        }, 15000);

        try {
          send({ persona: persona.id, personaName: persona.name, model, source: "custom" });
          const reader = upstream.body?.getReader();
          if (!reader) throw new Error("no upstream body");
          const decoder = new TextDecoder();
          let buffer = "";
          let acc = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const delta: string =
                  parsed?.choices?.[0]?.delta?.content ??
                  parsed?.choices?.[0]?.text ??
                  "";
                if (delta) {
                  acc += delta;
                  send({ delta });
                }
              } catch {
                /* partial */
              }
            }
          }
          send({ done: true, length: acc.length });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("[/api/chat/custom] stream error:", err);
          send({ error: "custom stream interrupted", degraded: true });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          clearInterval(keepalive);
          try {
            controller.close();
          } catch {
            /* closed */
          }
        }
      },
      cancel() {
        console.log("[/api/chat/custom] client disconnected");
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-OpenCore-Source": "custom",
      },
    });
  } catch (err) {
    console.error("[/api/chat/custom] fatal:", err);
    return NextResponse.json({ error: "custom endpoint failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chat/custom",
    purpose: "proxy to any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, HF TGI, etc.)",
    body: "{ messages, endpoint, apiKey?, model, persona?, stream? }",
    note: "bring your own model — local or remote. what you run is your call.",
  });
}
