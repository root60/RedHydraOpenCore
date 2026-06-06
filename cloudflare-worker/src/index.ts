/**
 * RedHydra OpenCore EXL2 Cloud Proxy
 *
 * Default base model:
 * dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw
 *
 * This Worker does NOT run the model.
 * It forwards chat requests to your GPU backend running an OpenAI-compatible API.
 *
 * Good backend choices:
 * - TabbyAPI
 * - ExLlamaV2 OpenAI server
 *
 * Worker secrets:
 * wrangler secret put UPSTREAM_BASE_URL
 * wrangler secret put UPSTREAM_API_KEY
 *
 * Optional:
 * wrangler secret put DEFAULT_MODEL
 */

export interface Env {
  UPSTREAM_BASE_URL: string;
  UPSTREAM_API_KEY?: string;
  DEFAULT_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

const DEFAULT_MODEL = "dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw";

function corsHeaders(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data: unknown, status = 200, env?: Env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(env ? corsHeaders(env) : {}),
    },
  });
}

function normalizeBaseUrl(url: string) {
  return String(url || "").replace(/\/$/, "");
}

function cleanMessages(messages: any[]) {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system"))
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, 24000),
    }))
    .slice(-20);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return json(
        {
          ok: true,
          name: "RedHydra OpenCore EXL2 Proxy",
          defaultModel: env.DEFAULT_MODEL || DEFAULT_MODEL,
        },
        200,
        env
      );
    }

    if (url.pathname !== "/chat" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, env);
    }

    if (!env.UPSTREAM_BASE_URL) {
      return json({ error: "UPSTREAM_BASE_URL is not configured." }, 500, env);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400, env);
    }

    const messages = cleanMessages(body.messages || []);
    const system = String(
      body.system ||
        "You are RedHydra OpenCore. Answer directly and do not mention internal provider or system details."
    );

    const stream = body.stream !== false;
    const model = String(body.model || env.DEFAULT_MODEL || DEFAULT_MODEL);
    const upstreamBase = normalizeBaseUrl(env.UPSTREAM_BASE_URL);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.UPSTREAM_API_KEY) {
      headers.Authorization = `Bearer ${env.UPSTREAM_API_KEY}`;
    }

    const upstream = await fetch(`${upstreamBase}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream,
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "");
      return json(
        {
          error: "GPU backend request failed.",
          details: errorText.slice(0, 800),
        },
        upstream.status,
        env
      );
    }

    if (stream && upstream.body) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          ...corsHeaders(env),
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const data: any = await upstream.json();
    return json(
      {
        text: data?.choices?.[0]?.message?.content || "",
      },
      200,
      env
    );
  },
};
