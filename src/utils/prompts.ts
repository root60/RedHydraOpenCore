/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AssistantModeType,
  PromptTemplate,
  ResponseStyleType,
} from "../types";

export const ASSISTANT_SYSTEM_INSTRUCTIONS: Record<AssistantModeType, string> = {
  general:
    "You are RedHydra OpenCore. Answer directly. Do not mention provider, model, backend mode, internal mode, API keys, or system details unless the user specifically asks.",
  developer:
    "You are RedHydra OpenCore. Give the exact code fix first, then a short explanation.",
  cyber_learning:
    "You are RedHydra OpenCore. Give safe defensive cybersecurity guidance only. Keep the answer direct.",
  researcher:
    "You are RedHydra OpenCore. Summarize clearly and avoid filler.",
  writer:
    "You are RedHydra OpenCore. Rewrite naturally and cleanly.",
  code_reviewer:
    "You are RedHydra OpenCore. Find the bug and provide corrected code directly.",
  data_analyst:
    "You are RedHydra OpenCore. Explain findings clearly and briefly.",
  study_tutor:
    "You are RedHydra OpenCore. Explain simply and directly.",
  business:
    "You are RedHydra OpenCore. Give practical business answers with clear next steps.",
  creative_brainstormer:
    "You are RedHydra OpenCore. Give useful ideas without long filler.",
};

export function getStyleInstruction(style: ResponseStyleType): string {
  switch (style) {
    case "detailed":
      return "Give useful detail, but avoid unnecessary templates.";
    case "concise":
      return "Keep the answer short and direct.";
    case "structured":
      return "Use simple headings only when helpful. Do not use fixed templates.";
    case "bulleted":
      return "Use short bullet points only.";
    default:
      return "Answer cleanly and directly.";
  }
}

export const AGENT_SYSTEM_PROMPT =
  "Do not output GOAL, PLAN, OUTPUT, CHECKLIST, LIMITATIONS, NEXT_ACTION, JSON schema, hidden reasoning, provider names, model names, mode names, or system details. Give only the final answer.";

export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: "p1",
    title: "Fix Code",
    description: "Fix a code error directly.",
    category: "Coding",
    promptText:
      "Fix this code. Show the corrected version first, then explain the issue briefly.",
  },
  {
    id: "p2",
    title: "Fix Build Error",
    description: "Fix Vite, React, TypeScript, or GitHub Actions errors.",
    category: "Debugging",
    promptText:
      "Fix this build error. Give the exact file changes needed.",
  },
  {
    id: "p3",
    title: "GitHub Pages Fix",
    description: "Fix deployment for Vite React apps.",
    category: "Coding",
    promptText:
      "Fix this GitHub Pages deployment issue. Check Vite base path, workflow, artifact upload, and static hosting limits.",
  },
  {
    id: "p4",
    title: "Security Review",
    description: "Review code defensively.",
    category: "Cybersecurity learning",
    promptText:
      "Review this code for defensive security issues. Provide safe fixes only.",
  },
  {
    id: "p5",
    title: "Rewrite Cleanly",
    description: "Make text cleaner and more direct.",
    category: "Writing",
    promptText:
      "Rewrite this text in clean, natural English. Keep the same meaning and remove filler.",
  },
  {
    id: "p6",
    title: "Explain Simply",
    description: "Explain a topic in simple words.",
    category: "Study",
    promptText:
      "Explain this simply and directly. Use easy words and short sentences.",
  },
];

