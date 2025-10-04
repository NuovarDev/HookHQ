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

<!-- UsageSnippet language="python" operationID="post_/webhooks/send" method="post" path="/webhooks/send" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.webhooks.send(idempotency_key="1234567890", request_body={
        "endpoints": [
            "ep_a1b2_abcd1234",
            "grp_a1b2_efgh5678",
        ],
        "event_type": "user.created",
        "payload": {},
        "event_id": "abcdef1234567890",
    })

    # Use the SDK ...

```

### Parameters

| Parameter                                                                                   | Type                                                                                        | Required                                                                                    | Description                                                                                 | Example                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `idempotency_key`                                                                           | *Optional[str]*                                                                             | :heavy_minus_sign:                                                                          | Optional idempotency key                                                                    | 1234567890                                                                                  |
| `request_body`                                                                              | [Optional[models.PostWebhooksSendRequestBody]](../../models/postwebhookssendrequestbody.md) | :heavy_minus_sign:                                                                          | N/A                                                                                         |                                                                                             |
| `retries`                                                                                   | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)                            | :heavy_minus_sign:                                                                          | Configuration to override the default retry behavior of the client.                         |                                                                                             |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |