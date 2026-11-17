import { FeatureGrid } from "../components/FeatureGrid";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { features } from "../lib/content";

const deployUrl =
  process.env.NEXT_PUBLIC_DEPLOY_URL ??
  "https://deploy.workers.cloudflare.com/?url=https://github.com/NuovarDev/HookHQ";
const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.hookhq.dev";
const repoUrl = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/NuovarDev/HookHQ";

export default function HomePage() {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <Header deployUrl={deployUrl} docsUrl={docsUrl} repoUrl={repoUrl} />
      <main className="landing-shell mx-auto w-full max-w-[1360px] px-5 pb-12 pt-7 sm:px-8 sm:pb-16 lg:px-10 lg:pt-10">
        <Hero deployUrl={deployUrl} repoUrl={repoUrl} />

        <section id="features" className="mt-24 sm:mt-32">
          <div className="feature-intro mb-9 grid gap-5 sm:mb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:items-end">
            <div>
              <h2 className="mt-4 max-w-[17ch] text-balance text-4xl font-medium tracking-tight sm:text-5xl">
                Every event has a clear path forward.
              </h2>
            </div>
            <p className="max-w-[48ch] text-pretty text-base leading-7 text-muted sm:justify-self-end sm:text-lg sm:leading-8">
              A durable, self-hosted foundation for routing, observability, recovery, and a polished customer-facing
              experience.
            </p>
          </div>
          <FeatureGrid features={features} />
        </section>

        <Footer deployUrl={deployUrl} docsUrl={docsUrl} repoUrl={repoUrl} />
      </main>
    </div>
  );
}
