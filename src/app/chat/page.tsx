"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Sparkles,
  Volume2,
  Square,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  Mic,
  MicOff,
  Radio,
  Copy,
  Check,
  Download,
  RefreshCw,
  Zap,
  Paperclip,
  X,
  FileText,
  Bot,
} from "lucide-react";
import { useChat, type ConnStatus, type UploadedAttachment } from "@/hooks/use-chat";
import { CHAT_SUGGESTIONS, PERSONAS, SKILLS } from "@/lib/opencore";
import { Markdown } from "@/components/markdown";
import { ModelSettings } from "@/components/sections/model-settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PERSONA_ORDER = ["snarky", "sage", "gremlin"];

const VOICES = [
  { id: "browser", label: "Browser voice · instant fallback" },
  { id: "coral", label: "OpenAI Coral · natural" },
  { id: "marin", label: "OpenAI Marin · premium" },
  { id: "cedar", label: "OpenAI Cedar · premium" },
  { id: "alloy", label: "OpenAI Alloy · balanced" },
  { id: "nova", label: "OpenAI Nova · bright" },
  { id: "onyx", label: "OpenAI Onyx · deep" },
  { id: "sage", label: "OpenAI Sage · calm" },
  { id: "shimmer", label: "OpenAI Shimmer · light" },
];

export default function ChatPage() {
  const {
    persona,
    personaId,
    setPersonaId,
    messages,
    input,
    setInput,
    sending,
    speakingId,
    scrollRef,
    send,
    speak,
    reset,
    regenerate,
    exportMarkdown,
    activeSkill,
    setActiveSkill,
    voiceId,
    setVoiceId,
    connStatus,
    modelConfig,
    setModelConfig,
  } = useChat("snarky");

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showSkills, setShowSkills] = React.useState(false);
  const [showModelSettings, setShowModelSettings] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [autoVoice, setAutoVoice] = React.useState(false);
  const [agentMode, setAgentMode] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadedAttachment[]>([]);
  const [fileReading, setFileReading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);
  const spokenReplyRef = React.useRef<string | null>(null);

  // Load saved model config, normalize old defaults, then warm the gateway once on page visit.
  React.useEffect(() => {
    let cancelled = false;
    import("@/components/sections/model-settings").then(({ loadConfig, saveConfig, DEFAULT_CONFIG }) => {
      if (cancelled) return;
      const saved = loadConfig();
      const next = saved.mode === "gateway" ? { ...saved, model: saved.model || DEFAULT_CONFIG.model } : saved;
      setModelConfig(next);
      saveConfig(next);

      if (next.mode === "gateway") {
        fetch("/api/gateway/connection-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: next.model || DEFAULT_CONFIG.model }),
        }).catch(() => undefined);
      }
    });
    return () => { cancelled = true; };
  }, [setModelConfig]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setVoiceSupported(Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    try {
      const savedAutoVoice = localStorage.getItem("opencore:auto-voice");
      if (savedAutoVoice === "1") setAutoVoice(true);
      const savedAgentMode = localStorage.getItem("opencore:agent-mode");
      if (savedAgentMode === "1") setAgentMode(true);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("opencore:auto-voice", autoVoice ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [autoVoice]);

  React.useEffect(() => {
    try {
      localStorage.setItem("opencore:agent-mode", agentMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [agentMode]);

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop?.();
    setListening(false);
  }, []);

  const toggleListening = React.useCallback(() => {
    if (listening) {
      stopListening();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("voice input unavailable", { description: "Use Chrome/Edge, or type your prompt." });
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    let finalTranscript = input.trim() ? `${input.trim()} ` : "";
    recognition.onstart = () => {
      setListening(true);
      toast("🎙️ listening", { description: "Speak now. Click the mic again to stop." });
    };
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalTranscript += transcript.trim() + " ";
        else interim += transcript;
      }
      setInput(`${finalTranscript}${interim}`.trimStart());
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      toast.error("voice input stopped", { description: event?.error || "microphone permission or browser issue" });
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [input, listening, setInput, stopListening]);

  React.useEffect(() => {
    return () => recognitionRef.current?.stop?.();
  }, []);

  // "p" cycles personas, ⌘E exports, ⌘R resets
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘E / Ctrl+E — export
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportMarkdown();
        return;
      }
      // ⌘R / Ctrl+R — reset (override browser refresh within the chat app)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        reset();
        toast("chat reset");
        return;
      }
      if (e.key === "p" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setPersonaId((prev: string) => {
          const idx = PERSONA_ORDER.indexOf(prev);
          const next = PERSONA_ORDER[(idx + 1) % PERSONA_ORDER.length];
          const p = PERSONAS.find((x) => x.id === next);
          if (p) toast(`🐉 persona → ${p.name}`, { description: p.tagline });
          return next;
        });
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setPersonaId, exportMarkdown, reset]);

  const readFilePreview = (file: File) =>
    new Promise<UploadedAttachment>((resolve) => {
      const maxChars = 18000;
      const readableByType = file.type.startsWith("text/") || file.type.includes("json") || file.type.includes("xml") || file.type.includes("csv");
      const readableByName = /\.(txt|md|markdown|json|csv|ts|tsx|js|jsx|py|java|c|cpp|cs|go|rs|php|rb|html|css|scss|xml|yaml|yml|toml|ini|log|env|sql|sh|bat|ps1)$/i.test(file.name);
      if (!readableByType && !readableByName) {
        resolve({ id: crypto.randomUUID(), name: file.name, type: file.type || "unknown", size: file.size });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || "");
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          text: raw.slice(0, maxChars),
          truncated: raw.length > maxChars,
        });
      };
      reader.onerror = () => resolve({ id: crypto.randomUUID(), name: file.name, type: file.type || "unknown", size: file.size });
      reader.readAsText(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFileReading(true);
    try {
      const next = await Promise.all(Array.from(files).map(readFilePreview));
      setUploads((current) => [...current, ...next].slice(0, 12));
      toast.success(`${next.length} file${next.length === 1 ? "" : "s"} attached`, {
        description: "Text/code files include previews; binary files include metadata.",
      });
    } finally {
      setFileReading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitCurrent = () => {
    send(input, { attachments: uploads, agentMode });
    setUploads([]);
  };

  const copyMsg = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    toast.success("copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lastHydra = [...messages].reverse().find((m) => m.role === "hydra" && m.id !== "welcome");

  React.useEffect(() => {
    if (!autoVoice || !lastHydra || lastHydra.streaming || !lastHydra.text.trim()) return;
    if (spokenReplyRef.current === lastHydra.id) return;
    spokenReplyRef.current = lastHydra.id;
    speak(lastHydra);
  }, [autoVoice, lastHydra?.id, lastHydra?.streaming, lastHydra?.text, speak]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group inline-flex min-w-0 items-center gap-2 font-mono-display text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">back to opencore</span>
            <span className="sm:hidden">back</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hydra/40 bg-hydra/10 text-sm">
              {persona.emoji}
            </span>
            <span className={cn("max-w-[9rem] truncate font-mono-display text-xs font-bold sm:max-w-none", persona.accent)}>
              {persona.name}
            </span>
            <ConnBadge status={connStatus} />
          </div>
        </div>
      </header>

      {/* mobile and tablet controls */}
      <section className="border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-6xl gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="font-mono-display text-[9px] uppercase tracking-widest text-muted-foreground">persona</span>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 font-mono-display text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="font-mono-display text-[9px] uppercase tracking-widest text-muted-foreground">voice</span>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/70 px-3 py-2 font-mono-display text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mx-auto mt-2 flex max-w-6xl flex-wrap gap-2">
          <button
            onClick={() => setShowModelSettings(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-glow/35 bg-amber-glow/10 px-3 py-2 font-mono-display text-[10px] text-amber-glow sm:flex-none"
          >
            <Zap className="h-3 w-3" /> model settings
          </button>
          <button
            onClick={() => setAutoVoice((v) => !v)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-mono-display text-[10px] sm:flex-none",
              autoVoice ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card/60 text-muted-foreground"
            )}
          >
            <Radio className="h-3 w-3" /> {autoVoice ? "auto voice on" : "auto voice"}
          </button>
          <button
            onClick={() => setAgentMode((v) => !v)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-mono-display text-[10px] sm:flex-none",
              agentMode ? "border-hydra/40 bg-hydra/10 text-hydra" : "border-border bg-card/60 text-muted-foreground"
            )}
          >
            <Bot className="h-3 w-3" /> {agentMode ? "agent on" : "agent mode"}
          </button>
          <button
            onClick={exportMarkdown}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 font-mono-display text-[10px] text-muted-foreground sm:flex-none"
          >
            <Download className="h-3 w-3" /> export
          </button>
          <button
            onClick={reset}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 font-mono-display text-[10px] text-muted-foreground sm:flex-none"
          >
            <RotateCcw className="h-3 w-3" /> reset
          </button>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-0 sm:px-6 lg:gap-6 lg:px-8 lg:py-6">
        {/* persona sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 space-y-3">
            <p className="px-1 font-mono-display text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// "}persona
            </p>
            {PERSONAS.map((p) => {
              const isActive = p.id === personaId;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersonaId(p.id)}
                  className={cn(
                    "lift-card flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card/40 hover:bg-card/70"
                  )}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className={cn("font-mono-display text-xs font-bold", p.accent)}>
                      {p.name}
                    </p>
                    <p className="truncate font-mono-display text-[10px] text-muted-foreground">
                      {p.tagline}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* voice selector */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-3">
              <p className="flex items-center gap-1.5 font-mono-display text-[10px] uppercase tracking-wider text-amber-glow">
                <Volume2 className="h-3 w-3" /> voice
              </p>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono-display text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAutoVoice((v) => !v)}
                className={cn(
                  "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-mono-display text-[10px] transition-colors",
                  autoVoice ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background/50 text-muted-foreground hover:text-primary"
                )}
              >
                <Radio className="h-3 w-3" /> {autoVoice ? "auto-speak replies: on" : "auto-speak replies"}
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Server voices use <code className="rounded bg-secondary/50 px-1">OPENAI_API_KEY</code>; without it, the browser voice speaks instantly.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-3">
              <button
                onClick={() => setAgentMode((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono-display text-[10px] transition-colors",
                  agentMode ? "border-hydra/40 bg-hydra/10 text-hydra" : "border-border bg-background/50 text-muted-foreground hover:text-hydra"
                )}
              >
                <span className="inline-flex items-center gap-1.5"><Bot className="h-3 w-3" /> live agent mode</span>
                <span>{agentMode ? "on" : "off"}</span>
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Interactive workers plan, build, review, and report inside this chat session.
              </p>
            </div>

            {/* model card — shows current mode, click to configure custom endpoint */}
            <button
              onClick={() => setShowModelSettings(true)}
              className="w-full rounded-xl border border-border/60 bg-card/40 p-3 text-left transition-colors hover:border-amber-glow/40"
            >
              <p className="flex items-center gap-1.5 font-mono-display text-[10px] uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3 w-3 text-amber-glow" /> model
                <span className="ml-auto rounded border border-border/60 bg-background/50 px-1 py-px text-[8px] text-muted-foreground">
                  configure →
                </span>
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono-display text-[11px] font-bold text-foreground">
                    {modelConfig.mode === "gateway"
                      ? modelConfig.model || "uncensored-auto"
                      : modelConfig.mode === "custom" && modelConfig.model
                        ? modelConfig.model
                        : "OpenCore router"}
                  </span>
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono-display text-[9px]",
                      modelConfig.mode === "gateway"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : modelConfig.mode === "custom"
                          ? "border-amber-glow/40 bg-amber-glow/10 text-amber-glow"
                          : "border-primary/30 bg-primary/10 text-primary"
                    )}
                  >
                    {modelConfig.mode === "gateway" ? "gateway" : modelConfig.mode === "custom" ? "custom" : "managed"}
                  </span>
                </div>
                <p className="font-mono-display text-[10px] leading-relaxed text-muted-foreground">
                  {modelConfig.mode === "gateway"
                    ? "auto uncensored route · local/keyless failover."
                    : modelConfig.mode === "custom"
                      ? `→ ${modelConfig.endpoint || "not configured"}`
                      : "safety guardrails on by design. click to bring your own endpoint."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="oc-chip">streaming</span>
                  <span className="oc-chip">sse</span>
                  {modelConfig.mode === "gateway" && (
                    <span className="oc-chip border-primary/40 text-primary">failover router</span>
                  )}
                  {modelConfig.mode === "custom" && (
                    <span className="oc-chip border-amber-glow/40 text-amber-glow">your model</span>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={exportMarkdown}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/40 px-3 py-2 font-mono-display text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Download className="h-3 w-3" /> export chat (.md)
            </button>
          </div>
        </aside>

        {/* chat column */}
        <div className="flex flex-1 flex-col lg:rounded-2xl lg:border lg:border-border lg:bg-card/40">
          {agentMode && (
            <div className="border-b border-hydra/25 bg-hydra/5 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 font-mono-display text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-hydra/40 bg-hydra/10 px-2 py-0.5 text-hydra"><Bot className="h-3 w-3" /> agent mode live</span>
                <span>planner</span><span>researcher</span><span>builder</span><span>reviewer</span><span>reporter</span>
                <span className="ml-auto hidden sm:inline">runs while this chat is open</span>
              </div>
            </div>
          )}
          {/* messages */}
          <div
            ref={scrollRef}
            className="oc-scroll flex-1 space-y-4 overflow-y-auto p-3 sm:p-6"
            style={{ minHeight: "calc(100vh - 20rem)" }}
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("group flex", m.role === "you" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[80%]",
                      m.role === "you"
                        ? "rounded-br-sm bg-secondary text-foreground"
                        : "rounded-bl-sm border border-hydra/30 bg-hydra/10 text-foreground"
                    )}
                  >
                    {m.role === "hydra" && (
                      <span className={cn("mb-1 flex items-center gap-1 font-mono-display text-[10px]", persona.accent)}>
                        <Sparkles className="h-3 w-3" /> {persona.id}
                        {m.skill && (
                          <span className="ml-1 rounded border border-border/60 bg-background/50 px-1 text-[9px] text-muted-foreground">
                            skill: {m.skill}
                          </span>
                        )}
                        {m.degraded && (
                          <span className="ml-1 rounded border border-hydra/40 bg-hydra/10 px-1 text-[9px] text-hydra">
                            degraded
                          </span>
                        )}
                      </span>
                    )}
                    {m.role === "you" ? (
                      <div className="space-y-2">
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        {m.attachments?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {m.attachments.map((file) => (
                              <span key={file.id} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/45 px-2 py-0.5 font-mono-display text-[9px] text-muted-foreground">
                                <FileText className="h-2.5 w-2.5" /> {file.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className={cn(m.streaming && m.text === "" && "stream-cursor")}>
                        <Markdown>{m.text || (m.streaming ? "" : "...")}</Markdown>
                        {m.streaming && m.text && <span className="stream-cursor" />}
                      </div>
                    )}
                    {/* action row */}
                    {m.role === "hydra" && m.id !== "welcome" && !m.streaming && (
                      <div className="mt-2 flex items-center gap-1 border-t border-border/40 pt-1.5">
                        <button
                          onClick={() => speak(m)}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-0.5 font-mono-display text-[10px] text-muted-foreground transition-colors hover:text-amber-glow"
                        >
                          {speakingId === m.id ? (
                            <>
                              <Square className="h-2.5 w-2.5" /> stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-2.5 w-2.5" /> speak
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => copyMsg(m.id, m.text)}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-0.5 font-mono-display text-[10px] text-muted-foreground transition-colors hover:text-primary"
                        >
                          {copiedId === m.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                          {copiedId === m.id ? "copied" : "copy"}
                        </button>
                        {m === lastHydra && (
                          <button
                            onClick={regenerate}
                            disabled={sending}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-0.5 font-mono-display text-[10px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                          >
                            <RefreshCw className="h-2.5 w-2.5" /> regenerate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && messages[messages.length - 1]?.role === "you" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-bl-sm border border-hydra/30 bg-hydra/10 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-hydra [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-amber-glow [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                    <span className="ml-1 font-mono-display text-[10px] text-muted-foreground">
                      the hydra is thinking…
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* skills bar */}
          <div className="border-t border-border/60 px-3 py-2 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSkills((s) => !s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-display text-[10px] uppercase tracking-wider transition-colors",
                  showSkills || activeSkill
                    ? "border-amber-glow/50 bg-amber-glow/10 text-amber-glow"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-3 w-3" /> skills
              </button>
              {activeSkill && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-glow/40 bg-amber-glow/10 px-2 py-0.5 font-mono-display text-[10px] text-amber-glow">
                  {activeSkill.icon} {activeSkill.name}
                  <button onClick={() => setActiveSkill(null)} className="ml-0.5 hover:text-foreground">
                    ×
                  </button>
                </span>
              )}
              <span className="ml-auto hidden font-mono-display text-[10px] text-muted-foreground sm:inline">
                tip: type <code className="rounded bg-secondary/50 px-1">/summarize</code> or pick a skill
              </span>
            </div>
            <AnimatePresence>
              {showSkills && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SKILLS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActiveSkill(s);
                          setShowSkills(false);
                          toast(`skill: ${s.name}`, { description: s.example });
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono-display text-[10px] transition-colors",
                          activeSkill?.id === s.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{s.icon}</span> {s.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* suggestion chips (only when chat is fresh) */}
          {messages.length <= 1 && (
            <div className="border-t border-border/60 px-4 py-3 sm:px-6">
              <p className="mb-2 font-mono-display text-[10px] uppercase tracking-wider text-muted-foreground">
                {"// "}try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s, { agentMode })}
                    disabled={sending}
                    className="glow-border rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-left text-xs text-foreground/85 transition-colors hover:bg-secondary/60 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCurrent();
            }}
            className="border-t border-border/60 bg-secondary/20 p-2.5 sm:p-4"
          >
            <input ref={fileInputRef} type="file" multiple accept="*/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            {uploads.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {uploads.map((file) => (
                  <span key={file.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2 py-1 font-mono-display text-[10px] text-muted-foreground">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <button type="button" onClick={() => setUploads((items) => items.filter((item) => item.id !== file.id))} className="text-muted-foreground hover:text-hydra" aria-label={`Remove ${file.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button type="button" onClick={() => setUploads([])} className="rounded-lg border border-border px-2 py-1 font-mono-display text-[10px] text-muted-foreground hover:text-hydra">clear</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!voiceSupported}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-40",
                  listening
                    ? "border-hydra/50 bg-hydra/15 text-hydra"
                    : "border-amber-glow/30 bg-amber-glow/10 text-amber-glow hover:bg-amber-glow/20"
                )}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={voiceSupported ? "Click to talk" : "Speech recognition not supported in this browser"}
              >
                {listening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fileReading}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                aria-label="Attach files"
                title="Attach any file type"
              >
                {fileReading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitCurrent();
                  }
                }}
                placeholder={
                  activeSkill
                    ? `${activeSkill.prompt} …`
                    : "message OpenCore…  (shift+enter for newline, / for skills)"
                }
                rows={1}
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-background/60 px-4 py-2.5 font-mono-display text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={reset}
                className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary sm:grid"
                aria-label="Reset chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={sending || (!input.trim() && uploads.length === 0)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center font-mono-display text-[10px] text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3 w-3 text-primary" />
              {listening ? "listening live… click mic to stop" : agentMode ? "live agent mode · files accepted · session not stored" : autoVoice ? "streaming · auto voice enabled · session not stored" : "streaming · files + voice ready · session not stored"}
            </p>
          </form>
        </div>
      </main>

      {/* model settings panel — bring your own endpoint */}
      <ModelSettings
        open={showModelSettings}
        onClose={() => setShowModelSettings(false)}
        config={modelConfig}
        onSave={setModelConfig}
      />
    </div>
  );
}

/** Live connection-status badge — reflects the streaming state in real time. */
function ConnBadge({ status }: { status: ConnStatus }) {
  const meta: Record<ConnStatus, { label: string; dot: string; text: string; border: string; bg: string }> = {
    idle: { label: "ready", dot: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border", bg: "bg-card/40" },
    connecting: { label: "connecting", dot: "bg-amber-glow", text: "text-amber-glow", border: "border-amber-glow/40", bg: "bg-amber-glow/10" },
    streaming: { label: "streaming", dot: "bg-primary", text: "text-primary", border: "border-primary/40", bg: "bg-primary/10" },
    done: { label: "done", dot: "bg-primary", text: "text-primary", border: "border-primary/30", bg: "bg-primary/5" },
    error: { label: "retrying", dot: "bg-hydra", text: "text-hydra", border: "border-hydra/40", bg: "bg-hydra/10" },
  };
  const m = meta[status];
  return (
    <span
      className={cn(
        "hidden items-center gap-1 rounded-full border px-2 py-0.5 font-mono-display text-[9px] sm:inline-flex",
        m.border,
        m.bg,
        m.text
      )}
    >
      <span className={cn("live-dot h-1 w-1 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}
