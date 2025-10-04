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

<!-- UsageSnippet language="php" operationID="post_/webhooks/send" method="post" path="/webhooks/send" -->
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;
use Nuovar\HookHQ\Models\Operations;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();

$requestBody = new Operations\PostWebhooksSendRequestBody(
    endpoints: [
        'ep_a1b2_abcd1234',
        'grp_a1b2_efgh5678',
    ],
    eventType: 'user.created',
    payload: new Operations\Payload(),
    eventId: 'abcdef1234567890',
);

$response = $sdk->webhooks->send(
    idempotencyKey: '1234567890',
    requestBody: $requestBody

);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                                                                         | Type                                                                                              | Required                                                                                          | Description                                                                                       | Example                                                                                           |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `idempotencyKey`                                                                                  | *?string*                                                                                         | :heavy_minus_sign:                                                                                | Optional idempotency key                                                                          | 1234567890                                                                                        |
| `requestBody`                                                                                     | [?Operations\PostWebhooksSendRequestBody](../../Models/Operations/PostWebhooksSendRequestBody.md) | :heavy_minus_sign:                                                                                | N/A                                                                                               |                                                                                                   |

### Response

**[?Operations\PostWebhooksSendResponse](../../Models/Operations/PostWebhooksSendResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |