"use client";

import Image from "next/image";

type DestinationType = "webhook" | "sqs" | "pubsub";

const destinationIconMap: Record<DestinationType, { src: string; alt: string }> = {
  webhook: { src: "/webhook.svg", alt: "Webhook" },
  sqs: { src: "/sqs.svg", alt: "AWS SQS" },
  pubsub: { src: "/pubsub.svg", alt: "Google Cloud Pub/Sub" },
};

interface DestinationTypeIconProps {
  destinationType?: DestinationType;
  className?: string;
  iconClassName?: string;
}

export default function DestinationTypeIcon({
  destinationType = "webhook",
  className = "h-10 w-10 bg-muted flex items-center justify-center",
  iconClassName = "h-5 w-5",
}: DestinationTypeIconProps) {
  const icon = destinationIconMap[destinationType] ?? destinationIconMap.webhook;

  return (
    <div className={className}>
      <Image src={icon.src} alt={icon.alt} width={20} height={20} className={iconClassName} />
    </div>
  );
}
