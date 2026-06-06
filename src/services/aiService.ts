/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RedHydra OpenCore clean chat service.
 *
 * User-facing rules:
 * - Do not expose provider/model/internal mode text in chat.
 * - Do not print local-mode/system-template messages.
 * - Default assistant name: RedHydra OpenCore.
 * - Stream responses in real time.
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

function getLastUserMessage(messages: Message[]) {
  return messages[messages.length - 1]?.content || "";
}

function streamText(text: string, onChunk?: (text: string) => void) {
  if (!onChunk) return;

  let index = 0;
  const step = 20;

  const timer = window.setInterval(() => {
    index += step;
    onChunk(text.slice(0, index));

    if (index >= text.length) {
      onChunk(text);
      window.clearInterval(timer);
    }
  }, 9);
}

function cleanAssistantText(text: string) {
  return String(text || "")
    .replace(/\[GOAL\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[UNDERSTANDING\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[PLAN\][\s\S]*?(?=\[OUTPUT\]|$)/gi, "")
    .replace(/\[OUTPUT\]/gi, "")
    .replace(/\[CHECKLIST\][\s\S]*?(?=\[LIMITATIONS\]|\[NEXT_ACTION\]|$)/gi, "")
    .replace(/\[LIMITATIONS\][\s\S]*?(?=\[NEXT_ACTION\]|$)/gi, "")
    .replace(/\[NEXT_ACTION\]/gi, "")
    .replace(/RedHydra is running in .*?mode\.?/gi, "")
    .replace(/no-key local mode/gi, "")
    .replace(/local mode/gi, "")
    .replace(/provider:\s*`?[^`\n]+`?/gi, "")
    .replace(/model:\s*`?[^`\n]+`?/gi, "")
    .replace(/network ai:\s*[^.\n]+/gi, "")
    .replace(/login required:\s*[^.\n]+/gi, "")
    .replace(/built-in api key:\s*[^.\n]+/gi, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
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

function buildDirectFallback(messages: Message[]): string {
  const lastMessage = getLastUserMessage(messages);
  const normalized = lastMessage.toLowerCase();
  const attachment = extractAttachment(lastMessage);

  if (lastMessage.includes("--- ATTACHMENT CONTENT START ---")) {
    const preview = attachment.body
      ? attachment.body.slice(0, 1200) + (attachment.body.length > 1200 ? "\n..." : "")
      : "I could not read the file content.";

    return `I found ${attachment.name}.

${preview}

Send what you want changed, and I’ll give the exact fix.`;
  }

  if (hasAny(normalized, ["hello", "hi", "hey"])) {
    return "Hi, I’m RedHydra OpenCore. How can I help?";
  }

  if (hasAny(normalized, ["who are you", "your name", "what are you"])) {
    return "I’m RedHydra OpenCore.";
  }

  if (hasAny(normalized, ["fix", "bug", "error", "code", "build failed", "typescript", "vite", "react"])) {
    return "Send the code or error log, and I’ll give the corrected version.";
  }

  if (hasAny(normalized, ["deploy", "github pages", "workflow", "artifact"])) {
    return "Send the deployment log or workflow file, and I’ll fix the GitHub Pages setup.";
  }

  if (hasAny(normalized, ["security", "owasp", "vulnerability", "xss", "sql injection", "csrf"])) {
    return "Share the code or scenario. I’ll give a safe defensive fix.";
  }

  return "Please send the details, code, or error you want me to fix.";
}

export function parseAgentResponse(text: string): AgentPlan {
  const output = cleanAssistantText(text);

  return {
    goal: "Answer directly",
    understanding: "Return a clean user-facing answer.",
    steps: [
      {
        id: "step-1",
        title: "Answer",
        description: "Provide the final answer directly",
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
    return "This file is binary or not readable as plain text.";
  }

  try {
    const binaryString = window.atob(base64Part);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "Could not decode the attachment.";
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

function createAssistantMessage(text: string, isAgentMode: boolean): Message {
  const content = cleanAssistantText(text) || "Please send the details you want me to fix.";

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

  const useFallback =
    provider === "built-in-opencore" ||
    provider === "opencore-local" ||
    provider === "local" ||
    provider === "free-opencore";

  if (useFallback) {
    const text = buildDirectFallback(normalizedMessages);
    const cleanText = cleanAssistantText(text);
    streamText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  }

  try {
    const systemInstruction = buildSystemInstruction(settings, isAgentMode);
    const text = await callOpenAICompatibleProvider(
      normalizedMessages,
      settings,
      systemInstruction
    );

    const cleanText = cleanAssistantText(text);
    streamText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  } catch {
    const text = buildDirectFallback(normalizedMessages);
    const cleanText = cleanAssistantText(text);
    streamText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  }
}
