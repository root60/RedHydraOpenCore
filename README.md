# RedHydra AI Chat 🐉

An advanced, production-ready, dark-themed AI chatbot and structured task-automation agent workspace. RedHydra offers robust code generation, research summaries, localized document parsing, and defensible cybersecurity exercises supported by multiple top-tier AI API providers.

---

## 🚀 Primary Features

RedHydra is built with a sleek, high-contrast, cyberpunk-inspired visual identity. It targets developers, security researchers, and business analysts with structured data workspaces and robust model settings controls.

### 1. Advanced Chat Integration (ChatConsole)
- **ChatGPT-like Layout**: Fluid typing animation, responsive user/assistant bubbles, and system instructions.
- **Real-time SSE Streaming**: High-fidelity, character-by-character Server-Sent Events (SSE) streaming through the built-in Gemini channel.
- **Full Markdown Overrides**: Complete rendering of bullet outline hierarchies, informational blockquotes, and data structures.
- **Modular Code Blocks**: Support for syntax-styled code frames across 15+ target languages with instant copy widgets.
- **Timeline Operations**: Regenerating assistant loops, inline editing previous user prompts, clearing logs, or downloading transcripts into raw Markdown formats.

### 2. Multi-Step Agent Operations (AgentMode)
- Interactive bento-grid timeline detailing:
  - Overall system goal.
  - Active comprehension parameters.
  - Numbered itemized step tracking with dynamic status indicators (`Pending`, `Running`, `Completed`, `Failed`).
  - Validation checklists with user-editable compliance ticks.
  - Limitations and upcoming actions alerts.

### 3. Integrated Specialty Workspaces
- **Cybersecurity Audit Workspace**: Scan programs for OWASP Top 10 vulnerabilities, construct parameterized PDO statements, generate Docker secure layered configurations, or explain CVE disclosures safely.
- **Research Analytics Console**: Analyze material factuality to separate verifiable facts from subjective assumptions, generate structured briefs, and explore complex topics.
- **Multi-Source File Workbench**: Extract key outlines, draft FAQs, or perform comparative assessments between different document streams.
- **Interactive Prompt Cards**: Choose from diverse categories including Coding, Debugging, Writing, and Business Strategy to quickly build queries.

### 4. Enterprise-Grade Model Controls & Caching
- **Multi-Provider Hub**: Support for Built-in RedHydra Gemini, client-side OpenAI token keys, OpenRouter (Claude, LLaMA), and local Ollama offline APIs.
- **Parametric Tuning**: Real-time sliding temperature controls, max tokens adjustment, custom system prompt overrides, and template styles selections.
- **Private Local Memory**: Retain preferences and chats solely in local sandboxed storage. Easily export backups or wipe data with one click.

---

## 🛠️ Technology Stack
- **Library**: React 19 (TypeScript)
- **Bundler & Server**: Vite 6, Custom Express Backend, `tsx` runner
- **Styling**: Tailwind CSS v4
- **Formatting**: React Markdown, Custom CSS Utility Layers
- **Icons**: Lucide React
- **Compilers**: esbuild, ts-node

---

## 💻 Local Installation and Setup

### Prerequisites
- Node.js (v18.0 or higher)
- npm package manager

### 1. Clone & Expand
```bash
git clone <repository-url>
cd redhydra-ai-chat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Secrets
Copy the environment template and configure secrets:
```bash
cp .env.example .env
```
Inside `.env`, configure your server-side Gemini API key:
```env
GEMINI_API_KEY="YOUR_ACTUAL_SECURE_GEMINI_API_KEY"
```

### 4. Launch Local Dev Server
```bash
npm run dev
```
The server will start listening on port `3000`. Navigate to `http://localhost:3000` to start using your RedHydra AI Chat workspace!

---

## 🔒 Security, Safety, and Privacy
- **Client-Side Key Neutrality**: No secret keys are ever hardcoded. Client keys entered in settings are cached only within the sandboxed browser local storage.
- **Defensive Cyber Education ONLY**: The cybersecurity workspace strictly enforces safety policies. It is designed for defense, hardening, patching, and educational concept mapping. It will not assist in malicious scripting, exploitation, or malware compilation.
- **Code Review Mandate**: Always manually inspect and verify any generated scripts, server configs, or docker layers before deploying to live production sites.

---

## 📜 License
Licensed under the Apache-2.0 License. See the LICENSE details for terms.
