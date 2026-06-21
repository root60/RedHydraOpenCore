import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = 2000;
const OPENAI_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
]);

// Simple in-memory cache for repeated TTS requests.
const cache = new Map<string, { buffer: Buffer; contentType: string }>();
const CACHE_CAP = 40;

function cacheKey(text: string, voice: string, speed: number, instructions: string) {
  return `openai|${voice}|${speed}|${instructions}|${text}`;
}

function voiceInstructions(text: string, persona?: string, userInput?: string, provided?: string) {
  if (provided?.trim()) return provided.slice(0, 600);
  const combined = `${userInput || ""}\n${text || ""}`.toLowerCase();
  const mood = /urgent|asap|quick|fast|hurry|now/.test(combined)
    ? "Speak clearly with a focused, brisk pace."
    : /sad|sorry|stress|worried|afraid|confused|help/.test(combined)
      ? "Speak warmly, gently, and reassuringly."
      : /haha|lol|funny|joke|meme|awesome|great/.test(combined)
        ? "Sound upbeat and playful without overacting."
        : "Sound natural, clear, and conversational.";
  const personaLine =
    persona === "sage"
      ? "Use a calm, thoughtful sage tone."
      : persona === "gremlin"
        ? "Use an energetic, mischievous gremlin tone while staying understandable."
        : "Use a witty RedHydra tone with light snark, but keep it helpful.";
  return `${personaLine} ${mood}`;
}

async function openAiTts(input: {
  text: string;
  voice: string;
  speed: number;
  instructions: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENCORE_TTS_MODEL || "gpt-4o-mini-tts",
      voice: input.voice,
      input: input.text,
      instructions: input.instructions,
      speed: input.speed,
      response_format: "mp3",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(detail.slice(0, 300) || "OpenAI voice failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(new Uint8Array(arrayBuffer)), contentType: "audio/mpeg" };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text: string = typeof body?.text === "string" ? body.text.trim() : "";
  const requestedVoice: string = typeof body?.voice === "string" && body.voice ? body.voice : "browser";
  const speed: number =
    typeof body?.speed === "number" && body.speed >= 0.5 && body.speed <= 2.0
      ? body.speed
      : 1.0;
  const userInput = typeof body?.userInput === "string" ? body.userInput : "";
  const persona = typeof body?.persona === "string" ? body.persona : "snarky";
  const instructions = voiceInstructions(text, persona, userInput, typeof body?.instructions === "string" ? body.instructions : "");

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Browser voice is the zero-config default. Return a clean fallback signal instead of
  // throwing server-side TTS errors when no cloud voice key is configured.
  if (requestedVoice === "browser" || !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "server voice not configured", fallback: "browser", provider: "browser" },
      { status: 501 }
    );
  }

  try {
    const clipped = text.slice(0, MAX_LEN);
    const voice = OPENAI_VOICES.has(requestedVoice) ? requestedVoice : "coral";
    const key = cacheKey(clipped, voice, speed, instructions);

    const cached = cache.get(key);
    if (cached) {
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Content-Length": cached.buffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-OpenCore-Voice-Provider": "openai",
          "X-OpenCore-Cache": "HIT",
        },
      });
    }

    const rendered = await openAiTts({ text: clipped, voice, speed, instructions });

    if (cache.size >= CACHE_CAP) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, rendered);

    return new NextResponse(rendered.buffer, {
      status: 200,
      headers: {
        "Content-Type": rendered.contentType,
        "Content-Length": rendered.buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-OpenCore-Voice-Provider": "openai",
        "X-OpenCore-Cache": "MISS",
      },
    });
  } catch (err) {
    console.warn("[/api/voice] server TTS unavailable; browser fallback will be used.", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "server voice failed", fallback: "browser", provider: "browser" },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/voice",
    usage: "POST { text, voice?, speed?, persona?, userInput?, instructions? } -> audio/mp3 when OpenAI is configured, otherwise browser fallback signal",
    providers: {
      browser: { enabled: true, note: "instant zero-config fallback in the chat UI" },
      openai: {
        enabled: Boolean(process.env.OPENAI_API_KEY),
        model: process.env.OPENCORE_TTS_MODEL || "gpt-4o-mini-tts",
        voices: Array.from(OPENAI_VOICES),
      },
    },
    cache: { enabled: true, cap: CACHE_CAP },
  });
}
