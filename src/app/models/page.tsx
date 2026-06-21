import Link from "next/link";
import { ArrowRight, Cpu, KeyRound, Network, Server } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";
import { providerGroups } from "@/lib/site-content";

export default function ModelsPage() {
  return (
    <SitePage
      eyebrow="models and router"
      title="Real model names, custom endpoints, and gateway routing."
      description="The model list is separated from the landing page so users can understand which options are direct APIs, which are Hugging Face Space profiles, and which require local hosting."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {providerGroups.map((group) => (
          <article key={group.title} className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-lg shadow-primary/5 backdrop-blur">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              {group.title.includes("OpenAI") ? <KeyRound className="h-5 w-5" /> : group.title.includes("Local") ? <Server className="h-5 w-5" /> : group.title.includes("Gateway") ? <Network className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
            </div>
            <h2 className="font-mono-display text-lg font-black text-foreground">{group.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.models.map((model) => (
                <code key={model} className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                  {model}
                </code>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <InfoCard
          title="Hugging Face Spaces are not always normal chat APIs"
          body="The app treats HF Spaces as Gradio/Space profiles. If a Space exposes a usable API, the adapter can call it. If it has no app file or is sleeping, it must be fixed or restarted on Hugging Face first."
        />
        <InfoCard
          title="Kaggle model datasets need local hosting"
          body="Kaggle model-file datasets are added as local/self-host profiles. Download and serve them through Ollama, LM Studio, llama.cpp, or vLLM, then point the custom endpoint at your local server."
        />
      </div>

      <div className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-6 text-center">
        <p className="font-mono-display text-xs uppercase tracking-[0.26em] text-primary">configure inside chat</p>
        <h2 className="mt-3 text-2xl font-black">Use Model Settings to add keys and select providers.</h2>
        <Link href="/chat" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-mono-display text-sm font-black text-primary-foreground">
          Open model settings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </SitePage>
  );
}
