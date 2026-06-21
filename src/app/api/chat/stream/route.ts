import { NextRequest } from "next/server";
import { PERSONAS } from "@/lib/opencore";
import { routeChatCompletions } from "@/lib/llm-gateway/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

function normalizeMessages(value: unknown): ChatMessage[] {
  return Array.isArray(value)
    ? value
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof m === "object" &&
            ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
            typeof (m as ChatMessage).content === "string"
        )
        .slice(-12)
    : [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const incoming = normalizeMessages(body?.messages);

    if (incoming.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const personaId: string = typeof body?.persona === "string" ? body.persona : "snarky";
    const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

    return routeChatCompletions({
      model: "uncensored-auto",
      messages: [
        { role: "system", content: persona.systemPrompt },
        ...incoming.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 900,
    });
  } catch (err) {
    console.warn("[/api/chat/stream] gateway stream failed:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "stream failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  return Response.json({
    endpoint: "/api/chat/stream",
    type: "server-sent events (SSE)",
    defaultModel: "uncensored-auto",
  });
}
