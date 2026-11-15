import { Liquid } from "liquidjs";

export type TemplateVariables = Record<string, unknown>;

const ALLOWED_TAGS = new Set(["if", "unless", "case", "for", "comment", "break", "continue"]);
const ALLOWED_FILTERS = new Set([
  "append",
  "base64_decode",
  "base64_encode",
  "capitalize",
  "concat",
  "date",
  "downcase",
  "escape",
  "first",
  "join",
  "json",
  "last",
  "lstrip",
  "prepend",
  "replace",
  "rstrip",
  "size",
  "slice",
  "split",
  "strip",
  "strip_newlines",
  "truncate",
  "truncatewords",
  "upcase",
  "url_decode",
  "url_encode",
]);

const liquid = new Liquid({
  strictVariables: true,
  strictFilters: true,
  ownPropertyOnly: true,
  parseLimit: 32_768,
  renderLimit: 25,
  memoryLimit: 100_000,
});

for (const tag of Object.keys(liquid.tags)) {
  if (!ALLOWED_TAGS.has(tag)) delete liquid.tags[tag];
}

for (const filter of Object.keys(liquid.filters)) {
  if (!ALLOWED_FILTERS.has(filter)) liquid.unregisterFilter(filter);
}

function parseTemplate(template: string, target: string) {
  try {
    return liquid.parse(template);
  } catch (error) {
    throw new Error(`Could not parse ${target} template: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function renderWebhookTemplate(template: string, variables: TemplateVariables, target: string): string {
  try {
    return liquid.renderSync(parseTemplate(template, target), variables, { templateLimit: 1_000 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not parse")) throw error;
    throw new Error(`Could not render ${target} template: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function validateWebhookTemplate(template: string, target: string): void {
  parseTemplate(template, target);
}

export function validateWebhookDestinationTemplates(destination: Record<string, unknown>): void {
  if (typeof destination.url === "string") validateWebhookTemplate(destination.url, "URL");
  if (typeof destination.payloadTemplate === "string" && destination.payloadTemplate.trim()) {
    validateWebhookTemplate(destination.payloadTemplate, "payload");
  }
  if (destination.customHeaders && typeof destination.customHeaders === "object") {
    for (const [name, value] of Object.entries(destination.customHeaders as Record<string, unknown>)) {
      if (typeof value === "string") validateWebhookTemplate(value, `header ${name}`);
    }
  }
}

export function renderWebhookPayload(template: string, variables: TemplateVariables): string {
  return renderWebhookTemplate(template, variables, "payload");
}
