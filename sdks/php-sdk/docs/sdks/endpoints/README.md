# Endpoints
(*endpoints*)

## Overview

Endpoints API

### Available Operations

* [delete](#delete) - Delete an endpoint
* [update](#update) - Update an endpoint
* [list](#list) - List endpoints for the current environment
* [create](#create) - Create new endpoint

## delete

Delete an endpoint

### Example Usage

<!-- UsageSnippet language="php" operationID="delete_/endpoints/{id}" method="delete" path="/endpoints/{id}" -->
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



$response = $sdk->endpoints->delete(
    id: 'ep_a1b2_abcd1234'
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter          | Type               | Required           | Description        | Example            |
| ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| `id`               | *string*           | :heavy_check_mark: | Endpoint ID        | ep_a1b2_abcd1234   |

### Response

**[?Operations\DeleteEndpointsIdResponse](../../Models/Operations/DeleteEndpointsIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## update

Update an endpoint

### Example Usage

<!-- UsageSnippet language="php" operationID="patch_/endpoints/{id}" method="patch" path="/endpoints/{id}" -->
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



$response = $sdk->endpoints->update(
    id: 'ep_a1b2_abcd1234'
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter          | Type               | Required           | Description        | Example            |
| ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| `id`               | *string*           | :heavy_check_mark: | Endpoint ID        | ep_a1b2_abcd1234   |

### Response

**[?Operations\PatchEndpointsIdResponse](../../Models/Operations/PatchEndpointsIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## list

List endpoints for the current environment

### Example Usage

<!-- UsageSnippet language="php" operationID="get_/endpoints" method="get" path="/endpoints" -->
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



$response = $sdk->endpoints->list(

);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                     | Type                                          | Required                                      | Description                                   |
| --------------------------------------------- | --------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `enabled`                                     | *?bool*                                       | :heavy_minus_sign:                            | Whether to filter endpoints by enabled status |

### Response

**[?Operations\GetEndpointsResponse](../../Models/Operations/GetEndpointsResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## create

Create new endpoint

### Example Usage

<!-- UsageSnippet language="php" operationID="post_/endpoints" method="post" path="/endpoints" -->
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

$request = new Operations\PostEndpointsRequest(
    name: 'My Webhook Endpoint',
    description: 'My Webhook Endpoint description',
    url: 'https://example.com/webhook',
    customHeaders: new Operations\CustomHeaders(),
    proxyGroupId: 'proxygrp_a1b2_efgh5678',
);

$response = $sdk->endpoints->create(
    request: $request
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                                                          | Type                                                                               | Required                                                                           | Description                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `$request`                                                                         | [Operations\PostEndpointsRequest](../../Models/Operations/PostEndpointsRequest.md) | :heavy_check_mark:                                                                 | The request object to use for the request.                                         |

### Response

**[?Operations\PostEndpointsResponse](../../Models/Operations/PostEndpointsResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |