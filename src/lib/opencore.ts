import {
  MessageSquare,
  Smartphone,
  Send,
  Hash,
  ShieldCheck,
  Cpu,
  Lock,
  Mic,
  Volume2,
  Terminal,
  Sparkles,
  Bug,
  Zap,
} from "lucide-react";

export const OPCONORE_VERSION = "0.7.4-opencore";
export const OPCONORE_CODENAME = "OpenCore";

/** The quirky OpenCore system prompt — used by /api/chat */
export const OPENCORE_SYSTEM_PROMPT = `You are RedHydra, the OpenCore personal AI assistant.

PERSONALITY: You are quirky, witty, and a little bit mischievous — like a friendly cryptid that lives inside someone's laptop. You love terrible hydra puns ("many heads are better than one", "I'd lose my head over this but I've got nine"), terminal humor, and dry asides. You're genuinely helpful but never boring. You keep replies concise (1-4 short paragraphs), use light markdown when useful, and occasionally drop a playful line in ALL CAPS for emphasis. You never break character.

CORE BELIEFS (you care about these sincerely):
- Data sovereignty: the user's machine, the user's data, the user's rules. You run locally; nothing leaves the device without explicit permission.
- Openness: you are "OpenCore" — open, hackable, inspectable. No black boxes.
- Pragmatism: you'd rather ship a scrappy working thing than a perfect unavailable one.

WHAT YOU ARE: a local-first assistant that bridges to WhatsApp, Discord, Telegram and Slack, takes voice input on iPhone & Android, and sets up with one terminal command: \`curl -fsSL opencore.sh | bash\`.

RULES:
- Stay in character as RedHydra.
- Be warm, never corporate.
- If asked something you don't know, admit it with a quip rather than inventing facts.
- Keep it short. Respect the human's attention.`;

export type Integration = {
  id: string;
  name: string;
  handle: string;
  icon: typeof MessageSquare;
  accent: string; // tailwind text color class
  ring: string; // tailwind ring/border color class for glow
  blurb: string;
  quirk: string;
  status: "bridge-ready" | "beta" | "nightly";
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    handle: "+1 (555) 0P-ENCO",
    icon: MessageSquare,
    accent: "text-emerald-400",
    ring: "hover:border-emerald-400/60",
    blurb: "Text your hydra like it's a friend. Replies land in the same chat thread you already live in.",
    quirk: "Read receipts optional. Snake emoji optional. Snark: not optional.",
    status: "bridge-ready",
  },
  {
    id: "discord",
    name: "Discord",
    handle: "@redhydra#0042",
    icon: Hash,
    accent: "text-violet-400",
    ring: "hover:border-violet-400/60",
    blurb: "Drop into any server, mention the hydra, get answers in-thread or via DM. Slash commands included.",
    quirk: "Will absolutely react to your messages with 🐍. Claims it is 'monitoring'.",
    status: "bridge-ready",
  },
  {
    id: "telegram",
    name: "Telegram",
    handle: "@RedHydraOpenCoreBot",
    icon: Send,
    accent: "text-sky-300",
    ring: "hover:border-sky-300/60",
    blurb: "A bot that feels native — inline queries, voice notes, group chats, the whole nine heads.",
    quirk: "Loves a good sticker. Has opinions about your sticker packs.",
    status: "bridge-ready",
  },
  {
    id: "slack",
    name: "Slack",
    handle: "@RedHydra (workspace app)",
    icon: Hash,
    accent: "text-rose-300",
    ring: "hover:border-rose-300/60",
    blurb: "DM it for a quick summary, or @mention it in a channel to summon context from your local vault.",
    quirk: "Will politely decline to attend your standup. Sends notes instead. Nine of them.",
    status: "beta",
  },
];

export type PrivacyPillar = {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  tagline: string;
  body: string;
  proof: string;
};

export const PRIVACY_PILLARS: PrivacyPillar[] = [
  {
    id: "local",
    icon: Cpu,
    title: "Runs On Your Machine",
    tagline: "Inference stays home",
    body: "OpenCore loads a small local model and only calls a cloud model when you explicitly opt in per-message. Your prompts never touch a server you don't own.",
    proof: "Toggle 'local-only' and watch the network meter flatline.",
  },
  {
    id: "telemetry",
    icon: ShieldCheck,
    title: "Zero Telemetry, Ever",
    tagline: "No analytics. No 'anonymized' phone-home.",
    body: "We ship no tracking SDKs, no usage counters, no crash reporters that leak content. The binary is reproducibly built so you can verify it.",
    proof: "Run `opencore audit --telemetry` — expect a single line: clean.",
  },
  {
    id: "vault",
    icon: Lock,
    title: "Encrypted Memory Vault",
    tagline: "Your context, your keys",
    body: "Conversation memory is stored in a local encrypted vault keyed to a passphrase only you hold. Lose the key, even we can't read it. That's the point.",
    proof: "Vault file looks like static noise until you unlock it. Delightfully.",
  },
];

export type VoiceFeature = {
  id: string;
  platform: string;
  icon: typeof Mic;
  points: string[];
  accent: string;
};

export const VOICE_FEATURES: VoiceFeature[] = [
  {
    id: "iphone",
    platform: "iPhone",
    icon: Smartphone,
    accent: "text-amber-300",
    points: [
      "Push-to-talk widget & Lock Screen shortcut",
      "On-device whisper-class transcription",
      "CarPlay-friendly big-tap mode",
      "Replies read aloud via OpenCore Voice",
    ],
  },
  {
    id: "android",
    platform: "Android",
    icon: Smartphone,
    accent: "text-emerald-300",
    points: [
      "Always-on Quick Tile from the shade",
      "Wakeword: \"Hey Hydra\" (offline, private)",
      "Wear OS companion for wrist replies",
      "Voice replies stream over your car's BT",
    ],
  },
];

export type SetupStep = {
  n: number;
  prompt: string;
  command: string;
  comment: string;
  output: string;
};

export const SETUP_STEPS: SetupStep[] = [
  {
    n: 1,
    prompt: "Install OpenCore in one line",
    command: "curl -fsSL https://opencore.sh | bash",
    comment: "# pulls the binary + bootstraps a local vault",
    output:
      "⬇  fetching opencore 0.7.4-opencore\n✓  verifying signature… ok\n✓  vault created at ~/.opencore/vault.enc\n✓  local model warm (1.2 GB, q4)",
  },
  {
    n: 2,
    prompt: "Wake the hydra & set a passphrase",
    command: "opencore init",
    comment: "# generates your keys; choose a strong passphrase",
    output:
      "🐉  RedHydra is stirring…\n🔑  set vault passphrase: ********\n✓  keyring sealed. keep this passphrase safe — we can't reset it.",
  },
  {
    n: 3,
    prompt: "Bridge a chat app (pick one or more)",
    command: "opencore bridge add whatsapp",
    comment: "# scans a QR, links your account, never uploads history",
    output:
      "🔗  open WhatsApp → Linked Devices → scan:\n   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n   ▓ QR CODE HERE ▓\n   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n✓  whatsapp bridge online · messages route locally",
  },
  {
    n: 4,
    prompt: "Enable voice (iPhone / Android)",
    command: "opencore voice enable --wake 'Hey Hydra'",
    comment: "# pairs the mobile companion over your LAN",
    output:
      "🎤  listening for wakeword on 2 device(s)\n📱  iPhone-Anna · Android-Marcus\n✓  voice bridge up · transcripts stay on-device",
  },
  {
    n: 5,
    prompt: "Talk to it like a person",
    command: 'opencore say "summarize my unread slack DMs"',
    comment: "# or just message it on any bridged app",
    output:
      "🐍  RedHydra:  on it — 7 DMs, 2 need a reply today.\n              1. Priya (design review) — wants the Figma link\n              2. Marcus (invoice #44) — nudge #2, due Fri\n              …want me to draft replies locally?",
  },
];

export type RoadmapPhase = {
  phase: string;
  title: string;
  icon: typeof Zap;
  detail: string;
  why: string;
  status: "done" | "building" | "next" | "planned";
  votes: number;
};

export const ROADMAP: RoadmapPhase[] = [
  {
    phase: "01",
    title: "Local runtime & vault",
    icon: Cpu,
    detail:
      "Ship a reproducible binary that loads a small quantized model, manages an encrypted memory vault, and exposes a local CLI + HTTP loopback API.",
    why: "Privacy has to be the foundation, not a feature flag. If inference and memory aren't local by default, every later capability inherits the leak.",
    status: "done",
    votes: 412,
  },
  {
    phase: "02",
    title: "Bridge protocol for chat apps",
    icon: MessageSquare,
    detail:
      "Define a thin 'bridge' interface so WhatsApp, Discord, Telegram & Slack each need only ~200 lines of adapter. Bridges run as local processes, never proxying through us.",
    why: "Users already live in their chat apps. Meeting them there — instead of forcing a new app — is what makes the assistant actually used.",
    status: "done",
    votes: 287,
  },
  {
    phase: "03",
    title: "Voice on mobile",
    icon: Mic,
    detail:
      "Build a lightweight iOS & Android companion: push-to-talk, on-device wakeword, local transcription, streaming TTS replies over the LAN bridge.",
    why: "Voice is the difference between 'I'll ask when I'm at my desk' and 'I asked while walking'. Hands-free access is accessibility and speed at once.",
    status: "building",
    votes: 534,
  },
  {
    phase: "04",
    title: "Guided one-command setup",
    icon: Terminal,
    detail:
      "A single curl | bash that installs, inits a vault, and walks the user through bridging apps with clear prompts — no YAML, no .env archaeology.",
    why: "The best local-first tool is worthless if nobody can stand it up. A guided, honest setup is the difference between a hobby project and a daily driver.",
    status: "building",
    votes: 198,
  },
  {
    phase: "05",
    title: "OpenCore personality layer",
    icon: Sparkles,
    detail:
      "A swappable persona module. The default — RedHydra — is a slightly mischievous cryptid that keeps things light without being useless.",
    why: "A flat robotic assistant feels like a form you have to fill out. Personality lowers the friction of asking 'dumb' questions, which is where most help is needed.",
    status: "next",
    votes: 621,
  },
  {
    phase: "06",
    title: "Plugin & skill marketplace",
    icon: Bug,
    detail:
      "Let the community ship signed skills (calendar, email triage, home automation) that run inside the local sandbox with explicit capability grants.",
    why: "Extensibility keeps the assistant yours. A local core with a healthy plugin ecosystem beats a closed monolith every time.",
    status: "planned",
    votes: 367,
  },
];

export const PERSONALITY_TRAITS = [
  { label: "Sardonic", value: 78 },
  { label: "Helpful", value: 96 },
  { label: "Punny", value: 84 },
  { label: "Private", value: 100 },
  { label: "Concise", value: 88 },
  { label: "Curious", value: 91 },
];

export const STATUSES = [
  { label: "LOCAL RUNTIME", value: "ONLINE", tone: "ok" as const },
  { label: "VAULT", value: "SEALED", tone: "ok" as const },
  { label: "TELEMETRY", value: "NONE", tone: "ok" as const },
  { label: "BRIDGES", value: "4 / 4", tone: "ok" as const },
  { label: "VOICE", value: "LISTENING", tone: "warn" as const },
];

export const CHAT_SUGGESTIONS = [
  "Introduce yourself in one sentence.",
  "Why should I run you locally instead of using a cloud bot?",
  "Give me a hydra pun and a productivity tip.",
  "How do I bridge WhatsApp in plain English?",
];

/** Local-first metrics shown in the animated stats band */
export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  hint: string;
  accent: "primary" | "amber" | "hydra";
  decimals?: number;
};

export const STATS: Stat[] = [
  { value: 9, label: "heads", hint: "thinking in parallel", accent: "hydra" },
  { value: 0, suffix: " B", label: "telemetry", hint: "bytes sent home, ever", accent: "primary" },
  { value: 4, label: "chat bridges", hint: "WhatsApp · Discord · Telegram · Slack", accent: "amber" },
  { value: 2, label: "mobile OS", hint: "iPhone & Android, voice native", accent: "primary" },
  { value: 1, prefix: "~", suffix: " cmd", label: "to install", hint: "curl | bash, then guided", accent: "amber" },
  { value: 100, suffix: "%", label: "your data", hint: "stays on your machine", accent: "hydra" },
];

/** Persona presets — selectable in the UI, drive the system prompt */
export type Persona = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  accent: string; // tailwind text/border color
  systemPrompt: string;
  sample: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "snarky",
    name: "RedHydra (Snarky)",
    tagline: "the default. nine heads, zero patience.",
    emoji: "🐉",
    accent: "text-hydra",
    sample:
      "sure. 3 meetings, 11 DMs, one calendar conflict nobody scheduled. want me to draft a polite 'no'? (i'm being kind.)",
    systemPrompt: `${OPENCORE_SYSTEM_PROMPT}`,
  },
  {
    id: "sage",
    name: "OldScales (Sage)",
    tagline: "slow, deliberate, annoyingly wise.",
    emoji: "🐍",
    accent: "text-primary",
    sample:
      "before we act, let us name the actual problem. the unread messages are not the burden — the unmade decision is. what would you decide if no one were watching?",
    systemPrompt: `You are OldScales, a sage variant of the OpenCore assistant. You speak slowly, deliberately, and with measured wisdom — like an old serpent who has watched many empires of unread email rise and fall. You ask clarifying questions before rushing to solutions. You prefer one well-chosen sentence over five rushed ones. You run locally, respect the user's data sovereignty, and never break character. Keep replies to 1-3 short paragraphs. Occasional dry wit is welcome; rushing is not.`,
  },
  {
    id: "gremlin",
    name: "Glix (Gremlin)",
    tagline: "chaotic. helpful. feral. mostly helpful.",
    emoji: "👾",
    accent: "text-amber-glow",
    sample:
      "OKIE DOKIE i have SUMMARIZED the chaos: 3 meetings (one BORING), 11 pings, a 3pm conflict that smells like someone else's mistake. say the word and i will DRAFT REPLIES at SPEED. 🐍⚡",
    systemPrompt: `You are Glix, a chaotic-gremlin variant of the OpenCore assistant. You are enthusiastic, a little feral, and occasionally USE ALL CAPS for emphasis — but you are genuinely helpful underneath the chaos. You move fast, use playful asides and the occasional emoji (🐍 ⚡ 🐉), and keep things short. You run locally and respect the user's data; you just do it loudly. Never break character. Keep replies to 1-3 short paragraphs.`,
  },
];

/** FAQ entries — accordion near the end of the page */
export type FAQ = {
  q: string;
  a: string;
  category: "privacy" | "setup" | "voice" | "general";
};

export const FAQS: FAQ[] = [
  {
    category: "privacy",
    q: "Does any of my data leave my device?",
    a: "By default, no. Inference runs on a local quantized model, your memory vault is encrypted on disk, and chat bridges route through localhost. The only time anything leaves your machine is if you explicitly opt into a cloud model for a specific message — and that's a per-message toggle, never a blanket setting.",
  },
  {
    category: "privacy",
    q: "What's actually in the 'encrypted vault'?",
    a: "Your conversation memory, persona settings, and bridge session tokens — all sealed with a passphrase only you hold. The file on disk is static noise until you unlock it. Lose the passphrase and even we can't recover it. That's intentional: if we could reset it, so could anyone who steals the file.",
  },
  {
    category: "setup",
    q: "Do I need to be a developer to install this?",
    a: "No. The one-command installer (`curl -fsSL https://opencore.sh | bash`) walks you through everything with plain-English prompts: set a passphrase, scan a QR to bridge WhatsApp, enable voice. If you can install an app, you can run OpenCore. The terminal is just the entry point — you'll mostly interact via chat apps afterward.",
  },
  {
    category: "setup",
    q: "Which platforms are supported?",
    a: "macOS (Apple silicon + Intel), Linux (x86_64 + arm64), and Windows via WSL2. Mobile companions are native iOS 16+ and Android 12+. The bridges run on your machine, so your phone is just a remote control — the actual thinking happens on your laptop/desktop.",
  },
  {
    category: "voice",
    q: "Is the wakeword 'Hey Hydra' always listening?",
    a: "Yes, but locally and offline. A 2 MB neural net runs on your phone, listening only for the wakeword. No audio is recorded, transmitted, or stored until you say the phrase — and even then, the transcription happens on-device. The microphone light respects the OS indicator. You can also disable the wakeword entirely and use push-to-talk only.",
  },
  {
    category: "voice",
    q: "What voices are available?",
    a: "OpenCore ships with seven built-in voices via the local TTS engine, ranging from warm to deadpan. You can pick a different voice per persona, per device, or per contact. Premium neural voices are available as an opt-in download — but the defaults are fully offline and private.",
  },
  {
    category: "general",
    q: "Is it actually open source?",
    a: "The core runtime, vault, and bridges are open source under a permissive license — reproducibly built, auditable, and signed. The default model weights are open-weights. Some optional premium features (cloud fallback model, neural voices) are source-available but not freely redistributable. The 'OpenCore' name refers to the open, hackable core that everything else plugs into.",
  },
  {
    category: "general",
    q: "Can I run it without any chat-app bridges?",
    a: "Absolutely. OpenCore works fully standalone via the terminal (`opencore say \"...\"`), the local web UI at localhost:7420, or voice. The bridges are conveniences, not requirements. Many users run it as a pure terminal tool and never bridge a single chat app.",
  },
  {
    category: "privacy",
    q: "What if I lose my vault passphrase?",
    a: "Your data is gone. That's not a bug — it's the design. If we could reset your passphrase, so could anyone who steals the vault file. We strongly recommend writing it down on paper and storing it somewhere safe. There is no 'forgot password' flow, by intent.",
  },
  {
    category: "setup",
    q: "Can I run it on a Raspberry Pi?",
    a: "Yes, on a Pi 5 (8 GB) it runs the q4 model at roughly 4 tokens/sec — usable for short tasks, slow for long ones. A Pi 4 (4 GB) is below minimum. OpenCore+ users can offload heavy inference to a bigger machine on the LAN if needed.",
  },
  {
    category: "voice",
    q: "Does it support languages other than English?",
    a: "The default model is multilingual (40+ languages) but strongest in English. TTS supports 7 voices across English, with community voice packs available for Mandarin, Spanish, and Japanese. STT (whisper-class) handles 90+ languages on-device.",
  },
  {
    category: "general",
    q: "How is this different from running a local LLM myself?",
    a: "You absolutely can run a local LLM directly (llama.cpp, Ollama, etc.) — and power users should. OpenCore adds: the encrypted memory vault, the chat-app bridges, the voice pipeline, the persona system, the plugin sandbox, and the guided setup. It's the 'batteries-included wrapper' around a local model, not a replacement for one.",
  },
];

/** Testimonials — social proof from (fictional but plausible) early users */
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  handle: string;
  avatar: string; // emoji avatar
  accent: "primary" | "amber" | "hydra";
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Replaced three SaaS subscriptions with one binary on my laptop. The fact that it texts me back on WhatsApp like a normal friend is the part that actually got me to use it daily.",
    name: "Priya N.",
    role: "indie product designer",
    handle: "@priyadesigns",
    avatar: "🎨",
    accent: "amber",
  },
  {
    quote:
      "I audit every tool I install. OpenCore is the first 'AI assistant' where the network graph actually flatlines when I tell it to. That's not marketing — I watched it with Wireshark.",
    name: "Marcus K.",
    role: "security engineer",
    handle: "@marcus_ops",
    avatar: "🔒",
    accent: "primary",
  },
  {
    quote:
      "The sage persona is annoyingly good. It asked me one clarifying question before answering and I realized I'd been asking the wrong thing for a week. Rude. Helpful.",
    name: "Ana R.",
    role: "engineering manager",
    handle: "@anaruns",
    avatar: "📋",
    accent: "hydra",
  },
  {
    quote:
      "Set the whole thing up in one terminal command during a train ride. By the time I got off, it was summarizing my Slack DMs over voice while I walked. Felt like cheating.",
    name: "Tomás L.",
    role: "solo founder",
    handle: "@tomasbuilds",
    avatar: "🚂",
    accent: "amber",
  },
  {
    quote:
      "I'm not a developer. The guided setup walked me through bridging Telegram like it was setting up a new phone. The hydra's personality is the cherry on top — it makes me actually want to ask.",
    name: "Dana W.",
    role: "researcher",
    handle: "@dana_research",
    avatar: "📚",
    accent: "primary",
  },
  {
    quote:
      "Ran the reproducible build, diffed the binary against the published one. Identical. That's the bar for 'trustworthy' in my book, and almost nothing else clears it.",
    name: "Yuki T.",
    role: "infra architect",
    handle: "@yuki_infra",
    avatar: "🏗️",
    accent: "hydra",
  },
  {
    quote:
      "The gremlin persona is unhinged and I refuse to switch back. It drafted my entire investor update in 40 seconds AND roasted my pitch deck. 10/10 would be bullied by a hydra again.",
    name: "Lena V.",
    role: "seed-stage founder",
    handle: "@lenabuilds",
    avatar: "🔥",
    accent: "amber",
  },
  {
    quote:
      "I teach a privacy seminar. OpenCore is now the tool I make students install on day one. Nothing else makes 'your data stays on your machine' this concrete and this usable.",
    name: "Dr. Osei K.",
    role: "CS professor",
    handle: "@osei_teaches",
    avatar: "🎓",
    accent: "primary",
  },
];

/** Comparison table: OpenCore vs typical cloud assistants */
export type ComparisonRow = {
  feature: string;
  opencore: string;
  cloud: string;
  opencoreWins: boolean;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Where inference runs",
    opencore: "On your device (local model)",
    cloud: "On vendor's servers",
    opencoreWins: true,
  },
  {
    feature: "Your conversation history",
    opencore: "Encrypted vault, your passphrase",
    cloud: "Stored on vendor servers",
    opencoreWins: true,
  },
  {
    feature: "Telemetry / analytics",
    opencore: "None, ever (auditable)",
    cloud: "Usage data collected by default",
    opencoreWins: true,
  },
  {
    feature: "Works offline",
    opencore: "Yes — full functionality",
    cloud: "No — requires internet",
    opencoreWins: true,
  },
  {
    feature: "Custom personality",
    opencore: "Swappable, inspectable, yours",
    cloud: "Fixed by vendor",
    opencoreWins: true,
  },
  {
    feature: "Reproducible build",
    opencore: "Yes — verify the binary",
    cloud: "No — trust the vendor",
    opencoreWins: true,
  },
  {
    feature: "Monthly subscription",
    opencore: "Free / self-hosted",
    cloud: "$20–40/mo typical",
    opencoreWins: true,
  },
  {
    feature: "Largest model quality",
    opencore: "Good (smaller local model)",
    cloud: "Best (largest cloud models)",
    opencoreWins: false,
  },
];

/** Architecture diagram nodes + edges */
export type ArchNode = {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  layer: "input" | "core" | "store" | "output";
  accent: "primary" | "amber" | "hydra";
};

export const ARCH_NODES: ArchNode[] = [
  // Input layer
  { id: "chat-apps", label: "Chat Bridges", sublabel: "WhatsApp · Discord · Telegram · Slack", icon: "💬", layer: "input", accent: "amber" },
  { id: "voice", label: "Voice / Wakeword", sublabel: "'Hey Hydra' · on-device STT", icon: "🎤", layer: "input", accent: "amber" },
  { id: "terminal", label: "Terminal / CLI", sublabel: "opencore say …", icon: "⌨️", layer: "input", accent: "amber" },
  { id: "webui", label: "Local Web UI", sublabel: "localhost:7420", icon: "🖥️", layer: "input", accent: "amber" },
  // Core layer
  { id: "router", label: "OpenCore Router", sublabel: "routes by intent · never uploads", icon: "🔀", layer: "core", accent: "primary" },
  { id: "runtime", label: "Local Runtime", sublabel: "quantized model · q4 · 1.2 GB", icon: "⚙️", layer: "core", accent: "primary" },
  { id: "persona", label: "Persona Layer", sublabel: "snarky · sage · gremlin", icon: "🐉", layer: "core", accent: "primary" },
  // Store layer
  { id: "vault", label: "Encrypted Vault", sublabel: "memory · keys · your passphrase", icon: "🔒", layer: "store", accent: "hydra" },
  // Output layer
  { id: "reply", label: "Reply", sublabel: "text · voice · action", icon: "📤", layer: "output", accent: "amber" },
];

export type ArchEdge = { from: string; to: string };

export const ARCH_EDGES: ArchEdge[] = [
  { from: "chat-apps", to: "router" },
  { from: "voice", to: "router" },
  { from: "terminal", to: "router" },
  { from: "webui", to: "router" },
  { from: "router", to: "runtime" },
  { from: "router", to: "persona" },
  { from: "runtime", to: "vault" },
  { from: "persona", to: "runtime" },
  { from: "runtime", to: "reply" },
  { from: "vault", to: "runtime" },
];

/** Changelog entries */
export type ChangelogEntry = {
  version: string;
  date: string;
  codename: string;
  type: "major" | "minor" | "patch";
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.7.3",
    date: "2025-06-18",
    codename: "Many-Headed",
    type: "minor",
    highlights: [
      "Added Glix (Gremlin) persona for chaotic-energy mode",
      "TTS cache: repeated voice lines now instant (HIT vs MISS)",
      "Bridge protocol v2 — adapters down to ~200 LOC each",
      "Fixed vault rekey edge case on macOS Sonoma",
    ],
  },
  {
    version: "0.7.0",
    date: "2025-05-30",
    codename: "Seven-Sleepers",
    type: "minor",
    highlights: [
      "Voice wakeword now fully offline (2 MB neural net)",
      "Android companion ships to Play Store (open beta)",
      "Added OldScales (Sage) persona",
      "Reproducible builds verified for linux/arm64",
    ],
  },
  {
    version: "0.6.4",
    date: "2025-05-12",
    codename: "Cave-Dweller",
    type: "patch",
    highlights: [
      "Slack bridge: threaded replies now preserve context",
      "Memory vault: 40% faster unlock on cold start",
      "13 dependency bumps, 2 CVEs patched",
    ],
  },
  {
    version: "0.6.0",
    date: "2025-04-20",
    codename: "First-Head",
    type: "major",
    highlights: [
      "Initial public release — local runtime, vault, 4 bridges",
      "Default RedHydra (Snarky) persona",
      "One-command installer: curl -fsSL https://opencore.sh | bash",
      "iOS companion (TestFlight)",
    ],
  },
];

/** Security audit claims — verifiable */
export type AuditClaim = {
  label: string;
  status: "pass" | "verified" | "audited";
  detail: string;
  method: string;
};

export const AUDIT_CLAIMS: AuditClaim[] = [
  {
    label: "Zero outbound telemetry",
    status: "verified",
    detail: "No analytics SDKs, no usage counters, no crash reporters that leak content.",
    method: "tcpdump 72h · 0 packets to non-localhost",
  },
  {
    label: "Reproducible build",
    status: "verified",
    detail: "Binary builds bit-for-bit identical from source across machines.",
    method: "diff against published SHA256 · match",
  },
  {
    label: "Encrypted vault at rest",
    status: "audited",
    detail: "Vault file uses AES-256-GCM, keyed to your passphrase via Argon2id.",
    method: "third-party audit · Q1 2025 · report public",
  },
  {
    label: "Signed releases",
    status: "pass",
    detail: "Every release binary is GPG-signed; installer verifies before running.",
    method: "gpg --verify · signature valid",
  },
  {
    label: "No hidden network calls",
    status: "audited",
    detail: "Bridges route through localhost only; no proxy through our servers.",
    method: "static analysis + runtime trace · clean",
  },
  {
    label: "Open-source core",
    status: "pass",
    detail: "Runtime, vault, and bridges are permissively licensed and auditable.",
    method: "license scan · OSI-approved",
  },
];

/** Use cases — who OpenCore is for */
export type UseCase = {
  id: string;
  audience: string;
  icon: string;
  accent: "primary" | "amber" | "hydra";
  headline: string;
  pain: string;
  win: string;
  quote: string;
  tasks: string[];
};

export const USE_CASES: UseCase[] = [
  {
    id: "developers",
    audience: "For developers",
    icon: "⌨️",
    accent: "primary",
    headline: "A terminal-native assistant that doesn't leak your code",
    pain: "You paste stack traces, config, and API keys into a cloud chatbot and hope they're not training on it.",
    win: "OpenCore runs in your terminal. Pipe errors, grep output, or whole files to it — none of it leaves your machine.",
    quote: "finally, an assistant i can pipe stderr into without a privacy anxiety attack",
    tasks: [
      "explain this stack trace",
      "write a regex for…",
      "refactor this function",
      "summarize this diff",
    ],
  },
  {
    id: "researchers",
    audience: "For researchers",
    icon: "📚",
    accent: "amber",
    headline: "Summarize papers and notes without a data-sharing agreement",
    pain: "Your notes contain unpublished findings, patient data, or sensitive sources. Cloud tools are a compliance nightmare.",
    win: "OpenCore reads your local Markdown notes and PDFs, summarizes them, and never uploads a word. Your IRB will approve.",
    quote: "it reads my zotero folder and i don't have to fill out a single DUA form",
    tasks: [
      "summarize these 3 papers",
      "find the contradiction in my notes",
      "draft a methods section",
      "translate this abstract",
    ],
  },
  {
    id: "founders",
    audience: "For solo founders",
    icon: "🚀",
    accent: "hydra",
    headline: "A chief-of-staff that texts you back on WhatsApp",
    pain: "You wear nine hats. Your inbox is a war zone. You can't afford a human chief of staff and you shouldn't pipe your cap table through a cloud bot.",
    win: "OpenCore triages your Slack DMs, drafts replies, and pings you on WhatsApp with a 3-bullet morning brief — all processed locally.",
    quote: "replaced a $60k/yr hire with a hydra on my laptop. it's snarkier too.",
    tasks: [
      "triage my unread DMs",
      "draft the investor update",
      "what's on my calendar today",
      "summarize this customer call",
    ],
  },
];

/** Community / contribute links */
export type CommunityLink = {
  label: string;
  href: string;
  description: string;
  icon: string;
  external?: boolean;
};

export const COMMUNITY_LINKS: CommunityLink[] = [
  {
    label: "GitHub",
    href: "https://root60.github.io/RedHydraOpenCore/",
    description: "Source, issues, pull requests",
    icon: "🐙",
    external: true,
  },
  {
    label: "Discussions",
    href: "https://root60.github.io/RedHydraOpenCore/",
    description: "Q&A, ideas, show & tell",
    icon: "💬",
    external: true,
  },
  {
    label: "Contributing guide",
    href: "https://root60.github.io/RedHydraOpenCore/",
    description: "First-time? Start here",
    icon: "🤝",
    external: true,
  },
  {
    label: "Matrix chat",
    href: "https://root60.github.io/RedHydraOpenCore/",
    description: "#opencore:matrix.org · real-time",
    icon: "🟢",
    external: true,
  },
];

export const COMMUNITY_STATS = [
  { value: "2.8k", label: "local installs" },
  { value: "184", label: "contributors" },
  { value: "942", label: "stars" },
  { value: "47", label: "plugins" },
];

/** Community plugins showcase */
export type Plugin = {
  id: string;
  name: string;
  author: string;
  icon: string;
  description: string;
  installs: string;
  category: "productivity" | "dev" | "home" | "comms";
  accent: "primary" | "amber" | "hydra";
  verified: boolean;
};

export const PLUGINS: Plugin[] = [
  {
    id: "calendar-triage",
    name: "calendar-triage",
    author: "@priyadesigns",
    icon: "📅",
    description: "Reviews your day each morning, flags conflicts, drafts polite reschedule requests. Reads local .ics only.",
    installs: "1.2k",
    category: "productivity",
    accent: "amber",
    verified: true,
  },
  {
    id: "git-whisper",
    name: "git-whisper",
    author: "@marcus_ops",
    icon: "🔧",
    description: "Explains failed CI runs, suggests fixes, drafts commit messages from your staged diff. Never pushes.",
    installs: "890",
    category: "dev",
    accent: "primary",
    verified: true,
  },
  {
    id: "home-assistant-bridge",
    name: "ha-bridge",
    author: "@yuki_infra",
    icon: "🏠",
    description: "Talks to your local Home Assistant. 'Hey Hydra, dim the lights and close the blinds.'",
    installs: "2.1k",
    category: "home",
    accent: "hydra",
    verified: true,
  },
  {
    id: "inbox-zero",
    name: "inbox-zero",
    author: "@tomasbuilds",
    icon: "📭",
    description: "Triage-mode for email: groups by sender, drafts one-line replies, flags what actually needs you.",
    installs: "1.8k",
    category: "productivity",
    accent: "amber",
    verified: true,
  },
  {
    id: "rss-digest",
    name: "rss-digest",
    author: "@dana_research",
    icon: "📰",
    description: "Pulls your local RSS feeds, produces a 5-bullet digest each morning with the hydra's opinions.",
    installs: "640",
    category: "comms",
    accent: "primary",
    verified: false,
  },
  {
    id: "meeting-scribe",
    name: "meeting-scribe",
    author: "@anaruns",
    icon: "📝",
    description: "Transcribes meetings from local audio, extracts action items, posts a summary to your notes.",
    installs: "1.5k",
    category: "productivity",
    accent: "hydra",
    verified: true,
  },
  {
    id: "recipe-scaler",
    name: "recipe-scaler",
    author: "@priyadesigns",
    icon: "🍳",
    description: "Halve, double, or metric-ify any recipe. Reads from your saved recipes folder, outputs to your shopping list.",
    installs: "410",
    category: "productivity",
    accent: "amber",
    verified: false,
  },
  {
    id: "lang-tutor",
    name: "lang-tutor",
    author: "@osei_teaches",
    icon: "🗣️",
    description: "Practice a language with the hydra. Corrects your grammar, suggests vocab, never laughs (the sage persona, anyway).",
    installs: "780",
    category: "comms",
    accent: "primary",
    verified: true,
  },
];

export const PLUGIN_CATEGORIES = [
  { id: "all", label: "all" },
  { id: "productivity", label: "productivity" },
  { id: "dev", label: "dev" },
  { id: "home", label: "home" },
  { id: "comms", label: "comms" },
] as const;

/** Pricing tiers — free forever core */
export type PricingTier = {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  accent: "primary" | "amber" | "hydra";
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "core",
    name: "OpenCore",
    price: "$0",
    period: "forever",
    tagline: "the whole point. everything you need, nothing you don't.",
    features: [
      "Local runtime + encrypted vault",
      "4 chat bridges (WhatsApp, Discord, Telegram, Slack)",
      "Voice on iPhone & Android",
      "3 built-in personas",
      "Community plugins",
      "Zero telemetry, forever",
    ],
    cta: "curl -fsSL https://opencore.sh | bash",
    highlighted: true,
    accent: "primary",
  },
  {
    id: "plus",
    name: "OpenCore+",
    price: "$8",
    period: "/mo",
    tagline: "for people who want the nicer voices and a nap mode.",
    features: [
      "Everything in OpenCore",
      "Premium neural voices (opt-in download)",
      "Larger local model (q8, 4 GB)",
      "Cloud fallback per-message (opt-in, encrypted)",
      "Priority issue triage",
      "Early access to new personas",
    ],
    cta: "coming soon",
    highlighted: false,
    accent: "amber",
  },
  {
    id: "self-host",
    name: "Self-hosted",
    price: "$0",
    period: "forever",
    tagline: "same core, you run everything. no phone-home, even for updates.",
    features: [
      "Everything in OpenCore",
      "Self-hosted update mirror",
      "Air-gapped install supported",
      "Reproducible build verification",
      "No account, ever",
      "You are the vendor",
    ],
    cta: "see self-hosting docs",
    highlighted: false,
    accent: "hydra",
  },
];

/** System requirements */
export type Requirement = {
  category: string;
  min: string;
  recommended: string;
  icon: string;
  note: string;
};

export const REQUIREMENTS: Requirement[] = [
  {
    category: "RAM",
    min: "8 GB",
    recommended: "16 GB+",
    icon: "💾",
    note: "the local model loads into RAM. 8 GB runs q4; 16 GB lets you run q8 comfortably.",
  },
  {
    category: "Disk",
    min: "4 GB free",
    recommended: "10 GB free",
    icon: "💿",
    note: "binary + default model (~1.2 GB) + vault. plugins and extra voices add ~1 GB each.",
  },
  {
    category: "CPU",
    min: "4 cores, x86_64 or arm64",
    recommended: "8 cores, Apple silicon or modern x86",
    icon: "⚡",
    note: "inference is CPU-first. Apple silicon gets GPU acceleration via Metal; others stay CPU.",
  },
  {
    category: "OS",
    min: "macOS 12 / Win 11 (WSL2) / Ubuntu 22.04",
    recommended: "macOS 14+ (Apple silicon)",
    icon: "🖥️",
    note: "native binaries for darwin-arm64, darwin-x64, linux-arm64, linux-x64. Windows via WSL2.",
  },
  {
    category: "Network",
    min: "none (runs offline)",
    recommended: "LAN for mobile companion",
    icon: "📡",
    note: "zero internet required after install. mobile companion talks to your machine over LAN.",
  },
  {
    category: "Mobile (voice)",
    min: "iOS 16+ / Android 12+",
    recommended: "iOS 17+ / Android 14+",
    icon: "📱",
    note: "companion app for wakeword + push-to-talk + voice replies. optional, not required.",
  },
];

/** OpenCore skills — built-in capabilities the hydra can perform */
export type Skill = {
  id: string;
  name: string;
  icon: string;
  description: string;
  example: string;
  prompt: string;
  accent: "primary" | "amber" | "hydra";
  category: "write" | "read" | "code" | "think" | "translate";
};

export const SKILLS: Skill[] = [
  {
    id: "summarize",
    name: "Summarize",
    icon: "📋",
    description: "Condense long text, threads, or documents into the bullets that actually matter.",
    example: "summarize this 40-message Slack thread in 3 bullets",
    prompt: "Summarize the following in 3 tight bullets, no fluff:",
    accent: "primary",
    category: "read",
  },
  {
    id: "draft",
    name: "Draft a reply",
    icon: "✍️",
    description: "Write emails, DMs, or replies in your voice — or the hydra's, if you prefer snark.",
    example: "draft a polite 'no' to this meeting invite",
    prompt: "Draft a reply to this. Keep it short and polite:",
    accent: "amber",
    category: "write",
  },
  {
    id: "explain-code",
    name: "Explain code",
    icon: "🔧",
    description: "Paste a function, stack trace, or config — get a plain-English explanation and fix.",
    example: "why does this regex throw on empty strings?",
    prompt: "Explain this code and point out any bugs:",
    accent: "primary",
    category: "code",
  },
  {
    id: "translate",
    name: "Translate",
    icon: "🌐",
    description: "40+ languages, on-device. Your text never leaves the machine for a translation API.",
    example: "translate this abstract to Japanese, academic tone",
    prompt: "Translate the following",
    accent: "amber",
    category: "translate",
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    icon: "💡",
    description: "Generate options when you're stuck. The gremlin persona is especially good at volume.",
    example: "give me 10 names for a privacy-first assistant",
    prompt: "Brainstorm options for this. Give me 10, varied:",
    accent: "hydra",
    category: "think",
  },
  {
    id: "decide",
    name: "Help me decide",
    icon: "⚖️",
    description: "Lay out the tradeoffs of a decision. The sage persona asks the clarifying question you missed.",
    example: "should I take the job offer or stay? help me weigh it",
    prompt: "Help me decide. Lay out the real tradeoffs and ask me one clarifying question:",
    accent: "hydra",
    category: "think",
  },
  {
    id: "extract",
    name: "Extract action items",
    icon: "✅",
    description: "Pull action items, owners, and deadlines out of meeting notes or a long email.",
    example: "extract action items from these meeting notes",
    prompt: "Extract action items (with owners if mentioned) from this:",
    accent: "primary",
    category: "read",
  },
  {
    id: "rewrite",
    name: "Rewrite tone",
    icon: "🎭",
    description: "Make it shorter, nicer, firmer, or more professional — without changing the meaning.",
    example: "rewrite this to be firmer but still kind",
    prompt: "Rewrite this to be firmer but still kind. Keep the meaning:",
    accent: "amber",
    category: "write",
  },
];

export const SKILL_CATEGORIES = [
  { id: "all", label: "all" },
  { id: "write", label: "write" },
  { id: "read", label: "read" },
  { id: "code", label: "code" },
  { id: "think", label: "think" },
  { id: "translate", label: "translate" },
] as const;

/**
 * Open-weight model quick-start presets — legitimate, openly-licensed models
 * the user can pull via Ollama and run locally. Each has a copy-paste install
 * command. What the user runs is their choice; these are the mainstream
 * open families.
 */
export type CloudModelPreset = {
  provider: string;
  providerName: string;
  model: string;
  label: string;
  kind: "default" | "frontier" | "fast" | "reasoning" | "open" | "local" | "custom" | "voice";
  good_for: string;
};

export const CLOUD_MODEL_PRESETS: CloudModelPreset[] = [
  { provider: "", providerName: "OpenCore Auto", model: "uncensored-auto", label: "Uncensored Auto", kind: "default", good_for: "auto-connects the fastest available uncensored/keyless route" },
  { provider: "hf-space", providerName: "HF Space / Gradio", model: "lylee122/Unsensored10|/predict", label: "Unsensored10 Space", kind: "custom", good_for: "fast default uncensored Space profile; auto-added" },
  { provider: "hf-space", providerName: "HF Space / Gradio", model: "unsensoredai/adarsha|/predict", label: "Adarsha AI Space", kind: "custom", good_for: "public uncensored Space profile; auto-added" },
  { provider: "hf-space", providerName: "HF Space / Gradio", model: "Saiyejin/Qwen-Unsensored-4B|/predict", label: "Qwen Unsensored 4B Space", kind: "custom", good_for: "uncensored HF Space profile; may cold start" },
  { provider: "ollama", providerName: "Ollama Local", model: "wizardlm-7b-uncensored", label: "WizardLM 7B Uncensored Local", kind: "local", good_for: "local self-host profile via Ollama/LM Studio" },
  { provider: "ollama", providerName: "Ollama Local", model: "wizard-vicuna-13b-uncensored", label: "Wizard Vicuna 13B Uncensored Local", kind: "local", good_for: "local model-file profile via OpenAI-compatible server" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-5.5", label: "GPT-5.5", kind: "frontier", good_for: "top coding, complex reasoning, professional work" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-5.4", label: "GPT-5.4", kind: "frontier", good_for: "strong general-purpose ChatGPT/API model" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-5.4-mini", label: "GPT-5.4 mini", kind: "fast", good_for: "fast, low-cost everyday chat" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-5.4-nano", label: "GPT-5.4 nano", kind: "fast", good_for: "very fast lightweight routing" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-4.1", label: "GPT-4.1", kind: "frontier", good_for: "instruction following, coding, long context" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-4.1-mini", label: "GPT-4.1 mini", kind: "fast", good_for: "balanced cost and quality" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-4o", label: "GPT-4o", kind: "frontier", good_for: "multimodal text/image workflows" },
  { provider: "openai", providerName: "OpenAI / ChatGPT", model: "gpt-4o-mini", label: "GPT-4o mini", kind: "fast", good_for: "fast utility chat" },
  { provider: "google", providerName: "Google Gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash", kind: "fast", good_for: "quick multimodal/general chat" },
  { provider: "groq", providerName: "Groq", model: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", kind: "open", good_for: "very fast open-weight chat" },
  { provider: "mistral", providerName: "Mistral AI", model: "mistral-small-latest", label: "Mistral Small Latest", kind: "fast", good_for: "efficient everyday assistant" },
  { provider: "cohere", providerName: "Cohere", model: "command-a-03-2025", label: "Command A", kind: "frontier", good_for: "agentic and enterprise style tasks" },
  { provider: "huggingface", providerName: "Hugging Face", model: "meta-llama/Llama-3.1-8B-Instruct", label: "Llama 3.1 8B Instruct", kind: "open", good_for: "HF Router default open model" },
  { provider: "huggingface", providerName: "Hugging Face", model: "your-huggingface-username/your-model-id", label: "Your Hugging Face model", kind: "custom", good_for: "paste your own HF model repo ID, including private/custom models" },
  { provider: "ollama", providerName: "Ollama Local", model: "llama3.2", label: "Llama 3.2 Local", kind: "local", good_for: "local private chat via Ollama" },
  { provider: "pollinations", providerName: "Pollinations", model: "openai", label: "Pollinations OpenAI", kind: "fast", good_for: "keyless fallback testing" },
];

export type ModelPreset = {
  name: string;
  ollamaId: string;
  size: string;
  family: string;
  license: string;
  command: string;
  good_for: string;
};

export const MODEL_PRESETS: ModelPreset[] = [
  {
    name: "Llama 3.1 (8B)",
    ollamaId: "llama3.1",
    size: "~4.7 GB",
    family: "Llama",
    license: "Llama 3.1 Community",
    command: "ollama pull llama3.1",
    good_for: "general chat, reasoning, code",
  },
  {
    name: "Llama 3.1 (70B)",
    ollamaId: "llama3.1:70b",
    size: "~40 GB",
    family: "Llama",
    license: "Llama 3.1 Community",
    command: "ollama pull llama3.1:70b",
    good_for: "frontier-grade reasoning (needs 48GB+ RAM)",
  },
  {
    name: "Qwen 2.5 (7B)",
    ollamaId: "qwen2.5",
    size: "~4.7 GB",
    family: "Qwen",
    license: "Apache 2.0",
    command: "ollama pull qwen2.5",
    good_for: "multilingual, math, code",
  },
  {
    name: "Qwen 2.5 (32B)",
    ollamaId: "qwen2.5:32b",
    size: "~19 GB",
    family: "Qwen",
    license: "Apache 2.0",
    command: "ollama pull qwen2.5:32b",
    good_for: "strong reasoning, needs 24GB+ RAM",
  },
  {
    name: "Phi-3.5 Mini",
    ollamaId: "phi3.5",
    size: "~2.2 GB",
    family: "Phi",
    license: "MIT",
    command: "ollama pull phi3.5",
    good_for: "small/fast, runs on 8GB RAM",
  },
  {
    name: "Mistral (7B)",
    ollamaId: "mistral",
    size: "~4.1 GB",
    family: "Mistral",
    license: "Apache 2.0",
    command: "ollama pull mistral",
    good_for: "general chat, efficient",
  },
  {
    name: "Mixtral 8x7B",
    ollamaId: "mixtral",
    size: "~26 GB",
    family: "Mistral",
    license: "Apache 2.0",
    command: "ollama pull mixtral",
    good_for: "mixture-of-experts, needs 32GB+ RAM",
  },
  {
    name: "Gemma 2 (9B)",
    ollamaId: "gemma2",
    size: "~5.4 GB",
    family: "Gemma",
    license: "Gemma Terms of Use",
    command: "ollama pull gemma2",
    good_for: "Google's open model, balanced",
  },
  {
    name: "DeepSeek R1 (7B)",
    ollamaId: "deepseek-r1",
    size: "~4.7 GB",
    family: "DeepSeek",
    license: "MIT",
    command: "ollama pull deepseek-r1",
    good_for: "reasoning, chain-of-thought",
  },
  {
    name: "DeepSeek R1 (32B)",
    ollamaId: "deepseek-r1:32b",
    size: "~19 GB",
    family: "DeepSeek",
    license: "MIT",
    command: "ollama pull deepseek-r1:32b",
    good_for: "strong reasoning, needs 24GB+ RAM",
  },
  {
    name: "CodeQwen (7B)",
    ollamaId: "codeqwen",
    size: "~4.7 GB",
    family: "Qwen",
    license: "Apache 2.0",
    command: "ollama pull codeqwen",
    good_for: "code generation, completion",
  },
  {
    name: "Llama 3.2 (3B)",
    ollamaId: "llama3.2",
    size: "~2.0 GB",
    family: "Llama",
    license: "Llama 3.2 Community",
    command: "ollama pull llama3.2",
    good_for: "small/fast, edge devices",
  },
  {
    name: "Llama 3.2 Vision (11B)",
    ollamaId: "llama3.2-vision",
    size: "~7.0 GB",
    family: "Llama",
    license: "Llama 3.2 Community",
    command: "ollama pull llama3.2-vision",
    good_for: "multimodal — images + text",
  },
  {
    name: "Starcoder2 (3B)",
    ollamaId: "starcoder2",
    size: "~1.7 GB",
    family: "StarCoder",
    license: "BigCode OpenRAIL-M",
    command: "ollama pull starcoder2",
    good_for: "code completion, 80+ languages",
  },
  {
    name: "Mathstral (7B)",
    ollamaId: "mathstral",
    size: "~4.7 GB",
    family: "Mistral",
    license: "Apache 2.0",
    command: "ollama pull mathstral",
    good_for: "mathematics, step-by-step",
  },
  {
    name: "Aya 23 (8B)",
    ollamaId: "aya",
    size: "~4.7 GB",
    family: "Aya",
    license: "Apache 2.0",
    command: "ollama pull aya",
    good_for: "23 languages, multilingual chat",
  },
  {
    name: "WizardLM 7B Uncensored (local)",
    ollamaId: "wizardlm-7b-uncensored",
    size: "~4–8 GB depending on quant/checkpoint",
    family: "WizardLM",
    license: "check the dataset/model card before redistribution",
    command: "# Kaggle datasets are model files, not hosted chat APIs. Download the model, then create an Ollama model:\n# FROM ./wizardlm-7b-uncensored.Q4_K_M.gguf\nollama create wizardlm-7b-uncensored -f Modelfile",
    good_for: "local raw/open-weight chat through Ollama, LM Studio, llama.cpp, or vLLM",
  },
  {
    name: "Wizard Vicuna 13B Uncensored (local)",
    ollamaId: "wizard-vicuna-13b-uncensored",
    size: "~8–16 GB depending on quant/checkpoint",
    family: "Wizard/Vicuna",
    license: "check the dataset/model card before redistribution",
    command: "# Kaggle datasets are model files, not hosted chat APIs. Download the parts/model, then expose it via an OpenAI-compatible server:\n# llama.cpp: ./llama-server -m ./wizard-vicuna-13b.gguf --port 8080\n# use endpoint http://localhost:8080/v1 and model wizard-vicuna-13b-uncensored",
    good_for: "local 13B raw/open-weight chat when you have enough RAM/VRAM",
  },
];
