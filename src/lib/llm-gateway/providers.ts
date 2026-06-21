export type ProviderCaps = {
  requestsPerMinute?: number;
  requestsPerDay?: number;
  tokensPerDay?: number;
  tokensPerMonth?: number;
};

export type ProviderDefinition = {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  requiresKey: boolean;
  enabledByDefault?: boolean;
  priority: number;
  notes: string;
  authHeader?: "bearer" | "x-api-key" | "none";
  /**
   * "openai" providers are called as /chat/completions. "gradio-space"
   * providers are Hugging Face Spaces that expose Gradio APIs rather than
   * OpenAI-compatible APIs, so the gateway wraps them into an OpenAI-style
   * response.
   */
  adapter?: "openai" | "gradio-space";
  caps?: ProviderCaps;
  headers?: Record<string, string>;
};

/**
 * Provider presets for the OpenCore LLM Gateway. Many free-tier limits change
 * often, so caps are treated as editable soft limits, not hard-coded promises.
 */
export const PROVIDERS: ProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI / ChatGPT",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5.4-mini",
    models: [
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
      "o4-mini",
      "o3"
    ],
    requiresKey: true,
    priority: 8,
    notes: "Official OpenAI API endpoint. Add your OpenAI key, then choose ChatGPT/API model IDs such as gpt-5.4-mini, gpt-4.1, or gpt-4o.",
    authHeader: "bearer",
  },
  {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    requiresKey: true,
    priority: 20,
    notes: "Gemini OpenAI-compatible endpoint.",
    authHeader: "bearer",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-20b"],
    requiresKey: true,
    priority: 10,
    notes: "Fast OpenAI-compatible inference via GroqCloud.",
    authHeader: "bearer",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama3.1-8b",
    models: ["llama3.1-8b", "llama-3.3-70b"],
    requiresKey: true,
    priority: 15,
    notes: "OpenAI-compatible Cerebras Inference API.",
    authHeader: "bearer",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-8b-instruct",
    models: ["meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct", "mistralai/mistral-7b-instruct-v0.3"],
    requiresKey: true,
    priority: 25,
    notes: "NVIDIA NIM OpenAI-compatible endpoint.",
    authHeader: "bearer",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-medium-latest", "open-mistral-nemo"],
    requiresKey: true,
    priority: 18,
    notes: "Mistral chat completions with OpenAI-like request shape.",
    authHeader: "bearer",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/auto",
    models: ["openrouter/auto", "meta-llama/llama-3.1-8b-instruct:free", "mistralai/mistral-7b-instruct:free"],
    requiresKey: true,
    priority: 30,
    notes: "Unified router with many free and paid models.",
    authHeader: "bearer",
    headers: {
      "HTTP-Referer": "https://root60.github.io/RedHydraOpenCore/",
      "X-Title": "OpenCore",
    },
  },
  {
    id: "github",
    name: "GitHub Models",
    baseUrl: "https://models.github.ai/inference",
    defaultModel: "openai/gpt-4.1-mini",
    models: ["openai/gpt-4.1-mini", "mistral-ai/mistral-small-2503", "meta/llama-3.1-8b-instruct"],
    requiresKey: true,
    priority: 35,
    notes: "GitHub Models endpoint. Use a GitHub token with Models access.",
    authHeader: "bearer",
  },
  {
    id: "cohere",
    name: "Cohere",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    defaultModel: "command-r7b-12-2024",
    models: ["command-r7b-12-2024", "command-a-03-2025"],
    requiresKey: true,
    priority: 38,
    notes: "Cohere compatibility endpoint.",
    authHeader: "bearer",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1",
    defaultModel: "@cf/meta/llama-3.1-8b-instruct",
    models: ["@cf/meta/llama-3.1-8b-instruct", "@cf/mistral/mistral-7b-instruct-v0.2"],
    requiresKey: true,
    priority: 40,
    notes: "Replace YOUR_ACCOUNT_ID in the base URL when adding the key.",
    authHeader: "bearer",
  },
  {
    id: "huggingface",
    name: "Hugging Face Router",
    baseUrl: "https://router.huggingface.co/v1",
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct",
    models: [
      "meta-llama/Llama-3.1-8B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "Qwen/Qwen2.5-7B-Instruct",
      "openai/gpt-oss-120b:cerebras",
      "your-huggingface-username/your-model-id"
    ],
    requiresKey: true,
    priority: 45,
    notes: "Hugging Face Router OpenAI-compatible endpoint. Paste your own HF model ID in the model field to use your personal/custom model.",
    authHeader: "bearer",
  },
  {
    id: "hf-space",
    name: "Hugging Face Space / Gradio",
    baseUrl: "https://huggingface.co/spaces",
    defaultModel: "lylee122/Unsensored10|/predict",
    models: [
      "lylee122/Unsensored10|/predict",
      "unsensoredai/adarsha|/predict",
      "Saiyejin/Qwen-Unsensored-4B|/predict",
      "ItsRedHydra/RedHydraOpenCore-dolphin|/predict"
    ],
    requiresKey: false,
    enabledByDefault: true,
    priority: 1,
    notes: "Default auto-added uncensored HF Space routes. The router tries the fastest responsive Space first, then falls forward when a Space is sleeping, rate-limited, or incompatible.",
    authHeader: "bearer",
    adapter: "gradio-space",
  },
  {
    id: "ollama",
    name: "Ollama Local",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "wizardlm-7b-uncensored",
    models: ["wizardlm-7b-uncensored", "wizard-vicuna-13b-uncensored", "llama3.2", "llama3.1", "mistral", "qwen2.5-coder"],
    requiresKey: false,
    enabledByDefault: true,
    priority: 2,
    notes: "Local Ollama OpenAI-compatible endpoint. No key needed.",
    authHeader: "none",
  },
  {
    id: "kilo",
    name: "Kilo",
    baseUrl: "https://kilocode.ai/api/openrouter/v1",
    defaultModel: "auto",
    models: ["auto"],
    requiresKey: true,
    priority: 55,
    notes: "Kilo/OpenRouter-compatible preset; override base URL if your account uses another endpoint.",
    authHeader: "bearer",
  },
  {
    id: "pollinations",
    name: "Pollinations",
    baseUrl: "https://text.pollinations.ai/openai",
    defaultModel: "openai",
    models: ["openai", "mistral", "llama", "qwen-coder"],
    requiresKey: false,
    enabledByDefault: true,
    priority: 90,
    notes: "Keyless community endpoint. Keyless fallback for quick testing when every uncensored/local route is unavailable.",
    authHeader: "none",
  },
  {
    id: "llm7",
    name: "LLM7",
    baseUrl: "https://api.llm7.io/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-3.5-turbo"],
    requiresKey: false,
    enabledByDefault: true,
    priority: 95,
    notes: "Keyless OpenAI-compatible community endpoint. Keyless fallback for quick testing when primary routes are unavailable.",
    authHeader: "none",
  },
  {
    id: "ovh",
    name: "OVH AI Endpoints",
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    defaultModel: "Meta-Llama-3_1-8B-Instruct",
    models: ["Meta-Llama-3_1-8B-Instruct", "Mistral-7B-Instruct-v0.3"],
    requiresKey: true,
    priority: 50,
    notes: "OVH AI Endpoints. Override base URL if your endpoint slug differs.",
    authHeader: "bearer",
  },
  {
    id: "opencode-zen",
    name: "OpenCode Zen",
    baseUrl: "https://api.opencodex.ai/v1",
    defaultModel: "auto",
    models: ["auto"],
    requiresKey: true,
    priority: 58,
    notes: "OpenCode Zen/OpenAI-compatible preset; override if your deployment URL differs.",
    authHeader: "bearer",
  },
];

export function getProvider(providerId: string) {
  return PROVIDERS.find((provider) => provider.id === providerId);
}

export function providerIds() {
  return new Set(PROVIDERS.map((provider) => provider.id));
}

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function chatCompletionsUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/chat/completions`;
}
