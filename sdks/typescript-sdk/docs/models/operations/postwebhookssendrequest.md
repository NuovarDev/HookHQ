# PostWebhooksSendRequest

## Example Usage

```typescript
import { PostWebhooksSendRequest } from "hookhq/models/operations";

let value: PostWebhooksSendRequest = {
  idempotencyKey: "1234567890",
};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      | Example                                                                                          |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `idempotencyKey`                                                                                 | *string*                                                                                         | :heavy_minus_sign:                                                                               | Optional idempotency key                                                                         | 1234567890                                                                                       |
| `requestBody`                                                                                    | [operations.PostWebhooksSendRequestBody](../../models/operations/postwebhookssendrequestbody.md) | :heavy_minus_sign:                                                                               | N/A                                                                                              |                                                                                                  |