"use client";

import * as React from "react";
import { PERSONAS, SKILLS, type Skill } from "@/lib/opencore";
import { toast } from "sonner";
import type { ModelConfig } from "@/components/sections/model-settings";

export type UploadedAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  text?: string;
  truncated?: boolean;
};

export type SendOptions = {
  attachments?: UploadedAttachment[];
  agentMode?: boolean;
};

export type ChatMsg = {
  id: string;
  role: "you" | "hydra";
  text: string;
  audio?: HTMLAudioElement;
  streaming?: boolean;
  degraded?: boolean;
  skill?: string;
  promptedText?: string;
  attachments?: UploadedAttachment[];
  agentMode?: boolean;
};

export type ConnStatus = "idle" | "connecting" | "streaming" | "done" | "error";

type ApiMessage = { role: "system" | "user" | "assistant"; content: string };

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "hydra",
  text:
    "hey — i'm RedHydra, your local-first assistant. upload files, toggle agent mode for bigger tasks, or ask me anything. default route auto-loads uncensored/keyless profiles first.",
};

const AGENT_MODE_PROMPT = `You are in OpenCore live agent mode. Act like a small team of interactive workers inside the current chat session: Planner, Researcher, Builder, Reviewer, and Reporter. Break complex work into visible steps, ask for missing information only when truly blocking, make reasonable assumptions, complete as much as possible now, and report progress/checks. Do not claim you will keep working after the browser tab or server stops.`;

function formatAttachments(attachments: UploadedAttachment[] = []) {
  if (!attachments.length) return "";
  return [
    "Attached files for this request:",
    ...attachments.map((file, index) => {
      const header = `${index + 1}. ${file.name} (${file.type || "unknown type"}, ${Math.round(file.size / 1024)} KB)`;
      if (!file.text) return `${header}\n   Content preview unavailable in browser; use filename/type/size as context.`;
      return `${header}\n--- file text preview${file.truncated ? " (truncated)" : ""} ---\n${file.text}\n--- end file preview ---`;
    }),
  ].join("\n\n");
}

function parseSlashCommand(input: string): { skill?: Skill; rest: string } {
  const match = input.match(/^\/(\w+)\s*([\s\S]*)/);
  if (!match) return { rest: input };
  const cmd = match[1].toLowerCase();
  const rest = match[2] ?? "";
  const skill = SKILLS.find(
    (s) => s.id === cmd || s.name.toLowerCase().replace(/\s+/g, "-") === cmd
  );
  return { skill, rest };
}

function browserFrame(cb: () => void) {
  if (typeof requestAnimationFrame === "function") return requestAnimationFrame(cb);
  const timer = window.setTimeout(cb, 16);
  return timer as unknown as number;
}

function cancelBrowserFrame(id: number) {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else window.clearTimeout(id);
}


function browserTts(text: string, voiceHint: string, personaId: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      reject(new Error("browser speech synthesis unavailable"));
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1800));
    utterance.rate = personaId === "gremlin" ? 1.08 : personaId === "sage" ? 0.92 : 1;
    utterance.pitch = personaId === "gremlin" ? 1.12 : personaId === "sage" ? 0.92 : 1;
    utterance.volume = 1;
    const voices = synth.getVoices();
    const lowerHint = voiceHint.toLowerCase();
    const preferred = voices.find((v) => v.name.toLowerCase().includes(lowerHint))
      || voices.find((v) => /^en[-_]/i.test(v.lang))
      || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("browser voice failed"));
    synth.speak(utterance);
  });
}

async function streamCompletion(
  messages: ApiMessage[],
  personaId: string,
  onDelta: (acc: string) => void,
  onStatus: (s: ConnStatus) => void,
  config: ModelConfig
): Promise<{ ok: boolean; finalText: string }> {
  onStatus("connecting");

  const isCustom = config.mode === "custom" && Boolean(config.endpoint);
  const isGateway = config.mode === "gateway";
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const url = isGateway ? "/v1/chat/completions" : isCustom ? "/api/chat/custom" : "/api/chat/stream";
  const chatMessages = messages.filter((m) => m.role !== "system");
  const gatewayMessages: ApiMessage[] = [{ role: "system", content: persona.systemPrompt }, ...chatMessages];

  const payload: Record<string, unknown> = isGateway
    ? {
        model: config.model || "auto",
        messages: gatewayMessages,
        stream: true,
        temperature: 0.7,
      }
    : isCustom
      ? {
          messages: chatMessages,
          persona: personaId,
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          model: config.model || "gpt-3.5-turbo",
          stream: true,
        }
      : { messages: chatMessages, persona: personaId };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "stream failed");
  }

  onStatus("streaming");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  let pendingFlush = false;
  let rafId: number | null = null;

  const scheduleFlush = (latest: string) => {
    acc = latest;
    if (pendingFlush) return;
    pendingFlush = true;
    rafId = browserFrame(() => {
      pendingFlush = false;
      onDelta(acc);
    });
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        for (const rawLine of evt.split("\n")) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const obj = JSON.parse(data);
            const delta = obj.delta ?? obj?.choices?.[0]?.delta?.content ?? obj?.choices?.[0]?.text ?? "";
            if (typeof delta === "string" && delta) scheduleFlush(acc + delta);
            if (obj.error) throw new Error(obj.error?.message ?? obj.error);
          } catch (err) {
            // Partial JSON chunks are expected; keep buffering.
          }
        }
      }
    }
    if (rafId !== null) cancelBrowserFrame(rafId);
    onDelta(acc);
    onStatus("done");
    return { ok: true, finalText: acc };
  } catch {
    if (rafId !== null) cancelBrowserFrame(rafId);
    onDelta(acc);
    onStatus("error");
    return { ok: false, finalText: acc };
  }
}

export function useChat(initialPersonaId = "snarky") {
  const [personaId, setPersonaId] = React.useState(initialPersonaId);
  const [messages, setMessages] = React.useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);
  const [activeSkill, setActiveSkill] = React.useState<Skill | null>(null);
  const [voiceId, setVoiceId] = React.useState<string>("browser");
  const [connStatus, setConnStatus] = React.useState<ConnStatus>("idle");
  const [modelConfig, setModelConfig] = React.useState<ModelConfig>({
    mode: "gateway",
    endpoint: "",
    apiKey: "",
    model: "uncensored-auto",
  });
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const persona = React.useMemo(
    () => PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0],
    [personaId]
  );

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const buildApiMessages = React.useCallback((items: ChatMsg[]) => {
    return items
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: (m.role === "you" ? "user" : "assistant") as "user" | "assistant",
        content: m.promptedText ?? m.text,
      }));
  }, []);

  const send = React.useCallback(
    async (text: string, options: SendOptions = {}) => {
      const content = text.trim();
      const attachments = options.attachments || [];
      if ((!content && attachments.length === 0) || sending) return;

      const { skill, rest } = parseSlashCommand(content);
      const finalSkill = skill ?? activeSkill;
      const attachmentContext = formatAttachments(attachments);
      const visibleAttachmentLine = attachments.length
        ? `\n\n📎 ${attachments.length} file${attachments.length === 1 ? "" : "s"}: ${attachments.map((f) => f.name).join(", ")}`
        : "";
      const sections = [
        options.agentMode ? AGENT_MODE_PROMPT : "",
        attachmentContext,
        finalSkill ? finalSkill.prompt : "",
        rest || content || "Please analyze the attached files.",
      ].filter(Boolean);
      const userText = sections.join("\n\n");

      const userMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "you",
        text: `${content || "Analyze the attached files."}${visibleAttachmentLine}`,
        promptedText: userText,
        skill: finalSkill?.id,
        attachments,
        agentMode: options.agentMode,
      };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setSending(true);
      setActiveSkill(null);

      const replyId = crypto.randomUUID();
      setMessages((m) => [...m, { id: replyId, role: "hydra", text: "", streaming: true }]);

      const apiMessages = buildApiMessages(history);
      const onDelta = (acc: string) => {
        setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, text: acc } : msg)));
      };

      let result: { ok: boolean; finalText: string };
      try {
        result = await streamCompletion(apiMessages, persona.id, onDelta, setConnStatus, modelConfig);
      } catch {
        result = { ok: false, finalText: "" };
      }

      if (!result.ok) {
        const needsFallback = modelConfig.mode === "custom" || modelConfig.mode === "gateway";
        if (needsFallback) {
          // Keep the chat moving quietly; the fallback route is also the uncensored/keyless gateway.
        }
        try {
          setConnStatus("connecting");
          const res2 = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages, persona: persona.id }),
          });
          if (!res2.ok) throw new Error("chat failed");
          const data = await res2.json();
          result = { ok: true, finalText: data.reply ?? "" };
          onDelta(result.finalText);
          setConnStatus("done");
        } catch {
          onDelta(result.finalText || "the selected model is unreachable right now. try another HF Space, start Ollama/LM Studio, or configure a provider in model settings.");
          setConnStatus("error");
          toast.error("chat offline", { description: "no reachable model provider" });
          setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, streaming: false, degraded: true } : msg)));
          setSending(false);
          return;
        }
      }

      setMessages((m) =>
        m.map((msg) => (msg.id === replyId ? { ...msg, text: result.finalText || msg.text, streaming: false } : msg))
      );
      setSending(false);
    },
    [messages, sending, persona.id, activeSkill, modelConfig, buildApiMessages]
  );

  const speak = React.useCallback(
    async (msg: ChatMsg) => {
      if (speakingId === msg.id) {
        msg.audio?.pause();
        if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      messages.forEach((m) => m.audio?.pause());
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingId(msg.id);
      const text = msg.text.slice(0, 1800);
      try {
        if (voiceId === "browser") {
          await browserTts(text, voiceId, persona.id);
          setSpeakingId(null);
          return;
        }
        const lastUser = [...messages].reverse().find((m) => m.role === "you");
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: voiceId,
            persona: persona.id,
            userInput: lastUser?.text || "",
          }),
        });
        if (!res.ok) throw new Error("server voice failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setSpeakingId(null);
        audio.onerror = () => setSpeakingId(null);
        msg.audio = audio;
        await audio.play();
      } catch {
        try {
          await browserTts(text, voiceId, persona.id);
        } catch {
          toast.error("voice blocked", { description: "Allow audio playback or add OPENAI_API_KEY for server TTS." });
        } finally {
          setSpeakingId(null);
        }
      }
    },
    [speakingId, messages, voiceId, persona.id]
  );

  const reset = React.useCallback(() => {
    messages.forEach((m) => m.audio?.pause());
    setMessages([WELCOME]);
    setSpeakingId(null);
    setActiveSkill(null);
    setConnStatus("idle");
  }, [messages]);

  const regenerate = React.useCallback(() => {
    if (sending) return;
    const lastHydraIndex = [...messages].map((m, index) => ({ m, index })).reverse().find((item) => item.m.role === "hydra" && item.m.id !== "welcome")?.index;
    if (lastHydraIndex === undefined) return;
    const trimmed = messages.slice(0, lastHydraIndex);
    const lastUser = [...trimmed].reverse().find((m) => m.role === "you");
    if (!lastUser) return;

    const replyId = crypto.randomUUID();
    setMessages([...trimmed, { id: replyId, role: "hydra", text: "", streaming: true }]);
    setSending(true);

    const apiMessages = buildApiMessages(trimmed);
    const onDelta = (acc: string) => {
      setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, text: acc } : msg)));
    };

    (async () => {
      let result = await streamCompletion(apiMessages, persona.id, onDelta, setConnStatus, modelConfig).catch(() => ({ ok: false, finalText: "" }));
      if (!result.ok) {
        try {
          const res2 = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages, persona: persona.id }),
          });
          const data = await res2.json();
          result = { ok: true, finalText: data.reply ?? "" };
          onDelta(result.finalText);
          setConnStatus("done");
        } catch {
          onDelta("regeneration failed — the hydra lost its train of thought.");
          setConnStatus("error");
        }
      }
      setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, streaming: false } : msg)));
      setSending(false);
    })();
  }, [sending, messages, persona.id, modelConfig, buildApiMessages]);

  const exportMarkdown = React.useCallback(() => {
    const md = messages
      .map((m) => {
        const meta = [m.agentMode ? "agent mode" : "", m.attachments?.length ? `${m.attachments.length} attachment(s)` : ""].filter(Boolean).join(" · ");
        const label = m.role === "you" ? "you" : persona.name;
        return `**${label}:**${meta ? ` _${meta}_` : ""} ${m.text}`;
      })
      .join("\n\n");
    const blob = new Blob([`# OpenCore conversation\n\n_persona: ${persona.name}_\n_model mode: ${modelConfig.mode}_\n\n${md}\n`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opencore-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("conversation exported", { description: "saved as .md" });
  }, [messages, persona.name, modelConfig.mode]);

  return {
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
  };
}
