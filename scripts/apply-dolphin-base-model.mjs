#!/usr/bin/env node
/**
 * Set Dolphin EXL2 as RedHydra OpenCore default model in App.tsx.
 *
 * Run:
 * node scripts/apply-dolphin-base-model.mjs
 */

import fs from "node:fs";
import path from "node:path";

const appPath = path.join(process.cwd(), "src", "App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx not found. Run this from the repo root.");
  process.exit(1);
}

let source = fs.readFileSync(appPath, "utf8");
const before = source;

source = source.replace(
  /const\s+\[isAgentMode,\s*setIsAgentMode\]\s*=\s*useState\(true\)/g,
  "const [isAgentMode, setIsAgentMode] = useState(false)"
);

source = source.replace(
  /provider:\s*'built-in-opencore'/g,
  "provider: 'cloud-proxy'"
);

source = source.replace(
  /modelName:\s*'[^']*'/g,
  "modelName: 'dphn/Dolphin-Llama3-8B-Instruct-exl2-6bpw'"
);

source = source.replace(
  /responseStyle:\s*'structured'/g,
  "responseStyle: 'concise'"
);

source = source.replace(
  /PROXIED:\/\/\{settings\.provider\.toUpperCase\(\)\}\s*•\s*\{settings\.modelName\}/g,
  ""
);

source = source.split("DECENTRALIZED INTELLIGENCE // COGNITIVE FREEDOM").join("");
source = source.split("Assistant Node").join("RedHydra OpenCore");
source = source.split("Client Terminal").join("You");

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
  console.log("No changes made. App.tsx may already be patched.");
} else {
  fs.writeFileSync(appPath, source, "utf8");
  console.log("Updated App.tsx with Dolphin EXL2 base model and clean UI defaults.");
}
