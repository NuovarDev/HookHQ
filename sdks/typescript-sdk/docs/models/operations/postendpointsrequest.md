# PostEndpointsRequest

## Example Usage

```typescript
import { PostEndpointsRequest } from "hookhq/models/operations";

let value: PostEndpointsRequest = {
  name: "My Webhook Endpoint",
  description: "My Webhook Endpoint description",
  url: "https://example.com/webhook",
  customHeaders: {},
  proxyGroupId: "proxygrp_a1b2_efgh5678",
};
```

## Fields

| Field                                                                | Type                                                                 | Required                                                             | Description                                                          | Example                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                                                               | *string*                                                             | :heavy_check_mark:                                                   | Name of the endpoint                                                 | My Webhook Endpoint                                                  |
| `description`                                                        | *string*                                                             | :heavy_minus_sign:                                                   | Description of the endpoint                                          | My Webhook Endpoint description                                      |
| `url`                                                                | *string*                                                             | :heavy_check_mark:                                                   | URL of the endpoint                                                  | https://example.com/webhook                                          |
| `enabled`                                                            | *boolean*                                                            | :heavy_minus_sign:                                                   | Whether the endpoint is enabled                                      |                                                                      |
| `retryPolicy`                                                        | [operations.RetryPolicy](../../models/operations/retrypolicy.md)     | :heavy_minus_sign:                                                   | Retry policy of the endpoint                                         |                                                                      |
| `maxAttempts`                                                        | *number*                                                             | :heavy_minus_sign:                                                   | Maximum number of attempts of the endpoint                           |                                                                      |
| `timeoutMs`                                                          | *number*                                                             | :heavy_minus_sign:                                                   | Timeout of the endpoint                                              |                                                                      |
| `customHeaders`                                                      | [operations.CustomHeaders](../../models/operations/customheaders.md) | :heavy_minus_sign:                                                   | Custom headers of the endpoint                                       | {<br/>"Content-Type": "application/json"<br/>}                       |
| `proxyGroupId`                                                       | *string*                                                             | :heavy_minus_sign:                                                   | Proxy group ID of the endpoint                                       | proxygrp_a1b2_efgh5678                                               |