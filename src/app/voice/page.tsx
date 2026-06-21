import Link from "next/link";
import { ArrowRight, Mic, Volume2 } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";
import { voiceSteps } from "@/lib/site-content";

export default function VoicePage() {
  return (
    <SitePage
      eyebrow="voice and audio"
      title="Live voice belongs in the chat, explained here."
      description="This page explains how the interactive browser voice flow works without overloading the homepage."
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <InfoCard
          title="Voice input"
          body="The microphone button uses browser speech recognition when available. It writes live transcript text into the chat input so the user can edit before sending."
          icon={<Mic className="h-5 w-5" />}
        />
        <InfoCard
          title="Voice output"
          body="Auto-speak can read assistant replies aloud. With OPENAI_API_KEY configured, the /api/voice route can use OpenAI TTS voices; otherwise the browser fallback remains available."
          icon={<Volume2 className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 rounded-3xl border border-border/70 bg-card/65 p-6">
        <h2 className="font-mono-display text-lg font-black">Voice flow</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {voiceSteps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-border/70 bg-background/55 p-4 text-sm leading-7 text-muted-foreground">
              <span className="mr-2 font-mono-display text-primary">{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 text-center">
        <Link href="/chat" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-mono-display text-sm font-black text-primary-foreground">
          Try voice in chat <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </SitePage>
  );
}
