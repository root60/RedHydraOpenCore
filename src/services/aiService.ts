/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RedHydra OpenCore AI service.
 *
 * Default AI backend:
 * https://itsredhydra-redhydraopencore-dolphin.hf.space
 *
 * Default base model:
 * dphn/Dolphin3.0-Qwen2.5-0.5B
 */

import { AISettings, Message, AgentPlan } from "../types";
import {
  ASSISTANT_SYSTEM_INSTRUCTIONS,
  AGENT_SYSTEM_PROMPT,
  getStyleInstruction,
} from "../utils/prompts";

const DEFAULT_BASE_MODEL = "dphn/Dolphin3.0-Qwen2.5-0.5B";
const DEFAULT_LLM_ENDPOINT = "https://itsredhydra-redhydraopencore-dolphin.hf.space";

type AgentStatus = "pending" | "running" | "completed" | "failed";

function createId(prefix = "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLastUserMessage(messages: Message[]) {
  return [...messages].reverse().find((m) => m.role === "user")?.content?.trim() || "";
}

function getModelName(settings: AISettings) {
  return (
    (import.meta as any)?.env?.VITE_REDHYDRA_BASE_MODEL ||
    settings.modelName ||
    DEFAULT_BASE_MODEL
  );
}

function getCloudEndpoint() {
  const envEndpoint =
    (import.meta as any)?.env?.VITE_REDHYDRA_LLM_ENDPOINT ||
    (import.meta as any)?.env?.VITE_CLOUD_LLM_ENDPOINT ||
    DEFAULT_LLM_ENDPOINT;

  const storedEndpoint =
    typeof window !== "undefined"
      ? window.localStorage.getItem("redhydra_llm_endpoint") || ""
      : "";

  return String(storedEndpoint || envEndpoint || DEFAULT_LLM_ENDPOINT)
    .trim()
    .replace(/\/$/, "");
}

function cleanText(text: string) {
  return String(text || "")
    .replace(/\[GOAL\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[UNDERSTANDING\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[PLAN\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[OUTPUT\]/gi, "")
    .replace(/\[CHECKLIST\][\s\S]*?(?=\[LIMITATIONS\]|\[NEXT_ACTION\]|$)/gi, "")
    .replace(/\[LIMITATIONS\][\s\S]*?(?=\[NEXT_ACTION\]|$)/gi, "")
    .replace(/\[NEXT_ACTION\]/gi, "")
    .replace(/PROXIED:\/\/[^\n]+/gi, "")
    .replace(/built[- ]?in[- ]?opencore/gi, "")
    .replace(/hydra-opencore-v\d+/gi, "")
    .replace(/provider:\s*`?[^`\n]+`?/gi, "")
    .replace(/model:\s*`?[^`\n]+`?/gi, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function streamText(text: string, onChunk?: (text: string) => void) {
  if (!onChunk) return;

  let index = 0;
  const step = 10;

  const timer = window.setInterval(() => {
    index += step;
    onChunk(text.slice(0, index));

    if (index >= text.length) {
      onChunk(text);
      window.clearInterval(timer);
    }
  }, 12);
}

function includesAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function extractWeatherLocation(text: string) {
  const patterns = [
    /weather\s+(?:today\s+)?(?:in|at|for)\s+([a-zA-Z\s,.-]{2,60})/i,
    /(?:in|at|for)\s+([a-zA-Z\s,.-]{2,60})\s+(?:weather|temperature)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/[?.!]+$/g, "").trim();
  }

  if (text.toLowerCase().includes("dhaka")) return "Dhaka";
  return "";
}

async function getWeatherAnswer(userText: string) {
  const location = extractWeatherLocation(userText);
  if (!location) return "Which city should I check the weather for?";

  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) throw new Error("weather failed");

    const data = await response.json();
    const current = data?.current_condition?.[0];
    const area =
      data?.nearest_area?.[0]?.areaName?.[0]?.value ||
      data?.nearest_area?.[0]?.region?.[0]?.value ||
      location;

    if (!current) throw new Error("weather empty");

    return `Weather in ${area}: ${current.weatherDesc?.[0]?.value || "unavailable"}, ${current.temp_C}°C.
Feels like ${current.FeelsLikeC}°C. Humidity ${current.humidity}%, wind ${current.windspeedKmph} km/h.`;
  } catch {
    return `I could not fetch live weather for ${location}.
Try again with city and country name.`;
  }
}

function extractAttachment(content: string) {
  const nameMatch = content.match(/\[ATTACHED FILE:\s*"([^"]+)"/i);
  const bodyMatch = content.match(
    /--- ATTACHMENT CONTENT START ---\n([\s\S]*?)\n--- ATTACHMENT CONTENT END ---/i
  );

  return {
    name: nameMatch?.[1] || "attached file",
    body: bodyMatch?.[1]?.trim() || "",
  };
}

async function fallbackAnswer(messages: Message[]) {
  const text = getLastUserMessage(messages);
  const lower = text.toLowerCase();
  const attachment = extractAttachment(text);

  if (text.includes("--- ATTACHMENT CONTENT START ---")) {
    const preview = attachment.body
      ? attachment.body.slice(0, 1200) + (attachment.body.length > 1200 ? "\n..." : "")
      : "I could not read the attached file content.";

    return `I found ${attachment.name}.

${preview}

Tell me what you want changed in it.`;
  }

  if (includesAny(lower, ["weather", "temperature", "forecast", "rain today"])) {
    return getWeatherAnswer(text);
  }

  if (includesAny(lower, ["hello", "hi", "hey"])) {
    return "Hi, I’m RedHydra OpenCore.\nHow can I help?";
  }

  if (includesAny(lower, ["who are you", "your name"])) {
    return "I’m RedHydra OpenCore, powered by the Dolphin AI backend.";
  }

  if (includesAny(lower, ["exit code 1", "process completed with exit code 1"])) {
    return "Exit code 1 means the build failed. The real cause is usually above that line. Send the full error section above it and I’ll give the exact fix.";
  }

  if (includesAny(lower, ["not exported", "is not exported", "imported by"])) {
    return `That is an import/export mismatch.
Export the missing item from the source file, or update the import to the correct exported name. Send both files and I’ll write the exact patch.`;
  }

  if (includesAny(lower, ["vite", "build failed", "typescript", "react", "github pages", "workflow"])) {
    return "Send the full build log, especially the first error above “Process completed with exit code 1.” I’ll fix the exact file.";
  }

  if (includesAny(lower, ["fix", "bug", "error", "code", "script"])) {
    return `Send the code or full error log.
I’ll give the corrected version directly.`;
  }

  if (text.trim().endsWith("?")) {
    return "I can help. Add one more detail so I can answer accurately.";
  }

  return `Got it.
Send the details you want me to work on.`;
}

function getSystemInstruction(settings: AISettings, isAgentMode: boolean) {
  let instruction =
    ASSISTANT_SYSTEM_INSTRUCTIONS[settings.assistantMode] ||
    ASSISTANT_SYSTEM_INSTRUCTIONS.general;

  const styleInstruction = getStyleInstruction(settings.responseStyle);

  if (styleInstruction) instruction += "\n\n" + styleInstruction;

  if (settings.customSystemPrompt) {
    instruction += "\n\nUser instruction: " + settings.customSystemPrompt;
  }

  if (isAgentMode) instruction += "\n\n" + AGENT_SYSTEM_PROMPT;

  return instruction;
}

function normalizeMessages(messages: Message[]) {
  return messages.map((message) => {
    if (!message.attachment) return message;

    const readableContent = getReadableAttachmentContent(message.attachment);

    return {
      ...message,
      content: `[ATTACHED FILE: "${message.attachment.name}" (${message.attachment.type}, size: ${message.attachment.size} bytes)]
--- ATTACHMENT CONTENT START ---
${readableContent}
--- ATTACHMENT CONTENT END ---
${message.content}`,
    };
  });
}

async function callCloudProxy(
  messages: Message[],
  settings: AISettings,
  isAgentMode: boolean,
  onChunk?: (text: string) => void
) {
  const endpoint = getCloudEndpoint();

  if (!endpoint) throw new Error("No cloud endpoint configured.");

  const response = await fetch(`${endpoint}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getModelName(settings),
      messages: messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      system: getSystemInstruction(settings, isAgentMode),
      stream: true,
    }),
  });

  if (!response.ok) throw new Error("Cloud response failed.");

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream") && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) continue;

        const data = dataLine.replace(/^data:\s*/, "").trim();
        if (!data || data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta =
            parsed.text ||
            parsed.choices?.[0]?.delta?.content ||
            parsed.choices?.[0]?.message?.content ||
            "";

          if (delta) {
            fullText += delta;
            onChunk?.(cleanText(fullText));
          }
        } catch {
          fullText += data;
          onChunk?.(cleanText(fullText));
        }
      }
    }

    return cleanText(fullText);
  }

  const data = await response.json();

  return cleanText(
    data.text ||
      data.reply ||
      data.response ||
      data.message ||
      data.choices?.[0]?.message?.content ||
      ""
  );
}

async function callOpenAICompatibleProvider(
  messages: Message[],
  settings: AISettings,
  systemInstruction: string
) {
  if (!settings.baseUrl || (!settings.apiKey && settings.provider !== "ollama")) {
    throw new Error("Provider is not configured.");
  }

  const baseUrl = settings.baseUrl.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: getModelName(settings),
      messages: [
        { role: "system", content: systemInstruction },
        ...messages
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) throw new Error("Provider failed.");

  const data = await response.json();

  return cleanText(data.choices?.[0]?.message?.content || "");
}

export function parseAgentResponse(text: string): AgentPlan {
  const output = cleanText(text);

  return {
    goal: "Answer directly",
    understanding: "Clean user-facing response.",
    steps: [
      {
        id: "step-1",
        title: "Respond",
        description: "Return the answer",
        status: "completed" as AgentStatus,
      },
    ],
    output,
    validationChecklist: [],
    limitations: [],
    nextAction: "",
  };
}

export function getReadableAttachmentContent(attachment: {
  type: string;
  content: string;
}): string {
  if (!attachment.content) return "";

  if (!attachment.content.startsWith("data:")) return attachment.content;

  const commaIndex = attachment.content.indexOf(",");
  if (commaIndex === -1) return attachment.content;

  const base64Part = attachment.content.substring(commaIndex + 1);
  const mimeType = (attachment.type || "").toLowerCase();

  const isTextType =
    mimeType.startsWith("text/") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml") ||
    mimeType.includes("markdown") ||
    mimeType.includes("css") ||
    mimeType.includes("csv") ||
    mimeType.includes("sql") ||
    mimeType.includes("shell") ||
    mimeType.includes("config");

  if (!isTextType) return "This file is not readable as plain text in the browser.";

  try {
    const binaryString = window.atob(base64Part);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "Could not decode this attachment.";
  }
}

function createAssistantMessage(text: string, isAgentMode: boolean): Message {
  const content = cleanText(text) || "How can I help?";

  const message: Message = {
    id: createId(),
    role: "assistant",
    content,
    timestamp: new Date().toLocaleTimeString(),
  };

  if (isAgentMode) {
    message.agentPlan = parseAgentResponse(content);
  }

  return message;
}

export async function sendChatMessage(
  messages: Message[],
  settings: AISettings,
  isAgentMode: boolean,
  onChunk?: (text: string) => void
): Promise<Message> {
  const normalizedMessages = normalizeMessages(messages);
  const endpoint = getCloudEndpoint();

  if (endpoint) {
    try {
      const text = await callCloudProxy(normalizedMessages, settings, isAgentMode, onChunk);
      return createAssistantMessage(text, isAgentMode);
    } catch {
      const fallback = await fallbackAnswer(normalizedMessages);
      const clean = cleanText(fallback);

      streamText(clean, onChunk);

      return createAssistantMessage(clean, isAgentMode);
    }
  }

  const provider = settings.provider || "built-in-opencore";
  const useFallback =
    provider === "built-in-opencore" ||
    provider === "opencore-local" ||
    provider === "local" ||
    provider === "free-opencore" ||
    provider === "cloud-proxy";

  let text = "";

  if (useFallback) {
    text = await fallbackAnswer(normalizedMessages);
  } else {
    try {
      text = await callOpenAICompatibleProvider(
        normalizedMessages,
        settings,
        getSystemInstruction(settings, isAgentMode)
      );
    } catch {
      text = await fallbackAnswer(normalizedMessages);
    }
  }

  const clean = cleanText(text);

  streamText(clean, onChunk);

  return createAssistantMessage(clean, isAgentMode);
}

