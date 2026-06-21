import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/models", label: "Models" },
  { href: "/voice", label: "Voice" },
  { href: "/privacy", label: "Privacy" },
  { href: "/setup", label: "Setup" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 font-mono-display text-sm font-black text-primary shadow-lg shadow-primary/10">
            OC
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-mono-display text-sm font-black tracking-tight text-primary sm:text-base">
              OpenCore
            </span>
            <span className="hidden font-mono-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
              local-first AI workspace
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/55 p-1 font-mono-display text-xs text-muted-foreground lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-secondary hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/root60/RedHydraOpenCore"
            target="_blank"
            rel="noreferrer"
            className="hidden h-10 w-10 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:grid"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" />
          </a>
          <Link
            href="/chat"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono-display text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
          >
            enter chat <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/75 px-4 py-2 lg:hidden">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto font-mono-display text-xs text-muted-foreground [scrollbar-width:none]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-border/70 bg-card/55 px-3 py-1.5 hover:border-primary/40 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/35">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© 2026 OpenCore. Built for local-first AI experiments.</p>
        <div className="flex flex-wrap gap-3 font-mono-display text-xs">
          <Link href="/privacy" className="hover:text-primary">privacy</Link>
          <Link href="/models" className="hover:text-primary">models</Link>
          <Link href="/setup" className="hover:text-primary">setup</Link>
          <Link href="/chat" className="hover:text-primary">chat</Link>
        </div>
      </div>
    </footer>
  );
}

export function SitePage({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96" />
      <SiteHeader />
      <section className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", compact ? "py-10" : "py-14 sm:py-20")}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono-display text-[11px] uppercase tracking-[0.3em] text-primary">// {eyebrow}</p>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 text-pretty text-base leading-8 text-muted-foreground sm:text-lg">{description}</p>
        </div>
        <div className="mt-10">{children}</div>
      </section>
      <SiteFooter />
    </main>
  );
}

export function InfoCard({
  title,
  body,
  icon,
  className,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-3xl border border-border/70 bg-card/65 p-6 shadow-lg shadow-primary/5 backdrop-blur", className)}>
      {icon ? <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">{icon}</div> : null}
      <h2 className="font-mono-display text-lg font-black text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
    </article>
  );
}
