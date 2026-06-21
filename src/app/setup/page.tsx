import { Terminal } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";
import { setupCommands } from "@/lib/site-content";

export default function SetupPage() {
  return (
    <SitePage
      eyebrow="setup"
      title="Install, test, and push from PowerShell."
      description="The setup instructions are now on their own page instead of being buried inside a long homepage."
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <InfoCard
          title="Local test"
          body="Run npm install once, start the dev server with npm run dev, then open http://localhost:3000 and http://localhost:3000/chat."
          icon={<Terminal className="h-5 w-5" />}
        />
        <div className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-lg shadow-primary/5 backdrop-blur">
          <h2 className="font-mono-display text-lg font-black">PowerShell commands</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background/80 p-4 text-xs text-muted-foreground"><code>{setupCommands.join("\n")}</code></pre>
        </div>
      </div>
    </SitePage>
  );
}
