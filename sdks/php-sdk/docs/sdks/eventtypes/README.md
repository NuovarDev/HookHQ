# EventTypes
(*eventTypes*)

## Overview

### Available Operations

* [delete](#delete) - Delete an event type
* [update](#update) - Update an event type
* [list](#list) - List event types for the current environment
* [create](#create) - Create new event type

## delete

Delete an event type

### Example Usage

<!-- UsageSnippet language="php" operationID="delete_/event-types/{id}" method="delete" path="/event-types/{id}" -->
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->eventTypes->delete(
    id: 'user.created'
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter          | Type               | Required           | Description        | Example            |
| ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| `id`               | *string*           | :heavy_check_mark: | Event type ID      | user.created       |

### Response

**[?Operations\DeleteEventTypesIdResponse](../../Models/Operations/DeleteEventTypesIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## update

Update an event type

### Example Usage

<!-- UsageSnippet language="php" operationID="patch_/event-types/{id}" method="patch" path="/event-types/{id}" -->
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

$requestBody = new Operations\PatchEventTypesIdRequestBody(
    name: 'User Created',
    description: 'User created event',
    schema: new Operations\PatchEventTypesIdSchema(),
    enabled: true,
);

$response = $sdk->eventTypes->update(
    id: 'user.created',
    requestBody: $requestBody

);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                                                                          | Type                                                                                               | Required                                                                                           | Description                                                                                        | Example                                                                                            |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                                                                                               | *string*                                                                                           | :heavy_check_mark:                                                                                 | Event type ID                                                                                      | user.created                                                                                       |
| `requestBody`                                                                                      | [Operations\PatchEventTypesIdRequestBody](../../Models/Operations/PatchEventTypesIdRequestBody.md) | :heavy_check_mark:                                                                                 | N/A                                                                                                |                                                                                                    |

### Response

**[?Operations\PatchEventTypesIdResponse](../../Models/Operations/PatchEventTypesIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## list

List event types for the current environment

### Example Usage

<!-- UsageSnippet language="php" operationID="get_/event-types" method="get" path="/event-types" -->
```php
declare(strict_types=1);

require 'vendor/autoload.php';

use Nuovar\HookHQ;
use Nuovar\HookHQ\Models\Components;

$sdk = HookHQ\HookHQ::builder()
    ->setSecurity(
        new Components\Security(
            bearerAuth: '<YOUR_BEARER_TOKEN_HERE>',
        )
    )
    ->build();



$response = $sdk->eventTypes->list(

);

if ($response->statusCode === 200) {
    // handle response
}
```

### Response

**[?Operations\GetEventTypesResponse](../../Models/Operations/GetEventTypesResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## create

Create new event type

### Example Usage

<!-- UsageSnippet language="php" operationID="post_/event-types" method="post" path="/event-types" -->
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

$request = new Operations\PostEventTypesRequest(
    name: 'User Created',
    description: 'User created event',
    schema: new Operations\PostEventTypesSchema(),
    enabled: true,
);

$response = $sdk->eventTypes->create(
    request: $request
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                                                            | Type                                                                                 | Required                                                                             | Description                                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `$request`                                                                           | [Operations\PostEventTypesRequest](../../Models/Operations/PostEventTypesRequest.md) | :heavy_check_mark:                                                                   | The request object to use for the request.                                           |

### Response

**[?Operations\PostEventTypesResponse](../../Models/Operations/PostEventTypesResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |