import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";
import { getProvider, PROVIDERS } from "./providers";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "llm-gateway.json");

export type StoredProviderKey = {
  id: string;
  providerId: string;
  label: string;
  encryptedApiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
  dailyRequestCap?: number;
  monthlyTokenCap?: number;
  createdAt: string;
  updatedAt: string;
};

export type UsageRecord = {
  day: string;
  month: string;
  dailyRequests: number;
  monthlyRequests: number;
  dailyTokens: number;
  monthlyTokens: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt?: string;
  lastStatus?: number;
  lastError?: string;
};

export type GatewayStore = {
  keys: StoredProviderKey[];
  usage: Record<string, UsageRecord>;
  cooldowns: Record<string, number>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function month() {
  return new Date().toISOString().slice(0, 7);
}

function emptyStore(): GatewayStore {
  return { keys: [], usage: {}, cooldowns: {} };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!fsSync.existsSync(STORE_FILE)) {
    await fs.writeFile(STORE_FILE, JSON.stringify(emptyStore(), null, 2));
  }
}

export async function readStore(): Promise<GatewayStore> {
  await ensureStore();
  try {
    const parsed = JSON.parse(await fs.readFile(STORE_FILE, "utf8"));
    return {
      keys: Array.isArray(parsed.keys) ? parsed.keys : [],
      usage: parsed.usage && typeof parsed.usage === "object" ? parsed.usage : {},
      cooldowns: parsed.cooldowns && typeof parsed.cooldowns === "object" ? parsed.cooldowns : {},
    };
  } catch {
    return emptyStore();
  }
}

export async function writeStore(store: GatewayStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, STORE_FILE);
}

export function currentUsage(store: GatewayStore, keyId: string): UsageRecord {
  const existing = store.usage[keyId];
  const d = today();
  const m = month();
  const base: UsageRecord = existing ?? {
    day: d,
    month: m,
    dailyRequests: 0,
    monthlyRequests: 0,
    dailyTokens: 0,
    monthlyTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
  };

  if (base.day !== d) {
    base.day = d;
    base.dailyRequests = 0;
    base.dailyTokens = 0;
  }
  if (base.month !== m) {
    base.month = m;
    base.monthlyRequests = 0;
    base.monthlyTokens = 0;
    base.promptTokens = 0;
    base.completionTokens = 0;
  }
  store.usage[keyId] = base;
  return base;
}

export async function addProviderKey(input: {
  providerId: string;
  apiKey?: string;
  label?: string;
  baseUrl?: string;
  model?: string;
  enabled?: boolean;
  dailyRequestCap?: number;
  monthlyTokenCap?: number;
}) {
  const provider = getProvider(input.providerId);
  if (!provider) throw new Error("unknown provider");
  if (provider.requiresKey && !input.apiKey?.trim()) throw new Error("api key required for this provider");

  const store = await readStore();
  const now = new Date().toISOString();
  const key: StoredProviderKey = {
    id: randomUUID(),
    providerId: provider.id,
    label: input.label?.trim() || `${provider.name} key`,
    encryptedApiKey: encryptSecret(input.apiKey?.trim() || ""),
    baseUrl: input.baseUrl?.trim() || undefined,
    model: input.model?.trim() || undefined,
    enabled: input.enabled ?? true,
    dailyRequestCap: Number.isFinite(input.dailyRequestCap) ? input.dailyRequestCap : undefined,
    monthlyTokenCap: Number.isFinite(input.monthlyTokenCap) ? input.monthlyTokenCap : undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.keys.push(key);
  await writeStore(store);
  return redactKey(key, store);
}

export async function removeProviderKey(id: string) {
  const store = await readStore();
  const before = store.keys.length;
  store.keys = store.keys.filter((key) => key.id !== id);
  delete store.usage[id];
  delete store.cooldowns[id];
  await writeStore(store);
  return before !== store.keys.length;
}

export async function updateProviderKey(id: string, patch: Partial<StoredProviderKey> & { apiKey?: string }) {
  const store = await readStore();
  const key = store.keys.find((item) => item.id === id);
  if (!key) throw new Error("key not found");
  if (typeof patch.enabled === "boolean") key.enabled = patch.enabled;
  if (typeof patch.label === "string") key.label = patch.label;
  if (typeof patch.baseUrl === "string") key.baseUrl = patch.baseUrl || undefined;
  if (typeof patch.model === "string") key.model = patch.model || undefined;
  if (typeof patch.apiKey === "string") key.encryptedApiKey = encryptSecret(patch.apiKey);
  if (typeof patch.dailyRequestCap === "number") key.dailyRequestCap = patch.dailyRequestCap;
  if (typeof patch.monthlyTokenCap === "number") key.monthlyTokenCap = patch.monthlyTokenCap;
  key.updatedAt = new Date().toISOString();
  await writeStore(store);
  return redactKey(key, store);
}

export function getDecryptedApiKey(key: StoredProviderKey) {
  return decryptSecret(key.encryptedApiKey);
}

export function redactKey(key: StoredProviderKey, store: GatewayStore) {
  const provider = getProvider(key.providerId);
  let apiKey = "";
  try {
    apiKey = getDecryptedApiKey(key);
  } catch {
    apiKey = "";
  }
  return {
    id: key.id,
    providerId: key.providerId,
    providerName: provider?.name ?? key.providerId,
    label: key.label,
    maskedKey: maskSecret(apiKey),
    baseUrl: key.baseUrl || provider?.baseUrl || "",
    model: key.model || provider?.defaultModel || "auto",
    enabled: key.enabled,
    dailyRequestCap: key.dailyRequestCap,
    monthlyTokenCap: key.monthlyTokenCap,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
    usage: currentUsage(store, key.id),
    cooldownUntil: store.cooldowns[key.id] || 0,
  };
}

export function virtualKeyId(providerId: string) {
  return `virtual:${providerId}`;
}

export function virtualProviderKeys(): StoredProviderKey[] {
  const now = new Date().toISOString();
  const keys: StoredProviderKey[] = [];

  for (const provider of PROVIDERS.filter((item) => item.enabledByDefault && !item.requiresKey)) {
    const autoModels = provider.id === "hf-space"
      ? provider.models.filter((model) => !/RedHydraOpenCore-dolphin/i.test(model))
      : provider.id === "ollama"
        ? provider.models.slice(0, 3)
        : [provider.defaultModel];

    autoModels.forEach((model, index) => {
      keys.push({
        id: index === 0 ? virtualKeyId(provider.id) : `${virtualKeyId(provider.id)}:${index}`,
        providerId: provider.id,
        label: index === 0 ? `${provider.name} auto` : `${provider.name} auto ${index + 1}`,
        encryptedApiKey: "",
        baseUrl: provider.baseUrl,
        model,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  return keys;
}

export async function listRedactedKeys() {
  const store = await readStore();
  return [...store.keys, ...virtualProviderKeys()].map((key) => redactKey(key, store));
}

export async function recordUsage(
  keyId: string,
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number; status?: number; error?: string }
) {
  const store = await readStore();
  const record = currentUsage(store, keyId);
  const promptTokens = Math.max(0, Math.floor(usage.promptTokens ?? 0));
  const completionTokens = Math.max(0, Math.floor(usage.completionTokens ?? 0));
  const totalTokens = Math.max(0, Math.floor(usage.totalTokens ?? promptTokens + completionTokens));
  record.dailyRequests += 1;
  record.monthlyRequests += 1;
  record.dailyTokens += totalTokens;
  record.monthlyTokens += totalTokens;
  record.promptTokens += promptTokens;
  record.completionTokens += completionTokens;
  record.lastUsedAt = new Date().toISOString();
  record.lastStatus = usage.status;
  record.lastError = usage.error;
  await writeStore(store);
}

export async function markCooldown(keyId: string, ms: number) {
  const store = await readStore();
  store.cooldowns[keyId] = Date.now() + ms;
  await writeStore(store);
}

export function estimateTokensFromMessages(messages: { content?: string | unknown }[] = []) {
  const chars = messages.reduce((sum, message) => {
    const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content ?? "");
    return sum + content.length;
  }, 0);
  return Math.max(1, Math.ceil(chars / 4));
}
