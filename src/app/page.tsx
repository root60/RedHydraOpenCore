import Link from "next/link";
import { ArrowRight, Bot, BrainCircuit, Cpu, MessageSquare, Mic, ShieldCheck } from "lucide-react";
import { InfoCard, SiteFooter, SiteHeader } from "@/components/site/site-shell";
import { homeCards } from "@/lib/site-content";

const stats = [
  { label: "chat route", value: "/chat" },
  { label: "api route", value: "/v1" },
  { label: "personas", value: "3" },
  { label: "layout", value: "responsive" },
];

const icons = [Bot, MessageSquare, BrainCircuit, Mic, ShieldCheck, Cpu];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 grid-bg opacity-45" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96" />
      <SiteHeader />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="space-y-7 text-center lg:text-left">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono-display text-[10px] uppercase tracking-[0.24em] text-primary lg:mx-0">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-primary" /> clean multi-page build
          </div>
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:mx-0 lg:text-7xl">
              OpenCore, split into a cleaner <span className="text-glow-hydra text-hydra">AI tool hub</span>.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0">
              The homepage now acts as a simple profile and navigation hub. Features, models, voice, privacy, setup, and the chatbot each have their own page so users are not forced through one long landing page.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-mono-display text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              Enter main chatbot <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 px-6 py-3 font-mono-display text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Explore pages
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="font-mono-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-mono-display text-lg font-black text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-card/75 p-4 shadow-2xl shadow-primary/10 backdrop-blur sm:p-6">
          <div className="rounded-3xl border border-primary/20 bg-background/60 p-5">
            <p className="font-mono-display text-xs uppercase tracking-[0.26em] text-primary">// main chatbot preview</p>
            <div className="mt-5 space-y-4">
              <div className="max-w-[86%] rounded-2xl rounded-bl-sm border border-hydra/30 bg-hydra/10 px-4 py-3 text-sm">
                <p className="mb-1 font-mono-display text-[10px] text-primary">OC opencore</p>
                <p className="leading-relaxed text-foreground/90">Pick a model, choose a persona, talk by voice, then route through /v1 if needed.</p>
              </div>
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-sm bg-secondary px-4 py-3 text-sm">
                <p className="leading-relaxed">Show me the clean setup and take me to chat.</p>
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                <p className="mb-1 font-mono-display text-[10px] text-primary">⚡ assistant</p>
                <p className="leading-relaxed text-foreground/90">Done. Homepage stays short; details live on separate pages; chat stays one click away.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homeCards.map((card, index) => {
            const Icon = icons[index] || Bot;
            return (
              <Link key={card.href} href={card.href} className="group block">
                <InfoCard
                  title={card.title}
                  body={card.body}
                  icon={<Icon className="h-5 w-5" />}
                  className="h-full transition-transform group-hover:-translate-y-1 group-hover:border-primary/45"
                />
                <span className="sr-only">{card.cta}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
