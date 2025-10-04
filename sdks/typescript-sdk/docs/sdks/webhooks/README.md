# Webhooks
(*webhooks*)

## Overview

Webhooks API

### Available Operations

* [send](#send) - Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


## send

Send a webhook to the specified endpoints.

 Webhooks can be sent to endpoints and/or endpoint groups. 
 In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.


### Example Usage

<!-- UsageSnippet language="typescript" operationID="post_/webhooks/send" method="post" path="/webhooks/send" -->
```typescript
import { HookHQ } from "hookhq";

const hookHQ = new HookHQ({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const result = await hookHQ.webhooks.send({
    idempotencyKey: "1234567890",
    requestBody: {
      endpoints: [
        "ep_a1b2_abcd1234",
        "grp_a1b2_efgh5678",
      ],
      eventType: "user.created",
      payload: {},
      eventId: "abcdef1234567890",
    },
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { HookHQCore } from "hookhq/core.js";
import { webhooksSend } from "hookhq/funcs/webhooksSend.js";

// Use `HookHQCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const hookHQ = new HookHQCore({
  serverURL: "https://api.example.com",
  security: {
    bearerAuth: process.env["HOOKHQ_BEARER_AUTH"] ?? "",
  },
});

async function run() {
  const res = await webhooksSend(hookHQ, {
    idempotencyKey: "1234567890",
    requestBody: {
      endpoints: [
        "ep_a1b2_abcd1234",
        "grp_a1b2_efgh5678",
      ],
      eventType: "user.created",
      payload: {},
      eventId: "abcdef1234567890",
    },
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("webhooksSend failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PostWebhooksSendRequest](../../models/operations/postwebhookssendrequest.md)                                                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.PostWebhooksSendResponse](../../models/operations/postwebhookssendresponse.md)\>**

### Errors

| Error Type                                  | Status Code                                 | Content Type                                |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| errors.PostWebhooksSendBadRequestError      | 400                                         | application/json                            |
| errors.PostWebhooksSendUnauthorizedError    | 401                                         | application/json                            |
| errors.PostWebhooksSendForbiddenError       | 403                                         | application/json                            |
| errors.PostWebhooksSendTooManyRequestsError | 429                                         | application/json                            |
| errors.PostWebhooksSendInternalServerError  | 500                                         | application/json                            |
| errors.HookHQDefaultError                   | 4XX, 5XX                                    | \*/\*                                       |