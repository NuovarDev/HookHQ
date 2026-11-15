import { describe, expect, it } from "vitest";
import { renderWebhookPayload, renderWebhookTemplate } from "@/lib/webhookTemplates";

describe("webhook templates", () => {
  const variables = { accountId: "acct_123", name: "Ada" };

  it("renders variables in URLs and header values", () => {
    expect(renderWebhookTemplate("https://example.com/{{ accountId }}", variables, "URL")).toBe(
      "https://example.com/acct_123"
    );
    expect(renderWebhookTemplate("Bearer {{ name }}", variables, "header Authorization")).toBe("Bearer Ada");
  });

  it("parses a rendered payload template as JSON", () => {
    expect(renderWebhookPayload('{"account":"{{ accountId }}","name":{{ name | json }}}', variables)).toEqual({
      account: "acct_123",
      name: "Ada",
    });
  });

  it("rejects a payload template that does not render JSON", () => {
    expect(() => renderWebhookPayload("{{ name }}", variables)).toThrow("Payload template must render valid JSON");
  });

  it("supports the approved logic tags and filters", () => {
    expect(
      renderWebhookTemplate(
        "{% if name == 'Ada' %}{{ name | upcase }}{% else %}unknown{% endif %}",
        variables,
        "header"
      )
    ).toBe("ADA");
  });

  it("rejects unapproved tags", () => {
    expect(() => renderWebhookTemplate("{% assign value = 'x' %}{{ value }}", variables, "payload")).toThrow(
      "Could not parse"
    );
  });
});
