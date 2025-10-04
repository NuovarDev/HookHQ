# PostWebhooksSendRequestBody

## Example Usage

```typescript
import { PostWebhooksSendRequestBody } from "hookhq/models/operations";

let value: PostWebhooksSendRequestBody = {
  endpoints: [
    "ep_a1b2_abcd1234",
    "grp_a1b2_efgh5678",
  ],
  eventType: "user.created",
  payload: {},
  eventId: "abcdef1234567890",
};
```

## Fields

| Field                                                                        | Type                                                                         | Required                                                                     | Description                                                                  | Example                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `endpoints`                                                                  | *string*[]                                                                   | :heavy_check_mark:                                                           | List of endpoints or endpoint groups to send the webhook to                  | [<br/>"ep_a1b2_abcd1234",<br/>"grp_a1b2_efgh5678"<br/>]                      |
| `eventType`                                                                  | *string*                                                                     | :heavy_minus_sign:                                                           | Event type to send the webhook to. Required if sending to an endpoint group. | user.created                                                                 |
| `payload`                                                                    | [operations.PayloadRequest](../../models/operations/payloadrequest.md)       | :heavy_check_mark:                                                           | Payload to send with the webhook                                             | {<br/>"userId": "abcd1234"<br/>}                                             |
| `eventId`                                                                    | *string*                                                                     | :heavy_minus_sign:                                                           | Optional unique event ID to track the webhook                                | abcdef1234567890                                                             |