import { NextRequest } from "next/server";
import { chatCompletionsUrl, getProvider, normalizeBaseUrl, PROVIDERS, providerIds } from "./providers";
import {
  currentUsage,
  estimateTokensFromMessages,
  getDecryptedApiKey,
  markCooldown,
  readStore,
  recordUsage,
  StoredProviderKey,
  virtualProviderKeys,
} from "./store";

export const GATEWAY_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE,PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-OpenCore-Admin-Key",
};

type ChatBody = {
  model?: string;
  messages?: { role: string; content: string | unknown }[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
};

type Candidate = {
  key: StoredProviderKey;
  provider: NonNullable<ReturnType<typeof getProvider>>;
  model: string;
  score: number;
};

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const RATE_LIMITED_STATUS = new Set([429, 402, 403]);

function getAdminKey(req?: NextRequest) {
  return req?.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req?.headers.get("x-opencore-admin-key") || "";
}

export function requireAdmin(req: NextRequest) {
  const configured = process.env.OPENCORE_GATEWAY_ADMIN_KEY || process.env.LLM_GATEWAY_ADMIN_KEY;
  if (!configured) return true;
  return getAdminKey(req) === configured;
}

function normalizeModel(model?: string) {
  return model?.trim() || "auto";
}

function parseModelRequest(model: string) {
  const ids = providerIds();
  if (!model || model === "auto" || model === "uncensored-auto") return { providerId: undefined, model: model === "uncensored-auto" ? "uncensored-auto" : "auto" };

  const colon = model.indexOf(":");
  if (colon > 0) {
    const maybeProvider = model.slice(0, colon);
    if (ids.has(maybeProvider)) return { providerId: maybeProvider, model: model.slice(colon + 1) || "auto" };
  }

  const slash = model.indexOf("/");
  if (slash > 0) {
    const maybeProvider = model.slice(0, slash);
    if (ids.has(maybeProvider)) return { providerId: maybeProvider, model: model.slice(slash + 1) || "auto" };
  }

  return { providerId: undefined, model };
}

function isVirtualKey(key: StoredProviderKey) {
  return key.id.startsWith("virtual:");
}

function isWithinCaps(key: StoredProviderKey, store: Awaited<ReturnType<typeof readStore>>, options: { ignoreVirtualCooldown?: boolean } = {}) {
  const provider = getProvider(key.providerId);
  const usage = currentUsage(store, key.id);
  const dailyRequestCap = key.dailyRequestCap ?? provider?.caps?.requestsPerDay;
  const monthlyTokenCap = key.monthlyTokenCap ?? provider?.caps?.tokensPerMonth;
  const cooldownUntil = store.cooldowns[key.id] || 0;

  // Built-in keyless/local routes should not disappear from the chat UI for minutes
  // just because one HF Space was sleeping. The router will still try the next route.
  if (cooldownUntil > Date.now() && !(options.ignoreVirtualCooldown && isVirtualKey(key))) return false;
  if (dailyRequestCap && usage.dailyRequests >= dailyRequestCap) return false;
  if (monthlyTokenCap && usage.monthlyTokens >= monthlyTokenCap) return false;
  return key.enabled;
}

async function buildCandidatesAsync(body: ChatBody): Promise<Candidate[]> {
  const requested = parseModelRequest(normalizeModel(body.model || "uncensored-auto"));
  const store = await readStore();
  const keys = [...store.keys, ...virtualProviderKeys()];
  const wantsUncensoredAuto = !requested.providerId && (requested.model === "uncensored-auto" || requested.model === "auto");

  const candidates = keys
    .map((key): Candidate | null => {
      const provider = getProvider(key.providerId);
      if (!provider) return null;
      if (requested.providerId && requested.providerId !== provider.id) return null;
      if (!isWithinCaps(key, store, { ignoreVirtualCooldown: true })) return null;
      const usage = currentUsage(store, key.id);
      const model = requested.model === "auto" || requested.model === "uncensored-auto" ? key.model || provider.defaultModel : requested.model;
      const modelText = `${provider.id}/${model}`.toLowerCase();
      const isUncensoredish = /unsensored|uncensored|dolphin|wizard|vicuna|nous|hermes/.test(modelText);
      if (wantsUncensoredAuto && provider.requiresKey && !isUncensoredish) return null;
      const requestLoad = key.dailyRequestCap ? usage.dailyRequests / Math.max(1, key.dailyRequestCap) : 0;
      const tokenLoad = key.monthlyTokenCap ? usage.monthlyTokens / Math.max(1, key.monthlyTokenCap) : 0;
      const uncensoredBoost = wantsUncensoredAuto
        ? isUncensoredish
          ? -10
          : provider.id === "pollinations" || provider.id === "llm7"
            ? 80
            : 30
        : 0;
      const forcedProviderPenalty = requested.providerId ? 0 : provider.id === "openai" ? 500 : 0;
      const score = provider.priority + uncensoredBoost + forcedProviderPenalty + requestLoad * 20 + tokenLoad * 20 + Math.random() * 0.5;
      return { key, provider, model, score };
    })
    .filter((item): item is Candidate => Boolean(item))
    .sort((a, b) => a.score - b.score);

  if (candidates.length > 0 || requested.providerId) return candidates;

  // Absolute last resort: return every keyless virtual route so the main chat never
  // drops into an empty-candidate state.
  return virtualProviderKeys()
    .map((key): Candidate | null => {
      const provider = getProvider(key.providerId);
      if (!provider || provider.requiresKey) return null;
      return { key, provider, model: key.model || provider.defaultModel, score: provider.priority + 100 };
    })
    .filter((item): item is Candidate => Boolean(item));
}

function buildHeaders(candidate: Candidate) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(candidate.provider.headers || {}),
  };
  const apiKey = getDecryptedApiKey(candidate.key);
  if (candidate.provider.authHeader !== "none" && apiKey) {
    if (candidate.provider.authHeader === "x-api-key") headers["x-api-key"] = apiKey;
    else headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

function cleanBody(body: ChatBody, candidate: Candidate) {
  const copy: Record<string, unknown> = { ...body };
  delete copy.provider;
  delete copy.route;
  copy.model = candidate.model;
  copy.stream = Boolean(body.stream);
  return copy;
}

async function parseError(upstream: Response) {
  try {
    const text = await upstream.text();
    return text.slice(0, 800);
  } catch {
    return upstream.statusText;
  }
}

function providerHeaders(candidate: Candidate, extra?: Record<string, string>) {
  return {
    ...GATEWAY_HEADERS,
    "X-OpenCore-Provider": candidate.provider.id,
    "X-OpenCore-Provider-Name": candidate.provider.name,
    "X-OpenCore-Key": candidate.key.id,
    "X-OpenCore-Model": candidate.model,
    ...(extra || {}),
  };
}

function upstreamUrl(candidate: Candidate) {
  return chatCompletionsUrl(candidate.key.baseUrl || candidate.provider.baseUrl);
}

function extractUsage(data: any, promptEstimate: number) {
  const promptTokens = Number(data?.usage?.prompt_tokens ?? data?.usage?.promptTokens ?? promptEstimate);
  const completionTokens = Number(data?.usage?.completion_tokens ?? data?.usage?.completionTokens ?? 0);
  const totalTokens = Number(data?.usage?.total_tokens ?? data?.usage?.totalTokens ?? promptTokens + completionTokens);
  return { promptTokens, completionTokens, totalTokens };
}

function streamWithUsageTracking(upstream: Response, candidate: Candidate, promptEstimate: number) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let completionChars = 0;
  let status = upstream.status;
  let usageFromStream: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            const text = decoder.decode(value, { stream: true });
            completionChars += estimateCompletionChars(text);
            usageFromStream = extractStreamingUsage(text, usageFromStream);
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        const estimatedCompletion = Math.ceil(completionChars / 4);
        await recordUsage(candidate.key.id, {
          promptTokens: usageFromStream.promptTokens ?? promptEstimate,
          completionTokens: usageFromStream.completionTokens ?? estimatedCompletion,
          totalTokens: usageFromStream.totalTokens ?? promptEstimate + estimatedCompletion,
          status,
        }).catch(() => undefined);
        controller.close();
      }
    },
  });

  return readable;
}

function estimateCompletionChars(sseChunk: string) {
  let chars = 0;
  for (const line of sseChunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.text ?? "";
      if (typeof delta === "string") chars += delta.length;
    } catch {
      // Not JSON or split across chunks; fall back to small estimate.
    }
  }
  return chars;
}

function extractStreamingUsage(sseChunk: string, previous: { promptTokens?: number; completionTokens?: number; totalTokens?: number }) {
  let usage = previous;
  for (const line of sseChunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed?.usage) {
        usage = extractUsage(parsed, previous.promptTokens ?? 0);
      }
    } catch {
      // ignore partials
    }
  }
  return usage;
}


function messagesToPlainPrompt(messages: NonNullable<ChatBody["messages"]>) {
  return messages
    .map((message) => {
      const role = message.role === "assistant" ? "Assistant" : message.role === "system" ? "System" : "User";
      const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content ?? "");
      return `${role}: ${content}`;
    })
    .join("\n\n") + "\n\nAssistant:";
}

function parseSpaceModel(model: string) {
  const [rawSpaceId, rawApiName] = model.split("|");
  const spaceId = (rawSpaceId || "Saiyejin/Qwen-Unsensored-4B").trim();
  const apiName = (rawApiName || "/predict").trim().replace(/^\/+/, "") || "predict";
  return { spaceId, apiName };
}

function spaceSubdomain(spaceId: string) {
  return spaceId
    .trim()
    .replace(/^https?:\/\/huggingface\.co\/spaces\//i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/\.hf\.space\/?$/i, "")
    .replace(/[\/_.]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function gradioBaseUrl(candidate: Candidate, spaceId: string) {
  const override = candidate.key.baseUrl?.trim();
  if (override && /^https?:\/\//i.test(override) && !override.includes("huggingface.co/spaces")) {
    return normalizeBaseUrl(override);
  }
  return `https://${spaceSubdomain(spaceId)}.hf.space`;
}

function authHeadersForOptionalBearer(candidate: Candidate) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = getDecryptedApiKey(candidate.key);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

function collectStrings(value: unknown, bucket: string[] = []) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) bucket.push(trimmed);
    return bucket;
  }
  if (Array.isArray(value)) {
    if (value.length >= 2 && typeof value[1] === "string") bucket.push(value[1]);
    for (const item of value) collectStrings(item, bucket);
    return bucket;
  }
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    for (const key of ["response", "answer", "text", "output", "message", "content"]) {
      if (typeof objectValue[key] === "string") bucket.push(String(objectValue[key]));
    }
    for (const item of Object.values(objectValue)) collectStrings(item, bucket);
  }
  return bucket;
}

function extractTextFromGradioSse(sseText: string) {
  const strings: string[] = [];
  for (const line of sseText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]" || payload === "null") continue;
    try {
      collectStrings(JSON.parse(payload), strings);
    } catch {
      strings.push(payload);
    }
  }
  const useful = strings.filter((item, index) => strings.indexOf(item) === index);
  return useful.sort((a, b) => b.length - a.length)[0] || "";
}

function openAIResponseFromText(candidate: Candidate, text: string, promptEstimate: number) {
  const completionTokens = Math.ceil(text.length / 4);
  return {
    id: `chatcmpl-opencore-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: candidate.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: promptEstimate,
      completion_tokens: completionTokens,
      total_tokens: promptEstimate + completionTokens,
    },
  };
}

function streamOpenAIText(candidate: Candidate, text: string) {
  const encoder = new TextEncoder();
  const chunk = {
    id: `chatcmpl-opencore-${Date.now()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: candidate.model,
    choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
  };
  const done = {
    id: chunk.id,
    object: "chat.completion.chunk",
    created: chunk.created,
    model: candidate.model,
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  };
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

type GradioAttempt = {
  apiName: string;
  data: unknown[];
  style: "queue" | "predict" | "api-predict";
};

function lastUserText(messages: NonNullable<ChatBody["messages"]>) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return typeof last.content === "string" ? last.content : JSON.stringify(last.content ?? "");
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, ms = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function maybeGradioApiNames(baseUrl: string) {
  const names = new Set<string>(["predict", "chat", "respond", "generate", "submit"]);
  try {
    const info = await fetchJsonWithTimeout(`${baseUrl}/gradio_api/info`, { method: "GET" }, 12000);
    if (info.ok) {
      const json = await info.json().catch(() => ({}));
      const named = json?.named_endpoints || json?.endpoints || json?.dependencies || {};
      if (Array.isArray(named)) {
        for (const item of named) {
          const apiName = String(item?.api_name || item?.id || item?.name || "").replace(/^\/+/, "");
          if (apiName) names.add(apiName);
        }
      } else if (named && typeof named === "object") {
        for (const [key, value] of Object.entries(named as Record<string, any>)) {
          const apiName = String(value?.api_name || key || "").replace(/^\/+/, "");
          if (apiName) names.add(apiName);
        }
      }
    }
  } catch {
    // The Space may be asleep or old Gradio; the manual attempts below still work for many Spaces.
  }
  return Array.from(names);
}

async function runGradioAttempt(baseUrl: string, candidate: Candidate, attempt: GradioAttempt) {
  const headers = authHeadersForOptionalBearer(candidate);
  if (attempt.style === "queue") {
    const submitUrl = `${baseUrl}/gradio_api/call/${encodeURIComponent(attempt.apiName)}`;
    const submit = await fetchJsonWithTimeout(submitUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: attempt.data }),
    });
    if (!submit.ok) throw new Error(`queue submit ${submit.status}: ${await parseError(submit)}`);
    const submitData = await submit.json().catch(() => ({}));
    const eventId = submitData?.event_id;
    if (!eventId) throw new Error("queue submit did not return event_id");
    const resultUrl = `${baseUrl}/gradio_api/call/${encodeURIComponent(attempt.apiName)}/${encodeURIComponent(eventId)}`;
    const result = await fetchJsonWithTimeout(resultUrl, { method: "GET", headers }, 60000);
    if (!result.ok) throw new Error(`queue result ${result.status}: ${await parseError(result)}`);
    return extractTextFromGradioSse(await result.text());
  }

  const path = attempt.style === "api-predict" ? "/api/predict" : "/run/predict";
  const response = await fetchJsonWithTimeout(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: attempt.data, fn_index: 0 }),
  });
  if (!response.ok) throw new Error(`${path} ${response.status}: ${await parseError(response)}`);
  const data = await response.json().catch(() => ({}));
  const strings = collectStrings(data);
  return strings.sort((a, b) => b.length - a.length)[0] || "";
}

async function callGradioSpace(candidate: Candidate, body: ChatBody, promptEstimate: number) {
  const { spaceId, apiName } = parseSpaceModel(candidate.model);
  const baseUrl = gradioBaseUrl(candidate, spaceId);
  const fullPrompt = messagesToPlainPrompt(body.messages || []);
  const userPrompt = lastUserText(body.messages || []) || fullPrompt;
  const apiNames = [apiName, ...(await maybeGradioApiNames(baseUrl))]
    .map((name) => name.replace(/^\/+/, ""))
    .filter((name, index, arr) => name && arr.indexOf(name) === index);

  const dataShapes: unknown[][] = [
    [userPrompt],
    [userPrompt, []],
    [userPrompt, [], null],
    [userPrompt, ""],
    [fullPrompt],
    [fullPrompt, []],
  ];
  const attempts: GradioAttempt[] = [];
  for (const name of apiNames) {
    for (const data of dataShapes) attempts.push({ apiName: name, data, style: "queue" });
  }
  for (const data of dataShapes) {
    attempts.push({ apiName: "predict", data, style: "predict" });
    attempts.push({ apiName: "predict", data, style: "api-predict" });
  }

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const text = (await runGradioAttempt(baseUrl, candidate, attempt)).trim();
      if (!text) throw new Error("empty response");
      const data = openAIResponseFromText(candidate, text, promptEstimate);
      const usage = extractUsage(data, promptEstimate);
      await recordUsage(candidate.key.id, { ...usage, status: 200 }).catch(() => undefined);

      if (body.stream) {
        return new Response(streamOpenAIText(candidate, text), {
          status: 200,
          headers: providerHeaders(candidate, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-OpenCore-Adapter": "gradio-space",
            "X-OpenCore-Space": spaceId,
            "X-OpenCore-Gradio-Attempt": `${attempt.style}/${attempt.apiName}`,
          }),
        });
      }

      return Response.json(data, {
        status: 200,
        headers: providerHeaders(candidate, {
          "Content-Type": "application/json",
          "X-OpenCore-Adapter": "gradio-space",
          "X-OpenCore-Space": spaceId,
          "X-OpenCore-Gradio-Attempt": `${attempt.style}/${attempt.apiName}`,
        }),
      });
    } catch (err: any) {
      errors.push(`${attempt.style}/${attempt.apiName}: ${err?.message || "failed"}`.slice(0, 220));
    }
  }

  throw new Error(`HF Space ${spaceId} did not expose a compatible text endpoint. Tried ${attempts.length} Gradio request shapes. Last errors: ${errors.slice(-4).join(" | ")}`);
}

export async function routeChatCompletions(body: ChatBody): Promise<Response> {
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: { message: "messages array required", type: "invalid_request_error" } }, { status: 400, headers: GATEWAY_HEADERS });
  }

  const candidates = await buildCandidatesAsync(body);
  if (candidates.length === 0) {
    return Response.json(
      {
        error: {
          message: "The requested route has no active candidates. The default chat model is uncensored-auto; choose that model or add/start the provider you selected.",
          type: "opencore_no_provider_available",
        },
      },
      { status: 503, headers: GATEWAY_HEADERS }
    );
  }

  const promptEstimate = estimateTokensFromMessages(body.messages as any[]);
  const failures: { provider: string; status?: number; error: string }[] = [];

  for (const candidate of candidates) {
    try {
      if (candidate.provider.adapter === "gradio-space") {
        return await callGradioSpace(candidate, body, promptEstimate);
      }

      const upstream = await fetch(upstreamUrl(candidate), {
        method: "POST",
        headers: buildHeaders(candidate),
        body: JSON.stringify(cleanBody(body, candidate)),
        cache: "no-store",
      });

      if (!upstream.ok) {
        const errText = await parseError(upstream);
        failures.push({ provider: candidate.provider.id, status: upstream.status, error: errText });
        await recordUsage(candidate.key.id, { promptTokens: promptEstimate, completionTokens: 0, totalTokens: promptEstimate, status: upstream.status, error: errText }).catch(() => undefined);
        if (RATE_LIMITED_STATUS.has(upstream.status)) await markCooldown(candidate.key.id, 10 * 60 * 1000).catch(() => undefined);
        if (RETRYABLE_STATUS.has(upstream.status)) continue;
        continue;
      }

      if (body.stream) {
        const headers = new Headers(upstream.headers);
        headers.set("Content-Type", "text/event-stream; charset=utf-8");
        Object.entries(providerHeaders(candidate)).forEach(([k, v]) => headers.set(k, v));
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Connection", "keep-alive");
        headers.set("X-Accel-Buffering", "no");
        return new Response(streamWithUsageTracking(upstream, candidate, promptEstimate), {
          status: 200,
          headers,
        });
      }

      const data = await upstream.json();
      const usage = extractUsage(data, promptEstimate);
      await recordUsage(candidate.key.id, { ...usage, status: upstream.status }).catch(() => undefined);
      return Response.json(data, { status: 200, headers: providerHeaders(candidate, { "Content-Type": "application/json" }) });
    } catch (err: any) {
      failures.push({ provider: candidate.provider.id, error: err?.message ?? "network failure" });
      await markCooldown(candidate.key.id, 60 * 1000).catch(() => undefined);
      await recordUsage(candidate.key.id, { promptTokens: promptEstimate, completionTokens: 0, totalTokens: promptEstimate, status: 0, error: err?.message ?? "network failure" }).catch(() => undefined);
    }
  }

  return Response.json(
    {
      error: {
        message: "The uncensored-auto router tried every built-in/local route but none returned a usable reply this turn. Try again, or start Ollama/LM Studio for a reliable local model.",
        type: "opencore_all_providers_failed",
        details: failures.slice(0, 8),
      },
    },
    { status: 502, headers: GATEWAY_HEADERS }
  );
}

export async function listGatewayModels() {
  const store = await readStore();
  const configuredProviderIds = new Set([...store.keys, ...virtualProviderKeys()].filter((key) => key.enabled).map((key) => key.providerId));
  const data = [
    { id: "uncensored-auto", object: "model", created: 0, owned_by: "OpenCore Auto Router" },
    ...PROVIDERS.flatMap((provider) => {
      if (!configuredProviderIds.has(provider.id) && provider.requiresKey) return [];
      return provider.models.map((model) => ({
        id: `${provider.id}/${model}`,
        object: "model",
        created: 0,
        owned_by: provider.name,
      }));
    }),
  ];
  return { object: "list", data };
}
