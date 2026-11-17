import Image from "next/image";

const points = [
  ["Event Destinations", "Automatically route and fan out events to Webhooks, SQS, and Pub/Sub"],
  ["Free and Open-Source", "HookHQ is MIT licensed, fully open-source, and can run entirely on the Cloudflare Workers free plan."],
  ["Embedded user portal", "Give users control of their destinations and integrate with your app in seconds by embedding the portal iframe."],
  ["Multi-tenant", "Separate your environments, applications, and customers within one deployment."],
] as const;

export function Hero({ deployUrl, repoUrl }: { deployUrl: string; repoUrl: string }) {
  return (
    <section className="hero">
      <article className="hero-copy">
        <p className="hero-kicker"><span aria-hidden="true" /> Open source Event Destinations</p>
        <h1>Ship events.<br /><em>Control every delivery.</em></h1>
        <p className="hero-summary">
          HookHQ is an open source Event Destinations platform for teams that need durable event delivery, endpoint
          management, and more without depending on a closed SaaS.
        </p>
        <div className="hero-actions">
          <a className="button-primary" href={deployUrl} target="_blank" rel="noreferrer">Deploy for free in seconds</a>
          <a className="button-secondary" href={repoUrl} target="_blank" rel="noreferrer">View repository</a>
        </div>
      </article>

      <div className="route-surface">
        <div className="route-surface-heading">
          <span>One event. Any destination.</span>
          <span>Designed for delivery</span>
        </div>
        <div className="route-stage">
          <svg aria-hidden="true" className="route-lines" viewBox="0 0 1120 400" preserveAspectRatio="none">
            <path d="M 308 200 H 498" />
            <path d="M 622 200 H 675 Q 700 200 700 175 V 123 Q 700 99 724 99 H 792" />
            <path d="M 622 200 H 792" />
            <path d="M 622 200 H 675 Q 700 200 700 225 V 276 Q 700 300 724 300 H 792" />
            <path className="route-failure-branch" pathLength="1" d="M 560 200 V 360">
              <animate attributeName="stroke-dashoffset" values="1;1;0;0;1;1" keyTimes="0;0.76;0.82;0.91;0.94;1" dur="28s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.76;0.79;0.91;0.94;1" dur="28s" repeatCount="indefinite" />
            </path>
            <circle className="route-event" r="5">
              <animateMotion dur="4.8s" repeatCount="indefinite" path="M 308 200 H 560" keyPoints="0;0;1;1" keyTimes="0;0.12;0.48;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.1;0.12;0.46;0.48;1" dur="4.8s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event" r="5">
              <animateMotion dur="4.8s" repeatCount="indefinite" path="M 560 200 H 675 Q 700 200 700 175 V 123 Q 700 99 724 99 H 792" keyPoints="0;0;1;1" keyTimes="0;0.48;0.78;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.47;0.48;0.76;0.78;1" dur="4.8s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event" r="5">
              <animateMotion dur="4.8s" repeatCount="indefinite" path="M 560 200 H 792" keyPoints="0;0;1;1" keyTimes="0;0.48;0.78;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.47;0.48;0.76;0.78;1" dur="4.8s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event" r="5">
              <animateMotion dur="4.8s" repeatCount="indefinite" path="M 560 200 H 675 Q 700 200 700 225 V 276 Q 700 300 724 300 H 792" keyPoints="0;0;1;1" keyTimes="0;0.48;0.78;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.47;0.48;0.76;0.78;1" dur="4.8s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event route-event-single" r="5">
              <animateMotion begin="2.4s" dur="4.8s" repeatCount="indefinite" path="M 308 200 H 498 H 622 H 792" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.04;0.9;1" begin="2.4s" dur="4.8s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event" r="5">
              <animateMotion dur="28s" repeatCount="indefinite" path="M 308 200 H 498 H 622 H 675 Q 700 200 700 175 V 123 Q 700 99 724 99 H 792" keyPoints="0;0;1;1" keyTimes="0;0.49;0.64;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.48;0.49;0.63;0.64;1" dur="28s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event route-event-failure" r="5">
              <animateMotion dur="28s" repeatCount="indefinite" path="M 792 99 H 724 Q 700 99 700 123 V 175 Q 700 200 675 200 H 560" keyPoints="0;0;1;1" keyTimes="0;0.64;0.76;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.63;0.64;0.75;0.76;1" dur="28s" repeatCount="indefinite" />
            </circle>
            <circle className="route-event route-event-failure" r="5">
              <animateMotion dur="28s" repeatCount="indefinite" path="M 560 200 V 360" keyPoints="0;0;1;1" keyTimes="0;0.82;0.9;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.81;0.82;0.89;0.9;1" dur="28s" repeatCount="indefinite" />
            </circle>
          </svg>
          <div className="route-node route-source">Your API</div>
          <div className="route-hub"><Image src="/img/logo.svg" alt="" width={68} height={68} /></div>
          <div className="route-destinations">
            <div className="route-node"><Image src="/img/webhook.svg" alt="" width={19} height={19} /> Webhooks</div>
            <div className="route-node"><Image src="/img/sqs.svg" alt="" width={19} height={19} /> SQS</div>
            <div className="route-node"><Image src="/img/pubsub.svg" alt="" width={19} height={19} /> Pub/Sub</div>
          </div>
          <div className="route-node route-alert"><span aria-hidden="true" /> Failure alert</div>
        </div>
        <div className="route-benefits">
          {points.map(([title, copy]) => (
            <div key={title} className="route-benefit">
              <strong>{title}</strong>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
