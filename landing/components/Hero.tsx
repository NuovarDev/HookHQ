import Image from "next/image";

const points = [
  ["Event Destinations", "Automatically route and fan out events to Webhooks, SQS, and Pub/Sub"],
  ["Free and Open-Source", "HookHQ is MIT licensed, fully open-source, and can run entirely on the Cloudflare Workers free plan."],
  ["Embedded user portal", "Give users control of their destinations and integrate with your app in seconds by embedding the portal iframe."],
  ["Multi-tenant", "Separate your environments, applications, and customers within one deployment."],
] as const;

export function Hero({ deployUrl, docsUrl, repoUrl }: { deployUrl: string; docsUrl: string; repoUrl: string }) {
  return (
    <section className="grid items-stretch gap-6 min-[1081px]:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <article className="flex min-h-[36rem] flex-col justify-between border border-line bg-panel p-7 shadow-panel max-[760px]:p-4">
        <div>
          <h1 className="mb-4 font-mono text-[clamp(2.8rem,6vw,6rem)] uppercase leading-[0.94] tracking-[-0.03em]">
            Ship events.
            <br />
            Control your delivery.
          </h1>
          <p className="mb-6 max-w-[42rem] text-[1.08rem] leading-[1.7] text-muted">
            HookHQ is an open source Event Destinations platform for teams that need durable event delivery, endpoint
            management, and more without depending on a closed SaaS.
          </p>
          <div className="mt-8 grid gap-4 [grid-template-columns:repeat(3,max-content)] max-[760px]:grid-cols-1">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-foreground px-4 text-[0.92rem] font-semibold text-background transition hover:-translate-y-px hover:border-foreground"
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
            >
              Deploy for free in seconds
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-panel px-4 text-[0.92rem] font-semibold transition hover:-translate-y-px hover:border-foreground"
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Read docs
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-panel px-4 text-[0.92rem] font-semibold transition hover:-translate-y-px hover:border-foreground"
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              View repository
            </a>
          </div>
        </div>
      </article>

      <aside className="grid min-h-[36rem] grid-rows-[auto_auto_1fr_auto] border border-line bg-panel p-4 shadow-panel max-[760px]:p-4">
        <div className="relative overflow-hidden border border-line bg-[radial-gradient(circle_at_center,var(--panel-soft),transparent_60%),var(--panel-strong)] p-4 mb-4">
          <div className="relative grid min-h-64 items-center gap-4 min-[761px]:grid-cols-[1fr_10rem_1fr] max-[760px]:grid-cols-1 max-[760px]:justify-items-center">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full min-[761px]:block"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <g className="text-foreground/80">
                <line
                  x1="14"
                  y1="50"
                  x2="43"
                  y2="50"
                  stroke="currentColor"
                  strokeOpacity="0.55"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1="57"
                  y1="50"
                  x2="84"
                  y2="23"
                  stroke="currentColor"
                  strokeOpacity="0.55"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <line
                  x1="57"
                  y1="50"
                  x2="86"
                  y2="50"
                  stroke="currentColor"
                  strokeOpacity="0.65"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1="57"
                  y1="50"
                  x2="84"
                  y2="77"
                  stroke="currentColor"
                  strokeOpacity="0.55"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
            </svg>

            <div className="relative z-[2] flex justify-start max-[760px]:justify-center">
              <div className="inline-flex min-h-14 min-w-32 items-center justify-center rounded-full border border-lineStrong bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,black_8%)] px-4 font-mono text-[0.95rem] uppercase tracking-[0.08em] shadow-panel">
                API
              </div>
            </div>

            <div className="relative z-[2] mx-auto flex h-24 w-24 items-center justify-center rounded-[1.6rem] border border-lineStrong bg-[color:color-mix(in_srgb,var(--panel-strong)_88%,black_12%)] shadow-panel">
              <Image src="/logo.svg" alt="HookHQ" width={72} height={72} />
            </div>

            <div className="relative z-[2] grid justify-items-end gap-4 max-[760px]:justify-items-center">
              <div className="inline-flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full border border-lineStrong bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,black_8%)] px-4 font-mono text-[0.95rem] uppercase tracking-[0.08em] shadow-panel">
                <Image src="/webhook.svg" alt="" width={20} height={20} aria-hidden="true" />
                Webhooks
              </div>
              <div className="inline-flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full border border-lineStrong bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,black_8%)] px-4 font-mono text-[0.95rem] uppercase tracking-[0.08em] shadow-panel">
                <Image src="/sqs.svg" alt="" width={20} height={20} aria-hidden="true" />
                SQS
              </div>
              <div className="inline-flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full border border-lineStrong bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,black_8%)] px-4 font-mono text-[0.95rem] uppercase tracking-[0.08em] shadow-panel">
                <Image src="/pubsub.svg" alt="" width={20} height={20} aria-hidden="true" />
                Pub/Sub
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 max-[760px]:grid-cols-1">
          {points.map(([title, copy]) => (
            <div key={title} className="border border-line bg-panelSoft px-4 py-4 text-[0.92rem] leading-[1.5]">
              <strong className="mb-5 block text-[0.88rem] uppercase tracking-[0.08em]">{title}</strong>
              {copy}
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
