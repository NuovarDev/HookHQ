# EndpointGroups
(*endpointGroups*)

## Overview

### Available Operations

* [delete](#delete) - Delete an endpoint group
* [update](#update) - Update an endpoint group
* [list](#list) - List endpoint groups for the current environment
* [create](#create) - Create new endpoint group

## delete

Delete an endpoint group

### Example Usage

<!-- UsageSnippet language="php" operationID="delete_/endpoint-groups/{id}" method="delete" path="/endpoint-groups/{id}" -->
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



$response = $sdk->endpointGroups->delete(
    id: 'grp_a1b2_efgh5678'
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter          | Type               | Required           | Description        | Example            |
| ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| `id`               | *string*           | :heavy_check_mark: | Endpoint group ID  | grp_a1b2_efgh5678  |

### Response

**[?Operations\DeleteEndpointGroupsIdResponse](../../Models/Operations/DeleteEndpointGroupsIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## update

Update an endpoint group

### Example Usage

<!-- UsageSnippet language="php" operationID="patch_/endpoint-groups/{id}" method="patch" path="/endpoint-groups/{id}" -->
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



$response = $sdk->endpointGroups->update(
    id: 'grp_a1b2_efgh5678'
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter          | Type               | Required           | Description        | Example            |
| ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| `id`               | *string*           | :heavy_check_mark: | Endpoint group ID  | grp_a1b2_efgh5678  |

### Response

**[?Operations\PatchEndpointGroupsIdResponse](../../Models/Operations/PatchEndpointGroupsIdResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## list

List endpoint groups for the current environment

### Example Usage

<!-- UsageSnippet language="php" operationID="get_/endpoint-groups" method="get" path="/endpoint-groups" -->
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



$response = $sdk->endpointGroups->list(

);

if ($response->statusCode === 200) {
    // handle response
}
```

### Response

**[?Operations\GetEndpointGroupsResponse](../../Models/Operations/GetEndpointGroupsResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |

## create

Create new endpoint group

### Example Usage

<!-- UsageSnippet language="php" operationID="post_/endpoint-groups" method="post" path="/endpoint-groups" -->
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

$request = new Operations\PostEndpointGroupsRequest(
    name: 'My Endpoint Group',
    description: 'My Endpoint Group description',
    endpointIds: [
        'ep_a1b2_efgh5678',
    ],
    enabled: true,
);

$response = $sdk->endpointGroups->create(
    request: $request
);

if ($response->statusCode === 200) {
    // handle response
}
```

### Parameters

| Parameter                                                                                    | Type                                                                                         | Required                                                                                     | Description                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `$request`                                                                                   | [Operations\PostEndpointGroupsRequest](../../Models/Operations/PostEndpointGroupsRequest.md) | :heavy_check_mark:                                                                           | The request object to use for the request.                                                   |

### Response

**[?Operations\PostEndpointGroupsResponse](../../Models/Operations/PostEndpointGroupsResponse.md)**

### Errors

| Error Type          | Status Code         | Content Type        |
| ------------------- | ------------------- | ------------------- |
| Errors\APIException | 4XX, 5XX            | \*/\*               |