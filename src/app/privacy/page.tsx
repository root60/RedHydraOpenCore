import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";

export default function PrivacyPage() {
  return (
    <SitePage
      eyebrow="privacy"
      title="Cleaner repo, clearer key handling."
      description="This page describes the privacy expectations for the project and keeps sensitive configuration out of the GitHub repository."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <InfoCard
          title="No secrets in Git"
          body=".env files, local gateway secret files, local usage databases, build caches, logs, and node_modules are ignored and excluded from the clean ZIP."
          icon={<Lock className="h-5 w-5" />}
        />
        <InfoCard
          title="Encrypted provider keys"
          body="Gateway provider keys are stored server-side with AES-GCM encryption using OPENCORE_GATEWAY_SECRET. Use a long random value in production."
          icon={<KeyRound className="h-5 w-5" />}
        />
        <InfoCard
          title="Explicit routing"
          body="Users choose managed mode, gateway mode, or a custom endpoint. The app should never silently send prompts to providers that were not configured."
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 rounded-3xl border border-border/70 bg-card/65 p-6">
        <h2 className="font-mono-display text-lg font-black">Recommended .env.local</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background/80 p-4 text-xs text-muted-foreground"><code>{`OPENAI_API_KEY="your-openai-key"
OPENCORE_GATEWAY_SECRET="replace-with-a-long-random-secret"
OPENCORE_GATEWAY_ADMIN_KEY="replace-with-an-admin-token"
OPENCORE_TTS_MODEL="gpt-4o-mini-tts"
HF_TOKEN="your-huggingface-token"`}</code></pre>
      </div>
    </SitePage>
  );
}
