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

<!-- UsageSnippet language="python" operationID="delete_/endpoints/{id}" method="delete" path="/endpoints/{id}" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoints.delete(id="ep_a1b2_abcd1234")

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         | Example                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `id`                                                                | *str*                                                               | :heavy_check_mark:                                                  | Endpoint ID                                                         | ep_a1b2_abcd1234                                                    |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |                                                                     |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## update

Update an endpoint

### Example Usage

<!-- UsageSnippet language="python" operationID="patch_/endpoints/{id}" method="patch" path="/endpoints/{id}" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoints.update(id="ep_a1b2_abcd1234")

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         | Example                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `id`                                                                | *str*                                                               | :heavy_check_mark:                                                  | Endpoint ID                                                         | ep_a1b2_abcd1234                                                    |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |                                                                     |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## list

List endpoints for the current environment

### Example Usage

<!-- UsageSnippet language="python" operationID="get_/endpoints" method="get" path="/endpoints" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoints.list()

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`                                                           | *Optional[bool]*                                                    | :heavy_minus_sign:                                                  | Whether to filter endpoints by enabled status                       |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## create

Create new endpoint

### Example Usage

<!-- UsageSnippet language="python" operationID="post_/endpoints" method="post" path="/endpoints" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.endpoints.create(request={
        "name": "My Webhook Endpoint",
        "description": "My Webhook Endpoint description",
        "url": "https://example.com/webhook",
        "custom_headers": {},
        "proxy_group_id": "proxygrp_a1b2_efgh5678",
    })

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `request`                                                           | [models.PostEndpointsRequest](../../models/postendpointsrequest.md) | :heavy_check_mark:                                                  | The request object to use for the request.                          |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |