/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RedHydra OpenCore no-key AI service.
 *
 * This file intentionally does NOT import Google/GCP/Gemini SDKs and does NOT
 * require a built-in API key. The public GitHub Pages build runs in local
 * open-source guided mode by default.
 */

import { AISettings, Message, AgentPlan } from "../types";
import {
  ASSISTANT_SYSTEM_INSTRUCTIONS,
  AGENT_SYSTEM_PROMPT,
  getStyleInstruction,
} from "../utils/prompts";

type AgentStatus = "pending" | "running" | "completed" | "failed";

function nowId(prefix = "m") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function streamText(text: string, onChunk?: (text: string) => void) {
  if (!onChunk) return;
  let index = 0;
  const step = 14;
  const timer = window.setInterval(() => {
    index += step;
    onChunk(text.slice(0, index));
    if (index >= text.length) {
      onChunk(text);
      window.clearInterval(timer);
    }
  }, 12);
}

function hasAny(input: string, words: string[]) {
  return words.some((word) => input.includes(word));
}

function extractAttachmentBlock(content: string) {
  const nameMatch = content.match(/\[ATTACHED FILE:\s*"([^"]+)"/i);
  const bodyMatch = content.match(
    /--- ATTACHMENT CONTENT START ---\n([\s\S]*?)\n--- ATTACHMENT CONTENT END ---/i
  );

  return {
    name: nameMatch?.[1] || "attached-file",
    body: bodyMatch?.[1]?.trim() || "",
  };
}

function escapeFence(text: string) {
  return text.replace(/```/g, "ʼʼʼ");
}

function buildLocalGuidedAnswer(messages: Message[], settings: AISettings, isAgentMode: boolean): string {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const normalized = lastMessage.toLowerCase();
  const attachment = extractAttachmentBlock(lastMessage);
  const hasAttachment = lastMessage.includes("--- ATTACHMENT CONTENT START ---");

  let responseBody = "";

  if (hasAttachment) {
    const preview = attachment.body
      ? escapeFence(attachment.body.slice(0, 1200))
      : "[No readable text content was extracted. Binary files need a real model/backend or manual review.]";

    responseBody = `### Local File Review

I am running in **OpenCore Local Mode**, so no Google/GCP key or login is being used.

**File detected:** \`${attachment.name}\`

#### Extracted preview

\`\`\`text
${preview}${attachment.body.length > 1200 ? "\n...[truncated]" : ""}
\`\`\`

#### Safe review checklist

1. Check for hardcoded secrets such as API keys, tokens, passwords, private URLs, or service-account JSON.
2. Remove any vendor-specific built-in credentials before publishing the repository.
3. Keep user-provided keys optional and stored outside source control.
4. For GitHub Pages, remember that only static frontend code runs. Backend API routes do not run there.

#### Suggested next action

Paste the specific error log, file, or code section you want reviewed, and I can give a focused patch-style answer.`;
  } else if (hasAny(normalized, ["gcp", "gemini", "api key", "apikey", "service account", "google"])) {
    responseBody = `### No-Key OpenCore Mode

This build has been changed to avoid built-in Google/GCP/Gemini credentials.

#### What changed

- No built-in API key is required.
- No Google service account is required.
- No Gemini SDK is used by the browser chat path.
- The public GitHub Pages version works in local guided mode.
- Optional external providers remain optional only if a user adds their own key.

#### Why this is safer

A public open-source repository should not ship a shared cloud AI key. If a real key is pushed to GitHub, anyone can copy it, exhaust quota, or generate charges.

#### Free no-login behavior

This mode uses local rule-based assistance inside the browser. It is not a hosted LLM, but it keeps the project open-source, deployable, and usable without login or secrets.`;
  } else if (hasAny(normalized, ["deploy", "github pages", "vite", "workflow", "artifact", "build"])) {
    responseBody = `### GitHub Pages Deployment Guidance

Your public build should stay static and no-key.

#### Required setup

1. Use \`base: '/RedHydraOpenCore/'\` in \`vite.config.ts\`.
2. Use \`npm run build:pages\` for Pages.
3. Upload only the \`dist\` folder as the Pages artifact.
4. Use a unique artifact name to avoid duplicate \`github-pages\` artifacts.
5. Set GitHub Pages source to **GitHub Actions**.

#### Important

GitHub Pages cannot run \`server.ts\`, Express routes, or private environment variables. That is why the frontend must not depend on \`/api/chat\` for the default public mode.`;
  } else if (hasAny(normalized, ["react", "typescript", "javascript", "code", "function", "component", "bug", "fix"])) {
    responseBody = `### Local Code Assistant

I am running without any cloud API key. Here is a safe code-review pattern you can use:

\`\`\`ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function safeParseJson<T = unknown>(input: string): Result<T> {
  try {
    return { ok: true, value: JSON.parse(input) as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}
\`\`\`

#### Review checklist

- Validate inputs before using them.
- Avoid hardcoded secrets.
- Keep browser-only code separate from server-only code.
- Use environment variables only on a real backend, never inside static Pages output.`;
  } else if (hasAny(normalized, ["owasp", "security", "vulnerability", "xss", "sql injection", "csrf", "cyber"])) {
    responseBody = `### Defensive Security Guidance

This local mode only provides defensive and educational cybersecurity help.

#### Safe hardening checklist

1. Use parameterized queries instead of string-concatenated SQL.
2. Escape or sanitize user-controlled HTML to reduce XSS risk.
3. Add rate limiting to public APIs.
4. Keep secrets out of frontend bundles and public repos.
5. Use least-privilege credentials for backend services.
6. Add dependency scanning and secret scanning before release.

#### Example safe SQL pattern

\`\`\`ts
const query = "SELECT * FROM users WHERE email = ?";
await db.execute(query, [email]);
\`\`\``;
  } else if (hasAny(normalized, ["hello", "hi", "hey"])) {
    responseBody = `### Hello from RedHydra OpenCore

I am running in **free no-login local mode**.

No GCP API key.  
No service account.  
No built-in vendor credential.  
No forced login.

Ask me for code review, deployment help, file checks, or defensive security guidance.`;
  } else {
    responseBody = `### RedHydra OpenCore Local Mode

I can help with code review, GitHub Pages deployment, defensive security checklists, and structured technical guidance without using any cloud API key.

#### Current mode

- Provider: \`${settings.provider}\`
- Model label: \`${settings.modelName || "opencore-local"}\`
- Network AI: disabled by default
- Login required: no
- Built-in API key: no

#### Best use

Paste the code, error log, or file content you want fixed. I will return a clear patch-style answer that you can apply directly.`;
  }

  if (!isAgentMode) return responseBody;

  return `[GOAL]
Provide a no-login, no-GCP-key, open-source-safe response.

[UNDERSTANDING]
The app is operating in local OpenCore mode, so it must not depend on Google/GCP/Gemini credentials or any built-in API key.

[PLAN]
- [COMPLETED] Detect whether the request concerns keys, deployment, code, security, or files
- [COMPLETED] Use local guided response logic only
- [RUNNING] Return a structured answer compatible with the RedHydra agent panel
- [PENDING] Let the user paste more code or logs for a precise patch

[OUTPUT]
${responseBody}

[CHECKLIST]
- [/] No hardcoded cloud API key used
- [/] No Google service account required
- [/] No server-side secret needed for GitHub Pages default mode
- [ ] Real LLM quality requires optional local Ollama or user-owned provider key

[LIMITATIONS]
- Local mode is rule-based, not a full hosted LLM
- Browser-only GitHub Pages cannot run private backend routes
- Optional external providers still need the user's own credentials

[NEXT_ACTION]
Replace the fixed files, redeploy with GitHub Actions, then test the page with a fresh cache-busting URL.`;
}

// Parse structured output from the agent response.
export function parseAgentResponse(text: string): AgentPlan {
  const plan: AgentPlan = {
    goal: "",
    understanding: "",
    steps: [],
    output: "",
    validationChecklist: [],
    limitations: [],
    nextAction: "",
  };

  const sections: Record<string, string> = {};
  const regex =
    /\[(GOAL|UNDERSTANDING|PLAN|OUTPUT|CHECKLIST|LIMITATIONS|NEXT_ACTION)\]([\s\S]*?)(?=\n\[[A-Z_]+\]|$)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    sections[match[1]] = match[2].trim();
  }

  plan.goal = sections.GOAL || "Answer the user request safely.";
  plan.understanding =
    sections.UNDERSTANDING || "The request needs a structured technical response.";

  const planLines = (sections.PLAN || "").split("\n");
  let stepId = 1;

  for (const line of planLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let status: AgentStatus = "pending";
    let title = trimmed.replace(/^- /, "");

    const statusMatch = title.match(/^\[(COMPLETED|RUNNING|PENDING|FAILED)\]\s*(.*)$/i);
    if (statusMatch) {
      const s = statusMatch[1].toLowerCase();
      status = s === "completed" || s === "running" || s === "failed" ? s : "pending";
      title = statusMatch[2].trim();
    }

    plan.steps.push({
      id: `step-${stepId++}`,
      title: title || "Continue task",
      description: "Local OpenCore execution step",
      status,
    });
  }

  if (plan.steps.length === 0) {
    plan.steps = [
      {
        id: "step-1",
        title: "Analyze request",
        description: "Understand the user's goal",
        status: "completed",
      },
      {
        id: "step-2",
        title: "Generate local response",
        description: "Use no-key local guidance",
        status: "running",
      },
    ];
  }

  plan.output = sections.OUTPUT || text;

  for (const line of (sections.CHECKLIST || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const checked = trimmed.includes("[/]");
    const cleanText = trimmed
      .replace(/^- /, "")
      .replace(/^\[\/\]\s*/, "")
      .replace(/^\[ \]\s*/, "")
      .trim();

    plan.validationChecklist.push({
      text: cleanText,
      checked,
    });
  }

  if (plan.validationChecklist.length === 0) {
    plan.validationChecklist = [
      { text: "No hardcoded API key required", checked: true },
      { text: "Response generated locally", checked: true },
    ];
  }

  for (const line of (sections.LIMITATIONS || "").split("\n")) {
    const trimmed = line.trim().replace(/^- /, "");
    if (trimmed) plan.limitations.push(trimmed);
  }

  if (plan.limitations.length === 0) {
    plan.limitations = ["Local mode is not a full hosted LLM."];
  }

  plan.nextAction = sections.NEXT_ACTION || "Paste more detail for a focused patch.";
  return plan;
}

// Helper to decode Base64 Data URL to UTF-8 text if readable.
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
    return `[Binary file content of type "${attachment.type}". Local no-key mode cannot OCR or deeply parse this binary content.]`;
  }

  try {
    const binaryString = window.atob(base64Part);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return `[Encoded text could not be decoded: ${attachment.type}]`;
  }
}

function createAssistantMessage(text: string, isAgentMode: boolean): Message {
  const message: Message = {
    id: nowId(),
    role: "assistant",
    content: text,
    timestamp: new Date().toLocaleTimeString(),
  };

  if (isAgentMode) {
    message.agentPlan = parseAgentResponse(text);
  }

  return message;
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
  let finalSystemInstruction =
    ASSISTANT_SYSTEM_INSTRUCTIONS[settings.assistantMode] ||
    ASSISTANT_SYSTEM_INSTRUCTIONS.general;

  const styleInstruction = getStyleInstruction(settings.responseStyle);
  if (styleInstruction) {
    finalSystemInstruction += "\n\n" + styleInstruction;
  }

  if (settings.customSystemPrompt) {
    finalSystemInstruction += "\n\nUser custom instruction: " + settings.customSystemPrompt;
  }

  if (isAgentMode) {
    finalSystemInstruction += "\n\n" + AGENT_SYSTEM_PROMPT;
  }

  return finalSystemInstruction;
}

async function callOpenAICompatibleProvider(
  messages: Message[],
  settings: AISettings,
  finalSystemInstruction: string
): Promise<string> {
  if (!settings.apiKey && settings.provider !== "ollama") {
    throw new Error("No user-owned API key configured.");
  }

  const baseUrl = (settings.baseUrl || "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("Provider base URL is missing.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const payload = {
    model: settings.modelName,
    messages: [
      { role: "system", content: finalSystemInstruction },
      ...messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    ],
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
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

export async function sendChatMessage(
  messages: Message[],
  settings: AISettings,
  isAgentMode: boolean,
  onChunk?: (text: string) => void
): Promise<Message> {
  const mappedMessages = normalizeMessages(messages);
  const finalSystemInstruction = buildSystemInstruction(settings, isAgentMode);

  const provider = settings.provider || "built-in-opencore";
  const shouldUseLocalOpenCore =
    provider === "built-in-opencore" ||
    provider === "opencore-local" ||
    provider === "local" ||
    provider === "free-opencore";

  if (shouldUseLocalOpenCore) {
    const text = buildLocalGuidedAnswer(mappedMessages, settings, isAgentMode);
    streamText(text, onChunk);
    return createAssistantMessage(text, isAgentMode);
  }

  try {
    const text = await callOpenAICompatibleProvider(
      mappedMessages,
      settings,
      finalSystemInstruction
    );

    streamText(text, onChunk);
    return createAssistantMessage(text, isAgentMode);
  } catch (error: any) {
    const fallbackText = buildLocalGuidedAnswer(mappedMessages, settings, isAgentMode);

    const safeError = `### Provider Not Used

The selected provider could not be reached, so RedHydra stayed in **no-key OpenCore Local Mode**.

**Reason:** ${error?.message || "Unknown provider error"}

${fallbackText}`;

    streamText(safeError, onChunk);
    return createAssistantMessage(safeError, isAgentMode);
  }
}
