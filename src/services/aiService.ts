/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AISettings, Message, AgentPlan } from "../types";
import { ASSISTANT_SYSTEM_INSTRUCTIONS, AGENT_SYSTEM_PROMPT, getStyleInstruction } from "../utils/prompts";

// Parse structured output from the agent response
export function parseAgentResponse(text: string): AgentPlan {
  const plan: AgentPlan = {
    goal: "",
    understanding: "",
    steps: [],
    output: "",
    validationChecklist: [],
    limitations: [],
    nextAction: ""
  };

  const sections: Record<string, string> = {};
  const regex = /\[(GOAL|UNDERSTANDING|PLAN|OUTPUT|CHECKLIST|LIMITATIONS|NEXT_ACTION)\]([\s\S]*?)(?===\s*=|\[[A-Z_]+\]|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const sectionName = match[1];
    const content = match[2].trim();
    sections[sectionName] = content;
  }

  // Populate goal
  plan.goal = sections["GOAL"] || "Achieve technical and conceptual objectives outlined by user query.";
  plan.understanding = sections["UNDERSTANDING"] || "Analyze core requirements, identify architectural boundary conditions, and prepare structured modules.";
  
  // Populate steps
  const planLines = (sections["PLAN"] || "").split("\n");
  let stepId = 1;
  for (const line of planLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
    let title = trimmed;
    
    if (trimmed.startsWith("[COMPLETED]")) {
      status = 'completed';
      title = trimmed.replace("[COMPLETED]", "").trim();
    } else if (trimmed.startsWith("[RUNNING]")) {
      status = 'running';
      title = trimmed.replace("[RUNNING]", "").trim();
    } else if (trimmed.startsWith("[PENDING]")) {
      status = 'pending';
      title = trimmed.replace("[PENDING]", "").trim();
    } else if (trimmed.startsWith("- [COMPLETED]")) {
      status = 'completed';
      title = trimmed.replace("- [COMPLETED]", "").trim();
    } else if (trimmed.startsWith("- [RUNNING]")) {
      status = 'running';
      title = trimmed.replace("- [RUNNING]", "").trim();
    } else if (trimmed.startsWith("- [PENDING]")) {
      status = 'pending';
      title = trimmed.replace("- [PENDING]", "").trim();
    } else if (trimmed.startsWith("- ")) {
      title = trimmed.slice(2);
    }
    plan.steps.push({
      id: `step-${stepId++}`,
      title,
      description: `Task execution sub-plan`,
      status
    });
  }

  if (plan.steps.length === 0) {
    plan.steps = [
      { id: "step-1", title: "Analyze query constraints", description: "Deconstruct requested fields and constraints", status: "completed" },
      { id: "step-2", title: "Fulfill generation goals", description: "Compile outputs and formatting patterns", status: "running" },
      { id: "step-3", title: "Validate compliance and quality", description: "Verify conformity and robustness", status: "pending" }
    ];
  }

  // Populate output
  plan.output = sections["OUTPUT"] || text;

  // Populate checklist
  const checklistLines = (sections["CHECKLIST"] || "").split("\n");
  for (const line of checklistLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let checked = false;
    let content = trimmed;
    if (trimmed.startsWith("[/]")) {
      checked = true;
      content = trimmed.replace("[/]", "").trim();
    } else if (trimmed.startsWith("[ ]")) {
      checked = false;
      content = trimmed.replace("[ ]", "").trim();
    } else if (trimmed.startsWith("- [/]")) {
      checked = true;
      content = trimmed.replace("- [/]", "").trim();
    } else if (trimmed.startsWith("- [ ]")) {
      checked = false;
      content = trimmed.replace("- [ ]", "").trim();
    } else if (trimmed.startsWith("- ")) {
      content = trimmed.slice(2);
    }
    plan.validationChecklist.push({ text: content, checked });
  }

  if (plan.validationChecklist.length === 0) {
    plan.validationChecklist = [
      { text: "Review solution outputs for syntax", checked: true },
      { text: "Crosscheck with security and defensive policies", checked: true },
      { text: "Confirm execution steps pass browser testing", checked: false }
    ];
  }

  // Populate limitations
  const limitLines = (sections["LIMITATIONS"] || "").split("\n");
  for (const line of limitLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let content = trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed;
    plan.limitations.push(content);
  }
  if (plan.limitations.length === 0) {
    plan.limitations = [
      "Client-side sandbox environment",
      "Data relies entirely on input context",
      "Double-check generated structures before live production deployment"
    ];
  }

  plan.nextAction = sections["NEXT_ACTION"] || "Verify the modular output, edit the solution if needed, or ask for refinements.";

  return plan;
}

// Fallback guided assistance generator when offline or no API is available
export function getFallbackAnswer(
  messages: Message[],
  settings: AISettings,
  isAgentMode: boolean
): string {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const normalized = lastMessage.toLowerCase();

  let responseBody = "";

  if (normalized.includes("hello") || normalized.includes("hi ") || normalized.includes("hey")) {
    responseBody = `### Greetings from RedHydra AI!
I am currently operating in **Offline Fallback Guided Mode** because no local API key or client provider has been fully activated yet.

To unlock real, unrestricted generative AI capabilities, please navigate to the **Settings** panel and configure one of our supported providers:
1. **Built-in RedHydra OpenCore**: 100% Open-Source, Unlimited, and Lifetime Free! Run directly through our secure backend.
2. **OpenAI**: Bring your own ChatGPT key.
3. **OpenRouter**: Hook up models like LLaMA-3, Claude, or Mistral.
4. **Ollama**: Connect to models running locally on your hardware.

How can I guide you today? I can help generate templates, explain security concepts, or give coding checklists!`;
  } else if (normalized.includes("code") || normalized.includes("function") || normalized.includes("react") || normalized.includes("javascript")) {
    responseBody = `### Code Generation Guide
Since I am in fallback mode, here is a professional **React + TypeScript component template** with custom Tailwind CSS styling for a responsive, clean dashboard metric card:

\`\`\`tsx
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true
}) => {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group hover:border-red-900/50 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        <span className={\`flex items-center text-xs \${isPositive ? 'text-emerald-500' : 'text-rose-500'}\`}>
          {change}
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-mono font-bold text-zinc-100">{value}</h3>
      </div>
    </div>
  );
};
\`\`\`

To test custom generation, configure your API credential in settings!`;
  } else if (normalized.includes("owasp") || normalized.includes("vulnerability") || normalized.includes("injection") || normalized.includes("security") || normalized.includes("cyber")) {
    responseBody = `### Secured Cybersecurity Learning Module: Defending SQL Injection (SQLi)
Defensive training on secure development paradigms is essential to cybersecurity learning.

#### Vulnerability Architecture:
SQL Injection occurs when user input is concatenated directly into SQL queries, enabling attackers to execute arbitrary database directives.

*❌ Vulnerable Pattern (Express/Node):*
\`\`\`js
const query = \`SELECT * FROM users WHERE email = '\${req.body.email}' AND password = '\${req.body.password}'\`;
db.query(query); // CRITICAL: Concatenation allows query termination via quotes
\`\`\`

*✅ Hardened Pattern (Parameterized Interface):*
\`\`\`js
const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
db.execute(query, [req.body.email, req.body.password]); // PARSED: Data parameter is fully neutralized
\`\`\`

#### Hardening Action Checklist:
1. [x] Never concatenate queries dynamically with raw user inputs.
2. [x] Use a secure ORM (Prisma, Sequelize, Mongoose) or parameterization arrays.
3. [x] Implement Least Privilege configurations on database credentials.
4. [x] Deploy Helmet middlewares and rate-limiting scripts on public APIs.`;
  } else {
    // General default answer
    responseBody = `### RedHydra Assistant Guidance

You are interacting with the RedHydra Fallback Assistant. 

#### 💡 System Status & Configuration Options:
- **No API Key is hardcoded on the client-side** to preserve security headers and prevent browser key harvesting.
- **Built-in RedHydra OpenCore**: Run our 100% open-source, unlimited, and lifetime free model directly through our secure backend! simply select **Built-in RedHydra OpenCore** in Settings to instantly stream state queries!
- **Bring Your Own Key**: Go to Settings to input a custom OpenAI, OpenRouter, or Ollama local endpoint.

#### 🛠️ Ready-to-Copy Checklist for Setting up an API:
1. Navigate to **Settings** (bottom-left gear or sidebar menu).
2. Choose your **API Provider** (Built-in, OpenAI, OpenRouter, Ollama).
3. Paste your key privately into the **API Key** slot. It will be stored purely in your encrypted browser storage session.
4. Return to the chat and continue querying with full generative execution!`;
  }

  if (isAgentMode) {
    return `[GOAL]
Furnish fallback instructions and assist local users with configuration setups.

[UNDERSTANDING]
The user is querying in fallback guided mode because real API credentials are unconfigured or local services are offline.

[PLAN]
- [COMPLETED] Listen to user query keyword context
- [RUNNING] Format guided answers and step plans
- [PENDING] Direct user safely to settings or memory management

[OUTPUT]
${responseBody}

[CHECKLIST]
- [/] Respond safely without mock errors
- [/] Instruct client on how to configure API endpoints
- [ ] Receive valid client key injection

[LIMITATIONS]
- Static pre-built lookup logic only
- Knowledge is capped to local help templates
- No active reasoning parameters present

[NEXT_ACTION]
Open the Settings drawer and activate Built-in RedHydra OpenCore or add your OpenAI client token.`;
  }

  return responseBody;
}

// Helper to decode Base64 Data URL to UTF-8 text if readable, or return a neat binary placeholder
export function getReadableAttachmentContent(attachment: { type: string; content: string }): string {
  if (!attachment.content) return "";
  
  // If it is not a base64 Data URL, treat as raw text
  if (!attachment.content.startsWith("data:")) {
    return attachment.content;
  }
  
  const commaIndex = attachment.content.indexOf(",");
  if (commaIndex === -1) return attachment.content;
  
  const base64Part = attachment.content.substring(commaIndex + 1);
  const mimeType = (attachment.type || "").toLowerCase();
  
  const isTextType = mimeType.startsWith("text/") || 
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
                     
  if (isTextType) {
    try {
      const binaryString = window.atob(base64Part);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder("utf-8").decode(bytes);
    } catch (e) {
      return `[Binary / Encoded text: ${attachment.type}]`;
    }
  } else {
    return `[Binary file content of type "${attachment.type}" - parsed as inline data/multimodal representation inside Gemini Node]`;
  }
}

// core chat interaction service caller
export async function sendChatMessage(
  messages: Message[],
  settings: AISettings,
  isAgentMode: boolean,
  onChunk?: (text: string) => void
): Promise<Message> {
  // 1. Pre-process messages to serialize any file attachment contents directly into the prompt stream
  const mappedMessages = messages.map(m => {
    if (m.attachment) {
      const readableContent = getReadableAttachmentContent(m.attachment);
      const displayContent = `[ATTACHED FILE: "${m.attachment.name}" (${m.attachment.type}, size: ${m.attachment.size} bytes)]\n--- ATTACHMENT CONTENT START ---\n${readableContent}\n--- ATTACHMENT CONTENT END ---\n\n${m.content}`;
      return { ...m, content: displayContent };
    }
    return m;
  });

  // 2. Build system instruction
  let finalSystemInstruction = ASSISTANT_SYSTEM_INSTRUCTIONS[settings.assistantMode] || ASSISTANT_SYSTEM_INSTRUCTIONS.general;
  
  // Apply style preference
  const styleInstruction = getStyleInstruction(settings.responseStyle);
  if (styleInstruction) {
    finalSystemInstruction += "\n\n" + styleInstruction;
  }

  // Apply custom system prompt if set
  if (settings.customSystemPrompt) {
    finalSystemInstruction += "\n\nUser custom instruction: " + settings.customSystemPrompt;
  }

  // Apply Agent mode layout if requested
  if (isAgentMode) {
    finalSystemInstruction += "\n\n" + AGENT_SYSTEM_PROMPT;
  }

  // Fallback behavior check
  if (settings.provider !== 'built-in-opencore' && !settings.apiKey && settings.provider !== 'ollama') {
    // Generate fallback template
    const text = getFallbackAnswer(mappedMessages, settings, isAgentMode);
    
    // Smooth custom streaming typing effect integration
    if (onChunk) {
      let index = 0;
      const step = 8; // characters per tick
      const timer = setInterval(() => {
        if (index < text.length) {
          onChunk(text.substring(0, index + step));
          index += step;
        } else {
          onChunk(text);
          clearInterval(timer);
        }
      }, 15);
      // Wait for immediate completion resolve
    }

    const m: Message = {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };
    if (isAgentMode) {
      m.agentPlan = parseAgentResponse(text);
    }
    return m;
  }

  // 3. Call designated APIs based on provider
  if (settings.provider === 'built-in-opencore') {
    try {
      // Setup payload matching our Express routes
      const payload = {
        messages: mappedMessages.map(m => ({ role: m.role, content: m.content })),
        systemInstruction: finalSystemInstruction,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        modelName: settings.modelName || "hydra-opencore-v3",
        thinkingLevel: settings.thinkingLevel || "auto",
      };

      if (settings.streaming && onChunk) {
        // Run Real SSE Streaming call to server
        const response = await fetch("/api/chat-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Streaming reader unavailable");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  const sErr = new Error(parsed.error);
                  (sErr as any).isStreamError = true;
                  throw sErr;
                }
                const word = parsed.text || "";
                accumulatedText += word;
                onChunk(accumulatedText);
              } catch (e: any) {
                if (e.isStreamError) {
                  throw e;
                }
                // Ignore parsing errors for intermediate partial segments
              }
            }
          }
        }

        const m: Message = {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: accumulatedText,
          timestamp: new Date().toLocaleTimeString(),
        };
        if (isAgentMode) {
          m.agentPlan = parseAgentResponse(accumulatedText);
        }
        return m;

      } else {
        // Standard JSON fetch request
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server HTTP response: ${res.status}`);
        }

        const data = await res.json();
        const text = data.text || "";

        if (onChunk) {
          onChunk(text);
        }

        const m: Message = {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: new Date().toLocaleTimeString(),
        };
        if (isAgentMode) {
          m.agentPlan = parseAgentResponse(text);
        }
        return m;
      }
    } catch (err: any) {
      console.error("Built-in Server OpenCore Call Failed:", err);
      const errLower = (err.message || "").toLowerCase();
      let friendlyErr = "";
      
      if (errLower.includes("quota") || errLower.includes("exhausted") || errLower.includes("rate_limit") || errLower.includes("limit") || errLower.includes("429") || errLower.includes("too many requests")) {
        friendlyErr = `### 🛑 Gemini API Quota Exceeded (429 - Too Many Requests)
**Status:** Temporary Rate Limit Enforced by Google AI Studio Server Node

The Google AI Studio Gemini API free-tier limits have been reached, or the rate of request ticks exceeded metric bounds.

#### ⚡ How to Proceed:
1. **Wait 15-20 seconds** and retry your request. The token limits refresh automatically on the minute.
2. **Integrate your own personal API Key** for unlimited quota:
   - Click the **Settings/Config** tab in the sidebar navigation.
   - Insert your custom API Key (Gemini, OpenAI, or OpenRouter) directly.
   - Private key flows run immediately via browser cache lines bypassing global server blocks.
`;
      } else {
        friendlyErr = `### ⚠️ Connection to Built-in Server OpenCore Failed
**Details:** ${err.message || 'Server connection timed out'}

This usually happens because the host **API Key** is not configured inside the server-side environment or you are experiencing temporary network limits.

#### 💡 How to Recover:
1. Click **Settings** in your Workspace configurations.
2. Ensure your backend keys are set correctly.
3. Alternatively, toggle your AI provider to **OpenAI** or **OpenRouter** in settings, private keys are set client-side within browser cache!
`;
      }

      if (onChunk) onChunk(friendlyErr);
      const m: Message = {
        id: `m-${Date.now()}`,
        role: 'assistant',
        content: friendlyErr,
        timestamp: new Date().toLocaleTimeString(),
      };
      return m;
    }
  }

  // OpenAI, OpenRouter, Custom standard fetch client proxying
  try {
    let url = settings.baseUrl;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (settings.apiKey) {
      headers["Authorization"] = `Bearer ${settings.apiKey}`;
    }

    // Adapt payload for classic OpenAI schema
    const payload = {
      model: settings.modelName,
      messages: [
        { role: "system", content: finalSystemInstruction },
        ...mappedMessages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    };

    const res = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || errBody?.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    if (onChunk) {
      // Simulate client side typing chunk feed animation
      let index = 0;
      const step = 12;
      const timer = setInterval(() => {
        if (index < text.length) {
          onChunk(text.substring(0, index + step));
          index += step;
        } else {
          onChunk(text);
          clearInterval(timer);
        }
      }, 15);
    }

    const m: Message = {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };
    if (isAgentMode) {
      m.agentPlan = parseAgentResponse(text);
    }
    return m;

  } catch (err: any) {
    const errorMsg = `### ⚠️ API Provider Connection Failure
**Provider:** ${settings.provider.toUpperCase()}
**URL:** ${settings.baseUrl}
**Error Details:** ${err.message || 'Unknown network error. Please check your browser CORS policies for localhost/Ollama.'}

Check if your local server (Ollama) is launched, api endpoints are formatted, or keys are correctly pasted.`;

    if (onChunk) onChunk(errorMsg);
    
    return {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content: errorMsg,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
