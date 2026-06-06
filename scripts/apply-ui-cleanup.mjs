#!/usr/bin/env node
/**
 * One-time UI cleanup for RedHydra OpenCore.
 *
 * Run from repo root:
 * node scripts/apply-ui-cleanup.mjs
 */

import fs from "node:fs";
import path from "node:path";

const appPath = path.join(process.cwd(), "src", "App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx not found. Run this script from the repository root.");
  process.exit(1);
}

let source = fs.readFileSync(appPath, "utf8");
const before = source;

const replaceAll = (from, to) => {
  source = source.replace(from, to);
};

// Clean user-facing names and remove internal labels.
replaceAll(/PROXIED:\/\/\{settings\.provider\.toUpperCase\(\)\}\s*•\s*\{settings\.modelName\}/g, "");
replaceAll(/DECENTRALIZED INTELLIGENCE\s*\/\/\s*COGNITIVE FREEDOM/g, "RedHydra OpenCore");
replaceAll(/Assistant Node/g, "RedHydra OpenCore");
replaceAll(/Client Terminal/g, "You");
replaceAll(/STREAM FEEDING\.\.\./g, "typing...");
replaceAll(/Synchronizing pipeline logs\.\.\./g, "Thinking...");
replaceAll(/REDHYDRA\s*\/\/\s*OPENCORE ACTIVE\s*PROXIED/g, "RedHydra OpenCore");
replaceAll(/Hydra Cybernetic Emulator Core/g, "How can I help?");
replaceAll(
  /SYSTEM STATUS: ONLINE\s*\/\/\s*OPERATOR PARAMS:[\s\S]*?structural simulations\./g,
  "Ask RedHydra OpenCore anything. Send a question, code, or error log."
);
replaceAll(/⚡ QUICK LAUNCH CYBER BLUEPRINTS \(INTERACTIVE\)/g, "Quick actions");
replaceAll(/ENCRYPTED NODE: TLS_v1\.3_GCM_SHA384 STREAK INDETERMINATE/g, "");

// Simplify title and first chat content.
replaceAll(/title:\s*"Initial Hydra Intelligence Module"/g, 'title: "New Chat"');

replaceAll(
  /content:\s*`### Welcome to \*\*RedHydra OpenCore\*\*[\s\S]*?side-by-side with your agent\.`/g,
  "content: `Hi, I’m RedHydra OpenCore. How can I help?`"
);

replaceAll(
  /content:\s*`System profile synchronized:[\s\S]*?Use local guidelines or configure keys in settings\.`/g,
  "content: `New chat started.`"
);

replaceAll(
  /Current conversation pruned\.\nEnter a new query to start dynamic processing\./g,
  "Chat cleared."
);

replaceAll(/Pipeline request transmitted to RedHydra OpenCore sandbox\./g, "Message sent.");
replaceAll(/Connection pipeline disruption/g, "Connection error");
replaceAll(/Please check server setups or toggle API configuration\./g, "Please try again.");

// Remove provider/model info from exported chat files.
replaceAll(
  /Provider Profile:\s*\$\{settings\.provider\.toUpperCase\(\)\}\s*\(\$\{settings\.modelName\}\)\\n\\n---\\n\\n/g,
  ""
);
replaceAll(/RedHydra AI Conversational Log/g, "RedHydra OpenCore Chat");

// Make chat title plain in the topbar.
replaceAll(
  /navView === 'chat' && `RedHydra OpenCore \/\/ \$\{\(activeChat\?\.assistantMode \|\| 'general'\)\.replace\('_', ' '\)\}`/g,
  "navView === 'chat' && 'RedHydra OpenCore'"
);

// Add stable class/attribute to topbar.
if (!source.includes("data-redhydra-topbar")) {
  source = source.replace(
    /(\{\/\* TOP STATUS BAR BAR \*\/\}\s*)<div([^>]*?)className="([^"]*)"/,
    '$1<div data-redhydra-topbar="true"$2className="$3 redhydra-topbar"'
  );
}

// Add stable class/attribute to chat scroll area.
if (!source.includes("data-redhydra-chat-scroll")) {
  source = source.replace(
    /(\{\/\* Chat items scrolling list \*\/\}\s*)<div([^>]*?)className="([^"]*)"/,
    '$1<div data-redhydra-chat-scroll="true"$2className="$3 redhydra-chat-scroll"'
  );
}

if (source === before) {
  console.log("No changes made. App.tsx may already be cleaned, or its structure changed.");
} else {
  fs.writeFileSync(appPath, source, "utf8");
  console.log("Updated src/App.tsx with clean labels and stable header markers.");
}
