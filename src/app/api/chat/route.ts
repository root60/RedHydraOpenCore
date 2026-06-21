import { NextRequest, NextResponse } from "next/server";
import { PERSONAS } from "@/lib/opencore";
import { routeChatCompletions } from "@/lib/llm-gateway/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const FALLBACK_REPLIES = [
  "the uncensored-auto route is still warming up. try again in a moment, or start a local Ollama/LM Studio model for the fastest zero-key route.",
  "no model returned a usable reply yet. the gateway is alive, but every active route failed this turn.",
];

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
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const personaId: string = typeof body?.persona === "string" ? body.persona : "snarky";
    const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

    const response = await routeChatCompletions({
      model: "uncensored-auto",
      messages: [
        { role: "system", content: persona.systemPrompt },
        ...incoming.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
      temperature: 0.7,
      max_tokens: 900,
    });

    const data = await response.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !reply) {
      throw new Error(data?.error?.message || "empty gateway reply");
    }

    return NextResponse.json({
      reply,
      persona: persona.id,
      personaName: persona.name,
      provider: response.headers.get("x-opencore-provider"),
      model: response.headers.get("x-opencore-model"),
    });
  } catch (err) {
    console.warn("[/api/chat] gateway fallback failed:", err instanceof Error ? err.message : err);
    const reply = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    return NextResponse.json({ reply, degraded: true });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chat",
    defaultModel: "uncensored-auto",
    personas: PERSONAS.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji })),
    usage: "POST { messages: [{role, content}], persona?: 'snarky'|'sage'|'gremlin' }",
  });
}
