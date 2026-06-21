import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SCRIPT = `#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# OpenCore — bootstrap script (stub / demo)
# v0.7.4-opencore · codename "OpenCore"
#
# In a real release this script would:
#   1. Detect your OS + arch
#   2. Verify the GPG signature of the binary
#   3. Download the signed binary to ~/.opencore/bin/
#   4. Initialise the encrypted vault
#   5. Print next-steps (opencore bridge add, opencore voice enable)
#
# This is a showcase stub. Run it to see the guided prompts.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

BOLD='\\033[1m'
GREEN='\\033[32m'
AMBER='\\033[33m'
RED='\\033[31m'
RESET='\\033[0m'

echo ""
echo "\${BOLD}\${GREEN}OC  OpenCore — bootstrap\${RESET}"
echo "\${GREEN}   v0.7.4-opencore\${RESET}"
echo ""

# Step 1 — check deps
echo "\${AMBER}[1/5]\${RESET} checking dependencies…"
for cmd in curl sha256sum; do
  if ! command -v \$cmd &>/dev/null; then
    echo "\${RED}✗  \$cmd not found. please install it first.\${RESET}"
    exit 1
  fi
done
echo "\${GREEN}✓  dependencies ok\${RESET}"

# Step 2 — create dirs
echo "\${AMBER}[2/5]\${RESET} creating ~/.opencore/…"
mkdir -p ~/.opencore/bin ~/.opencore/vault
echo "\${GREEN}✓  directories ready\${RESET}"

# Step 3 — init vault
echo "\${AMBER}[3/5]\${RESET} initialising encrypted vault…"
echo "\${BOLD}  set vault passphrase:\${RESET} "
read -rs VAULT_PASS
echo ""
echo "\${GREEN}✓  vault sealed at ~/.opencore/vault/vault.enc\${RESET}"

# Step 4 — bridge
echo "\${AMBER}[4/5]\${RESET} bridge setup (run 'opencore bridge add <app>' later)"
echo "\${GREEN}✓  bridge module loaded\${RESET}"

# Step 5 — done
echo "\${AMBER}[5/5]\${RESET} finishing up…"
echo ""
echo "\${BOLD}\${GREEN}OC  OpenCore is ready.\${RESET}"
echo ""
echo "  next steps:"
echo "    opencore bridge add whatsapp   # link a chat app"
echo "    opencore voice enable          # enable voice on mobile"
echo "    opencore say \"hello opencore\"  # talk to it"
echo ""
echo "\${BOLD}  your data. your machine. your OpenCore.\${RESET}"
echo ""
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "text/x-shellscript; charset=utf-8",
      "Content-Disposition": 'attachment; filename="opencore.sh"',
      "Cache-Control": "no-cache",
    },
  });
}
