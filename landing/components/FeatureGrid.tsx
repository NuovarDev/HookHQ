import type { FeatureCard } from "../lib/content";

export function FeatureGrid({ features }: { features: FeatureCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {features.map(feature => (
        <article key={feature.title} className="border border-line bg-panel p-5 shadow-panel">
          <div className="mb-4 inline-flex border border-line bg-panelSoft px-2 py-1 text-[0.72rem] uppercase tracking-[0.12em] text-muted">
            {feature.kicker}
          </div>
          <h3 className="mb-3 text-base uppercase tracking-[0.08em]">{feature.title}</h3>
          <p className="leading-[1.65] text-muted">{feature.copy}</p>
          {feature.preview}
        </article>
      ))}
    </div>
  );
}
