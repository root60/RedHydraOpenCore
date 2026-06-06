#!/usr/bin/env node
/**
 * RedHydra OpenCore final UI cleanup.
 *
 * Run once from repo root:
 * node scripts/apply-final-chat-ui-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";

const appPath = path.join(process.cwd(), "src", "App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx not found. Run this from the repository root.");
  process.exit(1);
}

let source = fs.readFileSync(appPath, "utf8");
const before = source;

function replace(pattern, value) {
  source = source.replace(pattern, value);
}

function replaceAllLiteral(from, to) {
  source = source.split(from).join(to);
}

// Agent mode must not be default.
replace(/const\s+\[isAgentMode,\s*setIsAgentMode\]\s*=\s*useState\(true\)/g, "const [isAgentMode, setIsAgentMode] = useState(false)");

// Clean defaults.
replace(/modelName:\s*'hydra-opencore-v3'/g, "modelName: 'RedHydra OpenCore'");
replace(/responseStyle:\s*'structured'/g, "responseStyle: 'concise'");

// Clean initial chat.
replace(/title:\s*"Initial Hydra Intelligence Module"/g, 'title: "New Chat"');
replace(/messages:\s*\[\s*\{\s*id:\s*"m-welcome",\s*role:\s*'assistant',\s*content:\s*`### Welcome to \*\*RedHydra OpenCore\*\*[\s\S]*?side-by-side with your agent\.`\s*,\s*timestamp:\s*new Date\(\)\.toLocaleTimeString\(\)\s*\}\s*\]/g, "messages: []");

// Clean new chat system message.
replace(/messages:\s*\[\s*\{\s*id:\s*`m-init-\$\{Date\.now\(\)\}`,\s*role:\s*'system',\s*content:\s*`System profile synchronized:[\s\S]*?settings\.`,\s*timestamp:\s*new Date\(\)\.toLocaleTimeString\(\)\s*\}\s*\]/g, "messages: []");

// Header cleanup.
replace(/navView === 'chat' && `RedHydra OpenCore \/\/ \$\{\(activeChat\?\.assistantMode \|\| 'general'\)\.replace\('_', ' '\)\}`/g, "navView === 'chat' && 'RedHydra OpenCore'");
replaceAllLiteral("DECENTRALIZED INTELLIGENCE // COGNITIVE FREEDOM", "");
replace(/PROXIED:\/\/\{settings\.provider\.toUpperCase\(\)\}\s*•\s*\{settings\.modelName\}/g, "");

// Message labels.
replaceAllLiteral("Client Terminal", "You");
replaceAllLiteral("Assistant Node", "RedHydra OpenCore");
replaceAllLiteral("STREAM FEEDING...", "typing...");
replaceAllLiteral("Synchronizing pipeline logs...", "Thinking...");
replaceAllLiteral("GENERAL CONSOLE", "General");
replaceAllLiteral("DEVELOPMENT CO-PILOT", "Developer");
replaceAllLiteral("CYBER LAB", "Security");
replaceAllLiteral("ANALYTICAL RESEARCH", "Research");
replaceAllLiteral("SCRIBE COMPOSER", "Writer");
replaceAllLiteral("CODE REVIEW AUDITOR", "Code Review");

// Empty state cleanup.
replaceAllLiteral("REDHYDRA // OPENCORE ACTIVE  PROXIED", "RedHydra OpenCore");
replaceAllLiteral("Hydra Cybernetic Emulator Core", "How can I help?");
replace(/SYSTEM STATUS: ONLINE\s*\/\/\s*OPERATOR PARAMS:[\s\S]*?structural simulations\./g, "Ask a question, paste code, or send an error log.");
replaceAllLiteral("⚡ QUICK LAUNCH CYBER BLUEPRINTS (INTERACTIVE)", "Quick actions");
replaceAllLiteral("ENCRYPTED NODE: TLS_v1.3_GCM_SHA384 STREAK INDETERMINATE", "");

// Remove footer/internal info.
replace(/<span className="text-\[10px\][^"]*">\s*RedHydra Conformance API Logs\.\s*Client API caches reside safely in Sandboxed IndexedDB storage\.\s*<\/span>/g, "");
replaceAllLiteral("RedHydra Conformance API Logs. Client API caches reside safely in Sandboxed IndexedDB storage.", "");

// Toast/log text cleanup.
replaceAllLiteral("Agent Integration Activated", "Agent Mode On");
replaceAllLiteral("Agent Integration Suspended", "Agent Mode Off");
replace(/addToast\(`Agent Integration \$\{!isAgentMode \? 'Activated' : 'Suspended'\}`, "success"\);/g, "addToast(!isAgentMode ? 'Agent Mode On' : 'Agent Mode Off', 'success');");
replaceAllLiteral("Prune Chat", "Clear Chat");
replaceAllLiteral("Export Logs", "Export");
replaceAllLiteral("STOP PIPELINE", "STOP");

// Export cleanup.
replace(/# RedHydra AI Conversational Log:/g, "# RedHydra OpenCore Chat:");
replace(/Timestamp:\s*\$\{activeChat\.createdAt\}\\nProvider Profile:\s*\$\{settings\.provider\.toUpperCase\(\)\}\s*\(\$\{settings\.modelName\}\)\\n\\n---\\n\\n/g, "Timestamp: ${activeChat.createdAt}\\n\\n---\\n\\n");

// Compilation/log panel cleanup.
replace(/const\s+\[compilationLogs,\s*setCompilationLogs\]\s*=\s*useState\(\[[\s\S]*?"Monitoring operator terminal sessions\."\s*\]\)/g, "const [compilationLogs, setCompilationLogs] = useState<string[]>([])");

// Disable fake forbidden admin logs.
replace(/const handleUserAdminTrigger = \(\) => \{[\s\S]*?\};\s*const handleSelfUpgradeTrigger/g, "const handleUserAdminTrigger = () => { addToast('Action unavailable in browser build.', 'info'); }; const handleSelfUpgradeTrigger");
replace(/const handleSelfUpgradeTrigger = \(\) => \{[\s\S]*?\};\s*const triggerAISelfUpgradeCompilation/g, "const handleSelfUpgradeTrigger = () => { addToast('Action unavailable in browser build.', 'info'); }; const triggerAISelfUpgradeCompilation");
replace(/const triggerAISelfUpgradeCompilation = \(\) => \{[\s\S]*?\};\s*\/\/ CORE CHAT SENDING ENGINE/g, "const triggerAISelfUpgradeCompilation = () => {}; // CORE CHAT SENDING ENGINE");

// Clean clear-chat message.
replace(/content:\s*"Current conversation pruned\.\s*Enter a new query to start dynamic processing\."/g, 'content: "Chat cleared."');

// Clean error display.
replace(/content:\s*`### ⚠️ Connection pipeline disruption\\n\*\*Details:\*\* \$\{err\.message \|\| 'The request was terminated by client'\}\\n\\nPlease check server setups or toggle API configuration\.`/g, "content: `Something went wrong. Please try again.`");

// Make topbar and chat scroll easier to target by CSS.
if (!source.includes("data-redhydra-topbar")) {
  source = source.replace(
    /(\{\/\* TOP STATUS BAR BAR \*\/\}\s*)<div([^>]*?)className="([^"]*)"/,
    '$1<div data-redhydra-topbar="true"$2className="$3 redhydra-topbar"'
  );
}

if (!source.includes("data-redhydra-chat-scroll")) {
  source = source.replace(
    /(\{\/\* Chat items scrolling list \*\/\}\s*)<div([^>]*?)className="([^"]*)"/,
    '$1<div data-redhydra-chat-scroll="true"$2className="$3 redhydra-chat-scroll"'
  );
}

if (source === before) {
  console.log("No changes made. The file may already be patched or has changed structure.");
} else {
  fs.writeFileSync(appPath, source, "utf8");
  console.log("Updated src/App.tsx: clean responses, Agent Mode off by default, header/footer/internal labels cleaned.");
}
