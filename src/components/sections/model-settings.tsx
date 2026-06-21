"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Plug,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Search,
  Copy,
  Network,
  KeyRound,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CLOUD_MODEL_PRESETS, MODEL_PRESETS } from "@/lib/opencore";
import { cn } from "@/lib/utils";

export type ModelConfig = {
  mode: "managed" | "custom" | "gateway";
  endpoint: string;
  apiKey: string;
  model: string;
};

export const DEFAULT_CONFIG: ModelConfig = {
  mode: "gateway",
  endpoint: "",
  apiKey: "",
  model: "uncensored-auto",
};

const STORAGE_KEY = "opencore:model-config";

type GatewayProvider = {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  requiresKey: boolean;
  configured?: boolean;
  keyCount?: number;
  notes: string;
};

type GatewayKey = {
  id: string;
  providerId: string;
  providerName: string;
  label: string;
  maskedKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  dailyRequestCap?: number;
  monthlyTokenCap?: number;
  usage?: {
    dailyRequests: number;
    monthlyRequests: number;
    dailyTokens: number;
    monthlyTokens: number;
    lastUsedAt?: string;
    lastStatus?: number;
    lastError?: string;
  };
  cooldownUntil?: number;
};

export function loadConfig(): ModelConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored && typeof stored === "object") {
      const merged = { ...DEFAULT_CONFIG, ...stored };
      const legacyDefaults = new Set(["", "auto", "gpt-5.5", "openai/gpt-5.5", "openai/gpt-5.4-mini", "hf-space/Saiyejin/Qwen-Unsensored-4B", "hf-space/lylee122/Unsensored10", "hf-space/lylee122/Unsensored10|/predict", "hf-space/unsensoredai/adarsha", "hf-space/unsensoredai/adarsha|/predict"]);
      if (merged.mode !== "custom" && legacyDefaults.has(String(merged.model || ""))) {
        merged.mode = "gateway";
        merged.model = DEFAULT_CONFIG.model;
      }
      return merged;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(cfg: ModelConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

const CUSTOM_PRESETS = [
    { name: "HuggingFace Router", endpoint: "https://router.huggingface.co/v1", model: "your-huggingface-username/your-model-id" },
  { name: "HF Space / Gradio", endpoint: "https://lylee122-unsensored10.hf.space", model: "lylee122/Unsensored10|/predict" },
  { name: "Ollama", endpoint: "http://localhost:11434/v1", model: "llama3.2" },
  { name: "LM Studio", endpoint: "http://localhost:1234/v1", model: "local-model" },
  { name: "llama.cpp", endpoint: "http://localhost:8080/v1", model: "local" },
  { name: "vLLM", endpoint: "http://localhost:8000/v1", model: "local-model" },
];

function modeLabel(mode: ModelConfig["mode"]) {
  if (mode === "gateway") return "gateway router";
  if (mode === "custom") return "custom endpoint";
  return "managed";
}

export function ModelSettings({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: ModelConfig;
  onSave: (cfg: ModelConfig) => void;
}) {
  const [draft, setDraft] = React.useState<ModelConfig>(config);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; msg: string } | null>(null);
  const [fetchingModels, setFetchingModels] = React.useState(false);
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [modelQuery, setModelQuery] = React.useState("");
  const [showModelList, setShowModelList] = React.useState(false);

  const [providers, setProviders] = React.useState<GatewayProvider[]>([]);
  const [keys, setKeys] = React.useState<GatewayKey[]>([]);
  const [loadingGateway, setLoadingGateway] = React.useState(false);
  const [addingKey, setAddingKey] = React.useState(false);
  const [keyForm, setKeyForm] = React.useState({
    providerId: "hf-space",
    label: "",
    apiKey: "",
    baseUrl: "",
    model: "",
    dailyRequestCap: "",
    monthlyTokenCap: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setDraft({ ...DEFAULT_CONFIG, ...config });
    setTestResult(null);
    loadGateway();
  }, [open, config]);

  const selectedProvider = providers.find((p) => p.id === keyForm.providerId);

  const loadGateway = async () => {
    setLoadingGateway(true);
    try {
      const res = await fetch("/api/gateway/providers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "could not load gateway");
      setProviders(data.providers || []);
      setKeys(data.keys || []);
      if (data.providers?.[0] && !data.providers.some((p: GatewayProvider) => p.id === keyForm.providerId)) {
        setKeyForm((f) => ({ ...f, providerId: data.providers[0].id }));
      }
    } catch (err: any) {
      toast.error("gateway unavailable", { description: err?.message || "could not read provider registry" });
    } finally {
      setLoadingGateway(false);
    }
  };

  const addKey = async () => {
    if (!keyForm.providerId) return;
    if (selectedProvider?.requiresKey && !keyForm.apiKey.trim()) {
      toast.error("API key required", { description: `${selectedProvider.name} needs a key.` });
      return;
    }
    setAddingKey(true);
    try {
      const res = await fetch("/api/gateway/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...keyForm,
          label: keyForm.label || `${selectedProvider?.name || keyForm.providerId} key`,
          dailyRequestCap: keyForm.dailyRequestCap ? Number(keyForm.dailyRequestCap) : undefined,
          monthlyTokenCap: keyForm.monthlyTokenCap ? Number(keyForm.monthlyTokenCap) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "could not save key");
      toast.success("provider key saved", { description: `${data.key.providerName} is now available to the router.` });
      setKeyForm((f) => ({ ...f, label: "", apiKey: "", dailyRequestCap: "", monthlyTokenCap: "" }));
      await loadGateway();
    } catch (err: any) {
      toast.error("could not save key", { description: err?.message || "check the provider and key" });
    } finally {
      setAddingKey(false);
    }
  };

  const deleteKey = async (key: GatewayKey) => {
    if (key.id.startsWith("virtual:")) {
      toast("default keyless provider", { description: "This is a built-in keyless/local provider, not a saved secret." });
      return;
    }
    try {
      const res = await fetch("/api/gateway/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: key.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "delete failed");
      toast.success("provider key removed");
      await loadGateway();
    } catch (err: any) {
      toast.error("delete failed", { description: err?.message || "could not remove key" });
    }
  };

  const testCustom = async () => {
    if (!draft.endpoint) {
      setTestResult({ ok: false, msg: "enter an endpoint URL first" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/chat/connection-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: draft.endpoint, apiKey: draft.apiKey, model: draft.model || "gpt-3.5-turbo" }),
      });
      const data = await res.json();
      setTestResult(
        data.ok
          ? { ok: true, msg: `connected in ${data.elapsed}ms · ${data.model}` }
          : { ok: false, msg: `failed (${data.status ?? "error"}): ${data.error ?? "no response"}` }
      );
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message ?? "connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const testGateway = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/gateway/connection-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: draft.model || DEFAULT_CONFIG.model }),
      });
      const data = await res.json();
      setTestResult(
        data.ok
          ? { ok: true, msg: `gateway ok · ${data.provider || "provider"}/${data.model || "auto"} · ${data.elapsed}ms` }
          : { ok: false, msg: data?.error?.message || data?.reply || "gateway failed" }
      );
      await loadGateway();
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message ?? "gateway failed" });
    } finally {
      setTesting(false);
    }
  };

  const fetchModels = async () => {
    if (!draft.endpoint) {
      toast.error("enter an endpoint URL first");
      return;
    }
    setFetchingModels(true);
    setShowModelList(true);
    try {
      const res = await fetch("/api/chat/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: draft.endpoint, apiKey: draft.apiKey }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.models)) {
        const ids = data.models.map((m: { id: string }) => m.id);
        setAvailableModels(ids);
        toast.success(`found ${ids.length} model${ids.length === 1 ? "" : "s"}`);
      } else {
        setAvailableModels([]);
        toast.error("couldn't fetch models", { description: data.error ?? "endpoint unreachable" });
      }
    } catch {
      setAvailableModels([]);
      toast.error("couldn't fetch models", { description: "endpoint unreachable" });
    } finally {
      setFetchingModels(false);
    }
  };

  const copyCmd = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    toast.success("copied", { description: cmd });
  };

  const filteredModels = availableModels.filter((m) => m.toLowerCase().includes(modelQuery.toLowerCase()));

  const save = () => {
    onSave(draft);
    saveConfig(draft);
    toast.success(`${modeLabel(draft.mode)} saved`, {
      description: draft.mode === "gateway" ? `model: ${draft.model || DEFAULT_CONFIG.model}` : draft.mode === "custom" ? draft.endpoint : "OpenCore router",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="scanlines relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-3 sm:px-5">
              <Network className="h-4 w-4 text-amber-glow" />
              <span className="font-mono-display text-sm font-bold">model settings</span>
              <span className="hidden font-mono-display text-[10px] text-muted-foreground sm:inline">one endpoint · many providers · encrypted keys</span>
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={onClose} aria-label="Close">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-4 oc-scroll sm:p-5">
              <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">{"// "}mode</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeButton active={draft.mode === "gateway"} icon={<Network className="h-3.5 w-3.5" />} title="gateway" detail="/v1/chat/completions" onClick={() => setDraft((d) => ({ ...d, mode: "gateway", model: d.model || "auto" }))} />
                <ModeButton active={draft.mode === "custom"} icon={<Plug className="h-3.5 w-3.5" />} title="custom" detail="single endpoint" onClick={() => setDraft((d) => ({ ...d, mode: "custom" }))} />
              </div>

              {draft.mode === "gateway" && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-mono-display text-xs font-bold text-primary">Auto uncensored gateway enabled</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            The router auto-loads keyless uncensored/local profiles on page visit, then falls forward to the first responsive route. Add private keys only when you want paid or personal providers.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">gateway model</label>
                      <input
                        value={draft.model}
                        onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                        placeholder="uncensored-auto or hf-space/lylee122/Unsensored10"
                        className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                      />
                      <p className="mt-1 font-mono-display text-[10px] text-muted-foreground">
                        Default is <code className="rounded bg-secondary/50 px-1">uncensored-auto</code>. It auto-tries active uncensored/keyless profiles first. Use <code className="rounded bg-secondary/50 px-1">provider/model</code> only when you want to force a route.
                      </p>
                      <div className="mt-3 rounded-xl border border-border/60 bg-background/35 p-3">
                        <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">{"// "}model picker</p>
                        <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground">HF Spaces and local Ollama profiles are listed first. Kaggle model files must be served through Ollama, LM Studio, llama.cpp, or vLLM.</p>
                        <div className="grid max-h-48 gap-1.5 overflow-y-auto pr-1 oc-scroll sm:grid-cols-2">
                          <button onClick={() => setDraft((d) => ({ ...d, model: "uncensored-auto" }))} className="rounded-lg border border-primary/30 bg-primary/10 p-2 text-left font-mono-display text-[10px] text-primary">
                            <span className="block text-[11px] font-bold">Auto router</span>
                            <span className="text-muted-foreground">best available uncensored/keyless profile</span>
                          </button>
                          {CLOUD_MODEL_PRESETS.map((p) => (
                            <button
                              key={`${p.provider || "opencore"}/${p.model}`}
                              onClick={() => setDraft((d) => ({ ...d, model: p.provider ? `${p.provider}/${p.model}` : p.model }))}
                              className={cn(
                                "rounded-lg border p-2 text-left transition-colors",
                                draft.model === (p.provider ? `${p.provider}/${p.model}` : p.model) ? "border-amber-glow/50 bg-amber-glow/10" : "border-border/60 bg-card/40 hover:border-amber-glow/40"
                              )}
                            >
                              <span className="block truncate font-mono-display text-[11px] font-bold text-foreground">{p.label}</span>
                              <span className="block truncate font-mono-display text-[9px] text-muted-foreground">{p.providerName} · {p.kind}</span>
                              <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/85">{p.good_for}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={testGateway} disabled={testing} className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} test gateway
                      </Button>
                      <Button size="sm" variant="outline" onClick={loadGateway} disabled={loadingGateway} className="gap-1.5">
                        {loadingGateway ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} refresh
                      </Button>
                      {testResult && <ResultPill result={testResult} />}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/35 p-3">
                      <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">{"// "}auto routes</p>
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1 oc-scroll">
                        {keys.length === 0 ? (
                          <p className="rounded-lg border border-border/60 bg-card/40 p-3 text-center font-mono-display text-[10px] text-muted-foreground">Uncensored/keyless/local routes are auto-added. Private keys are optional.</p>
                        ) : (
                          keys.map((key) => (
                            <div key={key.id} className="rounded-lg border border-border/60 bg-card/40 p-3">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-mono-display text-[11px] font-bold text-foreground">{key.providerName} · {key.label}</p>
                                  <p className="truncate font-mono-display text-[10px] text-muted-foreground">{key.maskedKey} · {key.model}</p>
                                </div>
                                <span className={cn("rounded border px-1.5 py-0.5 font-mono-display text-[9px]", key.enabled ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{key.enabled ? "on" : "off"}</span>
                                <button onClick={() => deleteKey(key)} className="grid h-7 w-7 place-items-center rounded border border-border/60 text-muted-foreground hover:text-hydra" aria-label="Delete key">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-1 font-mono-display text-[9px] text-muted-foreground sm:grid-cols-4">
                                <span>day req: {key.usage?.dailyRequests ?? 0}</span>
                                <span>mo req: {key.usage?.monthlyRequests ?? 0}</span>
                                <span>day tok: {key.usage?.dailyTokens ?? 0}</span>
                                <span>mo tok: {key.usage?.monthlyTokens ?? 0}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-amber-glow/25 bg-amber-glow/5 p-4">
                    <p className="flex items-center gap-1.5 font-mono-display text-xs font-bold text-amber-glow"><KeyRound className="h-3.5 w-3.5" /> add provider key</p>
                    <label className="block">
                      <span className="mb-1 block font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">provider</span>
                      <select
                        value={keyForm.providerId}
                        onChange={(e) => {
                          const provider = providers.find((p) => p.id === e.target.value);
                          setKeyForm((f) => ({ ...f, providerId: e.target.value, baseUrl: provider?.baseUrl || "", model: provider?.defaultModel || "" }));
                        }}
                        className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs text-foreground focus:border-amber-glow/50 focus:outline-none"
                      >
                        {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}{provider.requiresKey ? "" : " (no key)"}</option>)}
                      </select>
                    </label>
                    {selectedProvider && <p className="rounded-lg border border-border/60 bg-background/40 p-2 text-[10px] leading-relaxed text-muted-foreground">{selectedProvider.notes}</p>}
                    <input value={keyForm.label} onChange={(e) => setKeyForm((f) => ({ ...f, label: e.target.value }))} placeholder="label, e.g. personal Groq" className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    <input type="password" value={keyForm.apiKey} onChange={(e) => setKeyForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={selectedProvider?.requiresKey ? "API key" : "optional key"} className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    <input value={keyForm.baseUrl} onChange={(e) => setKeyForm((f) => ({ ...f, baseUrl: e.target.value }))} placeholder={selectedProvider?.baseUrl || "override base URL"} className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    <input value={keyForm.model} onChange={(e) => setKeyForm((f) => ({ ...f, model: e.target.value }))} placeholder={selectedProvider?.defaultModel || "default model"} className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    {selectedProvider?.models?.length ? (
                      <div className="grid max-h-24 gap-1 overflow-y-auto rounded-lg border border-border/60 bg-background/35 p-1 oc-scroll sm:grid-cols-2">
                        {selectedProvider.models.map((m) => (
                          <button key={m} onClick={() => setKeyForm((f) => ({ ...f, model: m }))} className="truncate rounded px-2 py-1 text-left font-mono-display text-[9px] text-muted-foreground hover:bg-amber-glow/10 hover:text-amber-glow" title={m}>{m}</button>
                        ))}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <input value={keyForm.dailyRequestCap} onChange={(e) => setKeyForm((f) => ({ ...f, dailyRequestCap: e.target.value }))} placeholder="daily req cap" className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                      <input value={keyForm.monthlyTokenCap} onChange={(e) => setKeyForm((f) => ({ ...f, monthlyTokenCap: e.target.value }))} placeholder="monthly token cap" className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    </div>
                    <Button size="sm" onClick={addKey} disabled={addingKey || !keyForm.providerId} className="w-full bg-amber-glow text-black hover:bg-amber-glow/90">
                      {addingKey ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-1.5 h-3.5 w-3.5" />} save encrypted key
                    </Button>
                  </div>
                </div>
              )}

              {draft.mode === "managed" && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="font-mono-display text-xs font-bold text-primary">managed fallback disabled</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">OpenCore now routes through uncensored-auto by default. Use gateway mode instead.</p>
                </div>
              )}

              {draft.mode === "custom" && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-2 rounded-xl border border-amber-glow/30 bg-amber-glow/5 p-3">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-glow" />
                    <p className="text-[11px] leading-relaxed text-foreground/80">Custom mode sends this browser session to one OpenAI-compatible endpoint. For HF Spaces or encrypted multi-key routing, use gateway mode.</p>
                  </div>
                  <div>
                    <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">{"// "}presets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_PRESETS.map((p) => (
                        <button key={p.name} onClick={() => setDraft((d) => ({ ...d, endpoint: p.endpoint, model: p.model }))} className="rounded-lg border border-border bg-card/40 px-2.5 py-1 font-mono-display text-[10px] text-muted-foreground hover:border-amber-glow/40 hover:text-amber-glow">{p.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1 block font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">endpoint URL</span>
                      <input value={draft.endpoint} onChange={(e) => setDraft((d) => ({ ...d, endpoint: e.target.value }))} placeholder="http://localhost:11434/v1" className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                    </label>
                    <label>
                      <span className="mb-1 block font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">model</span>
                      <div className="flex gap-2">
                        <input value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} placeholder="llama3.2" className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                        <button onClick={fetchModels} disabled={fetchingModels || !draft.endpoint} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-amber-glow disabled:opacity-50" title="Browse models">
                          {fetchingModels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </label>
                  </div>
                  <AnimatePresence>
                    {showModelList && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                          <input value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} placeholder="filter models" className="mb-2 w-full rounded border border-border bg-background/60 px-2 py-1 font-mono-display text-[11px]" />
                          <div className="max-h-36 space-y-0.5 overflow-y-auto oc-scroll">
                            {filteredModels.length === 0 ? <p className="p-3 text-center font-mono-display text-[10px] text-muted-foreground">no models</p> : filteredModels.map((m) => (
                              <button key={m} onClick={() => { setDraft((d) => ({ ...d, model: m })); setShowModelList(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono-display text-[11px] hover:bg-amber-glow/10">{m}</button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <label>
                    <span className="mb-1 block font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">API key <span className="normal-case text-muted-foreground/60">optional</span></span>
                    <input type="password" value={draft.apiKey} onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))} placeholder="sk-... / blank for local" className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono-display text-xs" />
                  </label>
                  <div>
                    <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">{"// "}open models · quick start</p>
                    <div className="grid max-h-44 gap-1.5 overflow-y-auto oc-scroll sm:grid-cols-2 lg:grid-cols-3">
                      {MODEL_PRESETS.map((p) => (
                        <div key={p.ollamaId} className="rounded-lg border border-border/60 bg-background/40 p-2">
                          <div className="flex items-center justify-between gap-1">
                            <button onClick={() => setDraft((d) => ({ ...d, model: p.ollamaId }))} className="min-w-0 flex-1 text-left">
                              <p className="truncate font-mono-display text-[11px] font-bold">{p.name}</p>
                              <p className="truncate font-mono-display text-[9px] text-muted-foreground">{p.size} · {p.license}</p>
                            </button>
                            <button onClick={() => copyCmd(p.command)} className="grid h-6 w-6 shrink-0 place-items-center rounded border border-border/60 text-muted-foreground hover:text-primary"><Copy className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={testCustom} disabled={testing || !draft.endpoint} className="gap-1.5 border-amber-glow/40 text-amber-glow hover:bg-amber-glow/10">
                      {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} test connection
                    </Button>
                    {testResult && <ResultPill result={testResult} />}
                  </div>
                  <a href="https://github.com/ollama/ollama/blob/main/docs/openai.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono-display text-[10px] text-muted-foreground dotted-link hover:text-primary">local OpenAI-compatible server docs <ExternalLink className="h-2.5 w-2.5" /></a>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="font-mono-display text-[10px] text-muted-foreground">
                Auto routes need no setup. Private provider keys stay server-side and encrypted.
              </span>
              <Button size="sm" onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModeButton({ active, icon, title, detail, onClick }: { active: boolean; icon: React.ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        active ? "border-primary/50 bg-primary/10" : "border-border bg-card/40 hover:bg-card/70"
      )}
    >
      <div className="flex items-center gap-2 font-mono-display text-xs font-bold text-primary">{icon}{title}</div>
      <p className="mt-1 font-mono-display text-[10px] text-muted-foreground">{detail}</p>
    </button>
  );
}

function ResultPill({ result }: { result: { ok: boolean; msg: string } }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 font-mono-display text-[10px]", result.ok ? "border-primary/40 bg-primary/10 text-primary" : "border-hydra/40 bg-hydra/10 text-hydra")}>
      {result.ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      <span className="truncate">{result.msg}</span>
    </span>
  );
}
