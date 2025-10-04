# EventTypes
(*event_types*)

## Overview

### Available Operations

* [delete](#delete) - Delete an event type
* [update](#update) - Update an event type
* [list](#list) - List event types for the current environment
* [create](#create) - Create new event type

## delete

Delete an event type

### Example Usage

<!-- UsageSnippet language="python" operationID="delete_/event-types/{id}" method="delete" path="/event-types/{id}" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.event_types.delete(id="user.created")

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         | Example                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `id`                                                                | *str*                                                               | :heavy_check_mark:                                                  | Event type ID                                                       | user.created                                                        |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |                                                                     |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## update

Update an event type

### Example Usage

<!-- UsageSnippet language="python" operationID="patch_/event-types/{id}" method="patch" path="/event-types/{id}" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.event_types.update(id="user.created", name="User Created", description="User created event", schema={}, enabled=True)

    # Use the SDK ...

```

### Parameters

| Parameter                                                                           | Type                                                                                | Required                                                                            | Description                                                                         | Example                                                                             |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `id`                                                                                | *str*                                                                               | :heavy_check_mark:                                                                  | Event type ID                                                                       | user.created                                                                        |
| `name`                                                                              | *Optional[str]*                                                                     | :heavy_minus_sign:                                                                  | Event type name                                                                     | User Created                                                                        |
| `description`                                                                       | *Optional[str]*                                                                     | :heavy_minus_sign:                                                                  | Event type description                                                              | User created event                                                                  |
| `schema_`                                                                           | [Optional[models.PatchEventTypesIDSchema]](../../models/patcheventtypesidschema.md) | :heavy_minus_sign:                                                                  | Event type schema                                                                   | {<br/>"type": "object",<br/>"properties": {<br/>"userId": {<br/>"type": "string"<br/>}<br/>}<br/>} |
| `enabled`                                                                           | *Optional[bool]*                                                                    | :heavy_minus_sign:                                                                  | Event type enabled status                                                           | true                                                                                |
| `retries`                                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)                    | :heavy_minus_sign:                                                                  | Configuration to override the default retry behavior of the client.                 |                                                                                     |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## list

List event types for the current environment

### Example Usage

<!-- UsageSnippet language="python" operationID="get_/event-types" method="get" path="/event-types" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.event_types.list()

    # Use the SDK ...

```

### Parameters

| Parameter                                                           | Type                                                                | Required                                                            | Description                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `retries`                                                           | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)    | :heavy_minus_sign:                                                  | Configuration to override the default retry behavior of the client. |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |

## create

Create new event type

### Example Usage

<!-- UsageSnippet language="python" operationID="post_/event-types" method="post" path="/event-types" -->
```python
from hookhq import HookHQ, models
import os


with HookHQ(
    server_url="https://api.example.com",
    security=models.Security(
        bearer_auth=os.getenv("HOOKHQ_BEARER_AUTH", ""),
    ),
) as hook_hq:

    hook_hq.event_types.create(request={
        "name": "User Created",
        "description": "User created event",
        "schema_": {},
        "enabled": True,
    })

    # Use the SDK ...

```

### Parameters

| Parameter                                                             | Type                                                                  | Required                                                              | Description                                                           |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `request`                                                             | [models.PostEventTypesRequest](../../models/posteventtypesrequest.md) | :heavy_check_mark:                                                    | The request object to use for the request.                            |
| `retries`                                                             | [Optional[utils.RetryConfig]](../../models/utils/retryconfig.md)      | :heavy_minus_sign:                                                    | Configuration to override the default retry behavior of the client.   |

### Errors

| Error Type                | Status Code               | Content Type              |
| ------------------------- | ------------------------- | ------------------------- |
| errors.HookHQDefaultError | 4XX, 5XX                  | \*/\*                     |