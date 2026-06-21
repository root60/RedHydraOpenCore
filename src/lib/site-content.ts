export const homeCards = [
  {
    href: "/about",
    title: "Profile",
    body: "Meet the OpenCore personas without crowding the homepage.",
    cta: "read profile",
  },
  {
    href: "/features",
    title: "Features",
    body: "Chat, personas, skills, export, markdown, router mode, custom endpoints, and failover.",
    cta: "view features",
  },
  {
    href: "/models",
    title: "Models",
    body: "Real model names across OpenAI, Hugging Face Spaces, Ollama/local endpoints, and gateway providers.",
    cta: "browse models",
  },
  {
    href: "/voice",
    title: "Voice",
    body: "Click-to-talk input, live transcript filling, auto-speak replies, and OpenAI TTS support.",
    cta: "voice setup",
  },
  {
    href: "/privacy",
    title: "Privacy",
    body: "Encrypted keys, local-first routing options, explicit provider setup, and safer repo hygiene.",
    cta: "privacy notes",
  },
  {
    href: "/setup",
    title: "Setup",
    body: "Clean PowerShell commands for install, run, Git setup, and push.",
    cta: "setup guide",
  },
];

export const featureCards = [
  {
    title: "Main chatbot",
    body: "A dedicated /chat workspace with streaming responses, markdown rendering, copy, regenerate, export, prompt suggestions, and responsive controls.",
  },
  {
    title: "Persona engine",
    body: "Switch between OpenCore personas so the assistant tone changes without rebuilding the app.",
  },
  {
    title: "One /v1 gateway",
    body: "Expose a single OpenAI-compatible /v1/chat/completions endpoint with provider presets, encrypted keys, usage tracking, and fallback routing.",
  },
  {
    title: "Bring your own endpoint",
    body: "Point the tool at Ollama, LM Studio, llama.cpp, vLLM, OpenRouter, Hugging Face Router, or any compatible custom endpoint.",
  },
  {
    title: "Skills",
    body: "Skills add task-specific system instructions for code review, security analysis, writing, planning, and research-style prompts.",
  },
  {
    title: "Mobile first",
    body: "Navigation, model settings, persona controls, and chat actions remain reachable on phone, tablet, and desktop screens.",
  },
];

export const personaCards = [
  {
    emoji: "🐉",
    title: "RedHydra (Snarky)",
    body: "The default. Nine heads, zero patience, but still useful when work needs to ship.",
  },
  {
    emoji: "🐍",
    title: "OldScales (Sage)",
    body: "Slow, deliberate, annoyingly wise. Best for careful explanations and planning.",
  },
  {
    emoji: "👾",
    title: "Glix (Gremlin)",
    body: "Chaotic, helpful, feral, mostly helpful. Good for brainstorming and quick fixes.",
  },
];

export const providerGroups = [
  {
    title: "OpenAI / ChatGPT",
    models: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"],
  },
  {
    title: "Hugging Face Spaces / Gradio profiles",
    models: [
      "uncensored-auto",
      "hf-space/lylee122/Unsensored10",
      "hf-space/unsensoredai/adarsha",
      "hf-space/Saiyejin/Qwen-Unsensored-4B",
      "hf-space/ItsRedHydra/RedHydraOpenCore-dolphin",
    ],
  },
  {
    title: "Local / self-host profiles",
    models: ["ollama/wizardlm-7b-uncensored", "ollama/wizard-vicuna-13b-uncensored", "ollama/dolphin", "custom/openai-compatible"],
  },
  {
    title: "Gateway providers",
    models: ["Google Gemini", "Groq", "Cerebras", "NVIDIA", "Mistral", "OpenRouter", "GitHub Models", "Cohere", "Cloudflare", "Pollinations", "LLM7", "OVH AI Endpoints", "OpenCode Zen"],
  },
];

export const voiceSteps = [
  "Press the microphone button in /chat to start browser speech recognition.",
  "Speak naturally; the transcript is written into the message box as you talk.",
  "Send the message normally or edit the transcript first.",
  "Enable auto-speak to read assistant replies aloud after each response.",
  "Add OPENAI_API_KEY and OPENCORE_TTS_MODEL in .env.local for OpenAI TTS voices.",
];

export const setupCommands = [
  "cd C:\\Users\\nahid\\RedHydraOpenCore",
  "npm install",
  "npm run dev",
  "git status",
  "git add .",
  "git commit -m \"Clean repo and split landing pages\"",
  "git push -u origin main",
];
