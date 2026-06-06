/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean direct AI service for RedHydra OpenCore.
 *
 * Default mode:
 * - No GCP key
 * - No Google service account
 * - No built-in shared API key
 * - No forced template output
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

function streamPlainText(text: string, onChunk?: (text: string) => void) {
  if (!onChunk) return;

  let index = 0;
  const step = 18;

  const timer = window.setInterval(() => {
    index += step;
    onChunk(text.slice(0, index));

    if (index >= text.length) {
      onChunk(text);
      window.clearInterval(timer);
    }
  }, 10);
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

function stripMarkdownTemplate(text: string) {
  return text
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .trim();
}

function buildCleanLocalAnswer(messages: Message[]): string {
  const lastMessage = getLastUserMessage(messages);
  const normalized = lastMessage.toLowerCase();
  const attachment = extractAttachment(lastMessage);

  if (lastMessage.includes("--- ATTACHMENT CONTENT START ---")) {
    const fileText = attachment.body || "No readable text was extracted from the file.";
    const preview = fileText.length > 1000 ? `${fileText.slice(0, 1000)}\n...[truncated]` : fileText;

    return `I found the attached file: ${attachment.name}.

Preview:
${preview}

Tell me what you want fixed or checked in this file, and I will give you the exact changes.`;
  }

  if (hasAny(normalized, ["gcp", "gemini", "api key", "apikey", "service account", "google"])) {
    return "The app now works without a built-in GCP/Gemini API key. Do not hardcode any shared API key in the repo. The public version should use local no-key mode by default, and users can optionally add their own provider key or local Ollama endpoint if they want real LLM responses.";
  }

  if (hasAny(normalized, ["deploy", "github pages", "vite", "workflow", "artifact", "build"])) {
    return "For GitHub Pages, build the Vite frontend only, publish the dist folder, and keep base set to /RedHydraOpenCore/. GitHub Pages cannot run server.ts or backend API routes.";
  }

  if (hasAny(normalized, ["react", "typescript", "javascript", "code", "function", "component", "bug", "fix"])) {
    return "Paste the code or error log. I will point out the issue and give you the corrected version directly, without extra templates.";
  }

  if (hasAny(normalized, ["owasp", "security", "vulnerability", "xss", "sql injection", "csrf", "cyber"])) {
    return "Use defensive security practices only: validate inputs, avoid hardcoded secrets, use parameterized queries, sanitize unsafe HTML, rate-limit public APIs, and keep dependencies updated.";
  }

  if (hasAny(normalized, ["hello", "hi", "hey"])) {
    return "Hi. RedHydra is running in no-key local mode. Ask me for code fixes, deployment help, or defensive security guidance.";
  }

  return "I’m running in clean no-key local mode. Paste your code, error, or question, and I’ll answer directly.";
}

export function parseAgentResponse(text: string): AgentPlan {
  const cleanText = stripMarkdownTemplate(text);

  return {
    goal: "Answer directly",
    understanding: "The user wants a clean response without extra templates.",
    steps: [
      {
        id: "step-1",
        title: "Read request",
        description: "Understand the user message",
        status: "completed" as AgentStatus,
      },
      {
        id: "step-2",
        title: "Respond directly",
        description: "Return only the useful answer",
        status: "completed" as AgentStatus,
      },
    ],
    output: cleanText,
    validationChecklist: [
      {
        text: "No forced GOAL/PLAN/OUTPUT template",
        checked: true,
      },
      {
        text: "Direct answer returned",
        checked: true,
      },
    ],
    limitations: [],
    nextAction: "Send the next code or error to fix.",
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
    return `Binary file detected: ${attachment.type}. Local mode cannot read this file deeply.`;
  }

  try {
    const binaryString = window.atob(base64Part);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return `Could not decode attachment: ${attachment.type}`;
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
    throw new Error("Provider base URL is missing.");
  }

  if (!settings.apiKey && settings.provider !== "ollama") {
    throw new Error("API key is missing for this provider.");
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
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message || errorBody?.error || `HTTP ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function createAssistantMessage(text: string, isAgentMode: boolean): Message {
  const message: Message = {
    id: createId(),
    role: "assistant",
    content: stripMarkdownTemplate(text),
    timestamp: new Date().toLocaleTimeString(),
  };

  if (isAgentMode) {
    message.agentPlan = parseAgentResponse(message.content);
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

  const useLocalMode =
    provider === "built-in-opencore" ||
    provider === "opencore-local" ||
    provider === "local" ||
    provider === "free-opencore";

  if (useLocalMode) {
    const text = buildCleanLocalAnswer(normalizedMessages);
    const cleanText = stripMarkdownTemplate(text);
    streamPlainText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  }

  try {
    const systemInstruction = buildSystemInstruction(settings, isAgentMode);
    const text = await callOpenAICompatibleProvider(
      normalizedMessages,
      settings,
      systemInstruction
    );

    const cleanText = stripMarkdownTemplate(text);
    streamPlainText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  } catch (error: any) {
    const text = `Provider connection failed: ${error?.message || "Unknown error"}. RedHydra switched to local no-key mode. ${buildCleanLocalAnswer(normalizedMessages)}`;
    const cleanText = stripMarkdownTemplate(text);

    streamPlainText(cleanText, onChunk);
    return createAssistantMessage(cleanText, isAgentMode);
  }
}
