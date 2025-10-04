# PostWebhooksSendResponse

Webhook sent

## Example Usage

```typescript
import { PostWebhooksSendResponse } from "hookhq/models/operations";

let value: PostWebhooksSendResponse = {
  id: "abcdef1234567890",
  eventId: "abcdef1234567890",
  eventType: "user.created",
  payload: {},
  channels: [
    "ep_a1b2_abcd1234",
    "grp_a1b2_efgh5678",
  ],
  timestamp: "2021-01-01T00:00:00.000Z",
};
```

## Fields

| Field                                                                    | Type                                                                     | Required                                                                 | Description                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `id`                                                                     | *string*                                                                 | :heavy_minus_sign:                                                       | Webhook ID                                                               |
| `eventId`                                                                | *string*                                                                 | :heavy_minus_sign:                                                       | Event ID                                                                 |
| `eventType`                                                              | *string*                                                                 | :heavy_minus_sign:                                                       | Event type                                                               |
| `payload`                                                                | [operations.PayloadResponse](../../models/operations/payloadresponse.md) | :heavy_minus_sign:                                                       | Payload                                                                  |
| `channels`                                                               | *string*[]                                                               | :heavy_minus_sign:                                                       | Channels the webhook was sent to                                         |
| `timestamp`                                                              | *string*                                                                 | :heavy_minus_sign:                                                       | Timestamp the webhook was sent                                           |