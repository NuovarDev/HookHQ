import Image from "next/image";

export type FeatureCard = {
  title: string;
  copy: string;
  preview: React.ReactNode;
  bullets?: string[];
};

const previewShell = "feature-preview mt-5 overflow-hidden rounded-xl bg-panelStrong";

export const features: FeatureCard[] = [
  {
    title: "Topic-based subscriptions",
    copy: "Subscribe endpoints and endpoint groups to named event types or all events.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/event-types.png" alt="Subscriptions" width={1000} height={1000} />
      </div>
    ),
  },
  {
    title: "Automatic and manual retries",
    copy: "Deliver events with exponential backoff, stale queue recovery, and manual retry in the dashboard and API.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/retry.png" alt="Retries" width={1000} height={1000} />
      </div>
    ),
  },
  {
    title: "Multi-tenant support",
    copy: "Run multiple environments and applications within one deployment.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/environment-switcher.png" alt="Multi-tenant support" width={1000} height={1000} />
      </div>
    ),
  },
  {
    title: "Embeddable end-user portal",
    copy: "Expose a focused management surface to your own users without handing them the full dashboard or API. Customize and embed the portal in your own app.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/portal.png" alt="Portal view" width={1000} height={1000} />
      </div>
    ),
  },
  {
    title: "User-configurable failure alerts",
    copy: "Get notified via Slack or webhook when delivery failures cross a threshold. Allow users to configure their own alerting behavior via the portal.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/alerts.png" alt="Alerts" width={1000} height={1000} />
      </div>
    ),
  },
  {
    title: "Webhooks, SQS, and Pub/Sub",
    copy: "Use a generic destination model for direct webhooks, AWS SQS queues, and Google Cloud Pub/Sub topics.",
    preview: (
      <div className={previewShell}>
        <Image src="/img/destinations.png" alt="Destinations" width={1000} height={1000} />
      </div>
    ),
  },
];

