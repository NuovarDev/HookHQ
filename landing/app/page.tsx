import { FeatureGrid } from "../components/FeatureGrid";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { SectionTitle } from "../components/SectionTitle";
import { features } from "../lib/content";

const deployUrl =
  process.env.NEXT_PUBLIC_DEPLOY_URL ??
  "https://deploy.workers.cloudflare.com/?url=https://github.com/NuovarDev/HookHQ";
const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.hookhq.dev";
const repoUrl = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/NuovarDev/HookHQ";

export default function HomePage() {
  return (
    <div className="relative z-[1] min-h-screen">
      <Header deployUrl={deployUrl} docsUrl={docsUrl} repoUrl={repoUrl} />
      <main className="mx-auto w-[min(1280px,calc(100vw-2rem))] pb-16 pt-9 max-[760px]:w-[min(100vw-1rem,100%)] max-[760px]:pt-4">
        <Hero deployUrl={deployUrl} docsUrl={docsUrl} repoUrl={repoUrl} />

        <section
          id="features"
          className="mt-4 grid items-start gap-4 max-[1080px]:grid-cols-1"
        >
          <FeatureGrid features={features} />
        </section>

        <Footer deployUrl={deployUrl} docsUrl={docsUrl} repoUrl={repoUrl} />
      </main>
    </div>
  );
}
