import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";
import { personaCards } from "@/lib/site-content";

export default function AboutPage() {
  return (
    <SitePage
      eyebrow="tool profile"
      title="A cleaner profile page for the OpenCore assistant."
      description="This page explains what the tool is, who the personas are, and where users should go next. The main chatbot stays separate at /chat."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {personaCards.map((persona) => (
          <article key={persona.title} className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-lg shadow-primary/5 backdrop-blur">
            <div className="text-4xl">{persona.emoji}</div>
            <h2 className="mt-5 font-mono-display text-lg font-black text-foreground">{persona.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{persona.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <InfoCard
          title="What OpenCore is"
          body="A Next.js AI workspace with a full chatbot, persona controls, model routing, custom endpoint support, Hugging Face profiles, browser voice interaction, file uploads, and agent mode. It is designed as a developer-friendly GitHub project, not a cluttered demo page."
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6">
          <p className="font-mono-display text-xs uppercase tracking-[0.26em] text-primary">next step</p>
          <h2 className="mt-3 text-2xl font-black">Ready to talk?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Open the dedicated chatbot page. It contains the real interaction UI, not the landing page.</p>
          <Link href="/chat" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-mono-display text-sm font-black text-primary-foreground">
            Enter chat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SitePage>
  );
}
