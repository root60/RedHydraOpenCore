/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RedHydra OpenCore chat service.
 *
 * Goals:
 * - clean user-facing replies
 * - no provider/model/internal mode text in chat
 * - realtime streaming effect
 * - Agent Mode optional, not forced
 * - useful direct fallback when no user-owned provider is connected
 */

import { AISettings, Message, AgentPlan } from "../types";
import {
  ASSISTANT_SYSTEM_INSTRUCTIONS,
  AGENT_SYSTEM_PROMPT,
  getStyleInstruction,
} from "../utils/prompts";

type AgentStatus = "pending" | "running" | "completed" | "failed";

function createId(prefix = "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function lastUserText(messages: Message[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return lastUser?.content?.trim() || "";
}

function streamText(text: string, onChunk?: (text: string) => void) {
  if (!onChunk) return;

  let index = 0;
  const step = 12;
  const interval = window.setInterval(() => {
    index += step;
    onChunk(text.slice(0, index));

    if (index >= text.length) {
      onChunk(text);
      window.clearInterval(interval);
    }
  }, 12);
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
    .replace(/no-key local mode/gi, "")
    .replace(/local mode/gi, "")
    .replace(/provider:\s*`?[^`\n]+`?/gi, "")
    .replace(/model:\s*`?[^`\n]+`?/gi, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function includesAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
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

function extractWeatherLocation(text: string) {
  const lower = text.toLowerCase();

  const patterns = [
    /weather\s+(?:today\s+)?(?:in|at|for)\s+([a-zA-Z\s,.-]{2,60})/i,
    /(?:in|at|for)\s+([a-zA-Z\s,.-]{2,60})\s+(?:weather|temperature)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/[?.!]+$/g, "").trim();
    }
  }

  if (lower.includes("dhaka")) return "Dhaka";
  if (lower.includes("bangladesh")) return "Dhaka";

  return "";
}

async function getWeatherAnswer(userText: string) {
  const location = extractWeatherLocation(userText);

  if (!location) {
    return "Which city should I check the weather for?";
  }

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

    const condition = current.weatherDesc?.[0]?.value || "weather unavailable";
    const tempC = current.temp_C;
    const feelsC = current.FeelsLikeC;
    const humidity = current.humidity;
    const wind = current.windspeedKmph;

    return `Weather in ${area}: ${condition}, ${tempC}°C. Feels like ${feelsC}°C. Humidity ${humidity}%, wind ${wind} km/h.`;
  } catch {
    return `I could not fetch live weather for ${location}. Try again, or send the city and country name.`;
  }
}

async function getDirectFallbackAnswer(messages: Message[]) {
  const text = lastUserText(messages);
  const lower = text.toLowerCase();
  const attachment = extractAttachment(text);

  if (text.includes("--- ATTACHMENT CONTENT START ---")) {
    const preview = attachment.body
      ? attachment.body.slice(0, 1200) + (attachment.body.length > 1200 ? "\n..." : "")
      : "I could not read the attached file content.";

    return `I found ${attachment.name}.\n\n${preview}\n\nTell me what you want changed in it.`;
  }

  if (includesAny(lower, ["weather", "temperature", "rain today", "forecast"])) {
    return getWeatherAnswer(text);
  }

  if (includesAny(lower, ["hello", "hi", "hey"])) {
    return "Hi, I’m RedHydra OpenCore. How can I help?";
  }

  if (includesAny(lower, ["who are you", "your name", "what are you"])) {
    return "I’m RedHydra OpenCore.";
  }

  if (includesAny(lower, ["exit code 1", "process completed with exit code 1"])) {
    return "Exit code 1 only means the build failed. The real cause is usually a few lines above it. Send the full error section above “Build static frontend,” and I’ll give the exact fix.";
  }

  if (includesAny(lower, ["not exported", "is not exported", "imported by"])) {
    return "This is an import/export mismatch. Export the missing item from the source file, or change the importing file to use the correct exported name. Send both file names and I’ll write the exact fix.";
  }

  if (includesAny(lower, ["vite", "build failed", "typescript", "tsx", "react", "github actions", "github pages", "workflow"])) {
    return "Send the full build log, especially the first error above “Process completed with exit code 1.” I’ll fix the exact file causing it.";
  }

  if (includesAny(lower, ["fix", "bug", "error", "code", "script"])) {
    return "Send the code or full error log. I’ll give the corrected version directly.";
  }

  if (includesAny(lower, ["security", "owasp", "vulnerability", "xss", "sql injection", "csrf"])) {
    return "Share the code or scenario. I’ll give a safe defensive fix.";
  }

  if (text.trim().endsWith("?")) {
    return "I can help with that. Please add one more detail so I can answer accurately.";
  }

  return "Got it. Send the details you want me to work on.";
}

export function parseAgentResponse(text: string): AgentPlan {
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
    output: cleanText(text),
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

  if (!attachment.content.startsWith("data:")) {
    return attachment.content;
  }

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

  if (!isTextType) {
    return "This file is not readable as plain text in the browser.";
  }

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

function buildSystemInstruction(settings: AISettings, isAgentMode: boolean) {
  let instruction =
    ASSISTANT_SYSTEM_INSTRUCTIONS[settings.assistantMode] ||
    ASSISTANT_SYSTEM_INSTRUCTIONS.general;

  const styleInstruction = getStyleInstruction(settings.responseStyle);
  if (styleInstruction) {
    instruction += "\n\n" + styleInstruction;
  }

  if (settings.customSystemPrompt) {
    instruction += "\n\nUser instruction: " + settings.customSystemPrompt;
  }

  if (isAgentMode) {
    instruction += "\n\n" + AGENT_SYSTEM_PROMPT;
  }

  return instruction;
}

async function callOpenAICompatibleProvider(
  messages: Message[],
  settings: AISettings,
  systemInstruction: string
): Promise<string> {
  if (!settings.baseUrl) {
    throw new Error("Connection is not configured.");
  }

  if (!settings.apiKey && settings.provider !== "ollama") {
    throw new Error("Connection is not configured.");
  }

  const baseUrl = settings.baseUrl.replace(/\/$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.modelName,
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

  if (!response.ok) {
    throw new Error("Connection failed.");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function createMessage(text: string, isAgentMode: boolean): Message {
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
  const provider = settings.provider || "built-in-opencore";

  const useBuiltInFallback =
    provider === "built-in-opencore" ||
    provider === "opencore-local" ||
    provider === "local" ||
    provider === "free-opencore";

  let text = "";

  if (useBuiltInFallback) {
    text = await getDirectFallbackAnswer(normalizedMessages);
  } else {
    try {
      const systemInstruction = buildSystemInstruction(settings, isAgentMode);
      text = await callOpenAICompatibleProvider(
        normalizedMessages,
        settings,
        systemInstruction
      );
    } catch {
      text = await getDirectFallbackAnswer(normalizedMessages);
    }
  }

  const content = cleanText(text);
  streamText(content, onChunk);
  return createMessage(content, isAgentMode);
}
