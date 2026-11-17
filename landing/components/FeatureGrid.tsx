import type { FeatureCard } from "../lib/content";

export function FeatureGrid({ features }: { features: FeatureCard[] }) {
  const renderFeature = (feature: FeatureCard, index: number) => (
    <article key={feature.title} className={`feature-card feature-card-${index + 1} overflow-hidden rounded-2xl border border-line bg-panel`}>
      <div className="px-5 pt-1 sm:px-6 sm:pt-2">
      </div>
      <div className="feature-content px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <div className="feature-copy">
          <h3 className="max-w-[24ch] text-balance text-xl font-medium tracking-tight">{feature.title}</h3>
          <p className="mt-3 max-w-[47ch] text-pretty text-base leading-7 text-muted">{feature.copy}</p>
        </div>
        {feature.preview}
      </div>
    </article>
  );

  return (
    <div className="feature-grid">
      <div className="feature-row feature-row-lead">{features.slice(0, 2).map(renderFeature)}</div>
      <div className="feature-row feature-row-middle">{features.slice(2, 5).map((feature, index) => renderFeature(feature, index + 2))}</div>
      <div className="feature-row feature-row-closing">{features.slice(5).map((feature, index) => renderFeature(feature, index + 5))}</div>
    </div>
  );
}
