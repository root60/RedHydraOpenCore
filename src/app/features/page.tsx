import { Bot, BrainCircuit, Code2, Mic, Network, Smartphone } from "lucide-react";
import { InfoCard, SitePage } from "@/components/site/site-shell";
import { featureCards } from "@/lib/site-content";

const icons = [Bot, BrainCircuit, Network, Code2, Mic, Smartphone];

export default function FeaturesPage() {
  return (
    <SitePage
      eyebrow="features"
      title="All major features have room to breathe."
      description="Instead of placing every feature block on the homepage, this page focuses only on capability details and keeps the landing page clean."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature, index) => {
          const Icon = icons[index] || Bot;
          return <InfoCard key={feature.title} title={feature.title} body={feature.body} icon={<Icon className="h-5 w-5" />} />;
        })}
      </div>
    </SitePage>
  );
}
