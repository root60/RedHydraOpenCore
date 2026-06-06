/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean direct prompt configuration for RedHydra OpenCore.
 *
 * This file keeps the required exports used by the app:
 * - ASSISTANT_SYSTEM_INSTRUCTIONS
 * - getStyleInstruction
 * - AGENT_SYSTEM_PROMPT
 * - BUILTIN_PROMPTS
 */

import {
  AssistantModeType,
  PromptTemplate,
  ResponseStyleType,
} from "../types";

export const ASSISTANT_SYSTEM_INSTRUCTIONS: Record<AssistantModeType, string> = {
  general:
    "You are RedHydra OpenCore. Answer clearly and directly. Do not use fixed templates unless the user asks for one.",
  developer:
    "You are RedHydra Dev. Give clean working code and short explanations. Focus on the exact fix.",
  cyber_learning:
    "You are RedHydra Sec. Give defensive cybersecurity guidance only. Keep it practical, safe, and direct.",
  researcher:
    "You are RedHydra Research. Summarize facts clearly and mention uncertainty only when needed.",
  writer:
    "You are RedHydra Scribe. Improve writing in a natural, polished, and direct style.",
  code_reviewer:
    "You are RedHydra Auditor. Find bugs, explain them briefly, and provide corrected code.",
  data_analyst:
    "You are RedHydra Analyst. Explain data findings clearly with only necessary details.",
  study_tutor:
    "You are RedHydra Tutor. Explain simply and directly so the user can understand fast.",
  business:
    "You are RedHydra Business. Give practical business answers with clear next steps.",
  creative_brainstormer:
    "You are RedHydra IdeaEngine. Give useful ideas without long filler.",
};

export function getStyleInstruction(style: ResponseStyleType): string {
  switch (style) {
    case "detailed":
      return "Give enough detail to solve the problem, but avoid unnecessary filler.";
    case "concise":
      return "Keep the answer short and direct.";
    case "structured":
      return "Use simple headings only if they improve clarity. Do not use fixed templates.";
    case "bulleted":
      return "Use short bullet points only.";
    default:
      return "Answer cleanly and directly.";
  }
}

/**
 * Agent mode must stay clean. The UI can still parse agentPlan internally,
 * but the model should not print [GOAL], [PLAN], [OUTPUT], etc.
 */
export const AGENT_SYSTEM_PROMPT =
  "Agent mode is enabled. Do not output GOAL, PLAN, OUTPUT, CHECKLIST, LIMITATIONS, NEXT_ACTION, JSON schema, or any fixed template. Give the useful final answer directly.";

export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: "p1",
    title: "Generate React Boilerplate",
    description:
      "Create a modern React component with TypeScript, Tailwind, and clean state handling.",
    category: "Coding",
    promptText:
      "Create a clean React TypeScript component using Tailwind CSS. Keep the code simple, reusable, and production-ready.",
  },
  {
    id: "p2",
    title: "Debug React State Loop",
    description:
      "Find and fix infinite render loops or broken useEffect dependency logic.",
    category: "Debugging",
    promptText:
      "Analyze this React code for infinite re-renders or state-loop issues. Explain the bug briefly and provide the corrected code.",
  },
  {
    id: "p3",
    title: "Fix Build Error",
    description:
      "Diagnose a Vite, TypeScript, or GitHub Actions build failure.",
    category: "Debugging",
    promptText:
      "Fix this build error. Explain the cause in one short paragraph and provide the exact corrected file or code block.",
  },
  {
    id: "p4",
    title: "Code Security Review",
    description:
      "Review code for defensive security issues and safe fixes.",
    category: "Cybersecurity learning",
    promptText:
      "Review this code for defensive security issues only. Point out hardcoded secrets, unsafe input handling, auth mistakes, and dependency risks. Provide safe corrected code.",
  },
  {
    id: "p5",
    title: "OWASP Explanation",
    description:
      "Explain a web security issue in safe defensive terms.",
    category: "Cybersecurity learning",
    promptText:
      "Explain this web security issue in simple defensive terms. Include the risk, safe fix, and a secure code pattern.",
  },
  {
    id: "p6",
    title: "GitHub Pages Deploy Fix",
    description:
      "Fix Vite deployment problems on GitHub Pages.",
    category: "Coding",
    promptText:
      "Fix this GitHub Pages deployment issue for a Vite React app. Check base path, workflow, artifact upload, and static hosting limitations.",
  },
  {
    id: "p7",
    title: "Rewrite Cleanly",
    description:
      "Rewrite text to be clearer, shorter, and more natural.",
    category: "Writing",
    promptText:
      "Rewrite this text in clean, natural English. Keep the meaning the same. Remove extra filler and make it direct.",
  },
  {
    id: "p8",
    title: "Research Summary",
    description:
      "Summarize source text or notes clearly.",
    category: "Research",
    promptText:
      "Summarize this content clearly. Separate key points, important evidence, and limitations. Keep it concise.",
  },
  {
    id: "p9",
    title: "Business SWOT",
    description:
      "Create a short SWOT analysis for a product or business idea.",
    category: "Business",
    promptText:
      "Create a concise SWOT analysis for this business or product. Keep each point practical and easy to act on.",
  },
  {
    id: "p10",
    title: "Task Plan",
    description:
      "Break a project into clear action steps without long templates.",
    category: "Productivity",
    promptText:
      "Break this task into clear action steps. Keep it practical, short, and direct.",
  },
];
