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

  it("renders a payload template as the raw webhook body", () => {
    expect(renderWebhookPayload('{"account":"{{ accountId }}","name":{{ name | json }}}', variables)).toBe(
      '{"account":"acct_123","name":"Ada"}'
    );
  });

  it("allows a rendered payload that is not valid JSON", () => {
    expect(renderWebhookPayload("{{ name }}", variables)).toBe("Ada");
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
